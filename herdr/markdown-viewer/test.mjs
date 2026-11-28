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

// Reload asks first, then drops the edits and shows the file on disk.
viewer.reload(cx);
assert.equal(viewer.text, "my edit");
assert.equal(viewer.discard, true);
viewer.reload(cx); await pending;
assert.equal(viewer.text, "external edit");
assert.equal(viewer.saved, "external edit");
assert.equal(viewer.unsaved(), false);
console.log("Markdown viewer passed");

// Gutter marks against the last commit: "add" for new lines, "mod" for replaced ones, deleted
// for the line that removed lines sat before.
const json = value => JSON.parse(JSON.stringify(value));
const changes = (base, text) => json(api.changes(base, text));
assert.deepEqual(changes("a\nb\nc\nd", "a\nB\nX\nc"), { kinds: { 1: "mod", 2: "mod" }, deleted: [4], added: 2, removed: 2 });
assert.deepEqual(changes("same\n", "same\n"), { kinds: {}, deleted: [], added: 0, removed: 0 });
assert.deepEqual(changes("a\nb", "a\nnew\nb").kinds, { 1: "add" });
assert.deepEqual(changes("a\nb\nc", "a\nc"), { kinds: {}, deleted: [1], added: 0, removed: 1 });
// The demo that once marked an unchanged paragraph: blank lines must not steal the match.
const doc = "# N\n\nFirst.\n\nSecond.\n\nThird.\n\n- one\n- two\n\nLast.\n";
const edited = "# N\n\nFirst.\n\nSecond changed.\n\n- one\n- two\n\nLast.\n\nNew.\n";
assert.deepEqual(changes(doc, edited), { kinds: { 4: "mod", 10: "add", 11: "add" }, deleted: [6], added: 3, removed: 3 });
console.log("Git changes passed");

// Blocks split at blank lines, but not inside code fences or before indented continuations.
assert.deepEqual(json(api.blocks("# T\n\npara\nline\n\n```\ncode\n\nmore\n```\n\n- item\n\n  more")),
  [[0, 1], [2, 4], [5, 10], [11, 14]]);
console.log("Blocks passed");
