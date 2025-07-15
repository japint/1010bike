import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import { compareSync } from "bcrypt-ts-edge";
import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

// Extend NextAuth types
declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }
}

export const config: NextAuthConfig = {
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      credentials: {
        email: {
          type: "email",
        },
        password: {
          type: "password",
        },
      },
      async authorize(credentials) {
        if (credentials == null) return null;

        // find user in database
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email as string,
          },
        });

        // check if user exists and if password matches
        if (user && user.password) {
          const isMatch = compareSync(
            credentials.password as string,
            user.password
          );

          // if password is correct, return user object
          if (isMatch) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        }
        // if user not found or password does not match, return null
        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, token, trigger, newSession }) {
      // Assign user ID from token to session
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      // Add role to session from token
      if (session.user && token.role && typeof token.role === "string") {
        session.user.role = token.role;
      }

      // Handle session update
      if (trigger === "update" && newSession?.name && session.user) {
        session.user.name = newSession.name;
      }

      return session;
    },

    async jwt({ token, user }) {
      // If user is signing in, persist user data into token
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        if ("role" in user) {
          token.role = user.role;
        }
      }

      return token;
    },
    authorized: async ({ request }) => {
      // check for session cart cookie
      if (!request.cookies.get("sessionCartId")) {
        // generate new session cart ID cookie
        const sessionCartId = crypto.randomUUID();

        // create new response and add the cookie
        const response = NextResponse.next();

        // set newly generated sessionCartId in the response cookies with proper expiration
        response.cookies.set("sessionCartId", sessionCartId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        return response;
      }

      // Cookie exists, proceed normally
      return true;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
