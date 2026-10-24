import Link from "next/link";
import { getTherapies, getNews } from "@/lib/content";
import TherapyCard from "@/components/TherapyCard";
import NewsItemCard from "@/components/NewsItemCard";

export default function HomePage() {
  const featuredTherapies = getTherapies().slice(0, 3);
  const latestNews = getNews().slice(0, 2);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <section className="text-center">
        <h1 className="text-4xl font-extrabold text-slate-800 sm:text-5xl">
          One place to explore autism therapies from around the world
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          One Stop for Autism gathers therapies, behavior insights, and the latest
          research into one searchable resource for parents and therapists —
          always linked back to where it came from.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link href="/therapies" className="rounded-lg bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-700">
            Browse Therapies
          </Link>
          <Link href="/behaviors" className="rounded-lg border border-teal-600 px-5 py-2.5 font-semibold text-teal-700 hover:bg-teal-50">
            Behaviors & Triggers
          </Link>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Featured Therapies</h2>
          <Link href="/therapies" className="text-sm font-medium text-teal-700 hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {featuredTherapies.map((t) => (
            <TherapyCard key={t.slug} therapy={t} />
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Latest News</h2>
          <Link href="/news" className="text-sm font-medium text-teal-700 hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-6 space-y-6">
          {latestNews.map((n) => (
            <NewsItemCard key={n.slug} item={n} />
          ))}
        </div>
      </section>
    </main>
  );
}
