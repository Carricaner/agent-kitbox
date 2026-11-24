# Status Hub

A compact Herdr panel that switches between Claude Code and Codex usage and Docker containers. A Status Hub button shows or hides it; arrows in its header switch pages.

## What you see

A theme-colored, bordered panel below the Files or Changes area. Its centered heading has a left and right arrow. Claude Code shows an Output Style section with the current style name, then a Usage section with three labeled green segmented bars and green countdown badges. Codex shows the same usage bars and countdowns in blue. Docker shows small cards grouped by Compose project, with the container name, status text and a colored dot. The Docker list scrolls. Every category heading on every page, including Docker's project groups and any future page, uses one shared style: a centered, semibold, muted uppercase label with a thin border-colored line on each side.

## How it behaves

The Status Hub button toggles the panel and opens the right sidebar when needed. Arrows cycle between Claude Code, Codex and Docker and remember the page. Claude and Codex data older than five minutes is labeled stale. Docker refreshes every five seconds while its page is selected, even when the panel is hidden. An unavailable daemon or empty list shows a message. This mod does not display agent statuses or bind keys.

## Built from

Create `mods/status-hub/main.js`, `mod.json`, `capture.sh`, and `codex-usage.py`. The layout places one mod copy in the right panel and another with `props: {toggle: true}` in the tab row. The status-line wrapper forwards input to the existing Claude status-line program and saves only usage percentages, reset timestamps, the output style name, and update time to the Herdr app home. The Codex page reads token-count events from recent local Codex session files. The mod uses Herdr's file, layout, theme and command APIs and runs `docker ps -a` to read local container metadata. It requires Bash, jq, Python 3 and Docker for their respective features.

## Watch out

Do not replace or break an existing status-line command. Multiple Claude sessions write the same snapshot, so context belongs to the latest update. Codex context also belongs to the latest session with usage data. Missing data is not zero. Docker project labels can be absent; put those containers under Standalone. Running does not imply a health check. Keep Docker actions read-only, show errors, and allow scrolling. This mod does not support remote Docker hosts.

## Done when

- `herdr-app check mods/status-hub` succeeds.
- Existing Claude status-line output remains intact and only the intended fields are saved.
- Arrows switch pages and restore the last selection; the button toggles the panel.
- Codex usage appears in blue, and missing data displays as unavailable.
- Docker containers are grouped by Compose label; standalone, empty, unavailable, running, unhealthy and stopped states are legible.
