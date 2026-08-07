"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getVisitorId } from "@/lib/visitor";

export function LikeButton({
  songId,
  initialLikeCount,
  variant = "button",
  className,
}: {
  songId: string;
  initialLikeCount: number;
  variant?: "button" | "icon";
  className?: string;
}) {
  const [liked, setLiked] = useState(false);
  // initialLikeCount is only as trustworthy as the DB row it came from
  // (e.g. a page loaded before the like_count column existed would
  // pass undefined here) -- fall back to 0 rather than letting a bad
  // value poison the running count via undefined + 1 = NaN.
  const [count, setCount] = useState(
    Number.isFinite(initialLikeCount) ? initialLikeCount : 0,
  );
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase
      .from("song_likes")
      .select("id", { count: "exact", head: true })
      .eq("song_id", songId)
      .eq("visitor_id", getVisitorId())
      .then(({ count }) => {
        if (!cancelled && (count ?? 0) > 0) setLiked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [songId]);

  async function handleLike() {
    if (liked || pending) return;
    setPending(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("song_likes")
      .insert({ song_id: songId, visitor_id: getVisitorId() });

    setPending(false);

    // 23505 = unique_violation -- this browser already liked it
    // (e.g. from another tab). Treat that the same as success.
    if (error && error.code !== "23505") return;

    setLiked(true);
    setCount((current) => (Number.isFinite(current) ? current + 1 : 1));
  }

  const heart = liked ? "♥" : "♡";
  const label = liked ? "Liked" : "Like this song";

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleLike}
        disabled={liked || pending}
        aria-pressed={liked}
        aria-label={label}
        title={label}
        className={`flex h-9 flex-shrink-0 items-center gap-1 px-1 text-sm transition-colors disabled:cursor-default ${
          liked ? "text-accent" : "text-muted hover:text-accent"
        } ${className ?? ""}`}
      >
        <span aria-hidden className="text-lg">
          {heart}
        </span>
        <span>{count}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={liked || pending}
      aria-pressed={liked}
      aria-label={label}
      className={`flex items-center gap-2 rounded-full border px-6 py-2 text-sm font-medium transition-colors disabled:cursor-default ${
        liked
          ? "border-accent text-accent"
          : "border-card-border text-muted hover:border-accent hover:text-accent"
      } ${className ?? ""}`}
    >
      <span aria-hidden>{heart}</span>
      <span>{count}</span>
    </button>
  );
}
