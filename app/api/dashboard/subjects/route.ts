import { NextResponse } from "next/server";
import { Pool } from "pg";
import { cookies } from "next/headers";
import { decodeAuthToken } from "@/lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function GET() {
  try {

    /* ===== AUTH ===== */

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = decodeAuthToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    /* ===== FETCH USER DASHBOARD DATA ===== */

    // Get all subjects for the user
    const subjectsRes = await pool.query(
      `SELECT id, title, exam, total_duration FROM module_subjects WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    const subjects = subjectsRes.rows;

    // For each subject, get total modules and completed modules (from module_quiz)
    const results = await Promise.all(subjects.map(async (subj: any) => {
      // Total modules for this subject
      const totalRes = await pool.query(
        `SELECT COUNT(*) FROM modules WHERE course_id = $1`,
        [subj.id]
      );
      const total_modules = parseInt(totalRes.rows[0].count, 10);

      // Completed modules for this user (module_quiz with score not null)
      const completedRes = await pool.query(
        `SELECT COUNT(*) FROM module_quiz WHERE subject_id = $1 AND user_id = $2 AND score IS NOT NULL`,
        [subj.id, userId]
      );
      const completed_modules = parseInt(completedRes.rows[0].count, 10);

      // Progress percent (for backward compatibility, can be removed if not needed)
      const progress = total_modules > 0 ? Math.round((completed_modules / total_modules) * 100) : 0;

      return {
        ...subj,
        total_modules,
        completed_modules,
        progress,
      };
    }));

    return NextResponse.json(results);

  } catch (error: unknown) {

    console.error("Dashboard API error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}