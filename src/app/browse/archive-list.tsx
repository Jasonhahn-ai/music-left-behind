"use client";

import { useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { incrementPlayCount, publicStorageUrl, type Song } from "@/lib/songs";
import { ShareButton } from "@/components/share-button";
import { LikeButton } from "@/components/like-button";

// A fresh instance mounts each time a row expands and unmounts when it
// collapses, so hasCountedPlay naturally resets per "expand session"
// instead of needing manual bookkeeping keyed by song id.
function ExpandedPlayer({
  song,
  supabase,
}: {
  song: Song;
  supabase: SupabaseClient;
}) {
  const hasCountedPlay = useRef(false);

  return (
    <div className="px-5 pb-4">
      <audio
        controls
        autoPlay
        src={publicStorageUrl(supabase, song.audio_url)}
        onPlay={() => {
          if (hasCountedPlay.current) return;
          hasCountedPlay.current = true;
          incrementPlayCount(supabase, song.id).catch(() => {});
        }}
        className="w-full accent-accent"
      >
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}

export function ArchiveList({ songs }: { songs: Song[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (songs.length === 0) {
    return <p className="text-center text-muted">No songs in the archive yet.</p>;
  }

  return (
    <div className="w-full max-w-2xl divide-y divide-card-border rounded-2xl border border-card-border bg-card shadow-[0_0_90px_-25px_var(--accent-glow),0_30px_70px_-20px_rgba(0,0,0,0.7)]">
      {songs.map((song) => {
        const isExpanded = expandedId === song.id;
        const artworkUrl = song.artwork_url
          ? publicStorageUrl(supabase, song.artwork_url)
          : null;
        const togglePlay = () => setExpandedId(isExpanded ? null : song.id);
        const playCount = Number.isFinite(song.play_count) ? song.play_count : 0;

        return (
          <div key={song.id}>
            <div
              className={`flex items-center gap-1 pr-3 transition-colors ${
                isExpanded ? "bg-black/20" : ""
              }`}
            >
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isExpanded ? `Collapse ${song.title}` : `Play ${song.title}`}
                className="flex flex-shrink-0 items-center px-5 py-3 transition-colors hover:bg-black/20"
              >
                {artworkUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={artworkUrl}
                    alt=""
                    className="h-12 w-12 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-black/30 text-xl text-accent">
                    🎵
                  </div>
                )}
              </button>

              <div className="min-w-0 flex-1 py-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="block w-full truncate text-left font-display text-base text-foreground transition-colors hover:text-accent"
                >
                  {song.title}
                </button>
                <div className="flex items-center gap-1.5 text-sm text-muted">
                  <Link
                    href={`/artist/${song.user_id}`}
                    className="truncate transition-colors hover:text-accent"
                  >
                    {song.artist_name}
                  </Link>
                  <span aria-hidden>·</span>
                  <span className="flex-shrink-0">
                    <span aria-hidden>▶ </span>
                    {playCount}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={togglePlay}
                aria-label={isExpanded ? `Collapse ${song.title}` : `Play ${song.title}`}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center text-lg text-accent transition-transform"
              >
                <span className={isExpanded ? "rotate-90" : ""}>▸</span>
              </button>

              <LikeButton
                songId={song.id}
                initialLikeCount={song.like_count}
                variant="icon"
              />
              <ShareButton songId={song.id} variant="icon" />
            </div>

            {isExpanded && <ExpandedPlayer song={song} supabase={supabase} />}
          </div>
        );
      })}
    </div>
  );
}
