"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignupFormState = {
  error: string | null;
  message: string | null;
};

export async function signup(
  _prevState: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required.", message: null };
  }
  if (password.length < 6) {
    return {
      error: "Password must be at least 6 characters.",
      message: null,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message, message: null };
  }

  if (!data.session) {
    return {
      error: null,
      message: "Check your email to confirm your account before logging in.",
    };
  }

  redirect("/upload");
}
