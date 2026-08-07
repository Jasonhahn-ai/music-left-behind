"use server";

import { createClient } from "@/lib/supabase/server";
import { isSongTag } from "@/lib/tags";

export type UploadFormState = {
  error: string | null;
  success: boolean;
};

function extensionOf(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()! : "bin";
}

export async function uploadSong(
  _prevState: UploadFormState,
  formData: FormData,
): Promise<UploadFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to upload a song.", success: false };
  }

  const title = (formData.get("title") as string)?.trim();
  const artistName = (formData.get("artist_name") as string)?.trim();
  const story = (formData.get("story") as string)?.trim() || null;
  const audioFile = formData.get("audio") as File | null;
  const artworkFile = formData.get("artwork") as File | null;
  const tags = formData.getAll("tags").filter(
    (value): value is string => typeof value === "string" && isSongTag(value),
  );

  if (!title || !artistName) {
    return { error: "Title and artist name are required.", success: false };
  }
  if (!audioFile || audioFile.size === 0) {
    return { error: "An audio file is required.", success: false };
  }

  const audioPath = `${user.id}/${crypto.randomUUID()}.${extensionOf(audioFile.name)}`;
  const { error: audioError } = await supabase.storage
    .from("songs")
    .upload(audioPath, audioFile, {
      contentType: audioFile.type || "audio/mpeg",
    });

  if (audioError) {
    return { error: `Audio upload failed: ${audioError.message}`, success: false };
  }

  let artworkPath: string | null = null;
  if (artworkFile && artworkFile.size > 0) {
    artworkPath = `${user.id}/${crypto.randomUUID()}.${extensionOf(artworkFile.name)}`;
    const { error: artworkError } = await supabase.storage
      .from("songs")
      .upload(artworkPath, artworkFile, {
        contentType: artworkFile.type || "image/jpeg",
      });

    if (artworkError) {
      await supabase.storage.from("songs").remove([audioPath]);
      return {
        error: `Artwork upload failed: ${artworkError.message}`,
        success: false,
      };
    }
  }

  const { error: insertError } = await supabase.from("songs").insert({
    user_id: user.id,
    title,
    artist_name: artistName,
    story,
    audio_url: audioPath,
    artwork_url: artworkPath,
    tags,
  });

  if (insertError) {
    const pathsToRemove = artworkPath ? [audioPath, artworkPath] : [audioPath];
    await supabase.storage.from("songs").remove(pathsToRemove);
    return { error: `Could not save song: ${insertError.message}`, success: false };
  }

  return { error: null, success: true };
}
