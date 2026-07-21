import Link from "next/link"

export default function AddLayout() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-manago-navy">
          Submissions are temporarily unavailable
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          We are finishing account security before reopening facility
          submissions.
        </p>
        <Link
          href="/nearby"
          className="mt-6 inline-flex rounded-xl bg-manago-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-manago-teal-dark"
        >
          Browse nearby facilities
        </Link>
      </section>
    </main>
  )
}
