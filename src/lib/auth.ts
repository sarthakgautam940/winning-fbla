// Single-user access: one code unlocks the app, and a signed cookie keeps this
// device unlocked. Only the SHA-256 of the code lives in the source.

export const SESSION_COOKIE = "wf_session";
export const PROFILE_NAME = "Ashwath";

// Browsers cap cookie lifetime at 400 days; the proxy re-issues it monthly.
export const SESSION_MAX_AGE = 400 * 24 * 60 * 60;
export const SESSION_REFRESH_AFTER = 30 * 24 * 60 * 60;

const CODE_SHA256 = process.env.ACCESS_CODE_SHA256 ?? "df1fffba77266289bce523dc748c57249a7c3ef734451fd0d6638608061adc87";

const encoder = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function toBase64Url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function secret(): string {
  // Set AUTH_SECRET in the deployment for a private signing key. Without it the
  // key is derived from the code hash, which is fine while the repository is private.
  return process.env.AUTH_SECRET ?? `winning-fbla/${CODE_SHA256}`;
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function checkCode(code: string): Promise<boolean> {
  const digest = toHex(await crypto.subtle.digest("SHA-256", encoder.encode(code.trim())));
  return timingSafeEqual(digest, CODE_SHA256);
}

export interface Session {
  u: string;
  iat: number;
}

export async function signSession(now = Math.floor(Date.now() / 1000)): Promise<string> {
  const payload = toBase64Url(encoder.encode(JSON.stringify({ u: "ashwath", iat: now } satisfies Session)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(), encoder.encode(payload)));
  return `${payload}.${toBase64Url(sig)}`;
}

export async function verifySession(token: string | undefined | null): Promise<Session | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(), fromBase64Url(sig) as BufferSource, encoder.encode(payload));
    if (!ok) return null;
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as Session;
    return data.u === "ashwath" && typeof data.iat === "number" ? data : null;
  } catch {
    return null;
  }
}

export function sessionCookie(value: string) {
  return {
    name: SESSION_COOKIE,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
