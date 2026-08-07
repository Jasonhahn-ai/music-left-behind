"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getVisitorId } from "@/lib/visitor";
import { REACTION_EMOJI } from "@/lib/reactions";
import type { Song } from "@/lib/songs";

export function ReactionBar({ song }: { song: Song }) {
  const [counts, setCounts] = useState<Record<string, number>>(
    song.reaction_counts ?? {},
  );
  const [reacted, setReacted] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase
      .from("song_reactions")
      .select("emoji")
      .eq("song_id", song.id)
      .eq("visitor_id", getVisitorId())
      .then(({ data }) => {
        if (!cancelled && data) {
          setReacted(new Set(data.map((row) => row.emoji as string)));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [song.id]);

  async function handleReact(emoji: string) {
    if (reacted.has(emoji) || pending) return;
    setPending(emoji);

    const supabase = createClient();
    const { error } = await supabase
      .from("song_reactions")
      .insert({ song_id: song.id, emoji, visitor_id: getVisitorId() });

    setPending(null);

    // 23505 = unique_violation -- this browser already used this emoji
    // on this song (e.g. from another tab). Treat as success.
    if (error && error.code !== "23505") return;

    setReacted((current) => new Set(current).add(emoji));
    setCounts((current) => {
      const existing = Number.isFinite(current[emoji]) ? current[emoji] : 0;
      return { ...current, [emoji]: existing + 1 };
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {REACTION_EMOJI.map((emoji) => {
        const isReacted = reacted.has(emoji);
        const count = Number.isFinite(counts[emoji]) ? counts[emoji] : 0;

        return (
          <button
            key={emoji}
            type="button"
            onClick={() => handleReact(emoji)}
            disabled={isReacted || pending === emoji}
            aria-pressed={isReacted}
            aria-label={`React with ${emoji}`}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:cursor-default ${
              isReacted
                ? "border-accent bg-accent/10 text-accent"
                : "border-card-border text-muted hover:border-accent hover:text-accent"
            }`}
          >
            <span aria-hidden>{emoji}</span>
            <span>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
