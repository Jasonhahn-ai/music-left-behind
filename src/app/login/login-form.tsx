"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthFormState } from "./actions";

const initialState: AuthFormState = { error: null };

const inputClass =
  "rounded-lg border border-card-border bg-black/30 px-3 py-2 text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form
      action={formAction}
      className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-card-border bg-card p-8 shadow-[0_0_90px_-25px_var(--accent-glow),0_30px_70px_-20px_rgba(0,0,0,0.7)]"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-muted">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-muted">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-5 py-2 font-medium text-accent-ink shadow-[0_0_30px_-8px_var(--accent-glow)] transition-colors hover:bg-accent-strong disabled:opacity-40"
      >
        {pending ? "Logging in..." : "Log in"}
      </button>
      <p className="text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-accent hover:text-accent-strong">
          Sign up
        </Link>
      </p>
    </form>
  );
}
