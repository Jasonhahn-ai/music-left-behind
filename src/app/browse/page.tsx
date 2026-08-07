import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listSongs, type SongSort } from "@/lib/songs";
import { SONG_TAGS, isSongTag } from "@/lib/tags";
import { ArchiveList } from "./archive-list";

export const metadata: Metadata = {
  title: "Archive",
  description:
    "Every lost song in one place — browse, sort by likes or plays, and filter by genre or mood.",
};

const SORT_OPTIONS: { value: SongSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "liked", label: "Most liked" },
  { value: "played", label: "Most played" },
];

function parseSort(value: string | undefined): SongSort {
  return SORT_OPTIONS.some((option) => option.value === value)
    ? (value as SongSort)
    : "newest";
}

function buildHref(sort: SongSort, tag: string | undefined): string {
  const params = new URLSearchParams();
  if (sort !== "newest") params.set("sort", sort);
  if (tag) params.set("tag", tag);
  const query = params.toString();
  return query ? `/browse?${query}` : "/browse";
}

const pillClass = (active: boolean) =>
  `rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
    active
      ? "border-accent bg-accent/10 text-accent"
      : "border-card-border text-muted hover:border-accent hover:text-accent"
  }`;

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; tag?: string }>;
}) {
  const { sort: sortParam, tag: tagParam } = await searchParams;
  const sort = parseSort(sortParam);
  const tag = tagParam && isSongTag(tagParam) ? tagParam : undefined;

  const supabase = await createClient();
  const songs = await listSongs(supabase, sort, tag);

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16">
      <h1 className="font-display text-3xl text-foreground">Archive</h1>

      <div className="flex items-center gap-2">
        {SORT_OPTIONS.map((option) => (
          <Link
            key={option.value}
            href={buildHref(option.value, tag)}
            aria-current={sort === option.value ? "true" : undefined}
            className={pillClass(sort === option.value)}
          >
            {option.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link
          href={buildHref(sort, undefined)}
          aria-current={!tag ? "true" : undefined}
          className={pillClass(!tag)}
        >
          All tags
        </Link>
        {SONG_TAGS.map((tagOption) => (
          <Link
            key={tagOption}
            href={buildHref(sort, tagOption)}
            aria-current={tag === tagOption ? "true" : undefined}
            className={pillClass(tag === tagOption)}
          >
            {tagOption}
          </Link>
        ))}
      </div>

      <ArchiveList songs={songs} />
    </main>
  );
}
