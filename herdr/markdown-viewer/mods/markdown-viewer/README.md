# Markdown viewer for Herdr

View a Markdown file as source, formatted text, or both side by side or stacked. Edit local files in Source mode and click Save. The preview follows your edits. The viewer checks for external changes every two seconds when there are no unsaved edits. If the file changed elsewhere, saving fails without overwriting it; copy your edits before reopening the file. Remote files are read-only.

## Install and update

Clone the repository, then copy the mod into Herdr's configuration folder:

```sh
git clone https://github.com/Carricaner/agent-kitbox.git
cd agent-kitbox
mkdir -p "${HERDR_APP_HOME:-$HOME/.config/herdr-app}/mods/markdown-viewer"
cp herdr/markdown-viewer/mods/markdown-viewer/{main.js,mod.json,VERSION} "${HERDR_APP_HOME:-$HOME/.config/herdr-app}/mods/markdown-viewer/"
herdr-app check "${HERDR_APP_HOME:-$HOME/.config/herdr-app}/mods/markdown-viewer"
```

To update, run `git pull` in the cloned repository and repeat the `cp` and `herdr-app check` commands. This replaces the installed mod's code; back up any personal modifications first. Herdr reloads the mod after files are saved, so save any open edits before updating.

Check the installed version with:

```sh
cat "${HERDR_APP_HOME:-$HOME/.config/herdr-app}/mods/markdown-viewer/VERSION"
```

See the repository's [changelog](../../CHANGELOG.md) for release notes. The version file identifies the copied release; it does not check for updates or detect later local edits.

Open a file beside the focused terminal:

```sh
herdr-app do pane.split '{"direction":"right","mod":"markdown-viewer","props":{"file":"/absolute/path/to/file.md"}}'
```

The Files panel must be configured separately to open Markdown files in this viewer.
