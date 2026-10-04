# ASD Guide Newsletter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow visitors to subscribe via email and receive an automatic digest when WebCMan publishes new articles.

**Architecture:** Resend handles both contact storage (Audiences) and email delivery. Next.js API routes manage subscribe/confirm/unsubscribe. WebCMan calls `sendNewsletter()` after each run that produces new articles. No database or login required.

**Tech Stack:** Next.js 14 App Router, Resend SDK (`resend`), HMAC-SHA256 signed tokens via Node.js `crypto`, Vitest + React Testing Library, Tailwind CSS.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/confirm-token.ts` | Create | Sign/verify HMAC confirmation tokens |
| `src/lib/confirm-token.test.ts` | Create | Token utility tests |
| `src/app/api/subscribe/route.ts` | Create | POST: validate email, send confirmation |
| `src/app/api/subscribe/route.test.ts` | Create | Subscribe API tests |
| `src/app/api/subscribe/confirm/route.ts` | Create | GET: verify token, add to Resend Audience |
| `src/app/api/subscribe/confirm/route.test.ts` | Create | Confirm API tests |
| `src/app/api/unsubscribe/route.ts` | Create | GET: remove from Resend Audience |
| `src/app/api/unsubscribe/route.test.ts` | Create | Unsubscribe API tests |
| `src/app/subscribe/confirmed/page.tsx` | Create | "You're subscribed!" page |
| `src/app/unsubscribed/page.tsx` | Create | "You've been unsubscribed" page |
| `src/components/SubscribeForm.tsx` | Create | Email input + submit, client component |
| `src/components/SubscribeForm.test.tsx` | Create | Form interaction tests |
| `src/components/Footer.tsx` | Modify | Add SubscribeForm |
| `webcman/src/newsletter.ts` | Create | Build + send digest email via Resend |
| `webcman/src/newsletter.test.ts` | Create | Newsletter sender tests |
| `webcman/src/run.ts` | Modify | Call sendNewsletter after engine |
| `.github/workflows/webcman.yml` | Modify | Add newsletter env vars |

---

## Task 1: Install Resend SDK and configure env vars

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env.local`

- [ ] **Step 1: Install the Resend SDK**

```bash
npm install resend
```

Expected output: `added 1 package` (or similar)

- [ ] **Step 2: Add env vars to `.env.local`**

Open `.env.local` and add these lines (fill in your actual values):

```
RESEND_API_KEY=re_your_key_here
RESEND_AUDIENCE_ID=your_audience_id_here
RESEND_FROM_EMAIL=updates@yourdomain.com
SUBSCRIBE_SECRET=any-random-string-at-least-32-chars
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

To get `RESEND_AUDIENCE_ID`: go to resend.com → Audiences → Create Audience → copy the ID.

To get `RESEND_FROM_EMAIL` working: go to resend.com → Domains → Add Domain → follow the DNS record instructions for your domain registrar. Takes ~5 minutes.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(newsletter): install resend sdk"
```

---

## Task 2: Confirmation token utility

**Files:**
- Create: `src/lib/confirm-token.ts`
- Create: `src/lib/confirm-token.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/confirm-token.test.ts`:

```typescript
import { vi, describe, it, expect, afterEach } from "vitest";
import { signToken, verifyToken } from "./confirm-token";

describe("confirm-token", () => {
  afterEach(() => vi.restoreAllMocks());

  it("verifies a freshly signed token", () => {
    const token = signToken("test@example.com");
    expect(verifyToken(token)).toBe("test@example.com");
  });

  it("returns null for an expired token", () => {
    const past = Date.now() - 25 * 60 * 60 * 1000; // 25h ago
    vi.spyOn(Date, "now").mockReturnValue(past);
    const token = signToken("test@example.com");
    vi.restoreAllMocks();
    expect(verifyToken(token)).toBeNull();
  });

  it("returns null for a tampered token", () => {
    const token = signToken("test@example.com");
    const tampered = token.slice(0, -4) + "xxxx";
    expect(verifyToken(tampered)).toBeNull();
  });

  it("returns null for a non-base64 string", () => {
    expect(verifyToken("!!!notvalid!!!")).toBeNull();
  });

  it("returns null for a token with missing fields", () => {
    const bad = Buffer.from(JSON.stringify({ email: "x@x.com" })).toString("base64url");
    expect(verifyToken(bad)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/lib/confirm-token.test.ts
```

