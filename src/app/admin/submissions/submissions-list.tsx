"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export type Submission = {
  id: number;
  name: string;
  amenity_type_id: number;
  address: string;
  building_name: string | null;
  floor: string | null;
  description: string | null;
  photo_url: string | null;
  latitude: number;
  longitude: number;
  open_time: string | null;
  close_time: string | null;
  is_24_hours: boolean;
  is_accessible: boolean;
  feature_ids: number[];
  status: string;
};

type SubmissionsListProps = {
  initialSubmissions: Submission[];
};

export default function SubmissionsList({
  initialSubmissions,
}: SubmissionsListProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions);

  async function approveSubmission(submission: Submission) {
    const { error: insertError } = await supabase.from("facilities").insert({
      name: submission.name,
      amenity_type_id: submission.amenity_type_id,
      latitude: submission.latitude,
      longitude: submission.longitude,
      address: submission.address,
      building_name: submission.building_name,
      floor: submission.floor,
      description: submission.description,
      photo_url: submission.photo_url,
      is_accessible: submission.is_accessible,
      is_verified: true,
      status: "active",
    });

    if (insertError) {
      console.error(insertError);
      alert(insertError.message);
      return;
    }

    const { error: updateError } = await supabase
      .from("facility_submissions")
      .update({ status: "approved" })
      .eq("id", submission.id);

    if (updateError) {
      console.error(updateError);
      alert(updateError.message);
      return;
    }

    setSubmissions((prev) => prev.filter((item) => item.id !== submission.id));
  }

  async function rejectSubmission(id: number) {
    const { error } = await supabase
      .from("facility_submissions")
      .update({ status: "rejected" })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setSubmissions((prev) => prev.filter((item) => item.id !== id));
  }

  if (submissions.length === 0) {
    return (
      <p className="text-muted-foreground">No pending submissions right now.</p>
    );
  }

  return (
    <>
      {submissions.map((submission) => (
        <div key={submission.id} className="mb-6 rounded-xl border p-5">
          <h2 className="text-xl font-semibold">{submission.name}</h2>

          <p>{submission.address}</p>

          {submission.building_name && (
            <p>Building: {submission.building_name}</p>
          )}

          {submission.floor && <p>Floor: {submission.floor}</p>}

          {submission.description && <p>{submission.description}</p>}

          {submission.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element -- matches facility cards elsewhere
            <img
              src={submission.photo_url}
              className="mt-4 h-56 w-full rounded-lg object-cover"
              alt={submission.name}
            />
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => approveSubmission(submission)}
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              Approve
            </button>

            <button
              onClick={() => rejectSubmission(submission.id)}
              className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
