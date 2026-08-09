"use client";

import { useEffect } from "react";

const TERMS = [
  {
    lead: "No compensation.",
    body: "You will not be paid for songs you upload or for plays, likes, or shares they receive. This is not a revenue-sharing or royalty platform.",
  },
  {
    lead: "Voluntary and free.",
    body: "Sharing your music here is entirely optional, and every song is made available to visitors to listen to for free.",
  },
  {
    lead: "This is not Spotify (or any streaming service).",
    body: "There's no monetization, no distribution deal, and no promise of exposure, discovery, or industry opportunity. This is simply a place to let songs be heard.",
  },
  {
    lead: "You keep your rights.",
    body: "You retain ownership of your music. Uploading here doesn't transfer any rights to Music Left Behind — you're just choosing to let others listen.",
  },
  {
    lead: "You confirm it's yours.",
    body: "By uploading, you confirm that you wrote and/or own the rights to this song, and that you have the right to share it here.",
  },
  {
    lead: "Remove it anytime.",
    body: "You can take your music down whenever you'd like, from your artist dashboard.",
  },
];

export function AgreementModal({
  pending,
  error,
  onAgree,
  onClose,
}: {
  pending: boolean;
  error: string | null;
  onAgree: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-agreement-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-card-border bg-card shadow-[0_0_90px_-20px_var(--accent-glow),0_30px_70px_-20px_rgba(0,0,0,0.8)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 text-2xl leading-none text-muted transition-colors hover:text-accent"
        >
          &times;
        </button>

        <div className="overflow-y-auto px-8 py-10">
          <h2
            id="upload-agreement-title"
            className="font-title text-3xl tracking-wide text-accent"
          >
            Before You Upload: Please Read
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-muted">
            Music Left Behind is a free, community platform where unsigned artists can
            share songs that never got the attention they deserved. Before you upload,
            please understand:
          </p>

          <ul className="mt-5 flex flex-col gap-3 text-sm leading-relaxed text-muted">
            {TERMS.map(({ lead, body }) => (
              <li key={lead} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                <span>
                  <strong className="font-medium text-foreground">{lead}</strong> {body}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm leading-relaxed text-muted">
            By clicking &lsquo;I Agree,&rsquo; you confirm that you understand and accept
            these terms.
          </p>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={onAgree}
              disabled={pending}
              className="rounded-full bg-accent px-6 py-2 font-medium text-accent-ink shadow-[0_0_30px_-8px_var(--accent-glow)] transition-colors hover:bg-accent-strong disabled:opacity-40"
            >
              {pending ? "Saving..." : "I Agree"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
