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
