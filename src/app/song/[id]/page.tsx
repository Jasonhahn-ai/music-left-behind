import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSongById, publicStorageUrl } from "@/lib/songs";
import { SongView } from "./song-view";

type SongPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: SongPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const song = await getSongById(supabase, id);

  if (!song) {
    return { title: "Song not found" };
  }

  const description = `${song.title} by ${song.artist_name} on Music Left Behind.`;
  const artworkUrl = song.artwork_url
    ? publicStorageUrl(supabase, song.artwork_url)
    : undefined;

  return {
    title: song.title,
    description,
    openGraph: {
      title: song.title,
      description,
      siteName: "Music Left Behind",
      type: "music.song",
      // Explicitly fall back to the site-wide generated image rather
      // than omitting `images` and relying on it inheriting from the
      // root layout -- returning an `openGraph` object at all here
      // isn't guaranteed to deep-merge missing fields from the parent.
      images: [artworkUrl ?? "/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: song.title,
      description,
      images: [artworkUrl ?? "/twitter-image"],
    },
  };
}

export default async function SongPage({ params }: SongPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const song = await getSongById(supabase, id);

  if (!song) {
    notFound();
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <SongView song={song} />
    </main>
  );
}
