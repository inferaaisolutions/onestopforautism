import { createHmac } from "crypto";

const TTL_MS = 24 * 60 * 60 * 1000;

function secret(): string {
  return process.env.SUBSCRIBE_SECRET ?? "dev-secret-change-in-production";
}

export function signToken(email: string): string {
  const exp = Date.now() + TTL_MS;
  const payload = JSON.stringify({ email, exp });
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return Buffer.from(JSON.stringify({ email, exp, sig })).toString("base64url");
}

export function verifyToken(token: string): string | null {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf-8");
    const { email, exp, sig } = JSON.parse(raw) as {
      email?: unknown;
      exp?: unknown;
      sig?: unknown;
    };
    if (typeof email !== "string" || typeof exp !== "number" || typeof sig !== "string") {
      return null;
    }
    if (Date.now() > exp) return null;
    const payload = JSON.stringify({ email, exp });
    const expected = createHmac("sha256", secret()).update(payload).digest("hex");
    if (sig !== expected) return null;
    return email;
  } catch {
    return null;
  }
}
