import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSongById } from "@/lib/songs";
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

  return {
    title: song.title,
    description,
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
