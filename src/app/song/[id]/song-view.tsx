"use client";

import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Song } from "@/lib/songs";
import { SongDisplay } from "@/components/song-display";
import { ShareButton } from "@/components/share-button";
import { LikeButton } from "@/components/like-button";
import { ReactionBar } from "@/components/reaction-bar";

export function SongView({ song }: { song: Song }) {
  const supabase = useMemo(() => createClient(), []);

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-7 rounded-2xl border border-card-border bg-card p-10 shadow-[0_0_90px_-25px_var(--accent-glow),0_30px_70px_-20px_rgba(0,0,0,0.7)]">
      <SongDisplay song={song} supabase={supabase} titleAs="h1" showPlayCount>
        <ReactionBar song={song} />
        <div className="flex items-center gap-3">
          <LikeButton songId={song.id} initialLikeCount={song.like_count} />
          <ShareButton songId={song.id} />
        </div>
      </SongDisplay>
    </div>
  );
}
