import { NextResponse } from "next/server";
import { Pool } from "pg";
import { generateModuleContent } from "../generateModuleContent";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function POST(req: Request) {
  try {
    const { subjectId, moduleOrder } = await req.json();
    console.log("👉 SUBJECT ID RECEIVED:", subjectId);
    // 1️⃣ Get module details
    const moduleRes = await pool.query(
  `
  SELECT m.title, m.goal, m.topics
  FROM modules m
  JOIN module_subjects ms ON m.course_id = ms.id
  WHERE ms.id = $1 AND m.module_order = $2
  `,
  [subjectId, moduleOrder]
);

    if (!moduleRes.rows.length) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const module = moduleRes.rows[0];

    // 2️⃣ Get subject title
    const subjectRes = await pool.query(
      `SELECT title FROM module_subjects WHERE id = $1`,
      [subjectId]
    );

    if (!subjectRes.rows.length) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const subjectTitle = subjectRes.rows[0].title;

    // 3️⃣ Generate module
    await generateModuleContent({
      subjectId,
      subjectTitle,
      module,
      moduleOrder,
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("❌ Generation failed:", err);
    return NextResponse.json({ error: "Failed to generate module" }, { status: 500 });
  }
}