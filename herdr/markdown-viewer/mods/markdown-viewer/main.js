import { View, div } from "gpui-kit";
import { v_flex, h_flex, TextView, Editor, EditorState } from "gpui-base";
import { props, readTextFile, writeTextFile, theme, settings, closeOverlay, exec } from "herdr";

const modes = ["preview", "source", "side", "stack"];

// How `text` differs from `base`, line by line, the way an IDE marks its gutter:
// kinds[k] is "add" or "mod" for new line k, deleted lists the new lines that removed lines sat
// just before, and added and removed count lines.
// Matching a line with text scores more than matching a blank one, so blank lines never steal the match.
// ponytail: weighted LCS on the lines between the common prefix and suffix; past 4M cells the whole middle is one change.
function changes(base, text) {
  const a = base.split("\n"), b = text.split("\n");
  let p = 0, s = 0;
  while (p < a.length && p < b.length && a[p] === b[p]) p++;
  while (s < a.length - p && s < b.length - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s++;
  const x = a.slice(p, a.length - s), y = b.slice(p, b.length - s), n = x.length, m = y.length;
  const kinds = {}, deleted = [];
  let hunk = null, added = 0, removed = 0;
  const open = j => (hunk ??= { at: p + j, lines: [], removed: 0 });
  const close = () => {
    if (!hunk) return;
    for (const k of hunk.lines) kinds[k] = hunk.removed ? "mod" : "add";
    if (!hunk.lines.length) deleted.push(hunk.at);
    added += hunk.lines.length;
    removed += hunk.removed;
    hunk = null;
  };
  if (n * m > 4e6) { open(0); for (let j = 0; j < m; j++) hunk.lines.push(p + j); hunk.removed = n; }
  else {
    const L = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
      L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + (x[i].trim() ? 2 : 1) : Math.max(L[i + 1][j], L[i][j + 1]);
    for (let i = 0, j = 0; i < n || j < m;) {
      if (i < n && j < m && x[i] === y[j]) { close(); i++; j++; }
      else if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) open(j).lines.push(p + j++);
      else { open(j).removed++; i++; }
    }
  }
  close();
  return { kinds, deleted, added, removed };
}

// Top-level blocks as [first line, end line). Splits only at blank lines outside code fences
// and never before an indented line, which may continue a list item.
// ponytail: line heuristics, not a Markdown parser; an HTML block with blank lines splits.
function blocks(text) {
  const lines = text.split("\n"), out = [];
  let start = null, fence = null;
  lines.forEach((line, k) => {
    const f = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (f) fence = !fence ? f[1] : f[1][0] === fence[0] && f[1].length >= fence.length ? null : fence;
    if (line.trim()) { start ??= k; return; }
    const next = lines.slice(k + 1).find(l => l.trim()) ?? "";
    if (start !== null && !fence && !/^\s/.test(next)) { out.push([start, k]); start = null; }
  });
  if (start !== null) out.push([start, lines.length]);
  return out;
}

export default class MarkdownViewer extends View {
  init(_props, cx) {
    this.file = props()?.file;
    this.on = props()?.on;
    this.overlay = props()?.overlay; // set when opened as a floating window
    // localStorage is shared by copies with the same props, so each file remembers its own view.
    const mode = localStorage.getItem("mode");
    this.mode = modes.includes(mode) ? mode : "preview";
    this.load(cx);
    this.loadBase(cx);
    cx.timer.every(2000, cx => this.load(cx));
    cx.timer.every(5000, cx => this.loadBase(cx));
  }

  // The file as of the last git commit, or null outside git or for a file git does not track.
  loadBase(cx) {
    if (!this.file || this.basing) return;
    this.basing = true;
    const slash = this.file.lastIndexOf("/");
    cx.spawn(async cx => {
      try {
        const r = await exec("git", ["show", `HEAD:./${this.file.slice(slash + 1)}`],
          { cwd: this.file.slice(0, slash) || "/", on: this.on, timeout: 5000 });
        this.base = r.code === 0 ? r.stdout : null;
      } catch { this.base = null; }
      finally { this.basing = false; cx.notify(); }
    });
  }

  diff() {
    if (this.base == null || this.text == null) return null;
    if (this.diffBase !== this.base || this.diffText !== this.text)
      [this.diffBase, this.diffText, this.diffResult] = [this.base, this.text, changes(this.base, this.text)];
    return this.diffResult;
  }

  unsaved() { return Boolean(this.code) && this.text !== this.saved; }

  load(cx) {
    if (this.loading || this.saving || !this.file || this.unsaved()) return;
    this.loading = true;
    cx.spawn(async cx => {
      try {
        const text = await readTextFile(this.file, { on: this.on });
        if (this.unsaved()) return;
        if (text === null) { this.error = "File not found"; }
        else if (text !== this.text) {
          this.code?.release();
          this.text = this.saved = text;
          this.code = EditorState.new({ language: "markdown", readonly: !!this.on, value: text,
            font_family: settings().font_family, font_size: 12 });
          this.code.on("change", (_event, cx) => { this.text = this.code.value(); this.message = null; this.discard = false; cx.notify(); });
          this.error = null;
        } else this.error = null;
      } catch { this.error = "Cannot read this file"; }
      finally { this.loading = false; cx.notify(); }
    });
  }

  save(cx) {
    if (this.on || this.saving || !this.unsaved()) return;
    const text = this.text;
    this.saving = true;
    cx.spawn(async cx => {
      try {
        await writeTextFile(this.file, text, this.saved);
        this.saved = text;
        this.message = "Saved";
      } catch { this.message = "Save failed: file changed elsewhere or cannot be written"; }
      finally { this.saving = false; cx.notify(); }
    });
  }

