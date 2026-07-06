import { getBehaviors } from "@/lib/content";
import BehaviorsExplorer from "./BehaviorsExplorer";

export default function BehaviorsPage() {
  const behaviors = getBehaviors();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800">Behaviors & Triggers</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        Common behaviors, their possible triggers, and home remedies/coping
        strategies reported by parents and professionals. This information is
        sourced from multiple channels and is not a substitute for
        professional guidance.
      </p>
      <BehaviorsExplorer behaviors={behaviors} />
    </main>
  );
}
