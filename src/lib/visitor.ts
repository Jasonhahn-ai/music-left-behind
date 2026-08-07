const STORAGE_KEY = "anonymous_visitor_id";

// A random, self-reported ID used to soft-dedupe anonymous likes from
// the same browser. Not tied to auth, not verified server-side beyond
// the unique(song_id, visitor_id) constraint -- clearing localStorage
// or using another browser resets it, by design.
export function getVisitorId(): string {
  if (typeof window === "undefined") return "";

  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
