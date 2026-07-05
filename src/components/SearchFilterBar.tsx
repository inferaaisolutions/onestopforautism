"use client";

interface Props {
  query: string;
  onQueryChange: (value: string) => void;
  evidenceLevel?: string;
  onEvidenceLevelChange?: (value: string) => void;
}

export default function SearchFilterBar({ query, onQueryChange, evidenceLevel, onEvidenceLevelChange }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search..."
        aria-label="Search"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:w-64"
      />
      {onEvidenceLevelChange && (
        <select
          value={evidenceLevel}
          onChange={(e) => onEvidenceLevelChange(e.target.value)}
          aria-label="Filter by evidence level"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All evidence levels</option>
          <option value="clinical">Clinical / Peer-Reviewed</option>
          <option value="emerging">Emerging Evidence</option>
          <option value="anecdotal">Anecdotal / Community-Sourced</option>
        </select>
      )}
    </div>
  );
}
