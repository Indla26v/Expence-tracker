import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { encode } from "next-auth/jwt";
import { getAuthSecret, getSessionTokenCookieName } from "@/lib/auth";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const allowedEmail = process.env.APP_USER_EMAIL;
  const passwordHash = process.env.APP_USER_PASSWORD_HASH;
  if (!allowedEmail || !passwordHash) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  if (email.toLowerCase() !== allowedEmail.toLowerCase()) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await compare(password, passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const secret = getAuthSecret();
  const salt = getSessionTokenCookieName();

  const token = await encode({
    secret,
    salt,
    token: {
      sub: "single-user",
      email: allowedEmail,
    },
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return NextResponse.json({
    token,
    tokenType: "Bearer",
    expiresIn: 60 * 60 * 24 * 30,
  });
}

