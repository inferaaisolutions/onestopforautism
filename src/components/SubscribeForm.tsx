"use client";
import { useState } from "react";

type Status = "idle" | "loading" | "sent" | "error";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="text-sm text-teal-600">
        Check your inbox to confirm your subscription.
      </p>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={status === "loading"}
          className="flex-1 rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
        >
          {status === "loading" ? "..." : "Subscribe"}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-1 text-xs text-red-600">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}