Expected: FAIL — `Cannot find module './confirm-token'`

- [ ] **Step 3: Implement the token utility**

Create `src/lib/confirm-token.ts`:

```typescript
import { createHmac } from "crypto";

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function secret(): string {
  return process.env.SUBSCRIBE_SECRET ?? "dev-secret-change-in-production";
}

export function signToken(email: string): string {
  const exp = Date.now() + TTL_MS;
  const payload = JSON.stringify({ email, exp });
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return Buffer.from(JSON.stringify({ email, exp, sig })).toString("base64url");
}

export function verifyToken(token: string): string | null {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf-8");
    const { email, exp, sig } = JSON.parse(raw) as {
      email?: unknown;
      exp?: unknown;
      sig?: unknown;
    };
    if (typeof email !== "string" || typeof exp !== "number" || typeof sig !== "string") {
      return null;
    }
    if (Date.now() > exp) return null;
    const payload = JSON.stringify({ email, exp });
    const expected = createHmac("sha256", secret()).update(payload).digest("hex");
    if (sig !== expected) return null;
    return email;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/lib/confirm-token.test.ts
```

Expected: 5 passed

- [ ] **Step 5: Commit**

```bash
git add src/lib/confirm-token.ts src/lib/confirm-token.test.ts
git commit -m "feat(newsletter): add HMAC confirmation token utility"
```

---

## Task 3: Subscribe API route

**Files:**
- Create: `src/app/api/subscribe/route.ts`
- Create: `src/app/api/subscribe/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/subscribe/route.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";

const mockEmailSend = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockEmailSend },
  })),
}));

// Import AFTER mock is set up
const { POST } = await import("./route");

describe("POST /api/subscribe", () => {
  beforeEach(() => {
    mockEmailSend.mockResolvedValue({ data: { id: "msg1" }, error: null });
    process.env.RESEND_FROM_EMAIL = "test@example.com";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    process.env.RESEND_API_KEY = "re_test";
  });

  it("returns 400 for missing email", async () => {
    const req = new Request("http://localhost/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    const req = new Request("http://localhost/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "notanemail" }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 200 and calls Resend for valid email", async () => {
    const req = new Request("http://localhost/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com" }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(mockEmailSend).toHaveBeenCalledOnce();
    const call = mockEmailSend.mock.calls[0][0];
    expect(call.to).toBe("user@example.com");
    expect(call.html).toContain("http://localhost:3000/api/subscribe/confirm?token=");
  });

  it("returns 500 when Resend throws", async () => {
    mockEmailSend.mockRejectedValue(new Error("API error"));
    const req = new Request("http://localhost/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com" }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/app/api/subscribe/route.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement the subscribe route**

Create `src/app/api/subscribe/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { signToken } from "@/lib/confirm-token";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request): Promise<NextResponse> {
  let email: string;
  try {
    const body = (await req.json()) as { email?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const token = signToken(email);
  const confirmUrl = `${siteUrl}/api/subscribe/confirm?token=${token}`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@example.com",
      to: email,
      subject: "Confirm your ASD Guide subscription",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#0d9488;">Confirm your subscription</h2>
          <p>Click below to start receiving ASD Guide updates.</p>
          <p>
            <a href="${confirmUrl}"
               style="display:inline-block;background:#0d9488;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
              Confirm subscription
            </a>
          </p>
          <p style="color:#94a3b8;font-size:12px;">
            This link expires in 24 hours. If you didn't request this, ignore this email.
          </p>
        </div>
      `,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to send confirmation email. Please try again." }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/app/api/subscribe/route.test.ts
```

Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add src/app/api/subscribe/route.ts src/app/api/subscribe/route.test.ts
git commit -m "feat(newsletter): subscribe API route"
```

---

## Task 4: Confirm subscription API route

**Files:**
- Create: `src/app/api/subscribe/confirm/route.ts`
- Create: `src/app/api/subscribe/confirm/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/subscribe/confirm/route.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";
import { signToken } from "@/lib/confirm-token";

const mockContactCreate = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    contacts: { create: mockContactCreate },
  })),
}));

