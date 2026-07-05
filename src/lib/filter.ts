import { Therapy, Behavior, EvidenceLevel } from "./schema";

export function filterTherapies(
  therapies: Therapy[],
  query: string,
  evidenceLevel?: EvidenceLevel
): Therapy[] {
  const q = query.trim().toLowerCase();
  return therapies.filter((t) => {
    const matchesQuery = q === "" || t.name.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q);
    const matchesEvidence = !evidenceLevel || t.evidenceLevel === evidenceLevel;
    return matchesQuery && matchesEvidence;
  });
}

export function filterBehaviors(behaviors: Behavior[], query: string): Behavior[] {
  const q = query.trim().toLowerCase();
  return behaviors.filter(
    (b) => q === "" || b.name.toLowerCase().includes(q) || b.summary.toLowerCase().includes(q)
  );
}
