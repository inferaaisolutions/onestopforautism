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

function readContentItem(
  filePath: string,
  readFileSync: (p: string, enc: "utf-8") => string
): ContentItem | null {
  try {
    const raw = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>;
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
  // Dynamic import so vi.mock("fs", ...) is intercepted at call time
  const fsModule = await import("fs");
  const readFileSyncFn = (fsModule.readFileSync ?? (fsModule as unknown as { default: typeof import("fs") }).default?.readFileSync) as (p: string, enc: "utf-8") => string;

  const items: ContentItem[] = [];
  for (const relPath of addedFiles) {
    const item = readContentItem(path.posix.join(contentDir, relPath), readFileSyncFn);
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
