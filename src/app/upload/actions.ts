"use server";

import { createClient } from "@/lib/supabase/server";
import { isSongTag } from "@/lib/tags";
import { detectMpegLayer } from "@/lib/mpeg-audio";
import { isOwnedPath } from "@/lib/storage-paths";

export type UploadFormState = {
  error: string | null;
  success: boolean;
};

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

  const { data: agreement } = await supabase
    .from("user_agreements")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!agreement) {
    return {
      error: "You must accept the upload terms before publishing a song.",
      success: false,
    };
  }

  const title = (formData.get("title") as string)?.trim();
  const artistName = (formData.get("artist_name") as string)?.trim();
  const story = (formData.get("story") as string)?.trim() || null;
  const audioPath = formData.get("audio_path") as string | null;
  const artworkPath = (formData.get("artwork_path") as string) || null;
  const tags = formData.getAll("tags").filter(
    (value): value is string => typeof value === "string" && isSongTag(value),
  );

  if (!title || !artistName) {
    return { error: "Title and artist name are required.", success: false };
  }
  // The browser uploads the audio/artwork bytes straight to Supabase Storage
  // before calling this action (Vercel's Serverless Function body limit is
  // far below what a full song file needs) -- this only ever sees the
  // resulting storage paths.
  if (!audioPath) {
    return { error: "An audio file is required.", success: false };
  }
  if (!isOwnedPath(user.id, audioPath) || (artworkPath && !isOwnedPath(user.id, artworkPath))) {
    return { error: "Invalid file reference.", success: false };
  }

  const cleanupPaths = artworkPath ? [audioPath, artworkPath] : [audioPath];

  const { data: publicAudio } = supabase.storage.from("songs").getPublicUrl(audioPath);
  const headResponse = await fetch(publicAudio.publicUrl, {
    headers: { Range: "bytes=0-65535" },
  });
  if (!headResponse.ok) {
    await supabase.storage.from("songs").remove(cleanupPaths);
    return { error: "Could not verify the uploaded audio file.", success: false };
  }
  const audioHeaderChunk = await headResponse.arrayBuffer();
  const mpegLayer = detectMpegLayer(audioHeaderChunk);
  if (mpegLayer !== null && mpegLayer !== 3) {
    await supabase.storage.from("songs").remove(cleanupPaths);
    return {
      error: `This file is encoded as MPEG Layer ${mpegLayer === 1 ? "I" : "II"}, not MP3 (Layer III) -- browsers can't play it even though it's named or typed as MP3. Re-encode it as a standard MP3 and try again.`,
      success: false,
    };
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
    await supabase.storage.from("songs").remove(cleanupPaths);
    return { error: `Could not save song: ${insertError.message}`, success: false };
  }

  return { error: null, success: true };
}
