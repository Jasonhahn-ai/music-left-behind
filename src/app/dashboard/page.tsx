import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSongsByUser } from "@/lib/songs";
import { DashboardSongList } from "./dashboard-song-list";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const songs = await getSongsByUser(supabase, user.id);

  return (
    <main className="flex flex-1 flex-col items-center gap-8 px-6 py-16">
      <h1 className="font-display text-3xl text-foreground">Your songs</h1>
      <DashboardSongList songs={songs} />
    </main>
  );
}
