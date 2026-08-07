import type { SupabaseClient } from "@supabase/supabase-js";

export type Song = {
  id: string;
  user_id: string;
  title: string;
  artist_name: string;
  story: string | null;
  audio_url: string;
  artwork_url: string | null;
  created_at: string;
  play_count: number;
  like_count: number;
  tags: string[];
  reaction_counts: Record<string, number>;
};

const MAX_SONGS = 500;

export type SongSort = "newest" | "liked" | "played";

const SORT_COLUMNS: Record<SongSort, string> = {
  newest: "created_at",
  liked: "like_count",
  played: "play_count",
};

export async function listSongs(
  supabase: SupabaseClient,
  sort: SongSort = "newest",
  tag?: string,
): Promise<Song[]> {
  let query = supabase
    .from("songs")
    .select("*")
    .order(SORT_COLUMNS[sort], { ascending: false })
    .limit(MAX_SONGS);

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// Fisher-Yates shuffle. Used as a "shuffle bag": dealing songs off a
// shuffled array (without replacement) guarantees every song is shown
// exactly once per pass. Independent random sampling per click (even
// excluding the current song) is unbiased in the long run, but has no
// such per-pass coverage guarantee -- it can go many picks without
// hitting a given song purely by chance, which reads to a user as
// "getting stuck on a subset."
export function shuffleSongs(songs: Song[]): Song[] {
  const result = [...songs];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Starts a fresh pass: a full shuffle of every song, so each pass
// covers all of them. If the shuffle happens to put the song we're
// currently leaving back in the first slot, swap it out rather than
// filtering it from the pool -- filtering would shrink the pass to
// songs.length - 1, which is the bug this replaced.
export function startNewPass(songs: Song[], avoidId?: string): Song[] {
  const shuffled = shuffleSongs(songs);
  if (avoidId && shuffled.length > 1 && shuffled[0].id === avoidId) {
    const swapIndex = 1 + Math.floor(Math.random() * (shuffled.length - 1));
    [shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[0]];
  }
  return shuffled;
}

// FNV-1a: a small, deterministic string hash. Not cryptographic --
// just needs to spread different dates across different indices
// consistently.
function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// Picks the same song for everyone on a given UTC calendar day, with
// no stored state -- just a hash of the date used as an index into a
// stably-ordered list. `songs` must already be in a deterministic
// order (e.g. listSongs's default "newest" sort); shuffled input would
// make the pick non-deterministic despite the date-based hash.
export function pickSongOfTheDay(songs: Song[], date: Date = new Date()): Song | null {
  if (songs.length === 0) return null;
  const dateKey = date.toISOString().slice(0, 10);
  const index = hashString(dateKey) % songs.length;
  return songs[index];
}

export async function getSongById(
  supabase: SupabaseClient,
  id: string,
): Promise<Song | null> {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    // 22P02 = invalid input syntax for uuid -- the route param is
    // attacker/visitor-controlled and won't always be a well-formed
    // UUID. Treat that the same as "no such song" rather than a 500.
    if (error.code === "22P02") return null;
    throw error;
  }
  return data;
}

export async function getSongsByUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<Song[]> {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(MAX_SONGS);

  if (error) {
    // Same malformed-UUID case as getSongById -- an artist route param
    // won't always be well-formed.
    if (error.code === "22P02") return [];
    throw error;
  }
  return data ?? [];
}

// Fire-and-forget from the caller's perspective -- a failed play-count
// bump shouldn't interrupt playback. Counts once per call; callers are
// responsible for only calling this once per "starts playing" event,
// not on every pause/resume.
export async function incrementPlayCount(
  supabase: SupabaseClient,
  songId: string,
): Promise<void> {
  const { error } = await supabase.rpc("increment_play_count", {
    song_id_param: songId,
  });
  if (error) throw error;
}

export function publicStorageUrl(supabase: SupabaseClient, path: string) {
  return supabase.storage.from("songs").getPublicUrl(path).data.publicUrl;
}
