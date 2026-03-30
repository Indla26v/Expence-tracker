import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAuthSecret, getSessionTokenCookieName } from "@/lib/auth";

export type AuthToken = {
  sub?: string;
  email?: string;
  [key: string]: unknown;
};

export async function requireAuth(req: NextRequest): Promise<AuthToken | NextResponse> {
  const secret = getAuthSecret();
  const salt = getSessionTokenCookieName();

  const token = (await getToken({
    req,
    secret,
    salt,
    secureCookie: process.env.NODE_ENV === "production",
  })) as AuthToken | null;

  if (!token?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return token;
}

