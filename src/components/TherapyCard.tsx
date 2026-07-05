import Link from "next/link";
import Image from "next/image";
import { Therapy } from "@/lib/schema";
import EvidenceTag from "./EvidenceTag";

export default function TherapyCard({ therapy }: { therapy: Therapy }) {
  return (
    <Link
      href={`/therapies/${therapy.slug}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative mb-3 h-36 w-full overflow-hidden rounded-lg bg-slate-100">
        <Image src={`/images/${therapy.image}`} alt={therapy.name} fill className="object-cover" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800">{therapy.name}</h3>
      <p className="mt-1 text-sm text-slate-600">{therapy.summary}</p>
      <div className="mt-3">
        <EvidenceTag level={therapy.evidenceLevel} />
      </div>
    </Link>
  );
}
