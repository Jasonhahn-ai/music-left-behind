"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { uploadSong, type UploadFormState } from "./actions";
import { SONG_TAGS } from "@/lib/tags";
import { transcodeToMp3 } from "@/lib/transcode-audio";

const initialState: UploadFormState = { error: null, success: false };

const inputClass =
  "rounded-lg border border-card-border bg-black/30 px-3 py-2 text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent";

export function UploadForm() {
  const [state, formAction, pending] = useActionState(uploadSong, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [transcoding, setTranscoding] = useState(false);
  const [transcodeProgress, setTranscodeProgress] = useState(0);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const audioFile = formData.get("audio");

    if (audioFile instanceof File && audioFile.size > 0) {
      setTranscoding(true);
      setTranscodeProgress(0);
      try {
        const mp3File = await transcodeToMp3(audioFile, setTranscodeProgress);
        formData.set("audio", mp3File);
      } catch {
        // Best-effort optimization: if in-browser transcoding fails (e.g.
        // an unsupported browser), fall back to uploading the original
        // file untouched. The server-side layer check is still the safety
        // net for anything that turns out to be genuinely unplayable.
      } finally {
        setTranscoding(false);
      }
    }

    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-card-border bg-card p-8 shadow-[0_0_90px_-25px_var(--accent-glow),0_30px_70px_-20px_rgba(0,0,0,0.7)]"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium text-muted">
          Title
        </label>
        <input id="title" name="title" type="text" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="artist_name" className="text-sm font-medium text-muted">
          Artist name
        </label>
        <input
          id="artist_name"
          name="artist_name"
          type="text"
          required
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="story" className="text-sm font-medium text-muted">
          Story <span className="text-muted/70">(optional)</span>
        </label>
        <textarea id="story" name="story" rows={4} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-muted">
          Tags <span className="text-muted/70">(optional)</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {SONG_TAGS.map((tag) => (
            <label key={tag} className="cursor-pointer">
              <input
                type="checkbox"
                name="tags"
                value={tag}
                className="peer sr-only"
              />
              <span className="inline-block rounded-full border border-card-border px-3 py-1 text-sm text-muted transition-colors peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-accent">
                {tag}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="audio" className="text-sm font-medium text-muted">
          Audio file
        </label>
        <input
          id="audio"
          name="audio"
          type="file"
          accept="audio/*"
          required
          className="text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-1.5 file:text-sm file:font-medium file:text-accent-ink hover:file:bg-accent-strong"
        />
        <span className="text-xs text-muted/70">
          MP3, WAV, M4A, AAC, OGG, and more -- we&apos;ll automatically prepare it for playback.
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="artwork" className="text-sm font-medium text-muted">
          Artwork <span className="text-muted/70">(optional)</span>
        </label>
        <input
          id="artwork"
          name="artwork"
          type="file"
          accept="image/*"
          className="text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-1.5 file:text-sm file:font-medium file:text-accent-ink hover:file:bg-accent-strong"
        />
      </div>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-accent">Song uploaded successfully.</p>
      )}

      <button
        type="submit"
        disabled={transcoding || pending}
        className="rounded-full bg-accent px-5 py-2 font-medium text-accent-ink shadow-[0_0_30px_-8px_var(--accent-glow)] transition-colors hover:bg-accent-strong disabled:opacity-40"
      >
        {transcoding
          ? `Preparing your song... ${Math.round(transcodeProgress * 100)}%`
          : pending
            ? "Uploading..."
            : "Upload song"}
      </button>
    </form>
  );
}
