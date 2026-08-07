import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";

export async function SiteNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="flex items-center justify-between border-b border-card-border px-6 py-4">
      <Link
        href="/"
        className="font-display text-lg tracking-wide text-foreground"
      >
        Music Left Behind
      </Link>
      <div className="flex items-center gap-5 text-sm">
        <Link
          href="/browse"
          className="font-medium text-muted transition-colors hover:text-accent"
        >
          Browse
        </Link>
        <Link
          href="/gallery"
          className="font-medium text-muted transition-colors hover:text-accent"
        >
          Gallery
        </Link>
        {user ? (
          <>
            <Link
              href="/dashboard"
              className="font-medium text-muted transition-colors hover:text-accent"
            >
              Dashboard
            </Link>
            <Link
              href="/upload"
              className="font-medium text-muted transition-colors hover:text-accent"
            >
              Upload a song
            </Link>
            <span className="text-muted">{user.email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="font-medium text-muted transition-colors hover:text-accent"
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="font-medium text-muted transition-colors hover:text-accent"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="font-medium text-accent transition-colors hover:text-accent-strong"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
