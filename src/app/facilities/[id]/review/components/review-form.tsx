"use client"

import { useState } from "react"
import { Link, useTransitionRouter } from "next-view-transitions"
import { useAuth } from "@clerk/nextjs"
import { ChevronLeft, Star } from "lucide-react"
import { toast } from "sonner"
import { submitReview } from "@/app/actions/reviews"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { REVIEW_TAGS, RATING_LABELS } from "@/lib/reviews"
import { LIMITS } from "@/lib/validation"

type ReviewFormProps = {
  facilityId: string
  facilityName: string
  facilityPhoto: string
}

export default function ReviewForm({
  facilityId,
  facilityName,
  facilityPhoto,
}: ReviewFormProps) {
  const router = useTransitionRouter()
  const { userId, isLoaded } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const backHref = `/facilities/${facilityId}`
  const displayRating = hoverRating || rating

  /** Add or remove a review tag chip. */
  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  /** Validate locally, then submit the review via server action. */
  async function handleSubmit() {
    if (rating === 0) {
      toast.info("Please select a rating.")
      return
    }

    if (comment.trim().length > LIMITS.comment) {
      toast.info(`Comment must be ${LIMITS.comment} characters or fewer.`)
      return
    }

    if (!isLoaded || !userId) {
      toast.info("Please sign in to submit a review.")
      return
    }

    setSubmitting(true)

    const { error } = await submitReview({
      facilityId,
      rating,
      tags: selectedTags,
      comment: comment.trim() || null,
    })

    setSubmitting(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success("Review submitted!")
    router.push(backHref)
  }

  return (
    <div className="min-h-full bg-background pb-28 text-foreground">
      <div className="relative h-40 w-full">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote facility photo */}
        <img
          src={facilityPhoto}
          alt={facilityName}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />

        <Link
          href={backHref}
          className="absolute left-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/95 shadow-md"
          aria-label="Go back"
        >
          <ChevronLeft className="size-6 text-manago-navy" />
        </Link>
      </div>

      <div className="relative z-10 -mt-6 px-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h1 className="text-xl font-bold text-manago-navy">Add a Review</h1>
          <p className="mt-1 text-sm text-muted-foreground">{facilityName}</p>

          <div className="mt-5">
            <p className="text-sm font-semibold text-manago-navy">
              Overall experience
            </p>
            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const value = i + 1
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                    className="p-0.5"
                  >
                    <Star
                      className={cn(
                        "size-7",
                        value <= displayRating
                          ? "fill-manago-orange text-manago-orange"
                          : "text-border"
                      )}
                    />
                  </button>
                )
              })}
              {displayRating > 0 && (
                <span className="ml-2 text-sm font-medium text-muted-foreground">
                  {RATING_LABELS[displayRating]}
                </span>
              )}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-manago-navy">How was it?</p>
            <p className="text-xs text-muted-foreground">Select all that apply</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {REVIEW_TAGS.map((tag) => {
                const selected = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                      selected
                        ? "border-manago-teal bg-manago-teal/10 text-manago-teal"
                        : "border-border bg-white text-muted-foreground hover:border-manago-teal/40"
                    )}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-manago-navy">
              Comment{" "}
              <span className="font-normal text-muted-foreground">optional</span>
            </p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, LIMITS.comment))}
              placeholder="Share your experience to help others..."
              maxLength={LIMITS.comment}
              className="mt-2 min-h-24 rounded-xl"
            />
          </div>

          <div className="mt-5 rounded-xl bg-manago-notice p-3 text-center text-sm text-manago-notice-text">
            Please be respectful and share useful details that help others.
          </div>

          <Button
            className="mt-5 h-12 w-full rounded-xl bg-manago-teal text-white hover:bg-manago-teal-dark"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </div>
    </div>
  )
}
