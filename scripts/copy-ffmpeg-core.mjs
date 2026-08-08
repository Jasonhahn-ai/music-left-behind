// Copies the ffmpeg.wasm core (JS glue + WASM binary) from node_modules
// into public/ so the upload page can load it same-origin instead of from
// a third-party CDN. Runs on every install so the copy stays in sync with
// whatever @ffmpeg/core version is pinned in package.json.
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const srcDir = join(rootDir, "node_modules/@ffmpeg/core/dist/umd");
const destDir = join(rootDir, "public/ffmpeg");

await mkdir(destDir, { recursive: true });
await Promise.all(
  ["ffmpeg-core.js", "ffmpeg-core.wasm"].map((name) =>
    copyFile(join(srcDir, name), join(destDir, name)),
  ),
);

console.log("Copied ffmpeg-core.js and ffmpeg-core.wasm to public/ffmpeg/");
