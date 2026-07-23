import { REVIEW_TAGS } from "@/lib/reviews"

/** Singapore bounding box used to reject obviously invalid coordinates. */
export const SINGAPORE_BOUNDS = {
  minLat: 1.15,
  maxLat: 1.48,
  minLng: 103.6,
  maxLng: 104.1,
} as const

export const LIMITS = {
  name: 120,
  address: 300,
  buildingName: 120,
  floor: 40,
  description: 1000,
  comment: 1000,
  featureIds: 20,
  imageBytes: 5 * 1024 * 1024,
} as const

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** True when env vars needed for service-role writes are present. */
export function isSupabaseWriteConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

/** Read a FormData field as a trimmed string (empty when missing). */
export function readFormString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

/** Read a FormData field as a finite number (NaN when invalid). */
export function readFormNumber(formData: FormData, key: string) {
  const raw = readFormString(formData, key)
  const n = Number(raw)
  return Number.isFinite(n) ? n : NaN
}

/** Read a FormData boolean encoded as the string "true". */
export function readFormBool(formData: FormData, key: string) {
  return readFormString(formData, key) === "true"
}

/** True when coordinates fall inside Singapore (with a small margin). */
export function isValidSingaporeCoordinate(lat: number, lng: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  return (
    lat >= SINGAPORE_BOUNDS.minLat &&
    lat <= SINGAPORE_BOUNDS.maxLat &&
    lng >= SINGAPORE_BOUNDS.minLng &&
    lng <= SINGAPORE_BOUNDS.maxLng
  )
}

/** True for 24-hour clock times like "09:30" or "23:00". */
export function isValidTimeString(value: string) {
  return TIME_RE.test(value)
}

/** True for a standard UUID string. */
export function isValidUuid(value: string) {
  return UUID_RE.test(value)
}

/** Parse feature IDs from a JSON array string; returns null on bad input. */
export function parseFeatureIds(raw: string): number[] | null {
  try {
    const parsed = JSON.parse(raw || "[]")
    if (!Array.isArray(parsed)) return null
    if (parsed.length > LIMITS.featureIds) return null

    const ids: number[] = []
    for (const item of parsed) {
      const n = typeof item === "number" ? item : Number(item)
      if (!Number.isInteger(n) || n <= 0) return null
      ids.push(n)
    }
    return [...new Set(ids)]
  } catch {
    return null
  }
}

/** Validate an uploaded facility photo (type + size). */
export function validateImageFile(file: File): string | null {
  if (file.size <= 0) return "Please upload a photo."
  if (file.size > LIMITS.imageBytes) {
    return "Photo must be 5 MB or smaller."
  }
  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_TYPES)[number]
    )
  ) {
    return "Photo must be a JPEG, PNG, WebP, or GIF."
  }
  return null
}

/** Keep only known review tags; drop anything unexpected. */
export function sanitizeReviewTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return []
  const allowed = new Set<string>(REVIEW_TAGS)
  return [
    ...new Set(
      tags.filter((tag): tag is string => typeof tag === "string" && allowed.has(tag))
    ),
  ]
}

/** Clamp and trim an optional comment; null when empty. */
export function sanitizeComment(comment: unknown): string | null {
  if (comment == null) return null
  if (typeof comment !== "string") return null
  const trimmed = comment.trim()
  if (!trimmed) return null
  return trimmed.slice(0, LIMITS.comment)
}
