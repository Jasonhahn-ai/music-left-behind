import Link from "next/link";
import type { Song } from "@/lib/songs";

export function SongOfTheDay({
  song,
  artworkUrl,
}: {
  song: Song;
  artworkUrl: string | null;
}) {
  return (
    <Link
      href={`/song/${song.id}`}
      className="flex w-full max-w-sm items-center gap-4 rounded-xl border border-card-border bg-card/60 px-5 py-3 transition-colors hover:border-accent"
    >
      {artworkUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={artworkUrl}
          alt={`${song.title} artwork`}
          className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-black/30 text-2xl text-accent">
          🎵
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium tracking-[0.2em] text-accent uppercase">
          Song of the Day
        </p>
        <p className="truncate font-display text-lg text-foreground">
          {song.title}
        </p>
        <p className="truncate text-sm text-muted">{song.artist_name}</p>
      </div>
    </Link>
  );
}
