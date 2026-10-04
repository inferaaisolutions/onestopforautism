# ASD Guide Newsletter — Design

**Date:** 2026-10-04
**Status:** Approved for implementation

---

## Goal

Allow visitors to subscribe to email updates. When WebCMan adds new articles, all confirmed subscribers automatically receive a digest email listing the new content with links. No login, no gated content — subscribe and unsubscribe only.

---

## Architecture

Three components working together:

1. **Subscribe/Unsubscribe API** — Next.js App Router API routes handle email validation, confirmation token generation, and Resend Audience management
2. **Subscribe form** — React component embedded in the site footer, visible on all pages
3. **Newsletter sender** — function in WebCMan that triggers after new articles are added, reads the Resend Audience, and sends a digest email

No database. Resend Audiences stores the confirmed subscriber list. Confirmation uses a signed JWT (HMAC-SHA256) — no server-side state needed.

---

## Subscribe Flow

1. User types email in footer form and clicks Subscribe
2. Frontend POSTs to `/api/subscribe`
3. API validates email format
4. API generates a signed JWT: `{ email, exp: now + 24h }` signed with `SUBSCRIBE_SECRET`
5. API calls Resend to send a confirmation email containing:
   `https://<SITE_URL>/api/subscribe/confirm?token=<JWT>`
6. User clicks the confirmation link
7. API at `/api/subscribe/confirm` verifies the JWT signature and expiry
8. API adds the contact to the Resend Audience
9. User is redirected to `/subscribe/confirmed`

If the user is already subscribed (Resend returns a duplicate error), the API returns a friendly message instead of an error.

---

## Unsubscribe Flow

1. Every newsletter email footer contains:
   `Unsubscribe: https://<SITE_URL>/api/unsubscribe?id=<resend_contact_id>`
2. User clicks the link
3. API at `/api/unsubscribe` calls Resend to remove the contact from the Audience
4. User sees the `/unsubscribed` page

The Resend contact ID is included in outgoing emails as a custom header or embedded in the link at send time. It is opaque and safe to include in URLs.

---

## Newsletter Send (WebCMan Integration)

In `webcman/src/run.ts`, after `runUpdateEngine` completes:

```
if (stats.added.length > 0 && RESEND_API_KEY && RESEND_AUDIENCE_ID) {
  await sendNewsletter(stats.added, config.contentDir, apiKey, audienceId, fromEmail, siteUrl)
}
```

`webcman/src/newsletter.ts` (`sendNewsletter` function):
1. Reads the JSON content of each newly added file to get title, summary, slug
2. Fetches all confirmed contacts from the Resend Audience
3. Builds an HTML email:
   - Subject: `ASD Guide — {N} new article{s} added`
   - Body: title + one-sentence summary + "Read more →" link per article
   - Footer: site link + unsubscribe link (with contact ID per recipient)
4. Sends one email per contact using Resend's batch emails API (`emails.batch`) — one API call with an array of individual emails, each with a personalised unsubscribe link containing that contact's ID

No email is sent if `stats.added.length === 0`.

---

## Email Template

```
Subject: ASD Guide — 3 new articles added

Hi,

Here's what's new on ASD Guide:

• [Article Title]
  One-sentence summary.
  Read more → https://asd-guide.com/news/article-slug

• [Article Title]
  ...

---
You're receiving this because you subscribed at asd-guide.com.
Unsubscribe: https://asd-guide.com/api/unsubscribe?id=CONTACT_ID
```

Plain text version included alongside HTML.

---

## File Structure

**New files:**
- `src/app/api/subscribe/route.ts` — POST: validate email, send confirmation email via Resend
- `src/app/api/subscribe/confirm/route.ts` — GET: verify JWT, add to Resend Audience, redirect
- `src/app/api/unsubscribe/route.ts` — GET: remove from Resend Audience, redirect
- `src/app/subscribe/confirmed/page.tsx` — "You're subscribed!" page
- `src/app/unsubscribed/page.tsx` — "You've been unsubscribed" page
- `src/components/SubscribeForm.tsx` — email input + submit, client component
- `webcman/src/newsletter.ts` — `sendNewsletter()` function

**Modified files:**
- `src/components/Footer.tsx` — add `<SubscribeForm />`
- `webcman/src/run.ts` — call `sendNewsletter()` after engine completes
- `.env.local` — add newsletter env vars
- `.github/workflows/webcman.yml` — add newsletter env vars

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `RESEND_API_KEY` | `.env.local` + GitHub Secret | Resend API key |
| `RESEND_AUDIENCE_ID` | `.env.local` + GitHub Secret | Resend Audience ID (created in dashboard) |
| `RESEND_FROM_EMAIL` | `.env.local` + GitHub Secret | e.g. `updates@yourdomain.com` |
| `SUBSCRIBE_SECRET` | `.env.local` + GitHub Secret | Random string for signing confirmation JWTs |
| `NEXT_PUBLIC_SITE_URL` | `.env.local` + GitHub Secret | e.g. `https://asd-guide.com` (no trailing slash) |

---

## Security

- Confirmation tokens: HMAC-SHA256 signed, 24h expiry. Unverified emails never added to Audience.
- Unsubscribe links: use Resend contact ID (opaque), not raw email addresses in URLs.
- No email address exposed in any URL.
- Rate limiting: if the same email submits the subscribe form twice within 24h, the API returns a friendly "check your inbox" message without sending a second confirmation email.

---

## Error Handling

- Invalid email format → 400, form shows inline error
- Already subscribed → 200, form shows "you're already subscribed"
- Resend API failure → 500, form shows "something went wrong, try again"
- Expired/invalid confirmation token → show "this link has expired, please subscribe again"
- Unsubscribe with invalid contact ID → show "already unsubscribed or link is invalid"

---

## What This Is Not

- Not a CMS or newsletter builder — content comes from WebCMan only
- Not a login system — no passwords, sessions, or user accounts
- Not a mailing list manager — no segmentation, preferences, or scheduling
