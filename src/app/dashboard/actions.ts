"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DashboardActionState = {
  error: string | null;
};

export type EditSongState = {
  error: string | null;
  success: boolean;
};

export async function deleteSong(
  _prevState: DashboardActionState,
  formData: FormData,
): Promise<DashboardActionState> {
  const songId = formData.get("song_id") as string;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data: song, error: fetchError } = await supabase
    .from("songs")
    .select("audio_url, artwork_url, user_id")
    .eq("id", songId)
    .maybeSingle();

  if (fetchError || !song) return { error: "Song not found." };
  if (song.user_id !== user.id) return { error: "You don't own this song." };

  const paths = [song.audio_url, song.artwork_url].filter(
    (path): path is string => Boolean(path),
  );
  if (paths.length > 0) {
    // Best-effort: a storage cleanup hiccup shouldn't block the user
    // from removing the row they're trying to get rid of.
    await supabase.storage.from("songs").remove(paths);
  }

  const { error: deleteError } = await supabase
    .from("songs")
    .delete()
    .eq("id", songId)
    .eq("user_id", user.id);

  if (deleteError) {
    return { error: `Could not delete song: ${deleteError.message}` };
  }

  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateSong(
  _prevState: EditSongState,
  formData: FormData,
): Promise<EditSongState> {
  const songId = formData.get("song_id") as string;
  const title = (formData.get("title") as string)?.trim();
  const artistName = (formData.get("artist_name") as string)?.trim();
  const story = (formData.get("story") as string)?.trim() || null;

  if (!title || !artistName) {
    return { error: "Title and artist name are required.", success: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in.", success: false };

  const { error } = await supabase
    .from("songs")
    .update({ title, artist_name: artistName, story })
    .eq("id", songId)
    .eq("user_id", user.id);

  if (error) {
    return {
      error: `Could not save changes: ${error.message}`,
      success: false,
    };
  }

  revalidatePath("/dashboard");
  return { error: null, success: true };
}
