export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 text-slate-700">
      <h1 className="text-3xl font-bold text-slate-800">About One Stop for Autism</h1>
      <p>
        One Stop for Autism is an independent, informational platform built to help
        parents and therapists discover the wide range of therapies and
        approaches used for autism spectrum disorder around the world — from
        long-established interventions like speech and occupational therapy
        to emerging and controversial approaches like stem cell therapy or
        MERT. It also collects common behaviors, their possible triggers, and
        home remedies or coping strategies reported by parents and
        professionals.
      </p>
      <div>
        <h2 className="text-xl font-semibold text-slate-800">What this site is</h2>
        <p className="mt-2">
          A single place to see what's out there — organized, searchable,
          and always linked back to where the information originally came
          from, so you can dig deeper or verify it yourself.
        </p>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-slate-800">What this site is not</h2>
        <p className="mt-2">
          This site is not a medical provider and does not offer medical
          advice, diagnosis, or treatment. Content is aggregated from public
          sources — websites, published research, and online community
          discussion — and remains the property of its original authors or
          publishers. Inclusion of a therapy or remedy here is not an
          endorsement of its safety or effectiveness. Some content
          (particularly behaviors and home remedies) is anecdotal, sourced
          from parent/community discussion, and has not been clinically
          studied.
        </p>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Disclaimer</h2>
        <p className="mt-2">
          We do not own, verify, or take responsibility for the accuracy of
          aggregated content. Always consult a qualified healthcare
          professional before starting, stopping, or changing any therapy —
          especially biomedical or experimental approaches.
        </p>
      </div>
    </main>
  );
}
