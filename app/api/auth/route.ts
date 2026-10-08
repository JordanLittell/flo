import NextAuth from "next-auth"
import Email from "next-auth/providers/email"


export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    Email({
        server: process.env.EMAIL_SERVER,
        from: 'noreply@flow.com',
        // maxAge: 24 * 60 * 60, // How long email links are valid for (default 24h)
      }),
  ],
}

export default NextAuth(authOptions)