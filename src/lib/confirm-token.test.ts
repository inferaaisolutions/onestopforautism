import { vi, describe, it, expect, afterEach } from "vitest";
import { signToken, verifyToken } from "./confirm-token";

describe("confirm-token", () => {
  afterEach(() => vi.restoreAllMocks());

  it("verifies a freshly signed token", () => {
    const token = signToken("test@example.com");
    expect(verifyToken(token)).toBe("test@example.com");
  });

  it("returns null for an expired token", () => {
    const past = Date.now() - 25 * 60 * 60 * 1000;
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
