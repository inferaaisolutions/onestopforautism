import SubscribeForm from "./SubscribeForm";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            Get updates when new articles are published
          </p>
          <SubscribeForm />
        </div>
        <div className="space-y-2 text-sm text-slate-500">
          <p>
            One Stop for Autism is an independent aggregation platform. Content is sourced
            from public websites, research, and community discussion, and
            remains the property of its original authors or publishers. We do
            not verify, endorse, or take responsibility for the accuracy of
            aggregated content.
          </p>
          <p>
            Nothing on this site is medical advice. Always consult a qualified
            healthcare professional before starting or changing any therapy.
          </p>
        </div>
      </div>
    </footer>
  );
}
