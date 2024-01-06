import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";
import { Database } from "./supabase/types";

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/health") {
    return NextResponse.json({ status: "ok" });
  }

  if (
    req.nextUrl.pathname === "/.well-known/microsoft-identity-association.json"
  ) {
    return NextResponse.json({
      associatedApplications: [
        { applicationId: "8c42cc90-b3e6-46e6-aa40-8675f3ed247e" },
      ],
    });
  }

  const res = NextResponse.next();

  const supabase = createMiddlewareClient<Database>({ req, res });
  const session = await supabase.auth.getSession();
  const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const authenticated =
    aal.data?.currentLevel == "aal1" || aal.data?.currentLevel == "aal2";
  const mfaed = aal.data?.currentLevel == aal.data?.nextLevel;

  // paths allowed to be viewed whilst not authenticated
  const authPaths = ["/login", "/signup"];

  // list of unauthorized route for below list of role
  const listOfUnAuthorizedRoutes: { [key: string]: Array<string> } = {
    "/organization": ["editor", "viewer"]
  };

  // already logged in?
  if (authenticated && req.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // user has no org?
  if (authenticated && !session.data.session?.user.user_metadata.org) {
    return NextResponse.redirect(new URL("/organization/switch", req.url));
  }

  // logged out and on a restricted path?
  if (!authenticated && !authPaths.includes(req.nextUrl.pathname)) {
    const redirectUrl = req.nextUrl.clone();

    redirectUrl.pathname = "/login";

    if (req.nextUrl.pathname !== "/") {
      redirectUrl.searchParams.set("redirect", req.nextUrl.search ? `${req.nextUrl.pathname}${req.nextUrl.search}` : req.nextUrl.pathname);
    }

    return NextResponse.redirect(redirectUrl);
  }

  if (!mfaed && !authPaths.includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/auth/mfa/verify", req.url));
  }

  const { id: user_id, user_metadata } = session.data.session?.user ?? { id: "" };
  const user_role_in_org = await supabase.from('org_member').select('*').eq('user_id', user_id).eq('org_id', user_metadata?.org.id);

  if (listOfUnAuthorizedRoutes[req.nextUrl.pathname]?.includes(user_role_in_org.data?.[0].role ?? "")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/auth",
    "/devices",
    "/locations",
    "/alerts",
    "/account",
    "/health",
    "/setup",
    "/.well-known/microsoft-identity-association.json",
    "/organization"
  ],
};
