import { NextResponse } from "next/server";
import { Pool } from "pg";
import { cookies } from "next/headers";
import { decodeAuthToken } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ---------------- DB ---------------- */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/* ---------------- AI CLIENTS ---------------- */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/* ---------------- GET — load chat history ---------------- */

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const userId = token ? decodeAuthToken(token) : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subject_id");

    if (!subjectId) {
      return NextResponse.json({ error: "Missing subject_id" }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT messages FROM subject_chat
       WHERE user_id = $1 AND subject_id = $2`,
      [userId, subjectId]
    );

    return NextResponse.json({ messages: result.rows[0]?.messages || [] });
  } catch (err: any) {
    console.error("Chat GET failed", err);
    return NextResponse.json(
      { error: "Failed to load chat", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

/* ---------------- POST — send message, get reply, save ---------------- */

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const userId = token ? decodeAuthToken(token) : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subjectId, message, imageBase64, imageMimeType } = body;

    if (!subjectId || !message) {
      return NextResponse.json(
        { error: "Missing fields (subjectId, message)" },
        { status: 400 }
      );
    }

    /* -------- LOAD EXISTING HISTORY -------- */

    const historyResult = await pool.query(
      `SELECT messages FROM subject_chat
       WHERE user_id = $1 AND subject_id = $2`,
      [userId, subjectId]
    );
    const history = historyResult.rows[0]?.messages || [];

    /* -------- USER CONTEXT -------- */

    const ctxResult = await pool.query(
  `SELECT u.name, u.learning_style,
          ms.title AS subject_title
   FROM users u
   LEFT JOIN module_subjects ms ON ms.user_id = u.id AND ms.id = $2
   WHERE u.id = $1`,
  [userId, subjectId]
);

const ctx = ctxResult.rows[0];

    const systemPrompt = `You are a smart study assistant helping ${ctx?.name || "a student"} with "${ctx?.subject_title || "their subject"}".
Learning style: ${ctx?.learning_style || "unknown"}.
Answer study doubts clearly and concisely with examples suited to their learning style. Do not generate study plans — only answer questions.`;

    /* -------- GENERATE REPLY -------- */

    let reply = "";
    const hasImage = !!imageBase64;

    if (hasImage) {
      /* ── Gemini for image ── */
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const historyText = history
        .slice(-6)
        .map((m: any) =>
          `${m.role === "user" ? "Student" : "Assistant"}: ${m.text}`
        )
        .join("\n");

      const fullPrompt = historyText
        ? `${systemPrompt}\n\nRecent conversation:\n${historyText}\n\nStudent: ${message}`
        : `${systemPrompt}\n\nStudent: ${message}`;

      const result = await model.generateContent([
        fullPrompt,
        {
          inlineData: {
            mimeType: imageMimeType || "image/jpeg",
            data: imageBase64,
          },
        },
      ]);

      reply = result.response.text();

    } else {
      /* ── OpenRouter for text ── */
      const openrouterHistory = history.map((m: any) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Adaptive Learning App",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...openrouterHistory.slice(-6),
            { role: "user", content: message },
          ],
          max_tokens: 800,
        }),
      });

      const data = await response.json();

      console.log("FULL AI RESPONSE:", data);

        reply =
        data?.choices?.[0]?.message?.content ||
        data?.choices?.[0]?.text ||
        data?.message ||
        JSON.stringify(data) ||
        "Sorry, I couldn't generate a response.";
    }

    /* -------- SAVE UPDATED HISTORY -------- */

    const updatedHistory = [
      ...history,
      {
        role: "user",
        text: message,
        hasImage,
        timestamp: new Date().toISOString(),
      },
      {
        role: "bot",
        text: reply,
        timestamp: new Date().toISOString(),
      },
    ];

    await pool.query(
      `INSERT INTO subject_chat (user_id, subject_id, messages)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, subject_id)
       DO UPDATE SET messages = $3`,
      [userId, subjectId, JSON.stringify(updatedHistory)]
    );

    return NextResponse.json({ reply, history: updatedHistory });

  } catch (err: any) {
    console.error("Chat POST failed", err);
    return NextResponse.json(
      { error: "Chat failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}