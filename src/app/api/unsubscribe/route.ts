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
