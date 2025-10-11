// Stub for NextAuth - not used in microservices mode
// This file is kept for compatibility but authentication goes through microservices
import NextAuth from 'next-auth/next';
import { AuthOptions } from 'next-auth';

export const authOptions: AuthOptions = {
  providers: [
    // Providers are disabled in microservices mode
    // Authentication is handled by the Spring Boot user-service
  ],
  callbacks: {
    async jwt({ token }) {
      return token;
    },
    async session({ session }) {
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  debug: false,
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'stub-secret',
};

export default NextAuth(authOptions);
