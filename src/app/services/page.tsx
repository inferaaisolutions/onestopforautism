"use client";

import { useState } from "react";
import type { ServiceResult } from "@/app/api/services/route";

interface ApiResponse {
  zip: string;
  city: string;
  state: string;
  results: ServiceResult[];
  error?: string;
}

export default function ServicesPage() {
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!zip.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/services?zip=${encodeURIComponent(zip.trim())}`);
      const json: ApiResponse = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
      } else {
        setData(json);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-slate-800">
        Find ASD Services Near You
      </h1>
      <p className="mt-2 text-slate-600">
        Enter your US zip code to find nearby autism clinics, therapists, and healthcare providers.
      </p>

      <form onSubmit={handleSearch} className="mt-6 flex gap-3">
        <input
          type="text"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="Enter zip code"
          aria-label="Zip code"
          maxLength={5}
          className="w-40 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Find Services"}
        </button>
      </form>

      {error && (
        <p className="mt-6 text-sm text-red-600">{error}</p>
      )}

      {data && (
        <section className="mt-8">
          <p className="mb-4 text-sm text-slate-500">
            Showing results near {data.city}, {data.state} ({data.zip})
          </p>
          {data.results.length === 0 ? (
            <p className="text-slate-600">
              No services found within 25 miles. Try a nearby zip code or visit the{" "}
              <a
                href="https://www.autismspeaks.org/resource-guide"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-700 underline"
              >
                Autism Speaks Resource Guide
              </a>
              .
            </p>
          ) : (
            <ul className="space-y-4">
              {data.results.map((service) => (
                <li
                  key={service.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-semibold text-slate-800">{service.name}</h2>
                      <p className="mt-0.5 text-sm text-slate-500">{service.address}</p>
                      <span className="mt-2 inline-block rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                        {service.type}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="text-sm font-medium text-slate-600">
                        {service.distance} mi
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${service.lat},${service.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-teal-600 px-3 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                      >
                        View on Map
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
