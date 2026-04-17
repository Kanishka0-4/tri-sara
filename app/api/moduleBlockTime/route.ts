// API endpoint to record time spent per content block type in a module
import { NextResponse } from "next/server";
import { Pool } from "pg";
import { cookies } from "next/headers";
import { decodeAuthToken } from "@/lib/auth";

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
    const { subjectId, moduleId, blockType, timeSpentSeconds } = await req.json();
    if (!subjectId || !moduleId || !blockType || typeof timeSpentSeconds !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    // Upsert time spent for this user/module/blockType
    await pool.query(
      `INSERT INTO module_block_time (user_id, subject_id, module_id, block_type, time_spent_seconds, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id, subject_id, module_id, block_type)
       DO UPDATE SET time_spent_seconds = module_block_time.time_spent_seconds + EXCLUDED.time_spent_seconds, updated_at = NOW()`,
      [userId, subjectId, moduleId, blockType, timeSpentSeconds]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to record time spent" }, { status: 500 });
  }
}

// API endpoint to fetch time spent per block type for a module
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
    const moduleId = searchParams.get("moduleId");
    if (!subjectId || !moduleId) {
      return NextResponse.json({ error: "Missing subjectId or moduleId" }, { status: 400 });
    }
    const result = await pool.query(
      `SELECT block_type, time_spent_seconds FROM module_block_time WHERE user_id = $1 AND subject_id = $2 AND module_id = $3`,
      [userId, subjectId, moduleId]
    );
    return NextResponse.json({ times: result.rows });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch time data" }, { status: 500 });
  }
}
