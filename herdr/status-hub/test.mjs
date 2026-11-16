import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("mods/status-hub/main.js", import.meta.url), "utf8")
  .replace(/^import .*;\n/gm, "")
  .replace("export default class ClaudeUsage", "class ClaudeUsage") + "\nthis.Panel = ClaudeUsage;";
let output = '"web"\t"running"\t"Up 5 minutes"\t"app"\n"db"\t"exited"\t"Exited (1)"\t""';
let code = 0, task;
const api = {
  View: class {},
  exec: async () => ({ code, stdout: output }),
  readTextFile: async () => null,
  appHome: () => "",
};
vm.runInNewContext(source, api);
const panel = new api.Panel();
panel.page = "Docker";
const cx = { spawn: fn => { task = fn(cx); }, notify() {} };
panel.refresh(cx); await task;
assert.equal(panel.containers.length, 2);
assert.equal(panel.containers[0].project, "app");
assert.equal(panel.containers[1].project, "");
assert.equal(panel.containers[1].state, "exited");
output = "";
panel.refresh(cx); await task;
assert.equal(panel.containers.length, 0);
code = 1;
panel.refresh(cx); await task;
assert.equal(panel.dockerError, true);
console.log("Docker metadata, empty and error states passed");
