"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "onestopforautism-disclaimer-dismissed";

export default function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  if (dismissed) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-4 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900"
    >
      <span>
        This site aggregates publicly available information for general
        awareness only. It is not medical advice — always consult a
        qualified professional.
      </span>
      <button
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, "true");
          setDismissed(true);
        }}
        className="shrink-0 font-semibold underline"
        aria-label="Dismiss disclaimer"
      >
        Dismiss
      </button>
    </div>
  );
}
