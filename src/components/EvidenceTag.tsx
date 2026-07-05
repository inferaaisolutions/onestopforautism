import { EvidenceLevel } from "@/lib/schema";

const STYLES: Record<EvidenceLevel, string> = {
  clinical: "bg-emerald-100 text-emerald-800",
  emerging: "bg-sky-100 text-sky-800",
  anecdotal: "bg-amber-100 text-amber-800",
};

const LABELS: Record<EvidenceLevel, string> = {
  clinical: "Clinical / Peer-Reviewed",
  emerging: "Emerging Evidence",
  anecdotal: "Anecdotal / Community-Sourced",
};

export default function EvidenceTag({ level }: { level: EvidenceLevel }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STYLES[level]}`}>
      {LABELS[level]}
    </span>
  );
}
