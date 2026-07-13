"use client"

import { useState } from "react"
import { Link, useTransitionRouter } from "next-view-transitions"
import { ChevronLeft, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { REVIEW_TAGS, RATING_LABELS } from "@/lib/reviews"

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
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const backHref = `/facilities/${facilityId}`
  const displayRating = hoverRating || rating

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  async function handleSubmit() {
    if (rating === 0) {
      setError("Please select a rating.")
      return
    }

    setError(null)
    setSubmitting(true)

    const supabase = createClient()
    const { error: insertError } = await supabase.from("reviews").insert([
      {
        facility_id: facilityId,
        rating,
        tags: selectedTags,
        comment: comment.trim() || null,
      },
    ])

    setSubmitting(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    router.push(backHref)
  }

  return (
    <div className="min-h-full bg-gray-50 pb-28">
      <div className="relative h-40 w-full">
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
          <ChevronLeft className="size-6 text-gray-800" />
        </Link>
      </div>

      <div className="relative z-10 -mt-6 px-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Add a Review</h1>
          <p className="mt-1 text-sm text-gray-500">{facilityName}</p>

          <div className="mt-5">
            <p className="text-sm font-semibold text-gray-900">
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
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      )}
                    />
                  </button>
                )
              })}
              {displayRating > 0 && (
                <span className="ml-2 text-sm font-medium text-gray-600">
                  {RATING_LABELS[displayRating]}
                </span>
              )}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-gray-900">How was it?</p>
            <p className="text-xs text-gray-500">Select all that apply</p>
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
                        ? "border-cyan-600 bg-cyan-50 text-cyan-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    )}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-gray-900">
              Comment <span className="font-normal text-gray-400">optional</span>
            </p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience to help others..."
              className="mt-2 min-h-24 rounded-xl"
            />
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="mt-5 rounded-xl bg-cyan-50 p-3 text-center text-sm text-cyan-900">
            Reviews are checked by our team before going live.
          </div>

          <Button
            className="mt-5 h-12 w-full rounded-xl bg-cyan-600 text-white hover:bg-cyan-700"
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
