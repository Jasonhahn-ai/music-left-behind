"use client";

// Normalizes every uploaded audio file to a real MP3 (MPEG-1 Layer III) in
// the browser before it's ever sent to the server. This is what lets the
// upload form accept WAV/M4A/AAC/OGG/whatever-a-non-technical-user-has
// without asking them to re-encode anything themselves, and it's also what
// fixes the "Layer I/II mislabeled as .mp3" case that broke playback before --
// both are just "not yet the canonical format" to this pipeline, handled the
// same way. Runs the single-threaded @ffmpeg/core build (no cross-origin
// isolation headers required) loaded same-origin from public/ffmpeg/.
import type { FFmpeg } from "@ffmpeg/ffmpeg";

let ffmpegPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: "/ffmpeg/ffmpeg-core.js",
        wasmURL: "/ffmpeg/ffmpeg-core.wasm",
      });
      return ffmpeg;
    })();
  }
  return ffmpegPromise;
}

export class TranscodeError extends Error {}

export async function transcodeToMp3(
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<File> {
  const { fetchFile } = await import("@ffmpeg/util");
  const ffmpeg = await getFFmpeg();

  const jobId = crypto.randomUUID();
  const inputName = `${jobId}-input`;
  const outputName = `${jobId}-output.mp3`;

  const handleProgress = ({ progress }: { progress: number }) => {
    onProgress?.(Math.min(1, Math.max(0, progress)));
  };
  ffmpeg.on("progress", handleProgress);

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // -vn: drop any video/artwork stream some containers (e.g. M4A) embed.
    // -acodec libmp3lame -b:a 192k: encode real Layer III at a solid
    // constant bitrate, regardless of what codec/layer the input used.
    const exitCode = await ffmpeg.exec([
      "-i",
      inputName,
      "-vn",
      "-acodec",
      "libmp3lame",
      "-b:a",
      "192k",
      outputName,
    ]);

    if (exitCode !== 0) {
      throw new TranscodeError(`ffmpeg exited with code ${exitCode}`);
    }

    const data = await ffmpeg.readFile(outputName);
    // .slice() rather than using `data` directly: ffmpeg.wasm's Uint8Array
    // can be backed by a SharedArrayBuffer, which File/Blob don't accept.
    // TypedArray#slice always copies into a plain ArrayBuffer.
    const bytes = (data instanceof Uint8Array ? data : new TextEncoder().encode(data)).slice();
    const baseName = file.name.replace(/\.[^./\\]+$/, "") || "track";

    return new File([bytes], `${baseName}.mp3`, { type: "audio/mpeg" });
  } finally {
    ffmpeg.off("progress", handleProgress);
    await Promise.allSettled([ffmpeg.deleteFile(inputName), ffmpeg.deleteFile(outputName)]);
  }
}
