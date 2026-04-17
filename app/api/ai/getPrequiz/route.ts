import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get("moduleId");

    if (!moduleId) {
      return NextResponse.json({ error: "Missing moduleId" }, { status: 400 });
    }

    const result = await pool.query(
      `
      SELECT id, question_text, options
      FROM pre_quiz_questions
      WHERE module_id = $1
      `,
      [moduleId]
    );

    return NextResponse.json({
      quiz: result.rows.map((q) => ({
        q: q.question_text,           // ✅ match frontend
        options: q.options,
        correct: 0,                  // optional (frontend expects it)
        question_id: q.id,           // IMPORTANT for saving responses
      })),
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}