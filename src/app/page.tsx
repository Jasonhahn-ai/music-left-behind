import { createClient } from "@/lib/supabase/server";
import { listSongs, shuffleSongs, pickSongOfTheDay, publicStorageUrl } from "@/lib/songs";
import { getGalleryImages } from "@/lib/gallery";
import { DiscoverCard } from "./discover-card";
import { BackgroundSlideshow } from "@/components/background-slideshow";
import { SongOfTheDay } from "@/components/song-of-the-day";

export default async function Home() {
  const supabase = await createClient();
  const songs = await listSongs(supabase);
  const initialSong = shuffleSongs(songs)[0] ?? null;
  const galleryImages = await getGalleryImages();

  const songOfTheDay = pickSongOfTheDay(songs);
  const songOfTheDayArtworkUrl = songOfTheDay?.artwork_url
    ? publicStorageUrl(supabase, songOfTheDay.artwork_url)
    : null;

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-12 overflow-hidden px-6 py-16">
      <BackgroundSlideshow images={galleryImages} />

      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-title text-4xl text-foreground sm:text-5xl">
          Music Left Behind
        </h1>
        <p className="text-sm tracking-[0.15em] text-muted uppercase sm:text-base">
          The Greatest Songs You Never Heard
        </p>
      </div>

      {songOfTheDay && (
        <SongOfTheDay song={songOfTheDay} artworkUrl={songOfTheDayArtworkUrl} />
      )}

      <DiscoverCard songs={songs} initialSong={initialSong} />
    </main>
  );
}
