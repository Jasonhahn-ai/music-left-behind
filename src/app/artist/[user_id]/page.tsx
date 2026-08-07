import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSongsByUser, publicStorageUrl } from "@/lib/songs";

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ user_id: string }>;
}) {
  const { user_id } = await params;
  const supabase = await createClient();
  const songs = await getSongsByUser(supabase, user_id);

  if (songs.length === 0) {
    notFound();
  }

  const artistName = songs[0].artist_name;

  return (
    <main className="flex flex-1 flex-col items-center gap-8 px-6 py-16">
      <h1 className="font-display text-3xl text-foreground">{artistName}</h1>

      <div className="w-full max-w-2xl divide-y divide-card-border rounded-2xl border border-card-border bg-card shadow-[0_0_90px_-25px_var(--accent-glow),0_30px_70px_-20px_rgba(0,0,0,0.7)]">
        {songs.map((song) => {
          const artworkUrl = song.artwork_url
            ? publicStorageUrl(supabase, song.artwork_url)
            : null;

          return (
            <Link
              key={song.id}
              href={`/song/${song.id}`}
              className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-black/20"
            >
              {artworkUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={artworkUrl}
                  alt={`${song.title} artwork`}
                  className="h-12 w-12 flex-shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-black/30 text-xl text-accent">
                  🎵
                </div>
              )}
              <p className="truncate font-display text-base text-foreground">
                {song.title}
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
