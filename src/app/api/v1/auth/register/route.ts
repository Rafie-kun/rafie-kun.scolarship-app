import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db, schema } from '@/server/db/index';
import { hashPassword } from '@/server/lib/password';
import { env } from '@/server/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(10, 'Password must be at least 10 characters').max(128),
});

function ipHash(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for') ?? '';
  const ip = forwarded.split(',')[0]?.trim() || 'unknown';
  return createHash('sha256')
    .update(`${ip}:${env().AUTH_SECRET}`)
    .digest('hex');
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be JSON' } },
      { status: 400 },
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email or password',
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 422 },
    );
  }

  const { email, password } = parsed.data;

  try {
    const existing = await db()
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1)
      .then((rows) => rows[0]);

    if (existing) {
      return NextResponse.json(
        { error: { code: 'EMAIL_IN_USE', message: 'An account with this email already exists' } },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const created = await db()
      .insert(schema.users)
      .values({ email, password_hash: passwordHash })
      .returning({ id: schema.users.id, email: schema.users.email })
      .then((rows) => rows[0]);

    await db().insert(schema.auditLogs).values({
      actor: created.id,
      action: 'user.register',
      entity: 'user',
      entity_id: created.id,
      ip_hash: ipHash(req),
    });

    return NextResponse.json({ user: { id: created.id, email: created.email } }, { status: 201 });
  } catch (error: any) {
    console.error('[auth/register]', error);
    return NextResponse.json(
      { error: { code: 'REGISTER_FAILED', message: 'Could not create the account' } },
      { status: 500 },
    );
  }
}