const { GET } = await import("./route");

describe("GET /api/subscribe/confirm", () => {
  beforeEach(() => {
    mockContactCreate.mockResolvedValue({ data: { id: "c1" }, error: null });
    process.env.RESEND_API_KEY = "re_test";
    process.env.RESEND_AUDIENCE_ID = "aud_test";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
  });

  it("redirects to confirmed page on valid token", async () => {
    const token = signToken("user@example.com");
    const req = new Request(`http://localhost/api/subscribe/confirm?token=${token}`);
    const res = await GET(req as never);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/subscribe/confirmed?status=ok");
    expect(mockContactCreate).toHaveBeenCalledWith({
      audienceId: "aud_test",
      email: "user@example.com",
      unsubscribed: false,
    });
  });

  it("redirects to expired page on missing token", async () => {
    const req = new Request("http://localhost/api/subscribe/confirm");
    const res = await GET(req as never);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("status=expired");
  });

  it("redirects to expired page on invalid token", async () => {
    const req = new Request("http://localhost/api/subscribe/confirm?token=badtoken");
    const res = await GET(req as never);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("status=expired");
  });

  it("still redirects ok if Resend contact already exists", async () => {
    mockContactCreate.mockRejectedValue(new Error("already exists"));
    const token = signToken("user@example.com");
    const req = new Request(`http://localhost/api/subscribe/confirm?token=${token}`);
    const res = await GET(req as never);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/subscribe/confirmed?status=ok");
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/app/api/subscribe/confirm/route.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement the confirm route**

Create `src/app/api/subscribe/confirm/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { verifyToken } from "@/lib/confirm-token";

export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const email = verifyToken(token);
  if (!email) {
    return NextResponse.redirect(`${siteUrl}/subscribe/confirmed?status=expired`);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const audienceId = process.env.RESEND_AUDIENCE_ID ?? "";

  try {
    await resend.contacts.create({ audienceId, email, unsubscribed: false });
  } catch {
    // Contact may already exist — treat as success
  }

  return NextResponse.redirect(`${siteUrl}/subscribe/confirmed?status=ok`);
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/app/api/subscribe/confirm/route.test.ts
```

Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add src/app/api/subscribe/confirm/route.ts src/app/api/subscribe/confirm/route.test.ts
git commit -m "feat(newsletter): confirm subscription API route"
```

---

## Task 5: Unsubscribe API route

**Files:**
- Create: `src/app/api/unsubscribe/route.ts`
- Create: `src/app/api/unsubscribe/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/unsubscribe/route.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";

const mockContactRemove = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    contacts: { remove: mockContactRemove },
  })),
}));

const { GET } = await import("./route");

