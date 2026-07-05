import { getTherapies } from "@/lib/content";
import TherapiesExplorer from "./TherapiesExplorer";

export default function TherapiesPage() {
  const therapies = getTherapies();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800">Therapies & Interventions</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        A directory of therapies and interventions used around the world,
        aggregated from public sources with links back to the originals.
      </p>
      <TherapiesExplorer therapies={therapies} />
    </main>
  );
}
