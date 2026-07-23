import { AppPageHeader } from "@/components/app-page-header"
import { requireAdmin } from "@/lib/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { isSupabaseWriteConfigured } from "@/lib/validation"
import type { FacilitySubmission } from "@/types/submission"
import SubmissionsList from "./submissions-list"

export const dynamic = "force-dynamic"

/** Admin-only page listing pending facility submissions. */
export default async function AdminSubmissionsPage() {
  await requireAdmin()

  let submissions: FacilitySubmission[] = []

  if (isSupabaseWriteConfigured()) {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("facility_submissions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to load submissions:", error.message)
    } else if (data) {
      submissions = data as FacilitySubmission[]
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <AppPageHeader />
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-6 text-3xl font-bold text-manago-navy">
          Pending Facility Submissions
        </h1>
        <SubmissionsList initialSubmissions={submissions} />
      </div>
    </main>
  )
}
