"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Camera, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { AppPageHeader } from "@/components/app-page-header";
import { SubmissionCelebration } from "@/components/submission-celebration";
import { TimeSelect } from "@/components/time-select";
import { submitFacilitySubmission } from "@/app/actions/submissions";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  isValidSingaporeCoordinate,
  LIMITS,
  validateImageFile,
} from "@/lib/validation";
import {
  dedupeAmenityTypes,
  dedupeBySlug,
  EMPTY_FIELD_ERRORS,
  isOverlappingFeature,
  type AmenityType,
  type FeatureType,
  type FieldErrors,
  type MapboxSuggestion,
} from "./helpers";

const CARD = "m-4 rounded-2xl border border-border bg-card p-5 shadow-sm";

const CHIP =
  "rounded-xl border px-3.5 py-2 text-sm font-medium text-manago-navy transition-colors";

const SECTION_TITLE = "mb-3 text-lg font-bold text-manago-navy";

const INPUT =
  "w-full rounded-xl border border-border bg-white px-4 py-3 text-manago-navy placeholder:text-muted-foreground focus:border-manago-teal-dark focus:outline-none focus:ring-2 focus:ring-manago-teal/30";

const LABEL = "mb-1.5 block text-sm font-medium text-muted-foreground";

/** Contribute a new facility for admin review. */
export default function AddFacilityPage() {
  const { userId, isLoaded: isAuthLoaded } = useAuth();
  const [features, setFeatures] = useState<FeatureType[]>([]);
  const [selectedAmenityId, setSelectedAmenityId] = useState<number | null>(
    null
  );
  const [amenityTypes, setAmenityTypes] = useState<AmenityType[]>([]);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<number[]>([]);
  const [is24Hours, setIs24Hours] = useState(false);
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const preview = useMemo(
    () => (image ? URL.createObjectURL(image) : null),
    [image]
  );

  const [locationQuery, setLocationQuery] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [description, setDescription] = useState("");
  const [isAccessible, setIsAccessible] = useState(false);
  const [suggestions, setSuggestions] = useState<MapboxSuggestion[]>([]);
  const [floor, setFloor] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [fieldErrors, setFieldErrors] =
    useState<FieldErrors>(EMPTY_FIELD_ERRORS);

  const availableFeatures = useMemo(
    () =>
      features.filter((feature) => !isOverlappingFeature(feature, amenityTypes)),
    [features, amenityTypes]
  );

  /** Toggle a feature chip on or off. */
  const toggleFeature = (id: number) => {
    setSelectedFeatureIds((prev) =>
      prev.includes(id)
        ? prev.filter((featureId) => featureId !== id)
        : [...prev, id]
    );
  };

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  useEffect(() => {
    /** Load amenity types for the type chips. */
    async function loadAmenityTypes() {
      const { data, error } = await supabase
        .from("amenity_types")
        .select("id, slug, label, icon")
        .order("label");

      if (error) {
        console.error(error);
        toast.error("Could not load facility types.");
        return;
      }

      setAmenityTypes(dedupeAmenityTypes(data ?? []));
    }

    /** Load optional feature chips (excluding amenity overlaps). */
    async function loadFeatureTypes() {
      const { data, error } = await supabase
        .from("feature_types")
        .select("id, slug, label, icon")
        .order("label");

      if (error) {
        console.error(error);
        toast.error("Could not load features.");
        return;
      }

      setFeatures(dedupeBySlug(data ?? []));
    }

    loadAmenityTypes();
    loadFeatureTypes();
  }, []);

  /** Geocode a Singapore place query via Mapbox and show suggestions. */
  async function searchLocation(query: string) {
    setLocationQuery(query);
    setLocationStatus("");
    setIsUsingCurrentLocation(false);
    setLatitude(null);
    setLongitude(null);

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?country=sg&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`
    );

    const data = await response.json();
    setSuggestions(data.features ?? []);
  }

  /** Pin the form to the user's current GPS coordinates. */
  function handleUseCurrentLocation() {
    setLocationStatus("");

    if (!navigator.geolocation) {
      toast.error("Current location is not supported by this browser.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        if (!isValidSingaporeCoordinate(lat, lng)) {
          toast.error("Current location must be within Singapore.");
          setIsLocating(false);
          return;
        }
        setLatitude(lat);
        setLongitude(lng);
        setIsUsingCurrentLocation(true);
        setSuggestions([]);
        setFieldErrors((prev) => ({ ...prev, location: false }));
        setLocationStatus("Pinned. Enter the place name above.");
        setIsLocating(false);
      },
      () => {
        toast.error(
          "Unable to get your current location. Please allow location access and try again."
        );
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  /** Clear the GPS pin and return to address search. */
  function handleSearchInstead() {
    setIsUsingCurrentLocation(false);
    setLatitude(null);
    setLongitude(null);
    setSuggestions([]);
    setLocationStatus("");
  }

  /** Client-side validation, then submit FormData to the server action. */
  async function handleSubmit() {
    setFieldErrors(EMPTY_FIELD_ERRORS);

    const nextErrors: FieldErrors = { ...EMPTY_FIELD_ERRORS };
    const messages: string[] = [];
    const trimmedName = facilityName.trim();
    const trimmedFloor = floor.trim();

    if (!trimmedName) {
      messages.push("Please enter a facility name.");
    } else if (trimmedName.length > LIMITS.name) {
      messages.push(`Facility name must be ${LIMITS.name} characters or fewer.`);
    }

    if (selectedAmenityId === null) {
      nextErrors.facility = true;
      messages.push("Please select a facility type.");
    }

    if (
      !locationQuery.trim() ||
      latitude === null ||
      longitude === null ||
      !isValidSingaporeCoordinate(latitude, longitude)
    ) {
      nextErrors.location = true;
      messages.push(
        "Please select a location from the suggestions or use your current location pin."
      );
    }

    if (!trimmedFloor) {
      nextErrors.floor = true;
      messages.push("Please enter the floor.");
    } else if (trimmedFloor.length > LIMITS.floor) {
      nextErrors.floor = true;
      messages.push(`Floor must be ${LIMITS.floor} characters or fewer.`);
    }

    if (buildingName.trim().length > LIMITS.buildingName) {
      messages.push(
        `Building name must be ${LIMITS.buildingName} characters or fewer.`
      );
    }

    if (description.trim().length > LIMITS.description) {
      messages.push(`Notes must be ${LIMITS.description} characters or fewer.`);
    }

    if (!is24Hours && (!openTime || !closeTime)) {
      nextErrors.openingHours = true;
      messages.push("Please set opening and closing times, or turn on 24 hours.");
    }

    if (!image) {
      nextErrors.image = true;
      messages.push("Please upload a photo.");
    } else {
      const imageError = validateImageFile(image);
      if (imageError) {
        nextErrors.image = true;
        messages.push(imageError);
      }
    }

    if (messages.length > 0) {
      setFieldErrors(nextErrors);
      toast.info(messages[0], {
        description:
          messages.length > 1
            ? `${messages.length - 1} more issue${messages.length > 2 ? "s" : ""} to fix`
            : undefined,
      });
      return;
    }

    if (!isAuthLoaded || !userId) {
      toast.info("Please sign in to contribute a facility.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("name", trimmedName);
      formData.set("amenityTypeId", String(selectedAmenityId));
      formData.set("latitude", String(latitude));
      formData.set("longitude", String(longitude));
      formData.set("address", locationQuery.trim());
      formData.set("buildingName", buildingName.trim());
      formData.set("floor", trimmedFloor);
      formData.set("description", description.trim());
      formData.set("openTime", is24Hours ? "" : openTime);
      formData.set("closeTime", is24Hours ? "" : closeTime);
      formData.set("is24Hours", String(is24Hours));
      formData.set("isAccessible", String(isAccessible));
      formData.set("featureIds", JSON.stringify(selectedFeatureIds));
      if (image) formData.set("image", image);

      const { error } = await submitFacilitySubmission(formData);

      if (error) throw new Error(error);

      setFacilityName("");
      setBuildingName("");
      setDescription("");
      setIsAccessible(false);
      setSelectedAmenityId(null);
      setSelectedFeatureIds([]);
      setLocationQuery("");
      setFloor("");
      setLatitude(null);
      setLongitude(null);
      setIsUsingCurrentLocation(false);
      setSuggestions([]);
      setLocationStatus("");
      setOpenTime("");
      setCloseTime("");
      setIs24Hours(false);
      setImage(null);
      setFieldErrors(EMPTY_FIELD_ERRORS);
      setShowCelebration(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (showCelebration) {
    return (
      <SubmissionCelebration
        onAddAnother={() => setShowCelebration(false)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-background pb-8 text-foreground">
      <AppPageHeader />

      <section className={CARD}>
        <h2 className={SECTION_TITLE}>
          Basics
          <span className="ml-1 text-destructive">*</span>
        </h2>

        <label className={LABEL} htmlFor="facility-name">
          Facility name
        </label>
        <input
          id="facility-name"
          className={INPUT}
          placeholder="e.g. City Square Mall Toilet"
          value={facilityName}
          maxLength={LIMITS.name}
          onChange={(e) => setFacilityName(e.target.value)}
        />

        <p className={cn(LABEL, "mt-4")}>
          Type
          <span className="ml-1 text-destructive">*</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {amenityTypes.map((amenity) => (
            <button
              key={amenity.id}
              type="button"
              onClick={() => {
                setSelectedAmenityId(
                  selectedAmenityId === amenity.id ? null : amenity.id
                );
                setFieldErrors((prev) => ({ ...prev, facility: false }));
              }}
              className={cn(
                CHIP,
                selectedAmenityId === amenity.id
                  ? "border-manago-teal-dark bg-manago-chip"
                  : "border-border bg-white hover:border-manago-teal",
                fieldErrors.facility &&
                  selectedAmenityId === null &&
                  "border-destructive"
              )}
            >
              {amenity.label}
            </button>
          ))}
        </div>

        <label className={cn(LABEL, "mt-4")} htmlFor="building-name">
          Building name
          <span className="ml-1 font-normal">(optional)</span>
        </label>
        <input
          id="building-name"
          className={INPUT}
          placeholder="e.g. City Square Mall"
          value={buildingName}
          maxLength={LIMITS.buildingName}
          onChange={(e) => setBuildingName(e.target.value)}
        />

        <label className={cn(LABEL, "mt-4")} htmlFor="description">
          Notes
          <span className="ml-1 font-normal">(optional)</span>
        </label>
        <textarea
          id="description"
          className={cn(INPUT, "min-h-[88px] resize-y")}
          placeholder="Anything helpful for others to find it"
          value={description}
          maxLength={LIMITS.description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </section>

      <section className={CARD}>
        <h2 className={SECTION_TITLE}>
          Location
          <span className="ml-1 text-destructive">*</span>
        </h2>

        <label className={LABEL} htmlFor="location-query">
          Address or place
        </label>
        <input
          id="location-query"
          type="text"
          placeholder={
            isUsingCurrentLocation
              ? "Type the place name"
              : "Search for a location"
          }
          value={locationQuery}
          onChange={(e) => {
            if (isUsingCurrentLocation) {
              setLocationQuery(e.target.value);
              return;
            }
            searchLocation(e.target.value);
          }}
          className={cn(
            INPUT,
            fieldErrors.location && "border-destructive focus:border-destructive"
          )}
        />

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className={cn(
              CHIP,
              "flex flex-1 items-center justify-center gap-2 disabled:opacity-60",
              isUsingCurrentLocation
                ? "border-manago-teal-dark bg-manago-teal-dark text-white"
                : "border-border bg-white hover:border-manago-teal"
            )}
          >
            <LocateFixed className="size-4 shrink-0" aria-hidden />
            {isLocating
              ? "Locating…"
              : isUsingCurrentLocation
                ? "Pinned"
                : "Use my location"}
          </button>

          {isUsingCurrentLocation && (
            <button
              type="button"
              onClick={handleSearchInstead}
              className={cn(
                CHIP,
                "border-border bg-white hover:border-manago-teal"
              )}
            >
              Search instead
            </button>
          )}
        </div>

        {locationStatus && (
          <p className="mt-2 text-sm text-muted-foreground">{locationStatus}</p>
        )}

        {suggestions.length > 0 && (
          <div className="mt-2 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            {suggestions.map((place) => (
              <button
                key={place.id}
                type="button"
                className="block w-full border-b border-border px-4 py-3 text-left text-sm text-manago-navy last:border-b-0 hover:bg-muted"
                onClick={() => {
                  setLocationQuery(place.place_name);
                  setLatitude(place.center[1]);
                  setLongitude(place.center[0]);
                  setIsUsingCurrentLocation(false);
                  setSuggestions([]);
                  setLocationStatus("");
                  setFieldErrors((prev) => ({ ...prev, location: false }));
                }}
              >
                {place.place_name}
              </button>
            ))}
          </div>
        )}

        <label className={cn(LABEL, "mt-4")} htmlFor="floor">
          Floor / exact spot
          <span className="ml-1 text-destructive">*</span>
        </label>
        <input
          id="floor"
          type="text"
          placeholder="e.g. Level 2 beside KFC"
          value={floor}
          maxLength={LIMITS.floor}
          onChange={(e) => {
            setFloor(e.target.value);
            setFieldErrors((prev) => ({ ...prev, floor: false }));
          }}
          className={cn(
            INPUT,
            fieldErrors.floor && "border-destructive focus:border-destructive"
          )}
        />
      </section>

      <section className={CARD}>
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-manago-navy">Hours</h2>

          <button
            type="button"
            role="switch"
            aria-checked={is24Hours}
            aria-label="Open 24 hours"
            onClick={() => {
              setIs24Hours((prev) => {
                const next = !prev;
                if (next) {
                  setOpenTime("");
                  setCloseTime("");
                  setFieldErrors((errors) => ({
                    ...errors,
                    openingHours: false,
                  }));
                }
                return next;
              });
            }}
            className="flex items-center gap-2.5 select-none"
          >
            <span className="text-sm font-medium text-manago-navy">
              24 hours
            </span>
            <span
              className={cn(
                "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                is24Hours ? "bg-manago-teal-dark" : "bg-border"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform",
                  is24Hours && "translate-x-5"
                )}
              />
            </span>
          </button>
        </div>

        {is24Hours ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Open all day — no open/close time needed.
          </p>
        ) : (
          <div
            className={cn(
              "mt-4 grid grid-cols-2 gap-3",
              fieldErrors.openingHours && "rounded-xl ring-2 ring-destructive/30"
            )}
          >
            <TimeSelect
              id="open-time"
              label="Opens"
              value={openTime}
              onChange={(value) => {
                setOpenTime(value);
                setFieldErrors((prev) => ({ ...prev, openingHours: false }));
              }}
            />
            <TimeSelect
              id="close-time"
              label="Closes"
              value={closeTime}
              onChange={(value) => {
                setCloseTime(value);
                setFieldErrors((prev) => ({ ...prev, openingHours: false }));
              }}
            />
          </div>
        )}
      </section>

      <section className={CARD}>
        <h2 className={SECTION_TITLE}>
          Photo
          <span className="ml-1 text-destructive">*</span>
        </h2>

        <label
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-8 transition hover:border-manago-teal-dark hover:bg-manago-mint/30",
            fieldErrors.image ? "border-destructive" : "border-border"
          )}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
            <img
              src={preview}
              alt="Selected image preview"
              className="h-40 w-full rounded-xl object-cover px-3"
            />
          ) : (
            <>
              <Camera
                className="size-9 text-muted-foreground"
                strokeWidth={1.5}
                aria-hidden
              />
              <span className="mt-2 text-sm font-medium text-muted-foreground">
                Tap to add a photo
              </span>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              const imageError = validateImageFile(file);
              if (imageError) {
                toast.info(imageError);
                setFieldErrors((prev) => ({ ...prev, image: true }));
                return;
              }
              setImage(file);
              setFieldErrors((prev) => ({ ...prev, image: false }));
            }}
          />
        </label>

        {image && (
          <p className="mt-2 truncate text-center text-sm text-muted-foreground">
            {image.name}
          </p>
        )}
      </section>

      <section className={CARD}>
        <h2 className="mb-1 text-lg font-bold text-manago-navy">
          Extras
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            Optional
          </span>
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Accessibility and other useful details.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsAccessible((prev) => !prev)}
            className={cn(
              CHIP,
              isAccessible
                ? "border-manago-teal-dark bg-manago-chip"
                : "border-border bg-white hover:border-manago-teal"
            )}
          >
            Wheelchair accessible
          </button>

          {availableFeatures.map((feature) => (
            <button
              key={feature.id}
              type="button"
              onClick={() => toggleFeature(feature.id)}
              className={cn(
                CHIP,
                selectedFeatureIds.includes(feature.id)
                  ? "border-manago-teal-dark bg-manago-chip"
                  : "border-border bg-white hover:border-manago-teal"
              )}
            >
              {feature.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-4 rounded-2xl bg-manago-notice p-4">
        <p className="text-center text-sm font-medium text-manago-notice-text">
          Every submission is reviewed before going live.
        </p>
      </section>

      <div className="mt-6 flex justify-center px-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full max-w-sm rounded-2xl bg-manago-teal-dark px-10 py-4 font-semibold text-white transition-colors hover:bg-manago-teal disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </main>
  );
}
