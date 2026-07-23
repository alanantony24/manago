"use client"

import { useEffect, useMemo, useState } from "react"
import { useTransitionRouter } from "next-view-transitions"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteFacility, updateFacility } from "@/app/actions/facilities"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { LIMITS } from "@/lib/validation"
import type { AmenityType, Facility } from "@/types/facility"

const INPUT =
  "w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-manago-navy placeholder:text-muted-foreground focus:border-manago-teal-dark focus:outline-none focus:ring-2 focus:ring-manago-teal/30"

const LABEL = "mb-1.5 block text-sm font-medium text-muted-foreground"

type FacilityAdminPanelProps = {
  facility: Facility
  amenityTypes: AmenityType[]
}

/** Inline admin controls to edit or delete a facility. */
export function FacilityAdminPanel({
  facility,
  amenityTypes,
}: FacilityAdminPanelProps) {
  const router = useTransitionRouter()
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState(facility.name)
  const [amenityTypeId, setAmenityTypeId] = useState(facility.amenity_type_id)
  const [address, setAddress] = useState(facility.address ?? "")
  const [buildingName, setBuildingName] = useState(facility.building_name ?? "")
  const [floor, setFloor] = useState(facility.floor ?? "")
  const [latitude, setLatitude] = useState(String(facility.latitude))
  const [longitude, setLongitude] = useState(String(facility.longitude))
  const [description, setDescription] = useState(facility.description ?? "")
  const [isAccessible, setIsAccessible] = useState(facility.is_accessible)
  const [image, setImage] = useState<File | null>(null)

  const preview = useMemo(
    () => (image ? URL.createObjectURL(image) : null),
    [image]
  )

  const typeOptions = useMemo(() => {
    const byId = new Map(amenityTypes.map((type) => [type.id, type]))
    if (!byId.has(facility.amenity_type_id)) {
      byId.set(
        facility.amenity_type_id,
        facility.amenity_types ?? {
          id: facility.amenity_type_id,
          slug: "current",
          label: `Type #${facility.amenity_type_id}`,
        }
      )
    }
    return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label))
  }, [amenityTypes, facility.amenity_type_id, facility.amenity_types])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  /** Reset the edit form to the current facility values. */
  function resetForm() {
    setName(facility.name)
    setAmenityTypeId(facility.amenity_type_id)
    setAddress(facility.address ?? "")
    setBuildingName(facility.building_name ?? "")
    setFloor(facility.floor ?? "")
    setLatitude(String(facility.latitude))
    setLongitude(String(facility.longitude))
    setDescription(facility.description ?? "")
    setIsAccessible(facility.is_accessible)
    setImage(null)
  }

  /** Save facility edits via the admin server action. */
  async function handleSave() {
    const formData = new FormData()
    formData.set("name", name.trim())
    formData.set("amenityTypeId", String(amenityTypeId))
    formData.set("address", address.trim())
    formData.set("buildingName", buildingName.trim())
    formData.set("floor", floor.trim())
    formData.set("latitude", latitude.trim())
    formData.set("longitude", longitude.trim())
    formData.set("description", description.trim())
    formData.set("isAccessible", String(isAccessible))
    if (image) formData.set("image", image)

    setBusy(true)
    const { error } = await updateFacility(facility.id, formData)
    setBusy(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success("Facility updated.")
    setEditing(false)
    setImage(null)
    router.refresh()
  }

  /** Confirm and permanently delete this facility. */
  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete “${facility.name}”? This also removes its reviews and cannot be undone.`
    )
    if (!confirmed) return

    setBusy(true)
    const { error } = await deleteFacility(facility.id)
    setBusy(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success("Facility deleted.")
    router.push("/nearby")
  }

  return (
    <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-amber-900">
            Admin
          </h2>
          <p className="mt-0.5 text-xs text-amber-900/70">
            Edit facility details or remove this listing.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            className="rounded-lg border-amber-300 bg-white text-amber-950 hover:bg-amber-100"
            onClick={() => {
              if (editing) {
                resetForm()
                setEditing(false)
                return
              }
              resetForm()
              setEditing(true)
            }}
          >
            <Pencil className="size-3.5" />
            {editing ? "Cancel" : "Edit facility"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={busy}
            className="rounded-lg"
            onClick={handleDelete}
          >
            <Trash2 className="size-3.5" />
            Delete facility
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="mt-4 space-y-3 rounded-xl border border-border bg-card p-4">
          <div>
            <label htmlFor="admin-facility-name" className={LABEL}>
              Name
            </label>
            <input
              id="admin-facility-name"
              value={name}
              maxLength={LIMITS.name}
              onChange={(e) => setName(e.target.value)}
              className={INPUT}
            />
          </div>

          <div>
            <label htmlFor="admin-facility-type" className={LABEL}>
              Type
            </label>
            <select
              id="admin-facility-type"
              value={amenityTypeId}
              onChange={(e) => setAmenityTypeId(Number(e.target.value))}
              className={INPUT}
            >
              {typeOptions.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="admin-facility-address" className={LABEL}>
              Address
            </label>
            <input
              id="admin-facility-address"
              value={address}
              maxLength={LIMITS.address}
              onChange={(e) => setAddress(e.target.value)}
              className={INPUT}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="admin-facility-building" className={LABEL}>
                Building
              </label>
              <input
                id="admin-facility-building"
                value={buildingName}
                maxLength={LIMITS.buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="admin-facility-floor" className={LABEL}>
                Floor
              </label>
              <input
                id="admin-facility-floor"
                value={floor}
                maxLength={LIMITS.floor}
                onChange={(e) => setFloor(e.target.value)}
                className={INPUT}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="admin-facility-lat" className={LABEL}>
                Latitude
              </label>
              <input
                id="admin-facility-lat"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className={INPUT}
                inputMode="decimal"
              />
            </div>
            <div>
              <label htmlFor="admin-facility-lng" className={LABEL}>
                Longitude
              </label>
              <input
                id="admin-facility-lng"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className={INPUT}
                inputMode="decimal"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-facility-description" className={LABEL}>
              Description
            </label>
            <Textarea
              id="admin-facility-description"
              value={description}
              maxLength={LIMITS.description}
              onChange={(e) =>
                setDescription(e.target.value.slice(0, LIMITS.description))
              }
              className="min-h-24 rounded-xl"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-manago-navy">
            <input
              type="checkbox"
              checked={isAccessible}
              onChange={(e) => setIsAccessible(e.target.checked)}
              className="size-4 rounded border-border"
            />
            Wheelchair accessible
          </label>

          <div>
            <label htmlFor="admin-facility-photo" className={LABEL}>
              Replace photo{" "}
              <span className="font-normal">(optional)</span>
            </label>
            <input
              id="admin-facility-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className={cn(INPUT, "py-2 file:mr-3 file:rounded-md file:border-0 file:bg-manago-teal/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-manago-teal")}
            />
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- local file preview
              <img
                src={preview}
                alt="New photo preview"
                className="mt-2 h-32 w-full rounded-lg object-cover"
              />
            ) : null}
          </div>

          <Button
            type="button"
            disabled={busy}
            className="h-11 w-full rounded-xl bg-manago-teal text-white hover:bg-manago-teal-dark"
            onClick={handleSave}
          >
            {busy ? "Saving..." : "Save changes"}
          </Button>
        </div>
      ) : null}
    </section>
  )
}
