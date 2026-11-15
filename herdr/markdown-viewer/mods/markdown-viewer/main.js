import { View, div } from "gpui-kit";
import { v_flex, h_flex, TextView, Editor, EditorState } from "gpui-base";
import { props, readTextFile, writeTextFile, theme, settings } from "herdr";

export default class MarkdownViewer extends View {
  init(_props, cx) {
    this.file = props()?.file;
    this.on = props()?.on;
    this.mode = "preview";
    this.load(cx);
    cx.timer.every(2000, cx => this.load(cx));
  }

  load(cx) {
    if (this.loading || this.saving || !this.file || (this.code && this.text !== this.saved)) return;
    this.loading = true;
    cx.spawn(async cx => {
      try {
        const text = await readTextFile(this.file, { on: this.on });
        if (this.code && this.text !== this.saved) return;
        if (text === null) { this.error = "File not found"; }
        else if (text !== this.text) {
          this.code?.release();
          this.text = this.saved = text;
          this.code = EditorState.new({ language: "markdown", readonly: !!this.on, value: text,
            font_family: settings().font_family, font_size: 12 });
          this.code.on("change", (_event, cx) => { this.text = this.code.value(); this.message = null; cx.notify(); });
          this.error = null;
        } else this.error = null;
      } catch { this.error = "Cannot read this file"; }
      finally { this.loading = false; cx.notify(); }
    });
  }

  save(cx) {
    if (this.on || this.saving || !this.code || this.text === this.saved) return;
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

  close() { this.code?.release(); }

  render(cx) {
    const t = theme();
    const modes = [["preview", "Preview"], ["source", "Source"], ["side", "Side by side"], ["stack", "Top / bottom"]];
    const source = () => Editor.new(this.code).flex_1().min_w(0).min_h(0);
    const preview = () => div().id("markdown-scroll").flex_1().min_w(0).min_h(0).overflow_y_scrollbar().p(16)
      .child(TextView.markdown("markdown", this.text));
    let body;
    if (this.error || !this.code) body = div().p(16).child(this.error || (this.file ? "Loading…" : "No file selected"));
    else if (this.mode === "source") body = source();
    else if (this.mode === "preview") body = preview();
    else if (this.mode === "side") body = h_flex().flex_1().min_h(0).child(source()).child(preview());
    else body = v_flex().flex_1().min_h(0).child(source()).child(preview());
    return v_flex().size_full().min_h(0).bg(t.background).text_color(t.foreground)
      .child(h_flex().flex_none().gap(6).p(8).children(modes.map(([mode, label]) =>
        div().id(`mode-${mode}`).px(8).py(4).rounded(4).cursor_pointer()
          .bg(this.mode === mode ? t.selected : t.surface)
          .on_click((_e, cx) => { this.mode = mode; cx.notify(); }).child(label)))
        .child(div().id("save").px(8).py(4).rounded(4).cursor_pointer().bg(t.surface)
          .on_click((_e, cx) => this.save(cx)).child(this.saving ? "Saving…" : "Save"))
        .child(div().px(4).py(4).text_color(t.muted).child(this.on ? "Remote file: read-only" : this.message || (this.code && this.text !== this.saved ? "Unsaved" : ""))))
      .child(body);
  }
}
