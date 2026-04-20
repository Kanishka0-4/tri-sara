// /api/mega-quiz/retry-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeAuthToken } from '../../../../lib/auth';
import { db } from '../../../../lib/db';

const RETRY_DAYS = 2;
const RETRY_MS   = RETRY_DAYS * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const token  = (await cookies()).get('auth_token')?.value;
  const userId = token ? decodeAuthToken(token) : null;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subjectId } = await req.json();
  if (!subjectId) return NextResponse.json({ error: 'Missing subjectId' }, { status: 400 });

  const res = await db.query(
    `SELECT completed_at FROM quiz_attempts
     WHERE user_id = $1 AND subject_id = $2
     ORDER BY completed_at DESC LIMIT 1`,
    [userId, subjectId]
  );

  if (!res.rows.length) {
    // No attempt yet — free to take
    return NextResponse.json({ canRetake: true, completedAt: null, retryAfter: null });
  }

  const completedAt  = new Date(res.rows[0].completed_at);
  const retryAfterTs = completedAt.getTime() + RETRY_MS;
  const canRetake    = Date.now() >= retryAfterTs;

  return NextResponse.json({
    canRetake,
    completedAt: completedAt.toISOString(),
    retryAfter:  canRetake ? null : new Date(retryAfterTs).toISOString(),
  });
}