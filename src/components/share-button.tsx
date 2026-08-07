"use client";

import { useState } from "react";

const CONFIRMATION_MS = 1800;

export function ShareButton({
  songId,
  variant = "button",
  className,
}: {
  songId: string;
  variant?: "button" | "icon";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare(event: React.MouseEvent) {
    event.stopPropagation();
    const url = `${window.location.origin}/song/${songId}`;

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API can be unavailable (permissions, insecure context) --
      // fall back to a manual prompt so the link is still obtainable.
      window.prompt("Copy this link:", url);
      return;
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), CONFIRMATION_MS);
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleShare}
        aria-label="Copy link to this song"
        title="Copy link"
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-lg text-muted transition-colors hover:text-accent ${className ?? ""}`}
      >
        {copied ? "✓" : "🔗"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`rounded-full border border-card-border px-6 py-2 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent ${className ?? ""}`}
    >
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
