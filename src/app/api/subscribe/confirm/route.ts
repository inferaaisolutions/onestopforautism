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
