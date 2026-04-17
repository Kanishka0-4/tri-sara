import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Pool } from "pg";
import { decodeAuthToken } from '@/lib/auth';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const userId = token ? decodeAuthToken(token) : null;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { module_id, score, responses } = await req.json();
    if (!module_id || typeof score !== 'number' || !Array.isArray(responses)) {
      return NextResponse.json({ error: "module_id, score, and responses are required" }, { status: 400 });
    }
    // Save attempt and get attempt_id
    const attemptRes = await pool.query(
      `INSERT INTO pre_quiz_attempts (user_id, module_id, score)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, module_id)
       DO UPDATE SET score = EXCLUDED.score, attempt_date = CURRENT_TIMESTAMP
       RETURNING id`,
      [userId, module_id, score]
    );
    const attempt_id = attemptRes.rows[0].id;

    // Save each response
    for (const resp of responses) {
      // resp: { question_id, selected_option }
      if (typeof resp.question_id === 'number' && typeof resp.selected_option === 'number') {
        await pool.query(
          `INSERT INTO pre_quiz_responses (attempt_id, question_id, selected_option)
           VALUES ($1, $2, $3)`,
          [attempt_id, resp.question_id, resp.selected_option]
        );
      }
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Pre-quiz attempt save error:", err);
    return NextResponse.json({ error: "Failed to save pre-quiz attempt" }, { status: 500 });
  }
}
