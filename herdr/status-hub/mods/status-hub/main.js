import { View, div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { appHome, readTextFile, theme, props, layout, run, exec } from "herdr";

const pages = ["Claude Code", "Docker"];

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

export default class ClaudeUsage extends View {
  init(_props, cx) {
    if (props()?.toggle) return;
    const saved = localStorage.getItem("page");
    this.page = pages.includes(saved) ? saved : pages[0];
    localStorage.setItem("page", this.page);
    this.refresh(cx);
    cx.timer.every(5000, cx => this.refresh(cx));
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
        } else {
          const text = await readTextFile(`${appHome()}/data/claude-usage.json`);
          this.data = text ? JSON.parse(text) : null;
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
    const bar = (name, value, reset) => {
      const valid = typeof value === "number" && Number.isFinite(value);
      const percent = valid ? Math.max(0, Math.min(100, value)) : 0;
      const remaining = countdown(reset);
      return h_flex().h(22).gap(8).items_center()
        .child(div().w(55).text_color(t.muted).child(name))
        .child(h_flex().gap(2).children(Array.from({ length: 10 }, (_, i) => {
          const scale = i < Math.floor(percent / 10) && !stale ? 1 : 0.3;
          const color = [75, 128, 48].map((v, c) => Math.round((v + ([150, 255, 96][c] - v) * i / 9) * scale).toString(16).padStart(2, "0")).join("");
          return div().w(10).h(6).rounded(2).bg(`#${color}`);
        })))
        .child(div().w(32).text_color(t.foreground).child(valid ? `${Math.round(percent)}%` : "—"))
        .when(Boolean(remaining), el => el.child(div().px(5).py(1).rounded(5).bg("#34452d").text_size(10)
          .text_color("#b8eda0").child(remaining)));
    };
    const arrow = (direction, symbol) => div().id(`page-${direction}`).px(6).py(2).rounded(4)
      .text_color(pages.length > 1 ? t.foreground : t.dim)
      .when(pages.length > 1, el => el.cursor_pointer().hover(s => s.bg(t.hover)).on_click((_e, cx) => {
        const index = pages.indexOf(this.page);
        this.page = pages[(index + direction + pages.length) % pages.length];
        localStorage.setItem("page", this.page);
        this.refresh(cx);
        cx.notify();
      })).child(symbol);
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
      .when(!docker, el => el.child(bar("Context", data?.context))
        .child(bar("5 hours", data?.five_hour, data?.five_hour_reset))
        .child(bar("7 days", data?.seven_day, data?.seven_day_reset)))
      .when(docker, el => el.child(this.dockerError ? div().p(8).text_color(t.muted).child("Docker unavailable") :
        this.containers ? v_flex().id("docker-list").flex_1().min_h(0).overflow_y_scrollbar()
          .when(!this.containers.length, el => el.child(div().p(8).text_color(t.muted).child("No containers")))
          .children([...groups].map(([project, containers]) => v_flex().flex_none().gap(5).pt(8)
            .child(div().text_color(t.muted).text_size(10).child(project ? `COMPOSE · ${project}` : "STANDALONE"))
            .child(h_flex().flex_wrap().gap(6).children(containers.map(container =>
              v_flex().w(140).p(8).gap(4).rounded(6).bg(t.raised)
                .child(div().truncate().text_color(t.foreground).child(container.name))
                .child(h_flex().gap(5).items_center()
                  .child(div().size(6).rounded(3).bg(container.state === "running" && !container.status.includes("unhealthy") ? "#96ff60" : t.blocked))
                  .child(div().flex_1().min_w(0).truncate().text_color(t.muted).text_size(10).child(container.status)))))))) :
        div().p(8).text_color(t.muted).child("Loading Docker…")));
  }
}
