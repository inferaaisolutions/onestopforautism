import { getNews } from "@/lib/content";
import NewsItemCard from "@/components/NewsItemCard";

export default function NewsPage() {
  const news = getNews();
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800">Latest News</h1>
      <p className="mt-2 text-slate-600">
        Recent developments in autism therapies and research from around the world.
      </p>
      <div className="mt-8 space-y-6">
        {news.map((item) => (
          <NewsItemCard key={item.slug} item={item} />
        ))}
      </div>
    </main>
  );
}
