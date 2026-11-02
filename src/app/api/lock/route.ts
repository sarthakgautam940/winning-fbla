import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

// Signs this device out. Progress stays in the browser.
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: SESSION_COOKIE, value: "", path: "/", maxAge: 0 });
  return response;
}
