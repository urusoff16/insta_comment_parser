"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
process.chdir(root);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if ([".git", "node_modules", "__pycache__", ".venv"].includes(entry.name)) return [];
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function runNode(args) {
  const result = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, "Node check failed: " + args.join(" "));
}

const files = walk(root);
const jsonFiles = files.filter((file) => /\.(json|map)$/.test(file));
for (const file of jsonFiles) JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
const scripts = files.filter((file) => file.endsWith(".js"));
for (const script of scripts) runNode(["--check", script]);

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const metadata = JSON.parse(fs.readFileSync("package.json", "utf8"));
assert.equal(manifest.manifest_version, 3);
assert.equal(metadata.version, manifest.version);
assert.equal(metadata.license, "PolyForm-Strict-1.0.0");
assert.match(fs.readFileSync("LICENSE.md", "utf8"), /^# PolyForm Strict License 1\.0\.0/);

const references = [
  manifest.background.service_worker,
  manifest.action.default_popup,
  manifest.options_page,
  ...Object.values(manifest.icons),
  ...Object.values(manifest.action.default_icon),
  ...manifest.content_scripts.flatMap((entry) => entry.js || []),
];
for (const reference of references) {
  assert.ok(fs.existsSync(path.join(root, reference)), "Missing manifest asset: " + reference);
}
for (const html of [manifest.action.default_popup, manifest.options_page]) {
  const text = fs.readFileSync(html, "utf8");
  for (const match of text.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(?:https?:|mailto:|#)/.test(match[1])) continue;
    assert.ok(fs.existsSync(path.join(root, match[1].replace(/^\//, ""))), "Missing HTML asset: " + match[1]);
  }
}
for (const [size, reference] of Object.entries(manifest.icons)) {
  const png = fs.readFileSync(reference);
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(png.readUInt32BE(16), Number(size), "Wrong icon width: " + reference);
  assert.equal(png.readUInt32BE(20), Number(size), "Wrong icon height: " + reference);
}
runNode(["tests/localization.test.js"]);
console.log("Validated " + scripts.length + " JavaScript files, " + jsonFiles.length + " JSON/source-map files, manifest assets and icon dimensions.");
