import Link from "next/link";
import { Behavior } from "@/lib/schema";

export default function BehaviorCard({ behavior }: { behavior: Behavior }) {
  return (
    <Link
      href={`/behaviors/${behavior.slug}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <h3 className="text-lg font-semibold text-slate-800">{behavior.name}</h3>
      <p className="mt-1 text-sm text-slate-600">{behavior.summary}</p>
      <p className="mt-3 text-xs text-slate-400">{behavior.triggers.length} known triggers</p>
    </Link>
  );
}
