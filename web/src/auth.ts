import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { getAuthSecret, getSessionTokenCookieName } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const sessionTokenName = getSessionTokenCookieName();

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: getAuthSecret(),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name: sessionTokenName,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        console.log("Auth attempt with:", { email: raw?.email, password: raw?.password ? "***" : undefined });
        
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) {
          console.log("Schema parse failed:", parsed.error);
          return null;
        }

        const { email, password } = parsed.data;

        // Fetch user from database
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user) {
          console.log("User not found:", email);
          return null;
        }

        const ok = await compare(password, user.password);
        console.log("Password comparison result:", ok);
        if (!ok) return null;

        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) token.email = user.email;
      return token;
    },
    async session({ session, token }) {
      if (token?.email) session.user.email = String(token.email);
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allowed redirect URLs - only redirect to same origin
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
});

