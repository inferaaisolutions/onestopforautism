"use client";
import { useMemo, useState } from "react";
import { Behavior } from "@/lib/schema";
import { filterBehaviors } from "@/lib/filter";
import SearchFilterBar from "@/components/SearchFilterBar";
import BehaviorCard from "@/components/BehaviorCard";

export default function BehaviorsExplorer({ behaviors }: { behaviors: Behavior[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => filterBehaviors(behaviors, query), [behaviors, query]);

  return (
    <div className="mt-8">
      <SearchFilterBar query={query} onQueryChange={setQuery} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((b) => (
          <BehaviorCard key={b.slug} behavior={b} />
        ))}
      </div>
      {filtered.length === 0 && <p className="text-slate-500">No behaviors match your search.</p>}
    </div>
  );
}
