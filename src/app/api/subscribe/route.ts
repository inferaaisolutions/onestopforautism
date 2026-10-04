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