describe("GET /api/unsubscribe", () => {
  beforeEach(() => {
    mockContactRemove.mockResolvedValue({ data: {}, error: null });
    process.env.RESEND_API_KEY = "re_test";
    process.env.RESEND_AUDIENCE_ID = "aud_test";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
  });

  it("removes contact and redirects to unsubscribed page", async () => {
    const req = new Request("http://localhost/api/unsubscribe?id=contact-123");
    const res = await GET(req as never);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/unsubscribed?status=ok");
    expect(mockContactRemove).toHaveBeenCalledWith({
      audienceId: "aud_test",
      id: "contact-123",
    });
  });

  it("redirects to invalid page when id is missing", async () => {
    const req = new Request("http://localhost/api/unsubscribe");
    const res = await GET(req as never);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("status=invalid");
    expect(mockContactRemove).not.toHaveBeenCalled();
  });

  it("still redirects ok if Resend contact already removed", async () => {
    mockContactRemove.mockRejectedValue(new Error("not found"));
    const req = new Request("http://localhost/api/unsubscribe?id=contact-123");
    const res = await GET(req as never);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/unsubscribed?status=ok");
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/app/api/unsubscribe/route.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement the unsubscribe route**

Create `src/app/api/unsubscribe/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const contactId = url.searchParams.get("id") ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (!contactId) {
    return NextResponse.redirect(`${siteUrl}/unsubscribed?status=invalid`);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const audienceId = process.env.RESEND_AUDIENCE_ID ?? "";

  try {
    await resend.contacts.remove({ audienceId, id: contactId });
  } catch {
    // Already removed — treat as success
  }

  return NextResponse.redirect(`${siteUrl}/unsubscribed?status=ok`);
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/app/api/unsubscribe/route.test.ts
```

Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add src/app/api/unsubscribe/route.ts src/app/api/unsubscribe/route.test.ts
git commit -m "feat(newsletter): unsubscribe API route"
```

---

## Task 6: Confirmed and Unsubscribed pages

**Files:**
- Create: `src/app/subscribe/confirmed/page.tsx`
- Create: `src/app/unsubscribed/page.tsx`

No tests needed — these are static pages with no logic.

- [ ] **Step 1: Create the confirmed page**

Create `src/app/subscribe/confirmed/page.tsx`:

```typescript
import Link from "next/link";

export default function SubscribeConfirmedPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const expired = searchParams.status === "expired";

  return (
    <main className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-24 text-center">
      {expired ? (
        <>
          <h1 className="text-2xl font-bold text-slate-800">Link expired</h1>
          <p className="text-slate-600">
            This confirmation link has expired. Please subscribe again to get a fresh link.
          </p>
        </>
      ) : (
        <>
          <div className="text-5xl">✓</div>
          <h1 className="text-2xl font-bold text-slate-800">You&apos;re subscribed!</h1>
          <p className="text-slate-600">
            You&apos;ll receive an email when new articles are published on ASD Guide.
          </p>
        </>
      )}
      <Link
        href="/"
        className="rounded bg-teal-700 px-6 py-2 text-sm font-medium text-white hover:bg-teal-600"
      >
        Back to ASD Guide
      </Link>
    </main>
  );
}
```

- [ ] **Step 2: Create the unsubscribed page**

Create `src/app/unsubscribed/page.tsx`:

```typescript
import Link from "next/link";

export default function UnsubscribedPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const invalid = searchParams.status === "invalid";

  return (
    <main className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-24 text-center">
      {invalid ? (
        <>
          <h1 className="text-2xl font-bold text-slate-800">Invalid link</h1>
          <p className="text-slate-600">
            This unsubscribe link is invalid or you&apos;ve already been removed.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-slate-800">You&apos;ve been unsubscribed</h1>
          <p className="text-slate-600">
            You won&apos;t receive any more emails from ASD Guide.
          </p>
        </>
      )}
      <Link
        href="/"
        className="rounded bg-teal-700 px-6 py-2 text-sm font-medium text-white hover:bg-teal-600"
      >
        Back to ASD Guide
      </Link>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/subscribe/confirmed/page.tsx src/app/unsubscribed/page.tsx
git commit -m "feat(newsletter): add confirmed and unsubscribed pages"
```

---

## Task 7: SubscribeForm component

**Files:**
- Create: `src/components/SubscribeForm.tsx`
- Create: `src/components/SubscribeForm.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/SubscribeForm.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import SubscribeForm from "./SubscribeForm";

describe("SubscribeForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders email input and subscribe button", () => {
    render(<SubscribeForm />);
    expect(screen.getByPlaceholderText("your@email.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /subscribe/i })).toBeInTheDocument();
  });

  it("shows success message after successful submit", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 200 }));
    render(<SubscribeForm />);
    fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /subscribe/i }));
    await waitFor(() => {
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
    });
  });

  it("shows error message on failed submit", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 500 }));
    render(<SubscribeForm />);
    fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /subscribe/i }));
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it("disables input and button while loading", async () => {
    vi.mocked(fetch).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(new Response("{}", { status: 200 })), 100))
    );
    render(<SubscribeForm />);
    fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /subscribe/i }));
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByPlaceholderText("your@email.com")).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/components/SubscribeForm.test.tsx
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement the SubscribeForm component**

