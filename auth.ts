import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import { compareSync } from "bcrypt-ts-edge";

export const config = {
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  adapter: PrismaAdapter(prisma),   
    providers: [
        CredentialsProvider({
            email: {
                type: "email",
            },
            password: {
                type: "password",
            },
        },
        async authorize(credentials) => {
            if (credentials == null) return null;

            // find user in database
            const user = await prisma.user.findFirst({
                where: {
                    email: credentials.email as string,
                }
            });

            // check if user exists and if password matches
            if (user && user.password) {
                const isMatch = compareSync(credential.password, user.password);

                // if password is correct, return user object
                if (isMatch) {
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                    }
                }
            }
            // if user not found or password does not match, return null
            return null;
                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                };
            }
        })],
    }

export const { handlers, auth, signIn, signOut } = NextAuth(config);
