import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { pool as sharedPool } from "@/lib/db";
import { askGroq } from "@/lib/groq";
// POST: Save a new chat message and return updated chat
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const subjectId = Number(id);
  if (isNaN(subjectId)) {
    return NextResponse.json({ error: "Invalid subject id" }, { status: 400 });
  }
  let userId: number | null = null;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (token) {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      userId = decoded.id;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  }
  if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  const { message } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }
  const client = await pool.connect();
  // Fetch all module content for this subject
  const modulesRes = await client.query(
    `SELECT module_order, content FROM module_content WHERE subject_id = $1 ORDER BY module_order ASC`,
    [subjectId]
  );
  function scoreModule(content: string, question: string): number {
    const contentWords = new Set(content.toLowerCase().split(/\W+/));
    const questionWords = new Set(question.toLowerCase().split(/\W+/));
    let score = 0;
    for (const word of questionWords) {
      if (contentWords.has(word) && word.length > 3) score++;
    }
    return score;
  }
  type ModuleRow = { module_order: number; content: string };
  let bestModule: ModuleRow = modulesRes.rows[0];
  let bestScore = 0;
  for (const m of modulesRes.rows as ModuleRow[]) {
    const score = scoreModule(m.content, message);
    if (score > bestScore) {
      bestScore = score;
      bestModule = m;
    }
  }
  const moduleTexts = bestModule ? `Module ${bestModule.module_order}:\n${bestModule.content}` : "";
  try {
    // 1. Fetch or create the chat row
    const chatRes = await client.query(
      `SELECT messages FROM subject_chat WHERE user_id = $1 AND subject_id = $2`,
      [userId, subjectId]
    );
    let messages: any[] = chatRes.rows[0]?.messages || [];
    // 2. Add user message
    const userMsg = { role: "user", message, created_at: new Date().toISOString() };
    messages.push(userMsg);
    // 3. Generate assistant reply
    let assistantReply = "";
    try {
      const prompt = `You are a helpful tutor. Answer the student's question using only the following subject module content. Be as brief as possible and reply in 2-3 sentences only.\nIf the question is not covered in the content, politely reply: 'Sorry, I can only answer questions related to this subject.'\n\n${moduleTexts}\n\nStudent's question: ${message}`;
      assistantReply = await askGroq(prompt);
    } catch (err) {
      console.error("Groq LLM error:", err);
      assistantReply = `Sorry, I couldn't generate an answer right now. (LLM error: ${err instanceof Error ? err.message : String(err)})`;
    }
    const assistantMsg = { role: "assistant", message: assistantReply, created_at: new Date().toISOString() };
    messages.push(assistantMsg);
    // 4. Upsert the chat row
    await client.query(
      `INSERT INTO subject_chat (user_id, subject_id, messages) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, subject_id) DO UPDATE SET messages = EXCLUDED.messages`,
      [userId, subjectId, JSON.stringify(messages)]
    );
    return NextResponse.json({ chat: messages });
  } catch (error) {
    console.error("❌ POST CHAT FAILED:", error);
    return NextResponse.json({ error: "Failed to save chat" }, { status: 500 });
  } finally {
    client.release();
  }
}
import { NextResponse } from "next/server";
import { Pool } from "pg";

/* ---------------- DATABASE ---------------- */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/* ---------------- GET CHAT (LAZY CREATE) ---------------- */

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const subjectId = Number(id);
  if (isNaN(subjectId)) {
    return NextResponse.json({ error: "Invalid subject id" }, { status: 400 });
  }
  let userId: number | null = null;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (token) {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      userId = decoded.id;
    } catch {}
  }
  if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  const client = await pool.connect();
  try {
    const chatRes = await client.query(
      `SELECT messages FROM subject_chat WHERE user_id = $1 AND subject_id = $2`,
      [userId, subjectId]
    );
    const messages = chatRes.rows[0]?.messages || [];
    return NextResponse.json({ chat: messages });
  } catch (error) {
    console.error("❌ FETCH CHAT FAILED:", error);
    return NextResponse.json({ error: "Failed to fetch chat" }, { status: 500 });
  } finally {
    client.release();
  }
}
