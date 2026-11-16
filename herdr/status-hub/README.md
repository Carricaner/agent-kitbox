# Status Hub for Herdr

A compact Herdr panel with switchable pages for Claude Code usage and Docker container status. The Claude page shows context usage, five-hour and seven-day limits, and reset countdowns. The Docker page groups container cards by Compose project and shows their status. Use the arrows to switch pages; the selection is remembered.

## Install

Requirements: Herdr Desktop, Bash and `jq`. The Claude page needs Claude Code with a shell status line; the Docker page needs the Docker CLI and access to a local Docker daemon.

1. Clone this repository and copy `herdr/status-hub/mods/status-hub` into `${HERDR_APP_HOME:-~/.config/herdr-app}/mods/status-hub`. If a mod with that name already exists, do not overwrite it without checking its contents.
2. Run `herdr-app check` on the installed folder.
3. Add the mod to a **personal** layout. You can ask your Herdr agent:

   > Read `~/.config/herdr-app/AGENTS.md`, then add the installed `status-hub` mod below my Files panel. Add a button to show and hide it. Do not modify shipped layouts or mods.

   The panel is one copy of the mod. For the button, add another copy with `props: {"toggle": true}` and ensure the panel has the layout ID `panel-claude-usage` and the right sidebar has the ID `panel`.
4. Wrap your existing Claude Code status line so the panel can receive usage data. In `~/.claude/settings.json`, set `statusLine.command` to run `bash <absolute path to mods/status-hub/capture.sh> <your existing status-line program and its arguments>`. For example, if the existing command is `~/.claude/statusline.sh`, the new command is `bash ~/.config/herdr-app/mods/status-hub/capture.sh ~/.claude/statusline.sh`.

   Back up your existing settings first. If your command contains shell operators, quoting, environment assignments, or pipes, preserve it in a separate script and pass that script to the wrapper. If you have no existing status line, create a script that consumes stdin without printing it and pass that script instead. The wrapper forwards the original input and output to that program.

5. Use Claude Code until its status line updates. The panel displays `stale` if no update arrives for five minutes. Fields not provided by Claude Code appear as `—`.

To update, pull the repository and copy `main.js`, `mod.json`, and `capture.sh` into the installed mod folder, then run `herdr-app check` again. Back up any personal customizations first.

## Data and limits

The wrapper saves only percentages, reset times and an update timestamp to `data/claude-usage.json` under the Herdr app home. It does not save credentials or conversation content. Multiple Claude sessions share that file: **context is from the most recently updated session**, not necessarily the focused one. The wrapper and Herdr must use the same `HERDR_APP_HOME`.

The Docker page runs `docker ps -a` locally every five seconds while selected, including while the panel is hidden. It reads container names, status, and Compose project labels; it does not start, stop, or modify containers. Containers without a Compose label appear under Standalone. A green dot means running and not reported unhealthy; it does not guarantee a health check. Docker errors show as unavailable. Remote Docker hosts are not supported.

## Checks

Run `node herdr/status-hub/test.mjs` from the repository root, then `herdr-app check herdr/status-hub/mods/status-hub`.
