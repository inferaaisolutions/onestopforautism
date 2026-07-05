"use client";
import { useMemo, useState } from "react";
import { Therapy, EvidenceLevel } from "@/lib/schema";
import { filterTherapies } from "@/lib/filter";
import SearchFilterBar from "@/components/SearchFilterBar";
import TherapyCard from "@/components/TherapyCard";

export default function TherapiesExplorer({ therapies }: { therapies: Therapy[] }) {
  const [query, setQuery] = useState("");
  const [evidenceLevel, setEvidenceLevel] = useState("");

  const filtered = useMemo(
    () =>
      filterTherapies(
        therapies,
        query,
        evidenceLevel === "" ? undefined : (evidenceLevel as EvidenceLevel)
      ),
    [therapies, query, evidenceLevel]
  );

  return (
    <div className="mt-8">
      <SearchFilterBar
        query={query}
        onQueryChange={setQuery}
        evidenceLevel={evidenceLevel}
        onEvidenceLevelChange={setEvidenceLevel}
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <TherapyCard key={t.slug} therapy={t} />
        ))}
      </div>
      {filtered.length === 0 && <p className="text-slate-500">No therapies match your search.</p>}
    </div>
  );
}
