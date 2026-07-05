import { NewsItem } from "@/lib/schema";
import SourceAttribution from "./SourceAttribution";

export default function NewsItemCard({ item }: { item: NewsItem }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-400">
        {new Date(item.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
        {item.region ? ` · ${item.region}` : ""}
      </p>
      <h3 className="mt-1 text-lg font-semibold text-slate-800">{item.title}</h3>
      <p className="mt-2 text-sm text-slate-600">{item.summary}</p>
      <div className="mt-3">
        <SourceAttribution sources={item.sources} />
      </div>
    </article>
  );
}
