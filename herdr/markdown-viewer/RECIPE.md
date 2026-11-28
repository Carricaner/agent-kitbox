# Markdown viewer

A Herdr pane for reading and editing Markdown, with a live preview.

## What you see

- A pane in theme colors.
- A toolbar at the top: Preview, Source, Side by side, Top / bottom, Save, then the save status.
- A scrollable document below.
- Source uses the configured monospace font. Preview shows formatted Markdown.

## How it behaves

- Preview shows formatted Markdown. Source edits the text.
- Side by side and Top / bottom show both. The preview follows edits.
- Save writes local edits and reports success or failure.
- If saving fails, unsaved edits stay in the editor.
- With no unsaved edits, the file refreshes every two seconds.
- Remote files are read-only.
- It does not show agent statuses or bind keys.

## Built from

- `mods/markdown-viewer/main.js` and a `mod.json` with `place: none`.
- Props: `file`, and optional `on`.
- `EditorState` and `Editor` for source. `TextView.markdown` for preview.
- Herdr APIs: `readTextFile`, `writeTextFile`, `theme`, `settings`, `props`.
- No programs, network requests, shipped mods or images.

## Watch out

- Keep the last saved text as the expected value for atomic writes, so outside changes are never overwritten.
- Never replace unsaved edits during a refresh.
- `writeTextFile` only works on local files. Keep remote files read-only.
- Closing the pane throws away unsaved edits.
- The Files panel needs its own setup to open this mod.

## Done when

- `herdr-app check mods/markdown-viewer` passes.
- A local Markdown file opens in every view, edits show in the preview, and Save writes them.
- After an outside edit, a conflicting save fails and neither version is lost.
- A remote file stays read-only. Missing or unreadable files show an error.
