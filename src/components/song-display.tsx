"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import { useRef } from "react";
import Link from "next/link";
import { incrementPlayCount, publicStorageUrl, type Song } from "@/lib/songs";
import { TagPills } from "@/components/tag-pills";

export function SongDisplay({
  song,
  supabase,
  titleAs: TitleTag = "h2",
  showPlayCount = false,
  children,
}: {
  song: Song;
  supabase: SupabaseClient;
  titleAs?: "h1" | "h2";
  showPlayCount?: boolean;
  children?: ReactNode;
}) {
  const hasCountedPlay = useRef(false);
  const audioUrl = publicStorageUrl(supabase, song.audio_url);
  const artworkUrl = song.artwork_url
    ? publicStorageUrl(supabase, song.artwork_url)
    : null;
  const playCount = Number.isFinite(song.play_count) ? song.play_count : 0;

  return (
    <>
      {artworkUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={artworkUrl}
          alt={`${song.title} artwork`}
          className="h-64 w-64 rounded-xl object-cover shadow-[0_0_60px_-10px_var(--accent-glow),0_20px_40px_-10px_rgba(0,0,0,0.8)]"
        />
      ) : (
        <div className="flex h-64 w-64 items-center justify-center rounded-xl bg-black/30 text-5xl text-accent shadow-[0_0_60px_-10px_var(--accent-glow),0_20px_40px_-10px_rgba(0,0,0,0.8)]">
          🎵
        </div>
      )}

      <div className="flex flex-col items-center gap-2 text-center">
        <TitleTag className="font-display text-4xl leading-tight text-foreground">
          {song.title}
        </TitleTag>
        <Link
          href={`/artist/${song.user_id}`}
          className="text-sm tracking-[0.2em] text-muted uppercase transition-colors hover:text-accent"
        >
          {song.artist_name}
        </Link>
      </div>

      <TagPills tags={song.tags} />

      {song.story && (
        <p className="max-w-sm text-center text-sm leading-relaxed text-muted italic">
          {song.story}
        </p>
      )}

      <audio
        key={song.id}
        controls
        src={audioUrl}
        onPlay={() => {
          if (hasCountedPlay.current) return;
          hasCountedPlay.current = true;
          incrementPlayCount(supabase, song.id).catch(() => {});
        }}
        className="w-full accent-accent"
      >
        Your browser does not support the audio element.
      </audio>

      {showPlayCount && (
        <p className="text-xs text-muted">
          <span aria-hidden>▶ </span>
          {playCount} {playCount === 1 ? "play" : "plays"}
        </p>
      )}

      {children}
    </>
  );
}
