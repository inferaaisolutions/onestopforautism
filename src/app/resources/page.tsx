import { getResources } from "@/lib/content";

export default function ResourcesPage() {
  const resources = getResources();
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800">Resources</h1>
      <p className="mt-2 text-slate-600">
        Evergreen guides and reference material to help you navigate autism therapies.
      </p>
      <div className="mt-8 space-y-8">
        {resources.map((r) => (
          <article key={r.slug} id={r.slug}>
            <p className="text-xs uppercase tracking-wide text-slate-400">{r.category}</p>
            <h2 className="text-xl font-semibold text-slate-800">{r.title}</h2>
            <p className="mt-2 whitespace-pre-line text-slate-700">{r.body}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
