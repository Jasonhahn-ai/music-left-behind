export function TagPills({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-card-border px-3 py-1 text-xs text-muted"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
