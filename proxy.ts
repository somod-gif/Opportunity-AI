import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/profile"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!protectedPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = request.cookies.get("opportunity_session")?.value;
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
