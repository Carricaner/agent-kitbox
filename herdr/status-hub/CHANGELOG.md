# Changelog

## 0.4.0 — 2026-11-24

- Flash a usage bar when its number of lit segments changes: each segment's white frame lights in turn, then fades.
- When a Session or Workspace tile's value changes, a white line runs once around its edge, bright at the head and fading into the tile's gray at the tail.
- Both animations take 0.5 seconds and start slow, then speed up.
- First loads, missing values, and page or session switches never animate.

## 0.3.0 — 2026-11-24

- Add a Session category to the Claude page: model, effort, output style and fast mode as four equal tiles, plus a Workspace category with the current folder, repository, branch and worktree.
- Make the usage bar segments larger.
- Follow the focused Claude Code pane: session, workspace and context come from that session, while rate limits come from the newest update.
- Give every category heading one shared centered style, including Usage and Docker project groups.

## 0.2.0 — 2026-11-16

- Add a blue Codex usage page with context and rate limit countdowns.

## 0.1.0 — 2026-11-16

- Initial published version: Claude Code usage and reset countdowns, plus a Docker container status page.
- Switch between pages, remember the selection, and group containers by Docker Compose project.
