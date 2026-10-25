import { NextAuth } from '@auth/nextjs';
import { authConfig } from './server/lib/auth.js';

export const { handlers, auth } = NextAuth(authConfig);
