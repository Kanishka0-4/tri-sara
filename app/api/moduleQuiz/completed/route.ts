import { NextResponse } from "next/server";
import { Pool } from "pg";
import { cookies } from "next/headers";
import { decodeAuthToken } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const userId = token ? decodeAuthToken(token) : null;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    if (!subjectId) {
      return NextResponse.json({ error: "Missing subjectId" }, { status: 400 });
    }
    const result = await pool.query(
      `SELECT 
        COUNT(*) AS completed,
        COUNT(*) FILTER (WHERE score::float / NULLIF(total, 0) >= 0.5) AS passed
       FROM module_quiz 
       WHERE subject_id = $1 AND user_id = $2 AND score IS NOT NULL`,
      [subjectId, userId]
    );
    const completed = parseInt(result.rows[0].completed, 10);
    const passed    = parseInt(result.rows[0].passed,    10);
    return NextResponse.json({ completed, passed });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch completed modules" }, { status: 500 });
  }
}