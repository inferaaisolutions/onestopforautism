import Link from "next/link";

export default function UnsubscribedPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const invalid = searchParams.status === "invalid";

  return (
    <main className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-24 text-center">
      {invalid ? (
        <>
          <h1 className="text-2xl font-bold text-slate-800">Invalid link</h1>
          <p className="text-slate-600">
            This unsubscribe link is invalid or you&apos;ve already been removed.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-slate-800">You&apos;ve been unsubscribed</h1>
          <p className="text-slate-600">
            You won&apos;t receive any more emails from ASD Guide.
          </p>
        </>
      )}
      <Link
        href="/"
        className="rounded bg-teal-700 px-6 py-2 text-sm font-medium text-white hover:bg-teal-600"
      >
        Back to ASD Guide
      </Link>
    </main>
  );
}
