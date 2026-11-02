import { NextResponse } from "next/server";
import { checkCode, PROFILE_NAME, sessionCookie, signSession } from "@/lib/auth";

// A light brake on guessing. Instances do not share memory, so this slows a
// guesser down rather than guaranteeing a hard limit.
const attempts = new Map<string, { count: number; until: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILS = 12;

function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: Request) {
  const key = clientKey(request);
  const now = Date.now();
  const record = attempts.get(key);
  if (record && record.until > now && record.count >= MAX_FAILS) {
    return NextResponse.json({ ok: false, error: "Too many tries. Wait a few minutes." }, { status: 429 });
  }

  let code = "";
  try {
    const body = (await request.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code : "";
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!/^\d{7}$/.test(code) || !(await checkCode(code))) {
    const next = record && record.until > now ? { count: record.count + 1, until: record.until } : { count: 1, until: now + WINDOW_MS };
    attempts.set(key, next);
    await new Promise((r) => setTimeout(r, 450));
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  attempts.delete(key);
  const response = NextResponse.json({ ok: true, name: PROFILE_NAME });
  response.cookies.set(sessionCookie(await signSession()));
  return response;
}
