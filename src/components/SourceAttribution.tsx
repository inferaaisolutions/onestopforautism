import { SourceLink } from "@/lib/schema";

export default function SourceAttribution({ sources }: { sources: SourceLink[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="text-sm text-slate-500">
      <span className="font-medium">Sources: </span>
      {sources.map((s, i) => (
        <span key={s.url}>
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-teal-700">
            {s.label}
          </a>
          {i < sources.length - 1 ? ", " : ""}
        </span>
      ))}
    </div>
  );
}
