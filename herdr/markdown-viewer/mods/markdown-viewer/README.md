# Markdown viewer for Herdr

## What it does

- Four views: source, formatted preview, side by side, or top and bottom.
- Edit local files in Source, then click Save or press ⌘S.
- Save is gray when there is nothing to save.
- Unsaved edits show a yellow "● Unsaved changes".
- The toolbar shows the file name.
- Each file remembers the view you last picked.
- The preview follows your edits.
- In a git repository, Preview marks what changed since the last commit, like an IDE gutter. Unsaved edits count too.
  - Green bar: new lines.
  - Blue bar: changed lines.
  - Short red mark: lines were deleted here.
  - The toolbar shows the line counts, such as `+3 −1`.
  - Bars mark whole paragraphs, lists or code blocks, not single lines.
  - Source mode shows only the count. Herdr's editor cannot draw in its margin.
  - Files outside git, or not committed yet, show no marks.
- With no unsaved edits, it checks the file for outside changes every two seconds.
- If the file changed somewhere else, Save fails and nothing is overwritten.
- To get the new version, click Reload, then click again to confirm. This throws away your edits, so copy them first if you need them.
- Closing the pane throws away unsaved edits. It does not ask first.
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

Or open it as a floating window from your own mod:

```js
openOverlay({ kind: "window", mod: "markdown-viewer", key: `markdown:${file}`, width: 760, height: 0.8, props: { file } });
```

- The window gets a title bar with the file name and a × button.
- Drag the window by its title bar.
- `key` makes each file remember where you dropped its window. Opening the same file again replaces its window.

To open Markdown files from the Files panel, set up the Files panel separately.
