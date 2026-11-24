# Status Hub for Herdr

A compact Herdr panel with switchable pages for Claude Code and Codex usage and Docker container status. The Claude page shows the model, effort, output style, fast mode, current folder, repository, branch and worktree, then context usage, five-hour and seven-day limits, and reset countdowns. The Codex page uses blue bars for the same usage and reset information. The Docker page groups container cards by Compose project and shows their status. Use the arrows to switch pages; the selection is remembered.

<p>
  <img src="assets/claude-code-page.png" alt="Status Hub on the Claude Code page: session tiles, workspace details and usage bars" width="360">
  <img src="assets/status-hub-animation.gif" alt="Status Hub animating changed tiles and usage bars" width="360">
</p>

When a tile's value changes, a white line runs once around its edge. When a usage bar gains or loses a lit segment, each segment's frame lights in turn. Both take 0.5 seconds.

## Install

Requirements: Herdr Desktop, Bash, `jq` and Python 3. The Claude page needs Claude Code with a shell status line; the Docker page needs the Docker CLI and access to a local Docker daemon.

1. Clone this repository and copy `herdr/status-hub/mods/status-hub` into `${HERDR_APP_HOME:-~/.config/herdr-app}/mods/status-hub`. If a mod with that name already exists, do not overwrite it without checking its contents.
2. Run `herdr-app check` on the installed folder.
3. Add the mod to a **personal** layout. You can ask your Herdr agent:

   > Read `~/.config/herdr-app/AGENTS.md`, then add the installed `status-hub` mod below my Files panel. Add a button to show and hide it. Do not modify shipped layouts or mods.

   The panel is one copy of the mod. For the button, add another copy with `props: {"toggle": true}` and ensure the panel has the layout ID `panel-claude-usage` and the right sidebar has the ID `panel`.
4. Wrap your existing Claude Code status line so the panel can receive usage data. In `~/.claude/settings.json`, set `statusLine.command` to run `bash <absolute path to mods/status-hub/capture.sh> <your existing status-line program and its arguments>`. For example, if the existing command is `~/.claude/statusline.sh`, the new command is `bash ~/.config/herdr-app/mods/status-hub/capture.sh ~/.claude/statusline.sh`.

   Back up your existing settings first. If your command contains shell operators, quoting, environment assignments, or pipes, preserve it in a separate script and pass that script to the wrapper. If you have no existing status line, create a script that consumes stdin without printing it and pass that script instead. The wrapper forwards the original input and output to that program.

5. Use Claude Code until its status line updates. The panel displays `stale` if no update arrives for five minutes. Fields not provided by Claude Code appear as `—`.

To update, pull the repository and copy `main.js`, `mod.json`, `capture.sh`, `codex-usage.py`, and `VERSION` into the installed mod folder, then run `herdr-app check` again. Back up any personal customizations first.

Check the installed version with:

```sh
cat "${HERDR_APP_HOME:-$HOME/.config/herdr-app}/mods/status-hub/VERSION"
```

See the [changelog](CHANGELOG.md) for release notes. The version file identifies the copied release; it does not check for updates or detect later local edits.

## Data and limits

The wrapper saves only percentages, reset times, the model, effort and output style names, whether fast mode is on, the current folder path, repository name, branch and worktree names and an update timestamp to `data/claude-usage.json` under the Herdr app home. To find the branch, it runs `git branch --show-current` in the current folder; a detached HEAD shows as `—`. It does not save credentials or conversation content. When Claude Code runs in a Herdr terminal, the wrapper also saves a copy per terminal under `data/claude-sessions/`. The Claude page then follows the focused Claude pane: session, workspace and context come from that session, and the five-hour and seven-day limits come from the newest update of any session. If no Claude pane has been focused yet, or it has not updated its status line, the page shows the most recently updated session. Old per-terminal files are not deleted; they are small. The wrapper and Herdr must use the same `HERDR_APP_HOME`.

The Codex page reads token-count events from the 10 most recently modified session files under `${CODEX_HOME:-~/.codex}/sessions`; no extra setup is needed. Context comes from the most recently updated session with usage data, not necessarily the focused one. Values become stale five minutes after that event, and missing values appear as `—`. Only usage and reset data are displayed; the session files themselves can contain conversation content.

The Docker page runs `docker ps -a` locally every five seconds while selected, including while the panel is hidden. It reads container names, status, and Compose project labels; it does not start, stop, or modify containers. Containers without a Compose label appear under Standalone. A green dot means running and not reported unhealthy; it does not guarantee a health check. Docker errors show as unavailable. Remote Docker hosts are not supported.

## Checks

Run `node herdr/status-hub/test.mjs` and `python3 herdr/status-hub/test_codex_usage.py` from the repository root, then `herdr-app check herdr/status-hub/mods/status-hub`.
