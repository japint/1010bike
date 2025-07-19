import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db/prisma";
import { cookies } from "next/headers";
import { compareSync } from "bcrypt-ts-edge";
import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";
import CredentialsProvider from "next-auth/providers/credentials";

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

    async jwt({ token, user, trigger }) {
      // If user is signing in, persist user data into token
      if (user && user.name === "NO_NAME") {
        token.name = user.email!.split("@")[0];

        // Update database to reflect the token name
        await prisma.user.update({
          where: { id: user.id },
          data: { name: token.name },
        });
      }

      if (user && (trigger === "signIn" || trigger === "signUp")) {
        const cookiesObject = await cookies();
        const sessionCartId = cookiesObject.get("sessionCartId")?.value;

        if (sessionCartId) {
          const sessionCart = await prisma.cart.findFirst({
            where: { sessionCartId },
          });

          if (sessionCart) {
            // Delete current user cart
            await prisma.cart.deleteMany({
              where: { userId: user.id },
            });

            // Assign new cart
            await prisma.cart.update({
              where: { id: sessionCart.id },
              data: { userId: user.id },
            });
          }
        }
      }

      return token;
    },
    authorized: async ({ auth, request }) => {
      // array of regex patterns of path we want to protect
      const protectedPaths = [
        /\/shipping-address/,
        /\/payment-method/,
        /\/place-order/,
        /\/profile/,
        /\/user\/(.*)/,
        /\/order\/(.*)/,
        /\/admin/,
      ];

      // get the pathname from the request url object
      const { pathname } = new URL(request.url);

      // check if user is accessing a protected path
      const isProtectedPath = protectedPaths.some((path) =>
        path.test(pathname)
      );

      //  check if user is not authenticated and accessing a protected path
      if (!auth && isProtectedPath) {
        return Response.redirect(new URL("/sign-in", request.url));
      }

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
