import type { Song } from "@/lib/songs";
import { DashboardSongRow } from "./dashboard-song-row";

export function DashboardSongList({ songs }: { songs: Song[] }) {
  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-muted">You haven&apos;t uploaded any songs yet.</p>
        <a
          href="/upload"
          className="font-medium text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:text-accent-strong"
        >
          Upload your first song
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl divide-y divide-card-border rounded-2xl border border-card-border bg-card shadow-[0_0_90px_-25px_var(--accent-glow),0_30px_70px_-20px_rgba(0,0,0,0.7)]">
      {songs.map((song) => (
        <DashboardSongRow key={song.id} song={song} />
      ))}
    </div>
  );
}
