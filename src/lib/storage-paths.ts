function extensionOf(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()! : "bin";
}

// Shared by the browser (direct-to-storage upload) and the server (path
// ownership validation), so both sides agree on the `<uid>/<uuid>.<ext>`
// convention the storage RLS policies are keyed on.
export function songStoragePath(userId: string, filename: string): string {
  return `${userId}/${crypto.randomUUID()}.${extensionOf(filename)}`;
}

export function isOwnedPath(userId: string, path: string): boolean {
  return path.split("/")[0] === userId;
}
