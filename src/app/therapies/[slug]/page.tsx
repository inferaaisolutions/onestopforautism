import { notFound } from "next/navigation";
import Image from "next/image";
import { getTherapies, getTherapyBySlug } from "@/lib/content";
import EvidenceTag from "@/components/EvidenceTag";
import SourceAttribution from "@/components/SourceAttribution";

export function generateStaticParams() {
  return getTherapies().map((t) => ({ slug: t.slug }));
}

export default function TherapyDetailPage({ params }: { params: { slug: string } }) {
  const therapy = getTherapyBySlug(params.slug);
  if (!therapy) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="relative mb-6 h-64 w-full overflow-hidden rounded-xl bg-slate-100">
        <Image src={`/images/${therapy.image}`} alt={therapy.name} fill className="object-cover" />
      </div>
      <div className="mb-2 flex items-center gap-3">
        <h1 className="text-3xl font-bold text-slate-800">{therapy.name}</h1>
        <EvidenceTag level={therapy.evidenceLevel} />
      </div>
      <p className="text-slate-600">{therapy.summary}</p>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-slate-800">Overview</h2>
        <p className="mt-2 whitespace-pre-line text-slate-700">{therapy.description}</p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-slate-800">Claimed Benefits</h2>
        <ul className="mt-2 list-disc pl-5 text-slate-700">
          {therapy.claimedBenefits.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-slate-800">Evidence Notes</h2>
        <p className="mt-2 text-slate-700">{therapy.evidenceNotes}</p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-slate-800">Where It's Offered</h2>
        <p className="mt-2 text-slate-700">{therapy.regions.join(", ")}</p>
      </section>

      <section className="mt-8 border-t border-slate-200 pt-4">
        <SourceAttribution sources={therapy.sources} />
      </section>
    </main>
  );
}
