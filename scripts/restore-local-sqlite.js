const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const sqlite3Dir = path.join(__dirname, "..", "node_modules", "sqlite3");
const nodeBinary = path.join(sqlite3Dir, "build", "Release", "node_sqlite3.node");

if (!fs.existsSync(sqlite3Dir)) {
  console.error("sqlite3 is not installed. Run npm install first.");
  process.exit(1);
}

const platform = process.platform === "darwin" ? "darwin" : process.platform;
const arch = process.arch;

console.log(`Restoring local sqlite3 native binary (${platform}/${arch})...`);

execSync(`npx prebuild-install --platform ${platform} --arch ${arch} -r napi -f`, {
  cwd: sqlite3Dir,
  stdio: "inherit",
  env: {
    ...process.env,
    npm_config_platform: platform,
    npm_config_arch: arch,
  },
});

if (!fs.existsSync(nodeBinary)) {
  console.error("Failed to restore local sqlite3 binary.");
  process.exit(1);
}

console.log("Local sqlite3 binary restored:", nodeBinary);
