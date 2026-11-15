import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("mods/markdown-viewer/main.js", import.meta.url), "utf8")
  .replace(/^import .*;\n/gm, "")
  .replace("export default class MarkdownViewer", "class MarkdownViewer") + "\nthis.MarkdownViewer = MarkdownViewer;";
let disk = "original";
const api = {
  View: class {},
  readTextFile: async () => disk,
  writeTextFile: async (_path, text, expected) => {
    if (disk !== expected) throw new Error("stale");
    disk = text;
  },
  settings: () => ({}),
  EditorState: { new: ({ value }) => ({ value: () => value, on() {}, release() {} }) },
};
vm.runInNewContext(source, api);
let pending;
const cx = { spawn: fn => { pending = fn(cx); }, notify() {} };
const viewer = new api.MarkdownViewer();
viewer.file = "/test.md";
viewer.load(cx); await pending;
assert.equal(viewer.saved, "original");
viewer.text = "edited";
viewer.save(cx); await pending;
assert.equal(disk, "edited");
viewer.text = "my edit";
disk = "external edit";
viewer.save(cx); await pending;
assert.equal(disk, "external edit");
assert.equal(viewer.text, "my edit");
assert.match(viewer.message, /Save failed/);
