# Markdown viewer

A Herdr pane for reading and editing Markdown, with a live preview and a choice of source and preview layouts.

## What you see

A theme-colored pane has a toolbar at the top and a scrollable document below. The toolbar offers Preview, Source, Side by side, Top / bottom, and Save, followed by the save status. Source uses the configured monospace font; preview renders Markdown.

## How it behaves

Preview shows formatted Markdown. Source edits the text. Side by side and Top / bottom show both, with preview following edits. Save writes local edits explicitly and reports success or failure. Unsaved edits remain in the editor if saving fails. When there are no unsaved edits, the file refreshes every two seconds. Remote files are read-only. This pane does not display agent statuses or bind keys.

## Built from

Create `mods/markdown-viewer/main.js` and a `mod.json` with `place: none`. The pane receives `file` and optional `on` props. Use `EditorState` and `Editor` for source, `TextView.markdown` for preview, and Herdr's `readTextFile`, `writeTextFile`, `theme`, `settings`, and `props` APIs. No programs, network requests, shipped mods, or image assets are needed.

## Watch out

Keep the last saved text as the expected value for atomic writes so external changes are not overwritten. Never replace unsaved edits during refresh. `writeTextFile` only supports local files; remote files must stay read-only. Closing the pane discards unsaved edits. The Files panel needs separate configuration to open this mod.

## Done when

- `herdr-app check mods/markdown-viewer` passes.
- A local Markdown file opens in each mode, edits appear in preview, and Save writes them.
- An external edit causes a conflicting save to fail without overwriting either version.
- A remote file remains read-only and missing or unreadable files show an error.
