import { readdir } from "node:fs/promises";
import path from "node:path";

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif)$/i;

export async function getGalleryImages(): Promise<string[]> {
  const dir = path.join(process.cwd(), "public", "gallery");
  try {
    const files = await readdir(dir);
    return files
      .filter((file) => IMAGE_EXTENSIONS.test(file))
      .sort()
      .map((file) => `/gallery/${file}`);
  } catch {
    return [];
  }
}
