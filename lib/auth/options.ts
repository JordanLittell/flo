import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { User } from "@/lib/data";
import { validateCallback } from "./callback";

export const authOptions: NextAuthOptions = {
  // Credentials sign-in requires JWT sessions: the session lives in a signed, encrypted cookie.
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await User.verifyCredentials(credentials.email, credentials.password);
        return user ? { id: user.id, email: user.email } : null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
    redirect({ url, baseUrl }) {
      return new URL(validateCallback(url, baseUrl), baseUrl).href;
    },
  },
};
