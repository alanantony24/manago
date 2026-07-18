"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Submission = {
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

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    loadSubmissions();
  }, []);


  async function approveSubmission(submission: Submission) {
  // 1. Insert into facilities
  const { error: insertError } = await supabase
    .from("facilities")
    .insert({
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

  // 2. Mark submission as approved
  const { error: updateError } = await supabase
    .from("facility_submissions")
    .update({ status: "approved" })
    .eq("id", submission.id);

  if (updateError) {
    console.error(updateError);
    alert(updateError.message);
    return;
  }

  // 3. Remove it from the list
  setSubmissions((prev) =>
    prev.filter((item) => item.id !== submission.id)
  );
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

  setSubmissions((prev) =>
    prev.filter((item) => item.id !== id)
  );
}
  async function loadSubmissions() {
    const { data, error } = await supabase
      .from("facility_submissions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setSubmissions(data ?? []);
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold">
        Pending Facility Submissions
      </h1>

      {submissions.map((submission) => (
        <div
          key={submission.id}
          className="mb-6 rounded-xl border p-5"
        >
          <h2 className="text-xl font-semibold">
            {submission.name}
          </h2>

          <p>{submission.address}</p>

          {submission.building_name && (
            <p>Building: {submission.building_name}</p>
          )}

          {submission.floor && (
            <p>Floor: {submission.floor}</p>
          )}

          {submission.description && (
            <p>{submission.description}</p>
          )}

          {submission.photo_url && (
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
    </main>
  );
}