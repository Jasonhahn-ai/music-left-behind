import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UploadForm } from "./upload-form";
import { UploadGate } from "./upload-gate";

export default async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: agreement } = await supabase
    .from("user_agreements")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="flex flex-1 flex-col items-center gap-8 px-6 py-16">
      <h1 className="font-display text-3xl text-foreground">Upload a song</h1>
      <UploadGate hasAgreed={Boolean(agreement)}>
        <UploadForm userId={user.id} />
      </UploadGate>
    </main>
  );
}
