export const SONG_TAGS = [
  "Acoustic",
  "Rock",
  "Melancholy",
  "Upbeat",
  "Folk",
  "Electronic",
] as const;

export type SongTag = (typeof SONG_TAGS)[number];

export function isSongTag(value: string): value is SongTag {
  return (SONG_TAGS as readonly string[]).includes(value);
}
