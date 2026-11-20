const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const sqlite3Dir = path.join(__dirname, "..", "node_modules", "sqlite3");
const nodeBinary = path.join(sqlite3Dir, "build", "Release", "node_sqlite3.node");

if (!fs.existsSync(sqlite3Dir)) {
  console.error("sqlite3 is not installed. Run npm install first.");
  process.exit(1);
}

console.log("Downloading Windows sqlite3 native binary (NAPI)...");

execSync("npx prebuild-install --platform win32 --arch x64 -r napi -f", {
  cwd: sqlite3Dir,
  stdio: "inherit",
  env: {
    ...process.env,
    npm_config_platform: "win32",
    npm_config_arch: "x64",
  },
});

if (!fs.existsSync(nodeBinary)) {
  console.error("Failed to prepare Windows sqlite3 binary.");
  process.exit(1);
}

const header = fs.readFileSync(nodeBinary).subarray(0, 2).toString("utf8");
if (header !== "MZ") {
  console.error(`Expected Windows PE binary (MZ header). File: ${nodeBinary}`);
  process.exit(1);
}

console.log("Windows sqlite3 binary ready:", nodeBinary);
