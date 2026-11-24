import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { agents, appHome, readTextFile, theme, props, layout, run, exec } from "herdr";

const pages = ["Claude Code", "Codex", "Docker"];

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

function countdown(at) {
  if (typeof at !== "number" || !Number.isFinite(at)) return "";
  const seconds = Math.floor(at - Date.now() / 1000);
  if (seconds <= 0) return "now";
  const days = Math.floor(seconds / 86400), hours = Math.floor(seconds % 86400 / 3600), minutes = Math.floor(seconds % 3600 / 60);
  return days ? `${days}d ${hours}h` : hours ? `${hours}h ${minutes}m` : minutes ? `${minutes}m` : "<1m";
}

function text(value) {
  return typeof value === "string" && value ? value : "";
}

// ponytail: fixed 40-char cutoff, measure the panel width if paths still clip.
function shortPath(path) {
  if (path.length <= 40) return path;
  const parts = path.split("/").filter(Boolean);
  return `…/${parts.slice(-2).join("/")}`;
}

export default class ClaudeUsage extends View {
  init(_props, cx) {
    if (props()?.toggle) return;
    const saved = localStorage.getItem("page");
    this.page = pages.includes(saved) ? saved : pages[0];
    localStorage.setItem("page", this.page);
    this.refresh(cx);
    // Claude reads two small files, so it can follow focus every second; the others stay at 5s.
    this.ticks = 0;
    cx.timer.every(1000, cx => { if (this.page === "Claude Code" || ++this.ticks % 5 === 0) this.refresh(cx); });
  }

  refresh(cx) {
    if (this.loading) return;
    this.loading = true;
    const page = this.page;
    cx.spawn(async cx => {
      try {
        if (page === "Docker") {
          const result = await exec("docker", ["ps", "-a", "--format", "{{json .Names}}\t{{json .State}}\t{{json .Status}}\t{{json (.Label \"com.docker.compose.project\")}}"], { timeout: 5000 });
          if (result.code !== 0) throw new Error("Docker unavailable");
          this.containers = result.stdout.trim() ? result.stdout.trim().split("\n").map(line => {
            const [name, state, status, project] = line.split("\t").map(value => JSON.parse(value));
            return { name, state, status, project };
          }) : [];
          this.dockerError = false;
        } else if (page === "Codex") {
          const result = await exec("python3", [`${appHome()}/mods/status-hub/codex-usage.py`], { timeout: 5000 });
          if (result.code !== 0) throw new Error("Codex unavailable");
          this.data = JSON.parse(result.stdout);
        } else {
          const read = async name => {
            const text = await readTextFile(`${appHome()}/data/${name}`);
            return text ? JSON.parse(text) : null;
          };
          const session = id => /^[\w-]+$/.test(id ?? "") ? read(`claude-sessions/${id}.json`).catch(() => null) : null;
          // Follow the focused agent when it has a session file; otherwise keep the last one.
          const focus = agents().find(a => a.focused)?.address;
          let current = await session(focus);
          if (current) this.terminal = focus;
          else current = await session(this.terminal);
          const latest = await read("claude-usage.json");
          // Rate limits are account-wide, so take them from the newest update of any session.
          this.data = current && latest ? { ...current, updated: latest.updated, five_hour: latest.five_hour,
            five_hour_reset: latest.five_hour_reset, seven_day: latest.seven_day, seven_day_reset: latest.seven_day_reset } : latest ?? current;
        }
      } catch {
        if (page === "Docker") this.dockerError = true;
        else this.data = null;
      }
      finally { this.loading = false; if (this.page !== page) this.refresh(cx); cx.notify(); }
    });
  }