  // The first click asks; the second throws away the edits and reads the file again.
  reload(cx) {
    if (!this.discard) { this.discard = true; cx.notify(); return; }
    this.discard = false;
    this.code?.release();
    this.code = this.text = this.saved = this.message = null;
    this.load(cx);
    cx.notify();
  }

  close() { this.code?.release(); }

  render(cx) {
    const t = theme();
    const labels = { preview: "Preview", source: "Source", side: "Side by side", stack: "Top / bottom" };
    const unsaved = this.unsaved(), canSave = !this.on && !this.saving && unsaved;
    const button = (id, label, enabled, onClick, selected = false) => div().id(id).px(8).py(4).rounded(4)
      .bg(selected ? t.selected : t.surface).text_color(enabled ? t.foreground : t.dim)
      .when(enabled, el => el.cursor_pointer().hover(s => s.bg(selected ? t.selected : t.hover)).on_click(onClick))
      .child(label);
    const source = () => Editor.new(this.code).flex_1().min_w(0).min_h(0);
    const diff = this.diff();
    const scroll = () => div().id("markdown-scroll").flex_1().min_w(0).min_h(0).overflow_y_scrollbar().p(16);
    // In git, each block gets its own view so a bar can sit beside it: green new, blue changed,
    // red where lines were deleted. Link definitions are repeated into every block so [x][1] still resolves.
    const preview = () => {
      if (!diff) return scroll().child(TextView.markdown("markdown", this.text));
      const lines = this.text.split("\n"), list = blocks(this.text);
      const refs = lines.filter(l => /^ {0,3}\[[^\]^][^\]]*\]:/.test(l)).join("\n");
      const owner = k => { const i = list.findIndex(([, end]) => k < end); return i < 0 ? list.length - 1 : i; };
      const red = new Set(diff.deleted.map(owner));
      return scroll().child(v_flex().gap(8).children(list.map(([start, end], i) => {
        let kind = null;
        for (let k = start; k < end && kind !== "mod"; k++) kind = diff.kinds[k] ?? kind;
        const color = kind === "mod" ? t.ansi4 : kind === "add" ? t.ansi2 : null;
        const md = lines.slice(start, end).join("\n") + (refs ? `\n\n${refs}` : "");
        return div().relative().pl(12).child(TextView.markdown(`markdown-${i}`, md))
          .when(Boolean(color), el => el.child(div().absolute().left(0).top(0).bottom(0).w(3).rounded(1).bg(color)))
          // Deleted lines sat in the gap above this block: a short red mark there, not a bar.
          .when(red.has(i), el => el.child(div().absolute().left(0).top(-7).w(8).h(6).rounded(1).bg(t.ansi1)));
      })));
    };
    let body;
    if (this.error || !this.code) body = div().p(16).child(this.error || (this.file ? "Loading…" : "No file selected"));
    else if (this.mode === "source") body = source();
    else if (this.mode === "preview") body = preview();
    else if (this.mode === "side") body = h_flex().flex_1().min_h(0).child(source()).child(preview());
    else body = v_flex().flex_1().min_h(0).child(source()).child(preview());
    const status = this.on ? "Remote file: read-only" : this.message || (unsaved ? "● Unsaved changes" : "");
    const warn = !this.on && (unsaved || /failed/.test(this.message ?? ""));
    const name = this.file?.split("/").pop() ?? "";
    // In a floating window, presses that are not stopped drag it, so only the title bar drags.
    const keep = el => el.on_mouse_down("left", (_e, cx) => cx.stop_propagation());
    return v_flex().id("root").size_full().min_h(0).bg(t.background).text_color(t.foreground)
      .on_key_down((e, cx) => { if (e.keystroke === "cmd-s") { this.save(cx); cx.stop_propagation(); } })
      .when(Boolean(this.overlay), el => el.child(h_flex().flex_none().h(28).pl(10).pr(4).items_center()
        .border_b_1().border_color(t.border).bg(t.surface)
        .child(div().flex_1().min_w(0).truncate().text_color(t.muted).child(name))
        .child(keep(div().id("close").px(8).rounded(4).cursor_pointer().hover(s => s.bg(t.hover))
          .on_click(() => closeOverlay(this.overlay)).child("×")))))
      .child(keep(h_flex().id("toolbar").flex_none().flex_wrap().gap(6).p(8).items_center())
        .children(modes.map(mode => button(`mode-${mode}`, labels[mode], true, (_e, cx) => {
          this.mode = mode;
          localStorage.setItem("mode", mode);
          cx.notify();
        }, this.mode === mode)))
        .child(button("save", this.saving ? "Saving…" : "Save", canSave, (_e, cx) => this.save(cx)))
        .when(unsaved, el => el.child(button("reload", this.discard ? "Discard edits?" : "Reload", true, (_e, cx) => this.reload(cx))))
        .child(div().flex_none().px(4).text_color(warn ? t.ansi3 ?? t.foreground : t.muted).child(status))
        .when(Boolean(diff && (diff.added || diff.removed)), el => el.child(h_flex().flex_none().gap(4).px(4)
          .child(div().text_color(t.ansi2 ?? t.foreground).child(`+${diff.added}`))
          .child(div().text_color(t.ansi1 ?? t.foreground).child(`−${diff.removed}`))))
        .when(!this.overlay, el => el.child(div().flex_1().min_w(80).truncate().text_right().text_color(t.muted).child(name))))
      .child(keep(v_flex().id("body").flex_1().min_h(0).child(body)));
  }
}
