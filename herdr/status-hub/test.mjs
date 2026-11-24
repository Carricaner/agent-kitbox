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
assert.equal(api.shortPath("~/Documents/projects/agent-kitbox"), "~/Documents/projects/agent-kitbox");
assert.equal(api.shortPath("~/Documents/projects/agent-kitbox/herdr/status-hub/mods"), "…/status-hub/mods");
assert.equal(api.text(42), "");
console.log("Session field helpers passed");

const files = {
  "/data/claude-usage.json": '{"updated":2,"five_hour":40,"model":"Latest","context":90}',
  "/data/claude-sessions/t1.json": '{"updated":1,"five_hour":10,"model":"Opus","context":20}',
};
let focus = "t1";
api.readTextFile = async path => files[path] ?? null;
api.agents = () => [{ address: "t1", focused: focus === "t1" }, { address: "t2", focused: focus === "t2" }];
const claude = new api.Panel();
claude.page = "Claude Code";
claude.refresh(cx); await task;
assert.deepEqual([claude.data.model, claude.data.context, claude.data.five_hour, claude.data.updated], ["Opus", 20, 40, 2]);
focus = "t2"; // no session file: keep showing t1
claude.refresh(cx); await task;
assert.equal(claude.data.model, "Opus");
focus = "../x"; claude.terminal = null;
claude.refresh(cx); await task;
assert.equal(claude.data.model, "Latest");
console.log("Focused Claude session passed");
