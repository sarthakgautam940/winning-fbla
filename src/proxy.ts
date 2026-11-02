import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, SESSION_REFRESH_AFTER, sessionCookie, signSession, verifySession } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/") {
    // The gate. A remembered device skips straight into the app.
    return session ? NextResponse.redirect(new URL("/home", request.url)) : NextResponse.next();
  }

  if (pathname === "/api/unlock") return NextResponse.next();

  if (!session) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "locked" }, { status: 401 });
    const gate = new URL("/", request.url);
    if (pathname !== "/home") gate.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(gate);
  }

  const response = NextResponse.next();
  const now = Math.floor(Date.now() / 1000);
  if (now - session.iat > SESSION_REFRESH_AFTER) {
    response.cookies.set(sessionCookie(await signSession(now)));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|robots.txt).*)"],
};
