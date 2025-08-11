// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const reroute = (prefix: string, url: URL, originalUrl: string) =>
  NextResponse.rewrite(new URL(`/${prefix}${url.pathname}`, originalUrl));

// Only match non-static pages
export const config = {
  matcher: ["/((?!_next|api|favicon.ico|.*\\..*).*)"],
};

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  if (hostname.startsWith("univ.local")) {
    return reroute("univ", url, request.url);
  }

  if (hostname.startsWith("moa.local")) {
    return reroute("moa", url, request.url);
  }

  if (hostname.startsWith("docs.local")) {
    return reroute("docs", url, request.url);
  }

  return NextResponse.next();
}
