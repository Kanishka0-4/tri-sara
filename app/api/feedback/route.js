import { NextResponse } from "next/server";
import { Pool } from "pg";
import { cookies } from "next/headers";
import { decodeAuthToken } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    if (!subjectId) return NextResponse.json({ found: false });
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const userId = token ? decodeAuthToken(token) : null;
    if (!userId) return NextResponse.json({ found: false });
    const result = await pool.query(
      `SELECT 1 FROM feedback WHERE user_id = $1 AND subject_id = $2 LIMIT 1`,
      [userId, subjectId]
    );
    return NextResponse.json({ found: result.rows.length > 0 });
  } catch (err) {
    return NextResponse.json({ found: false });
  }
}

export async function POST(req) {
  try {
    const { subjectId, answers } = await req.json();
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const userId = token ? decodeAuthToken(token) : null;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Delete any existing feedback for this user/subject
    await pool.query(
      `DELETE FROM feedback WHERE user_id = $1 AND subject_id = $2`,
      [userId, subjectId]
    );
    // Insert new feedback
    await pool.query(
      `INSERT INTO feedback (user_id, subject_id, answers, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [userId, subjectId, JSON.stringify(answers)]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}
