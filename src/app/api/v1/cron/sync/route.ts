import { NextResponse } from 'next/server';
import { syncCatalog } from '@/server/services/catalog-sync';
import { env } from '@/server/lib/env';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(req: Request) {
  const secret = env().CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  return token === secret;
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}

async function run(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 },
    );
  }

  try {
    const counts = await syncCatalog();
    return NextResponse.json({ ok: true, counts });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: 'SYNC_FAILED',
          message: String(error?.message ?? error),
        },
      },
      { status: 500 },
    );
  }
}
