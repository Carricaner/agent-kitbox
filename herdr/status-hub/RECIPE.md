# Status Hub

A small Herdr panel with pages for Claude Code usage, Codex usage and Docker containers. A Status Hub button shows or hides it. Arrows in its header switch pages.

## What you see

- A bordered panel in theme colors, below the Files or Changes area.
- A centered heading with a left and a right arrow.
- **Claude Code**
  - Session: four equal tiles in one row for model, effort, output style and fast mode.
  - Workspace: the current folder, a full-width repository tile, then branch and worktree tiles.
  - Usage: three labeled green segmented bars with green countdown badges.
- **Codex**: the same usage bars and countdowns, in blue.
- **Docker**: small cards grouped by Compose project, each with the container name, status text and a colored dot. The list scrolls.
- **Category headings**: every page uses one shared style, including Docker project groups and any future page.
  - Centered, semibold, muted, uppercase label.
  - A thin border-colored line on each side.

## How it behaves

- The button toggles the panel and opens the right sidebar when needed.
- Arrows cycle Claude Code → Codex → Docker and remember the page.
- Claude and Codex data older than five minutes is marked stale.
- Animations, on the same page and session only:
  - A bar's lit segment count changes: white frames light in turn, three at a time. When a new one lights, the oldest of the three goes dark.
  - A tile's value changes: a white line, about a quarter of the edge long, runs once clockwise along the 1px edge. Bright head, tail fading into the tile's gray.
  - Both share one motion: 0.5 seconds, slow first, then fast.
  - Built with native opacity transitions. Percentage position transitions do not animate.
  - First loads, missing values and page or session switches never animate.
- Docker refreshes every five seconds while its page is selected, even when the panel is hidden.
- A down daemon or an empty list shows a message.
- It does not show agent statuses or bind keys.

## Built from

- `mods/status-hub/main.js`, `mod.json`, `capture.sh` and `codex-usage.py`.
- Layout: one copy in the right panel, another with `props: {toggle: true}` in the tab row.
- `capture.sh` wraps the existing Claude status line. It passes the input on and saves only:
  - usage percentages and reset times;
  - model, effort and output style names, and fast mode;
  - current folder, repository, branch and worktree;
  - update time.
- The Codex page reads token-count events from recent local Codex session files.
- Uses Herdr's file, layout, theme and command APIs.
- Runs `docker ps -a` to read local container data.
- Needs Bash, jq, Python 3 and Docker for their features.

## Watch out

- Never replace or break the existing status-line command.
- Many Claude sessions run at once:
  - Save one snapshot per Herdr terminal (`HC_TERMINAL_ID`, validated), plus a latest copy.
  - Show the focused Claude pane's session, workspace and context.
  - Keep the last one when a non-Claude pane is focused.
  - Take account-wide rate limits from the latest copy.
- Codex context also comes from the latest session with usage data.
- Missing data is not zero.
- Docker project labels can be missing. Put those containers under Standalone.
- Running does not mean a health check passed.
- Keep Docker read-only, show errors and allow scrolling.
- Remote Docker hosts are not supported.

## Done when

- `herdr-app check mods/status-hub` passes.
- The existing Claude status line still prints the same output, and only the listed fields are saved.
- Arrows switch pages and restore the last one. The button toggles the panel.
- Codex usage shows in blue. Missing data shows as unavailable.
- Docker containers are grouped by Compose label. Standalone, empty, unavailable, running, unhealthy and stopped all read clearly.
