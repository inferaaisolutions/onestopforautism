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