Create `src/components/SubscribeForm.tsx`:

```typescript
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/components/SubscribeForm.test.tsx
```

Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add src/components/SubscribeForm.tsx src/components/SubscribeForm.test.tsx
git commit -m "feat(newsletter): SubscribeForm component"
```

---

## Task 8: Add SubscribeForm to Footer

**Files:**
- Modify: `src/components/Footer.tsx`

No new tests — the Footer is a server component wrapping the client SubscribeForm. The SubscribeForm itself is already tested.

- [ ] **Step 1: Update Footer to include the subscribe form**

Open `src/components/Footer.tsx`. Replace the entire file with:

```typescript
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
            ASD Guide is an independent aggregation platform. Content is sourced
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
```

- [ ] **Step 2: Verify the site still builds**

```bash
npm run build
```

Expected: Build completes with no errors. (You may see a warning about `searchParams` needing to be awaited in Next.js 15 — ignore it for now, the pages still work.)

- [ ] **Step 3: Run the full test suite**

```bash
npm test
```

Expected: All existing tests pass, plus the new ones from Tasks 2–7.

- [ ] **Step 4: Commit**

```bash
git add src/components/Footer.tsx
git commit -m "feat(newsletter): add subscribe form to footer"
```

---

## Task 9: Newsletter sender

**Files:**
- Create: `webcman/src/newsletter.ts`
- Create: `webcman/src/newsletter.test.ts`

- [ ] **Step 1: Write the failing test**

Create `webcman/src/newsletter.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";
import { vol } from "memfs";

vi.mock("fs", () => require("memfs").fs);

const mockBatchSend = vi.fn();
const mockContactsList = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    batch: { send: mockBatchSend },
    contacts: { list: mockContactsList },
  })),
}));

const { sendNewsletter } = await import("./newsletter");

const CONTENT_DIR = "/content";

function seedContent() {
  vol.reset();
  vol.fromJSON({
    "/content/news/article-one.json": JSON.stringify({
      slug: "article-one",
      title: "New ASD Research",
      summary: "A summary of new research.",
      date: "2026-10-04",
      sources: [{ label: "Source", url: "https://example.com/1" }],
    }),
  });
}

