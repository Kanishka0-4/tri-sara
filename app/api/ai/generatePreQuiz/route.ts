import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL_NAME = "llama-3.3-70b-versatile";

async function askGroq(prompt: string) {
  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODEL_NAME,
    response_format: { type: "json_object" },
    temperature: 0.1,
  });
  return JSON.parse(chatCompletion.choices[0]?.message?.content || "{}" );
}

export async function POST(request: Request) {
  try {
    const { topics, module_id } = await request.json();
    if (!module_id || !topics || !Array.isArray(topics)) {
      return NextResponse.json({ error: "module_id and topics are required" }, { status: 400 });
    }
    const prompt = `
You are an expert educator. Generate EXACTLY 6 conceptual MCQs (definition-based) for the following topics:
${topics.map((t: string, i: number) => `${i + 1}. ${t}`).join("\n")}

Rules:
- Each question must ask for the correct definition of the topic.
- Each MCQ must have 4 options, only one of which is the correct definition.
- Options should be plausible but only one is correct.
- Return your response as a JSON object in the following format:
{
  "quiz": [
    { "question": "...", "options": ["A", "B", "C", "D"], "correct": 0 }
  ]
}
ONLY return valid JSON.
`;
    const result = await askGroq(prompt);
    const quiz = result.quiz;
    if (!quiz || !Array.isArray(quiz)) {
      return NextResponse.json({ error: "Quiz generation failed" }, { status: 500 });
    }

    // Store each question in the DB
    for (const q of quiz) {
      await pool.query(
        `INSERT INTO pre_quiz_questions (module_id, question_text, options, correct_option)
         VALUES ($1, $2, $3, $4)`,
        [
          module_id,
          q.question,
          JSON.stringify(q.options.map((opt: string, idx: number) => ({ text: opt, isCorrect: idx === q.correct }))),
          q.correct
        ]
      );
    }

    return NextResponse.json({ quiz });
  } catch (err) {
    console.error("Pre-quiz AI generation error:", err);
    let errorMessage = "Pre-quiz generation failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}