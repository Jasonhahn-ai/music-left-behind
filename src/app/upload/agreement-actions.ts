"use server";

import { createClient } from "@/lib/supabase/server";

export type AgreementState = {
  error: string | null;
  agreed: boolean;
};

export async function agreeToUploadTerms(): Promise<AgreementState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to continue.", agreed: false };
  }

  const { error } = await supabase
    .from("user_agreements")
    .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });

  if (error) {
    return { error: `Could not record your agreement: ${error.message}`, agreed: false };
  }

  return { error: null, agreed: true };
}
