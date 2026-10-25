import { eq } from 'drizzle-orm';
import type { NextAuthConfig } from '@auth/nextjs';
import Credentials from '@auth/core/providers/credentials';
import Google from '@auth/core/providers/google';

import { db, schema } from '../db/index.js';
import { env } from './env.js';
import { verifyPassword } from './password.js';

export const authConfig = {
  trustHost: true,
  secret: env().AUTH_SECRET,
  providers: [
    Credentials({
      id: 'credentials',
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = (credentials?.email as string | undefined)?.toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await db()
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, email))
          .limit(1)
          .then((rows) => rows[0]);

        if (!user || !user.password_hash || user.status !== 'active') {
          return null;
        }

        const ok = await verifyPassword(password, user.password_hash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          role: 'user',
        } as any;
      },
    }),
    ...(env().GOOGLE_CLIENT_ID && env().GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: env().GOOGLE_CLIENT_ID,
            clientSecret: env().GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id as string;
        token.email = user.email as string;
        token.role = (user as any).role ?? 'user';
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
    async authorized({ auth }) {
      return !!(auth as any)?.user;
    },
  },
  // Use Auth.js's built-in sign-in / error pages so there are no dead links.
  // A custom branded page can replace these once the UI phase lands.
} satisfies NextAuthConfig;
