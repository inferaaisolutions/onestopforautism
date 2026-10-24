import Link from "next/link";

export default function SubscribeConfirmedPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const expired = searchParams.status === "expired";

  return (
    <main className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-24 text-center">
      {expired ? (
        <>
          <h1 className="text-2xl font-bold text-slate-800">Link expired</h1>
          <p className="text-slate-600">
            This confirmation link has expired. Please subscribe again to get a fresh link.
          </p>
        </>
      ) : (
        <>
          <div className="text-5xl">✓</div>
          <h1 className="text-2xl font-bold text-slate-800">You&apos;re subscribed!</h1>
          <p className="text-slate-600">
            You&apos;ll receive an email when new articles are published on One Stop for Autism.
          </p>
        </>
      )}
      <Link
        href="/"
        className="rounded bg-teal-700 px-6 py-2 text-sm font-medium text-white hover:bg-teal-600"
      >
        Back to One Stop for Autism
      </Link>
    </main>
  );
}
