import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

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

  afterEach(() => {
    mockContactRemove.mockClear();
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
