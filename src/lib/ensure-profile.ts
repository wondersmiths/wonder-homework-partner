import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ensures a profile row exists for the current user.
 * Handles the case where a user signed up before the auto-profile trigger was set up.
 */
export async function ensureProfile(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Check if profile exists
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .single();

  if (profile) return profile;

  // Profile missing — create it from user metadata
  const role = user.user_metadata?.role || "parent";
  const fullName = user.user_metadata?.full_name || user.email || "User";

  const { data: newProfile, error } = await supabase
    .from("profiles")
    .insert({ id: user.id, role, full_name: fullName })
    .select("id, role, full_name")
    .single();

  if (error) {
    console.error("Failed to create missing profile:", error);
    return null;
  }

  return newProfile;
}
