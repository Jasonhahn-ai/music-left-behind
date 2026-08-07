"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { publicStorageUrl, type Song } from "@/lib/songs";
import { deleteSong, updateSong, type DashboardActionState } from "./actions";

const deleteInitialState: DashboardActionState = { error: null };

const inputClass =
  "rounded-lg border border-card-border bg-black/30 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent";

export function DashboardSongRow({ song }: { song: Song }) {
  const supabase = useMemo(() => createClient(), []);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editPending, startEditTransition] = useTransition();

  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteSong,
    deleteInitialState,
  );

  // Driven directly from the submit handler (via useTransition) rather
  // than an effect watching an action-state flag: useActionState's
  // returned state is just replaced on every call, so two consecutive
  // successful saves both look like { success: true } -- a naive
  // effect keyed on that value wouldn't see a "change" on the second
  // one and would fail to close the form.
  function handleEditSubmit(formData: FormData) {
    startEditTransition(async () => {
      const result = await updateSong({ error: null, success: false }, formData);
      if (result.success) {
        setEditing(false);
        setEditError(null);
      } else {
        setEditError(result.error);
      }
    });
  }

  const artworkUrl = song.artwork_url
    ? publicStorageUrl(supabase, song.artwork_url)
    : null;
  const playCount = Number.isFinite(song.play_count) ? song.play_count : 0;
  const likeCount = Number.isFinite(song.like_count) ? song.like_count : 0;

  function handleDeleteSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!window.confirm(`Delete "${song.title}"? This can't be undone.`)) {
      event.preventDefault();
    }
  }

  if (editing) {
    return (
      <div className="px-5 py-4">
        <form action={handleEditSubmit} className="flex flex-col gap-3">
          <input type="hidden" name="song_id" value={song.id} />

          <div className="flex flex-col gap-1">
            <label
              htmlFor={`title-${song.id}`}
              className="text-xs font-medium text-muted"
            >
              Title
            </label>
            <input
              id={`title-${song.id}`}
              name="title"
              defaultValue={song.title}
              required
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={`artist-${song.id}`}
              className="text-xs font-medium text-muted"
            >
              Artist name
            </label>
            <input
              id={`artist-${song.id}`}
              name="artist_name"
              defaultValue={song.artist_name}
              required
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={`story-${song.id}`}
              className="text-xs font-medium text-muted"
            >
              Story
            </label>
            <textarea
              id={`story-${song.id}`}
              name="story"
              defaultValue={song.story ?? ""}
              rows={3}
              className={inputClass}
            />
          </div>

          {editError && <p className="text-sm text-red-400">{editError}</p>}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={editPending}
              className="rounded-full bg-accent px-5 py-1.5 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-strong disabled:opacity-40"
            >
              {editPending ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setEditError(null);
              }}
              className="text-sm font-medium text-muted transition-colors hover:text-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 px-5 py-3">
      {artworkUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={artworkUrl}
          alt=""
          className="h-12 w-12 flex-shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-black/30 text-xl text-accent">
          🎵
        </div>
      )}

      <div className="min-w-0 flex-1">
        <Link
          href={`/song/${song.id}`}
          className="block truncate font-display text-base text-foreground transition-colors hover:text-accent"
        >
          {song.title}
        </Link>
        <p className="truncate text-sm text-muted">
          {song.artist_name} · ▶ {playCount} · ♥ {likeCount}
        </p>
        {deleteState.error && (
          <p className="text-sm text-red-400">{deleteState.error}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex-shrink-0 text-sm font-medium text-muted transition-colors hover:text-accent"
      >
        Edit
      </button>

      <form action={deleteAction} onSubmit={handleDeleteSubmit}>
        <input type="hidden" name="song_id" value={song.id} />
        <button
          type="submit"
          disabled={deletePending}
          className="flex-shrink-0 text-sm font-medium text-red-400 transition-colors hover:text-red-300 disabled:opacity-40"
        >
          {deletePending ? "Deleting..." : "Delete"}
        </button>
      </form>
    </div>
  );
}
