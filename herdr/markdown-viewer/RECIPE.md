# Markdown viewer

A Herdr pane for reading and editing Markdown, with a live preview.

## What you see

- A pane in theme colors.
- A toolbar at the top: Preview, Source, Side by side, Top / bottom, Save, Reload (only with unsaved edits), the save status, and the file name on the right. It wraps in a narrow pane.
- Buttons highlight on hover. Save is gray when there is nothing to save.
- A scrollable document below.
- Source uses the configured monospace font. Preview shows formatted Markdown.

## How it behaves

- Preview shows formatted Markdown. Source edits the text.
- Side by side and Top / bottom show both. The preview follows edits.
- In git, Preview marks changes since `HEAD` live, including unsaved edits: a green bar beside new blocks, blue beside changed ones, and a short red mark in the gap where lines were deleted. The toolbar shows `+added −removed`. Files git does not track show nothing.
- Save (or ⌘S) writes local edits and reports success or failure.
- Unsaved edits and failed saves show in yellow.
- Reload asks once ("Discard edits?"), then drops the edits and reads the file again.
- Each file remembers its last view (`localStorage`, shared by copies with the same props).
- If saving fails, unsaved edits stay in the editor.
- With no unsaved edits, the file refreshes every two seconds.
- Remote files are read-only.
- It does not show agent statuses or bind app-wide keys. ⌘S only works while the pane has the keyboard.

## Built from

- `mods/markdown-viewer/main.js` and a `mod.json` with `place: none`.
- Props: `file`, and optional `on`. Opened with `openOverlay({ kind: "window" })`, it also gets `overlay`: then it shows a title bar with the file name and a × that calls `closeOverlay`, and stops left presses everywhere else so only the title bar drags the window.
- `EditorState` and `Editor` for source. `TextView.markdown` for preview.
- Herdr APIs: `readTextFile`, `writeTextFile`, `theme`, `settings`, `props`, and `localStorage`.
- Runs `git show HEAD:./<file>` in the file's folder every five seconds (on its machine for remote files). No network requests, shipped mods or images.
- With a git base, Preview renders each top-level block (split at blank lines outside code fences, never before an indented line) as its own `TextView.markdown`, with an absolute 3px bar beside it. Link definitions are appended to every block.
- The diff is a weighted line LCS between the common prefix and suffix: text lines outweigh blank lines, so blank lines never steal a match. Replaced lines are "mod", lines only added are "add", and a hunk with only removals marks the next block.

## Watch out

- Splitting into blocks can break Markdown that spans blank lines: HTML blocks, footnotes, and text selection across blocks. Without a git base the preview stays one view.
- `Editor` has no gutter or line-color API, so Source cannot mark lines.

- Keep the last saved text as the expected value for atomic writes, so outside changes are never overwritten.
- Never replace unsaved edits during a refresh.
- `writeTextFile` only works on local files. Keep remote files read-only.
- Closing the pane throws away unsaved edits.
- The Files panel needs its own setup to open this mod.

## Done when

- `herdr-app check mods/markdown-viewer` passes.
- A local Markdown file opens in every view, edits show in the preview, and Save writes them.
- After an outside edit, a conflicting save fails and neither version is lost.
- In git, new, changed and deleted text show green, blue and red in Preview, and the count matches `git diff --stat`. Outside git, nothing shows.
- A remote file stays read-only. Missing or unreadable files show an error.
