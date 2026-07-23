"use client"

import { useState } from "react"
import { useTransitionRouter } from "next-view-transitions"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteReview } from "@/app/actions/reviews"
import { Button } from "@/components/ui/button"

type DeleteReviewButtonProps = {
  reviewId: string
  facilityId: string
}

/** Admin-only control to permanently remove a review. */
export function DeleteReviewButton({
  reviewId,
  facilityId,
}: DeleteReviewButtonProps) {
  const router = useTransitionRouter()
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this review? This cannot be undone."
    )
    if (!confirmed) return

    setBusy(true)
    const { error } = await deleteReview(reviewId, facilityId)
    setBusy(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success("Review deleted.")
    router.refresh()
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      disabled={busy}
      className="mt-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={handleDelete}
      aria-label="Delete review"
    >
      <Trash2 className="size-3.5" />
      {busy ? "Deleting..." : "Delete"}
    </Button>
  )
}
