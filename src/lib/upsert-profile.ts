import type { SupabaseClient } from "@supabase/supabase-js"
import { displayNameFromClerk } from "@/lib/display-name"

type ClerkNameFields = {
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
}

/** Upsert a profiles row and verify it exists before attributing activity. */
export async function upsertProfileRow(
  supabase: SupabaseClient,
  userId: string,
  user?: ClerkNameFields | null
): Promise<{ userId: string | null; error: string | null }> {
  const payload = {
    id: userId,
    display_name: displayNameFromClerk(user),
    updated_at: new Date().toISOString(),
  }

  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })

  if (upsertError) {
    // Fallback: plain insert (ignore conflict if the row already exists)
    const { error: insertError } = await supabase
      .from("profiles")
      .insert(payload)

    if (
      insertError &&
      insertError.code !== "23505" &&
      !insertError.message.toLowerCase().includes("duplicate")
    ) {
      return { userId: null, error: insertError.message }
    }
  }

  // Confirm the row is actually readable/present before using it as an FK.
  const { data, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle()

  if (selectError) {
    return { userId: null, error: selectError.message }
  }

  if (!data?.id) {
    return {
      userId: null,
      error:
        "Profile could not be saved. Check that the profiles table and grants are set up, then try again.",
    }
  }

  return { userId: data.id, error: null }
}