  render() {
    const t = theme(), data = this.data;
    if (props()?.toggle) {
      const root = layout(), panel = find(root, "panel"), usage = find(root, "panel-claude-usage");
      const shown = panel && !panel.hidden && usage && !usage.hidden;
      return h_flex().size_full().items_center().justify_center().bg(t.chrome)
        .child(div().id("usage-toggle").px(8).py(4).rounded(6).cursor_pointer()
          .bg(shown ? t.selected : t.chrome).text_color(shown ? t.foreground : t.muted).text_size(12)
          .hover(s => s.bg(t.hover))
          .on_click(() => {
            if (shown) run("layout.hide", { id: "panel-claude-usage" });
            else { run("layout.show", { id: "panel-claude-usage" }); run("layout.show", { id: "panel" }); }
          }).child("Status Hub"));
    }
    const stale = !data || !Number.isFinite(data.updated) || Date.now() / 1000 - data.updated > 300;
    const blue = this.page === "Codex";
    const bar = (name, value, reset) => {
      const valid = typeof value === "number" && Number.isFinite(value);
      const percent = valid ? Math.max(0, Math.min(100, value)) : 0;
      const remaining = countdown(reset);
      return h_flex().h(26).gap(8).items_center()
        .child(div().w(55).text_color(t.muted).child(name))
        .child(h_flex().gap(2).children(Array.from({ length: 10 }, (_, i) => {
          const scale = i < Math.floor(percent / 10) && !stale ? 1 : 0.3;
          const start = blue ? [48, 96, 160] : [75, 128, 48], end = blue ? [96, 180, 255] : [150, 255, 96];
          const color = start.map((v, c) => Math.round((v + (end[c] - v) * i / 9) * scale).toString(16).padStart(2, "0")).join("");
          return div().w(14).h(10).rounded(2).bg(`#${color}`);
        })))
        .child(div().w(32).text_color(t.foreground).child(valid ? `${Math.round(percent)}%` : "—"))
        .when(Boolean(remaining), el => el.child(div().px(5).py(1).rounded(5).bg(blue ? "#263e59" : "#34452d").text_size(10)
          .text_color(blue ? "#a6d5ff" : "#b8eda0").child(remaining)));
    };
    const arrow = (direction, symbol) => div().id(`page-${direction}`).px(6).py(2).rounded(4)
      .text_color(pages.length > 1 ? t.foreground : t.dim)
      .when(pages.length > 1, el => el.cursor_pointer().hover(s => s.bg(t.hover)).on_click((_e, cx) => {
        const index = pages.indexOf(this.page);
        this.page = pages[(index + direction + pages.length) % pages.length];
        this.data = null;
        localStorage.setItem("page", this.page);
        this.refresh(cx);
        cx.notify();
      })).child(symbol);
    const rule = () => div().flex_1().h(1).bg(t.border);
    const section = label => h_flex().pt(8).pb(2).gap(8).items_center()
      .child(rule())
      .child(div().text_color(t.muted).text_size(10).font_weight(600).child(label))
      .child(rule());
    const tile = (label, value) => v_flex().flex_1().min_w(0).gap(3).px(8).py(6).rounded(6).bg(t.raised)
      .child(div().text_color(t.muted).text_size(9).font_weight(600).child(label))
      .child(div().truncate().text_color(value ? t.foreground : t.dim).text_size(12).child(value || "—"));
    const docker = this.page === "Docker";
    const groups = new Map();
    for (const container of this.containers ?? []) {
      const key = container.project || "";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(container);
    }
    return v_flex().size_full().min_h(0).px(12).py(8).gap(2).bg(t.background).rounded(10)
      .border_1().border_color(t.border).text_size(11)
      .child(h_flex().items_center().justify_between()
        .child(arrow(-1, "‹"))
        .child(div().text_color(t.foreground).child(!docker && stale ? `${this.page} · stale` : this.page))
        .child(arrow(1, "›")))
      .when(this.page === "Claude Code", el => el.child(section("SESSION"))
        .child(h_flex().gap(6).py(2)
          .child(tile("MODEL", text(data?.model)))
          .child(tile("EFFORT", text(data?.effort)))
          .child(tile("STYLE", text(data?.output_style)))
          .child(tile("FAST", typeof data?.fast === "boolean" ? (data.fast ? "on" : "off") : "")))
        .child(section("WORKSPACE"))
        .child(div().h(20).flex().items_center().truncate().text_color(t.muted).child(text(data?.cwd) ? shortPath(data.cwd) : "—"))
        .child(h_flex().gap(6).py(2).child(tile("REPO", text(data?.repo))))
        .child(h_flex().gap(6).py(2)
          .child(tile("BRANCH", text(data?.branch)))
          .child(tile("WORKTREE", text(data?.worktree)))))
      .when(!docker, el => el.child(section("USAGE")).child(bar("Context", data?.context))
        .child(bar("5 hours", data?.five_hour, data?.five_hour_reset))
        .child(bar("7 days", data?.seven_day, data?.seven_day_reset)))
      .when(docker, el => el.child(this.dockerError ? div().p(8).text_color(t.muted).child("Docker unavailable") :
        this.containers ? v_flex().id("docker-list").flex_1().min_h(0).overflow_y_scrollbar()
          .when(!this.containers.length, el => el.child(div().p(8).text_color(t.muted).child("No containers")))
          .children([...groups].map(([project, containers]) => v_flex().flex_none().gap(5)
            .child(section(project ? `COMPOSE · ${project}` : "STANDALONE"))
            .child(h_flex().flex_wrap().gap(6).children(containers.map(container =>
              v_flex().w(140).p(8).gap(4).rounded(6).bg(t.raised)
                .child(div().truncate().text_color(t.foreground).child(container.name))
                .child(h_flex().gap(5).items_center()
                  .child(div().size(6).rounded(3).bg(container.state === "running" && !container.status.includes("unhealthy") ? "#96ff60" : t.blocked))
                  .child(div().flex_1().min_w(0).truncate().text_color(t.muted).text_size(10).child(container.status)))))))) :
        div().p(8).text_color(t.muted).child("Loading Docker…")));
  }
}
