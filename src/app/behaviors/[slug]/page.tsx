import { notFound } from "next/navigation";
import { getBehaviors, getBehaviorBySlug } from "@/lib/content";
import EvidenceTag from "@/components/EvidenceTag";
import SourceAttribution from "@/components/SourceAttribution";

export function generateStaticParams() {
  return getBehaviors().map((b) => ({ slug: b.slug }));
}

export default function BehaviorDetailPage({ params }: { params: { slug: string } }) {
  const behavior = getBehaviorBySlug(params.slug);
  if (!behavior) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800">{behavior.name}</h1>
      <p className="mt-2 text-slate-600">{behavior.summary}</p>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-slate-800">Possible Triggers</h2>
        <ul className="mt-2 list-disc pl-5 text-slate-700">
          {behavior.triggers.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-slate-800">Home Remedies & Coping Strategies</h2>
        <ul className="mt-3 space-y-3">
          {behavior.remedies.map((r) => (
            <li key={r.text} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3">
              <span className="text-slate-700">{r.text}</span>
              <EvidenceTag level={r.evidenceLevel} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 border-t border-slate-200 pt-4">
        <SourceAttribution sources={behavior.sources} />
      </section>
    </main>
  );
}
