import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeAuthToken } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const userId = token ? decodeAuthToken(token) : null;
    if (!userId) {
      console.error("[Activity API] Unauthorized: No userId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const params = await context.params;
    const subjectId = params?.id;
    if (!subjectId) {
      console.error("[Activity API] Missing subjectId param");
      return NextResponse.json({ error: "Missing subjectId param" }, { status: 400 });
    }
    let quizRes, contentRes, chapterReadRes, megaQuizRes;
    try {
      quizRes = await pool.query(
        `SELECT 'quiz' as type, 'Completed quiz for' as action, CONCAT('Module ', module_order) as name, created_at as date
         FROM module_quiz
         WHERE user_id = $1 AND subject_id = $2 AND score IS NOT NULL
         ORDER BY created_at DESC
         LIMIT 10`,
        [userId, subjectId]
      );
    } catch (e) {
      console.error("[Activity API] Quiz DB error:", e);
      throw e;
    }
    try {
      contentRes = await pool.query(
        `SELECT 'content' as type, 'Viewed' as action, CONCAT('Module ', module_id, ': ', INITCAP(block_type), ' Block') as name, updated_at as date
         FROM module_block_time
         WHERE user_id = $1 AND subject_id = $2
         ORDER BY updated_at DESC
         LIMIT 10`,
        [userId, subjectId]
      );
    } catch (e) {
      console.error("[Activity API] Content DB error:", e);
      throw e;
    }
    try {
      chapterReadRes = await pool.query(
        `SELECT 'read' as type, 'Completed chapter quiz' as action, CONCAT('Module ', module_order, ' - Chapter ', chapter_index) as name, created_at as date
         FROM chapter_quiz_scores
         WHERE user_id = $1 AND subject_id = $2
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId, subjectId]
      );
    } catch (e) {
      console.error("[Activity API] Chapter Read DB error:", e);
      throw e;
    }
    try {
      megaQuizRes = await pool.query(
        `SELECT 'mega-quiz' as type, 'Completed Mega-Quiz' as action, 'Mega-Quiz' as name, completed_at as date, score
         FROM quiz_attempts
         WHERE user_id = $1 AND subject_id = $2 AND completed_at IS NOT NULL
         ORDER BY completed_at DESC
         LIMIT 1`,
        [userId, subjectId]
      );
    } catch (e) {
      console.error("[Activity API] Mega-Quiz DB error:", e);
      throw e;
    }
    const all = [
      ...quizRes.rows,
      ...contentRes.rows,
      ...chapterReadRes.rows,
      ...megaQuizRes.rows
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return NextResponse.json({ activity: all });
  } catch (err) {
    console.error("[Activity API] Failed to fetch recent activity:", err);
    return NextResponse.json({ error: "Failed to fetch recent activity", details: String(err) }, { status: 500 });
  }
}