describe("sendNewsletter", () => {
  beforeEach(() => {
    seedContent();
    mockBatchSend.mockResolvedValue({ data: {}, error: null });
    mockContactsList.mockResolvedValue({
      data: {
        data: [
          { id: "c1", email: "alice@example.com", unsubscribed: false },
          { id: "c2", email: "bob@example.com", unsubscribed: true },
        ],
      },
    });
  });

  it("sends emails only to non-unsubscribed contacts", async () => {
    await sendNewsletter(
      ["news/article-one.json"],
      CONTENT_DIR,
      "re_test",
      "aud_test",
      "updates@example.com",
      "https://asd-guide.com"
    );
    expect(mockBatchSend).toHaveBeenCalledOnce();
    const emails = mockBatchSend.mock.calls[0][0] as Array<{ to: string }>;
    expect(emails).toHaveLength(1);
    expect(emails[0].to).toBe("alice@example.com");
  });

  it("includes article title and link in email", async () => {
    await sendNewsletter(
      ["news/article-one.json"],
      CONTENT_DIR,
      "re_test",
      "aud_test",
      "updates@example.com",
      "https://asd-guide.com"
    );
    const emails = mockBatchSend.mock.calls[0][0] as Array<{ html: string }>;
    expect(emails[0].html).toContain("New ASD Research");
    expect(emails[0].html).toContain("https://asd-guide.com/news/article-one");
  });

  it("includes personalised unsubscribe link per contact", async () => {
    await sendNewsletter(
      ["news/article-one.json"],
      CONTENT_DIR,
      "re_test",
      "aud_test",
      "updates@example.com",
      "https://asd-guide.com"
    );
    const emails = mockBatchSend.mock.calls[0][0] as Array<{ html: string }>;
    expect(emails[0].html).toContain("/api/unsubscribe?id=c1");
  });

  it("does not call batch.send when no contacts", async () => {
    mockContactsList.mockResolvedValue({ data: { data: [] } });
    await sendNewsletter(
      ["news/article-one.json"],
      CONTENT_DIR,
      "re_test",
      "aud_test",
      "updates@example.com",
      "https://asd-guide.com"
    );
    expect(mockBatchSend).not.toHaveBeenCalled();
  });

  it("does not call batch.send when no valid content files", async () => {
    vol.reset();
    await sendNewsletter(
      ["news/nonexistent.json"],
      CONTENT_DIR,
      "re_test",
      "aud_test",
      "updates@example.com",
      "https://asd-guide.com"
    );
    expect(mockBatchSend).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run webcman/src/newsletter.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement the newsletter sender**

Create `webcman/src/newsletter.ts`:

```typescript
import fs from "fs";
import path from "path";
import { Resend } from "resend";

interface ContentItem {
  slug: string;
  title: string;
  summary: string;
}

interface Contact {
  id: string;
  email: string;
  unsubscribed: boolean;
}

function readContentItem(filePath: string): ContentItem | null {
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, unknown>;
    const { slug, title, summary } = raw;
    if (typeof slug === "string" && typeof title === "string" && typeof summary === "string") {
      return { slug, title, summary };
    }
    return null;
  } catch {
    return null;
  }
}

function buildEmail(items: ContentItem[], siteUrl: string, contactId: string): string {
  const rows = items
    .map(
      (item) => `
    <div style="margin-bottom:20px;">
      <a href="${siteUrl}/news/${item.slug}"
         style="font-size:16px;font-weight:600;color:#0d9488;text-decoration:none;">
        ${item.title}
      </a>
      <p style="margin:4px 0 0;color:#475569;font-size:14px;">${item.summary}</p>
    </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1e293b;">
  <h1 style="color:#0d9488;font-size:20px;margin-bottom:20px;">
    ASD Guide — ${items.length} new article${items.length === 1 ? "" : "s"}
  </h1>
  ${rows}
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
  <p style="font-size:12px;color:#94a3b8;">
    You&apos;re receiving this because you subscribed at
    <a href="${siteUrl}" style="color:#94a3b8;">${siteUrl.replace(/https?:\/\//, "")}</a>.
    &nbsp;|&nbsp;
    <a href="${siteUrl}/api/unsubscribe?id=${contactId}" style="color:#94a3b8;">Unsubscribe</a>
  </p>
</body>
</html>`;
}

export async function sendNewsletter(
  addedFiles: string[],
  contentDir: string,
  resendApiKey: string,
  audienceId: string,
  fromEmail: string,
  siteUrl: string
): Promise<void> {
  const items: ContentItem[] = [];
  for (const relPath of addedFiles) {
    const item = readContentItem(path.join(contentDir, relPath));
    if (item) items.push(item);
  }
  if (items.length === 0) return;

  const resend = new Resend(resendApiKey);

  const { data: listData } = await resend.contacts.list({ audienceId });
  const contacts = ((listData as { data?: Contact[] })?.data ?? []).filter(
    (c: Contact) => !c.unsubscribed
  );
  if (contacts.length === 0) return;

  const subject = `ASD Guide — ${items.length} new article${items.length === 1 ? "" : "s"}`;

  await resend.batch.send(
    contacts.map((contact: Contact) => ({
      from: fromEmail,
      to: contact.email,
      subject,
      html: buildEmail(items, siteUrl, contact.id),
    }))
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run webcman/src/newsletter.test.ts
```

Expected: 5 passed

- [ ] **Step 5: Commit**

```bash
git add webcman/src/newsletter.ts webcman/src/newsletter.test.ts
git commit -m "feat(newsletter): newsletter sender with Resend batch API"
```

---

## Task 10: Wire into WebCMan run.ts and GitHub Actions

**Files:**
- Modify: `webcman/src/run.ts`
- Modify: `.github/workflows/webcman.yml`

- [ ] **Step 1: Add newsletter call to run.ts**

Open `webcman/src/run.ts`. Add the import at the top, after the existing imports:

```typescript
import { sendNewsletter } from "./newsletter";
```

Find this block (around line 64):

```typescript
console.log(`[WebCMan] Done. +${stats.added.length} added, ~${stats.updated.length} updated, ${stats.flagged.length} flagged, ${stats.blocked.length} blocked, ${stats.failed.length} failed.`);
```

Replace it with:

```typescript
console.log(`[WebCMan] Done. +${stats.added.length} added, ~${stats.updated.length} updated, ${stats.flagged.length} flagged, ${stats.blocked.length} blocked, ${stats.failed.length} failed.`);

  // Send newsletter if new articles were added
  const resendKey = process.env.RESEND_API_KEY ?? "";
  const audienceId = process.env.RESEND_AUDIENCE_ID ?? "";
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  if (stats.added.length > 0 && resendKey && audienceId && fromEmail && siteUrl) {
    console.log("[WebCMan] Sending newsletter...");
    try {
      await sendNewsletter(stats.added, config.contentDir, resendKey, audienceId, fromEmail, siteUrl);
      console.log(`[WebCMan] Newsletter sent to subscribers.`);
    } catch (err) {
      console.error("[WebCMan] Newsletter send failed:", String(err));
    }
  }
```

- [ ] **Step 2: Run the full test suite to confirm nothing broke**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 3: Add newsletter env vars to GitHub Actions workflow**

Open `.github/workflows/webcman.yml`. Find the `Run WebCMan` step:

```yaml
      - name: Run WebCMan
        env:
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
          CI: true
        run: npm run webcman
```

Replace it with:

```yaml
      - name: Run WebCMan
        env:
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          RESEND_AUDIENCE_ID: ${{ secrets.RESEND_AUDIENCE_ID }}
          RESEND_FROM_EMAIL: ${{ secrets.RESEND_FROM_EMAIL }}
          NEXT_PUBLIC_SITE_URL: ${{ secrets.NEXT_PUBLIC_SITE_URL }}
          CI: true
        run: npm run webcman
```

- [ ] **Step 4: Add the new secrets to your GitHub repo**

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret** and add:

- `RESEND_API_KEY` — your Resend API key
- `RESEND_AUDIENCE_ID` — your Resend Audience ID
- `RESEND_FROM_EMAIL` — e.g. `updates@yourdomain.com`
- `NEXT_PUBLIC_SITE_URL` — your deployed site URL (e.g. `https://asd-guide.com`)

- [ ] **Step 5: Commit**

```bash
git add webcman/src/run.ts .github/workflows/webcman.yml
git commit -m "feat(newsletter): wire newsletter send into webcman run + github actions"
```

---

## Final verification

- [ ] Run the full test suite one last time:

```bash
npm test
```

Expected: All tests pass (existing + all new newsletter tests).

- [ ] Start the dev server and confirm the subscribe form appears in the footer:

```bash
npm run dev
```

Open `http://localhost:3000` — the footer should show an email input and Subscribe button.

- [ ] Test the subscribe flow end to end:
  1. Enter your own email in the footer form and click Subscribe
  2. Check your inbox for the confirmation email
  3. Click the confirmation link — should redirect to the "You're subscribed!" page
  4. Go to resend.com → Audiences — your email should appear as a contact

- [ ] Test the unsubscribe flow:
  1. Manually construct `http://localhost:3000/api/unsubscribe?id=<your-contact-id>` (contact ID from Resend dashboard)
  2. Should redirect to the "You've been unsubscribed" page
  3. Contact should be removed from Resend Audience
