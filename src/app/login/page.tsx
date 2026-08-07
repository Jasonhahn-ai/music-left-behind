import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <h1 className="font-display text-3xl text-foreground">Log in</h1>
      <LoginForm />
    </main>
  );
}
