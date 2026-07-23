import { createClient } from "@/lib/supabase/server";
import SubmissionsList, { type Submission } from "./submissions-list";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage() {
  let submissions: Submission[] = [];

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("facility_submissions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load submissions:", error.message);
    } else if (data) {
      submissions = data as Submission[];
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Pending Facility Submissions</h1>
      <SubmissionsList initialSubmissions={submissions} />
    </main>
  );
}
