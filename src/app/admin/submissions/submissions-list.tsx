"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  approveFacilitySubmission,
  rejectFacilitySubmission,
} from "@/app/actions/submissions"
import type { FacilitySubmission } from "@/types/submission"

type SubmissionsListProps = {
  initialSubmissions: FacilitySubmission[]
}

function formatSubmissionHours(submission: FacilitySubmission): string | null {
  if (submission.is_24_hours) return "Open 24 hours"
  if (submission.open_time && submission.close_time) {
    return `${submission.open_time} – ${submission.close_time}`
  }
  return null
}

/** Admin list of pending facility submissions with approve / reject actions. */
export default function SubmissionsList({
  initialSubmissions,
}: SubmissionsListProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [busyId, setBusyId] = useState<number | null>(null)

  /** Approve by id; server reloads the row so client fields are not trusted. */
  async function approveSubmission(id: number) {
    setBusyId(id)
    const { error } = await approveFacilitySubmission(id)
    setBusyId(null)

    if (error) {
      toast.error(error)
      return
    }

    setSubmissions((prev) => prev.filter((item) => item.id !== id))
    toast.success("Facility approved.")
  }

  /** Mark a pending submission as rejected. */
  async function rejectSubmission(id: number) {
    setBusyId(id)
    const { error } = await rejectFacilitySubmission(id)
    setBusyId(null)

    if (error) {
      toast.error(error)
      return
    }

    setSubmissions((prev) => prev.filter((item) => item.id !== id))
    toast.success("Submission rejected.")
  }

  if (submissions.length === 0) {
    return (
      <p className="text-muted-foreground">No pending submissions right now.</p>
    )
  }

  return (
    <>
      {submissions.map((submission) => {
        const hours = formatSubmissionHours(submission)

        return (
        <div
          key={submission.id}
          className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <h2 className="text-xl font-semibold text-manago-navy">
            {submission.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {submission.address}
          </p>
          {submission.building_name ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Building: {submission.building_name}
            </p>
          ) : null}
          {submission.floor ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Floor: {submission.floor}
            </p>
          ) : null}
          {hours ? (
            <p className="mt-1 text-sm text-muted-foreground">Hours: {hours}</p>
          ) : null}
          {submission.description ? (
            <p className="mt-3 text-sm text-foreground/80">
              {submission.description}
            </p>
          ) : null}
          {submission.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- matches facility cards elsewhere
            <img
              src={submission.photo_url}
              className="mt-4 h-56 w-full rounded-lg object-cover"
              alt={submission.name}
            />
          ) : null}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              disabled={busyId === submission.id}
              onClick={() => approveSubmission(submission.id)}
              className="rounded-lg bg-manago-teal px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={busyId === submission.id}
              onClick={() => rejectSubmission(submission.id)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-manago-navy disabled:opacity-60"
            >
              Reject
            </button>
          </div>
        </div>
        )
      })}
    </>
  )
}
