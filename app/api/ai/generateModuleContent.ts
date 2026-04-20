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
  apiKey: process.env.GROQ_API_KEY_1!,
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
  console.log(`🤖 Generating Module ${moduleOrder}...`);

  /* -------- LEARNING PROFILE -------- */

  const result = await pool.query(
    `
    SELECT users.learning_profile
    FROM users
    JOIN module_subjects ON users.id = module_subjects.user_id
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

  /* -------- GROQ GENERATION (with one retry) -------- */

  let content = "";
  const MAX_ATTEMPTS = 2;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`🔁 Attempt ${attempt} for Module ${moduleOrder}...`);

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          // System role: strict instruction following
          role: "system",
          content:
            "You are an expert university educator. You always follow formatting instructions exactly. " +
            "You never skip content blocks, never shorten chapters, and never output any content outside the specified [TEXT], [VISUAL], and [AUDIO] tags. " +
            "You always complete all chapters fully before stopping.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,   // Lower = more deterministic, better format adherence
      max_tokens: 8000,
    });

    const raw = response.choices[0]?.message?.content ?? "";

    if (raw.length >= 500) {
      content = raw;
      break;
    }

    console.warn(
      `⚠️ Attempt ${attempt} produced short content (${raw.length} chars). ${
        attempt < MAX_ATTEMPTS ? "Retrying..." : "Giving up."
      }`
    );

    if (attempt === MAX_ATTEMPTS) {
      throw new Error(
        `Generated content too short after ${MAX_ATTEMPTS} attempts (last: ${raw.length} chars)`
      );
    }
  }

  /* -------- SAVE (safe against race conditions) -------- */

  const insertResult = await pool.query(
  `
  INSERT INTO module_content (subject_id, module_order, content)
  VALUES ($1, $2, $3)
  RETURNING *
  `,
  [subjectId, moduleOrder, content]
);

  console.log(`✅ Module ${moduleOrder} saved`, insertResult.rows[0]?.id);

  return content;
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
    console.log(`📦 Module ${moduleOrder} loaded from cache`);
    return existing.rows[0].content;
  }

  /* -------- GENERATE IF MISSING -------- */

  console.log(`⚠️ Module ${moduleOrder} not found → generating`);

  // Use the returned content directly — no need to re-query
  const content = await generateModuleContent({
    subjectId,
    subjectTitle,
    module,
    moduleOrder,
  });

  return content;
}