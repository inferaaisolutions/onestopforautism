import { vi, describe, it, expect, beforeEach } from "vitest";

const mockEmailSend = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockEmailSend },
  })),
}));

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
