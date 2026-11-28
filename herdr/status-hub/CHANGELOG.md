# Changelog

## Unreleased

- Fix the usage bar animation leaving faint gray edges on segments after the light passed (seen at window zoom other than 100%).
- New README animation showing the three-segment light.

## 0.4.1 — 2026-11-29

- The usage bar animation now looks like a short moving light: at most three segment frames are lit at once. When a new frame lights, the oldest of the three goes dark.
- Simpler, bullet-point README with the screenshot and animation shown one above the other.

## 0.4.0 — 2026-11-24

- Usage bars animate when their lit segment count changes: each segment's white frame lights in turn, then fades.
- Session and Workspace tiles animate when their value changes: a white line runs once around the edge, bright head, fading tail.
- Both take 0.5 seconds, slow first, then fast.
- No animation on first load, missing values, or page and session switches.

## 0.3.0 — 2026-11-24

- New Session category: model, effort, output style and fast mode, as four equal tiles.
- New Workspace category: current folder, repository, branch and worktree.
- Larger usage bar segments.
- Follows the focused Claude Code pane:
  - Session, workspace and context come from that pane.
  - Rate limits come from the newest update.
- One shared, centered style for every category heading, including Usage and Docker project groups.

## 0.2.0 — 2026-11-16

- New Codex page: blue usage bars for context and rate limits, with countdowns.

## 0.1.0 — 2026-11-16

- First release: Claude Code usage with reset countdowns, and a Docker container page.
- Switch pages with arrows. The last page is remembered.
- Docker containers are grouped by Compose project.
