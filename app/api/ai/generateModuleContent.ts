import { Pool } from "pg";
import Groq from "groq-sdk";
import { buildModulePrompt } from "./modulePrompt";

/* ---------------- DB ---------------- */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/* ---------------- GROQ ---------------- */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

/* ---------------- GENERATE MODULE ---------------- */

export async function generateModuleContent({
  subjectId,
  subjectTitle,
  module,
  moduleOrder,
}: {
  subjectId: number;
  subjectTitle: string;
  module: {
    title: string;
    topics?: string[];
    expected_outcome?: string;
    goal?: string;
  };
  moduleOrder: number;
}) {
  try {
    console.log(`🤖 Generating Module ${moduleOrder}...`);

    /* -------- LEARNING PROFILE -------- */

    const result = await pool.query(
      `
      SELECT users.learning_profile
      FROM users
      JOIN module_subjects
      ON users.id = module_subjects.user_id
      WHERE module_subjects.id = $1
      `,
      [subjectId]
    );

    if (!result.rows.length) {
      throw new Error("User learning profile not found");
    }

    const profile = result.rows[0].learning_profile;

    const topics = module.topics ?? [];
    const goal = module.expected_outcome ?? module.goal ?? "";

    const prompt = buildModulePrompt({
      subjectTitle,
      moduleTitle: module.title,
      topics,
      goal,
      profile,
    });

    /* -------- GROQ GENERATION -------- */

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "";

    if (!content || content.length < 200) {
      throw new Error("Generated content too short");
    }

    /* -------- SAVE -------- */

    const insertResult = await pool.query(
      `
      INSERT INTO module_content
      (subject_id, module_order, content)
      VALUES ($1,$2,$3)
      RETURNING *
      `,
      [subjectId, moduleOrder, content]
    );

    console.log("✅ INSERTED:", insertResult.rows);
    console.log(`✅ Module ${moduleOrder} saved`);

    return content;

  } catch (err) {
    console.error(`❌ Module ${moduleOrder} failed:`, err);
    throw err;
  }
}

/* ---------------- GET OR CREATE ---------------- */

export async function getOrCreateModuleContent({
  subjectId,
  subjectTitle,
  module,
  moduleOrder,
}: {
  subjectId: number;
  subjectTitle: string;
  module: any;
  moduleOrder: number;
}) {
  /* -------- CHECK DB -------- */

  const existing = await pool.query(
    `
    SELECT content
    FROM module_content
    WHERE subject_id = $1 AND module_order = $2
    `,
    [subjectId, moduleOrder]
  );

  if (existing.rows.length && existing.rows[0].content) {
    console.log(`📦 Module ${moduleOrder} exists`);
    return existing.rows[0].content;
  }

  /* -------- GENERATE IF MISSING -------- */

  console.log(`⚠️ Module ${moduleOrder} missing → generating`);

  await generateModuleContent({
    subjectId,
    subjectTitle,
    module,
    moduleOrder,
  });

  /* -------- FETCH AGAIN -------- */

  const newData = await pool.query(
    `
    SELECT content
    FROM module_content
    WHERE subject_id = $1 AND module_order = $2
    `,
    [subjectId, moduleOrder]
  );

  return newData.rows[0]?.content || null;
}