import { NextRequest, NextResponse } from "next/server";

export const config = {
  // skip static, api, etc.
  matcher: ["/((?!_next|api|favicon.ico|.*\\..*).*)"],
};

export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") || "").toLowerCase();
  const url = request.nextUrl;

  // --- Local dev (works when you run next dev) ---
  if (host.startsWith("univ.local")) {
    // serve the univ portal within the same app
    url.pathname = "/univ/login";
    return NextResponse.rewrite(url);
  }
  if (host.startsWith("moa.local")) {
    url.pathname = "/moa/login";
    return NextResponse.rewrite(url);
  }

  // --- Production domains on Vercel ---
  // Both subdomains should be added in Vercel → Project → Settings → Domains
  if (host === "moa.betterinternship.com") {
    url.pathname = "/moa/login";
    return NextResponse.rewrite(url);
  }

  if (host === "uni.moa.betterinternship.com") {
    url.pathname = "/univ/login";
    return NextResponse.rewrite(url);
  }

  // Default passthrough
  return NextResponse.next();
}
