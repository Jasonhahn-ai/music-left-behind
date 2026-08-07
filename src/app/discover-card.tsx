"use client";

import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { shuffleSongs, startNewPass, type Song } from "@/lib/songs";
import { SongDisplay } from "@/components/song-display";
import { ShareButton } from "@/components/share-button";
import { LikeButton } from "@/components/like-button";
import { ReactionBar } from "@/components/reaction-bar";

const FADE_MS = 220;

export function DiscoverCard({
  songs,
  initialSong,
}: {
  songs: Song[];
  initialSong: Song | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [song, setSong] = useState(initialSong);
  const [visible, setVisible] = useState(true);
  const queueRef = useRef<Song[]>(
    shuffleSongs(songs.filter((candidate) => candidate.id !== initialSong?.id)),
  );

  function handleNext() {
    setVisible(false);
    window.setTimeout(() => {
      if (queueRef.current.length > 0) {
        const [next, ...rest] = queueRef.current;
        queueRef.current = rest;
        setSong(next);
      } else {
        const nextPass = startNewPass(songs, song?.id);
        queueRef.current = nextPass.slice(1);
        setSong(nextPass[0] ?? null);
      }
      setVisible(true);
    }, FADE_MS);
  }

  if (!song) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <p className="font-display text-2xl text-foreground">No songs yet.</p>
        <a
          href="/signup"
          className="font-medium text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:text-accent-strong"
        >
          Be the first to upload one
        </a>
      </div>
    );
  }

  return (
    <div
      className="flex w-full max-w-md flex-col items-center gap-7 rounded-2xl border border-card-border bg-card p-10 shadow-[0_0_90px_-25px_var(--accent-glow),0_30px_70px_-20px_rgba(0,0,0,0.7)] transition-opacity ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transitionDuration: `${FADE_MS}ms`,
      }}
    >
      <SongDisplay song={song} supabase={supabase} titleAs="h2">
        <ReactionBar key={song.id} song={song} />
        <div className="flex items-center gap-3">
          <LikeButton key={song.id} songId={song.id} initialLikeCount={song.like_count} />
          <ShareButton songId={song.id} />
          <button
            onClick={handleNext}
            disabled={songs.length <= 1 || !visible}
            className="rounded-full bg-accent px-8 py-2.5 font-medium text-accent-ink shadow-[0_0_30px_-8px_var(--accent-glow)] transition-colors hover:bg-accent-strong disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </SongDisplay>
    </div>
  );
}
