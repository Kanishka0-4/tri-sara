import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeAuthToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
	const cookieStore = await cookies();
	const token = cookieStore.get('auth_token')?.value;
	const userId = token ? decodeAuthToken(token) : null;
	const body = await req.json();
	const { subjectId } = body;
	if (!userId) {
		return NextResponse.json({ error: 'Unauthorized: user not found' }, { status: 401 });
	}
	// Fetch latest analytics_summary for this user and subject by joining with quiz_attempts
	const result = await db.query(
		`SELECT a.* FROM analytics_summary a
		JOIN quiz_attempts qa ON a.attempt_id = qa.id
		WHERE qa.user_id = $1 AND a.subject_id = $2
		ORDER BY qa.completed_at DESC
		LIMIT 1`,
		[userId, subjectId]
	);
	if (!result.rows.length) {
		return NextResponse.json({ error: 'No summary found.' }, { status: 404 });
	}
	return NextResponse.json({ summary: result.rows[0] });
}
