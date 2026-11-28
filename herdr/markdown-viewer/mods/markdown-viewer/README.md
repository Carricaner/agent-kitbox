# Markdown viewer for Herdr

## What it does

- Four views: source, formatted preview, side by side, or top and bottom.
- Edit local files in Source, then click Save.
- The preview follows your edits.
- With no unsaved edits, it checks the file for outside changes every two seconds.
- If the file changed somewhere else, Save fails and nothing is overwritten. Copy your edits, then reopen the file.
- Remote files are read-only.

## Install

```sh
git clone https://github.com/Carricaner/agent-kitbox.git
cd agent-kitbox
mkdir -p "${HERDR_APP_HOME:-$HOME/.config/herdr-app}/mods/markdown-viewer"
cp herdr/markdown-viewer/mods/markdown-viewer/{main.js,mod.json,VERSION} "${HERDR_APP_HOME:-$HOME/.config/herdr-app}/mods/markdown-viewer/"
herdr-app check "${HERDR_APP_HOME:-$HOME/.config/herdr-app}/mods/markdown-viewer"
```

## Update

1. Back up any changes you made to the installed mod.
2. Save any open edits. Herdr reloads the mod when its files change.
3. Run `git pull` in the cloned repository.
4. Run the `cp` and `herdr-app check` commands again.

## Check the version

```sh
cat "${HERDR_APP_HOME:-$HOME/.config/herdr-app}/mods/markdown-viewer/VERSION"
```

- This shows the version you copied. It does not check for updates or notice your own edits.
- Release notes: [changelog](../../CHANGELOG.md).

## Open a file

Open a file beside the focused terminal:

```sh
herdr-app do pane.split '{"direction":"right","mod":"markdown-viewer","props":{"file":"/absolute/path/to/file.md"}}'
```

To open Markdown files from the Files panel, set up the Files panel separately.
