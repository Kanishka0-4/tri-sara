/**
 * Robustly parse a JSON array from an AI response that may be truncated.
 * Three-layer fallback: normal parse → salvage last complete object → per-object scan.
 */
function safeParseJsonArray(text) {
  if (!text || typeof text !== "string") return [];

  const startIdx = text.indexOf("[");
  if (startIdx === -1) return [];
  const raw = text.slice(startIdx);

  // 1. Normal parse
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {}

  // 2. Salvage — close the array at the last complete '}'
  try {
    const lastClose = raw.lastIndexOf("}");
    if (lastClose !== -1) {
      const salvaged = raw.slice(0, lastClose + 1) + "]";
      const parsed = JSON.parse(salvaged);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.warn(`[safeParseJsonArray] Salvaged ${parsed.length} items from truncated JSON.`);
        return parsed;
      }
    }
  } catch (_) {}

  // 3. Per-object scan
  try {
    const results = [];
    let depth = 0;
    let start = -1;
    let inString = false;
    let escape = false;

    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (escape) { escape = false; continue; }
      if (ch === "\\" && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;

      if (ch === "{") {
        if (depth === 0) start = i;
        depth++;
      } else if (ch === "}") {
        depth--;
        if (depth === 0 && start !== -1) {
          try { results.push(JSON.parse(raw.slice(start, i + 1))); } catch (_) {}
          start = -1;
        }
      }
    }

    if (results.length > 0) {
      console.warn(`[safeParseJsonArray] Extracted ${results.length} objects via per-object scan.`);
      return results;
    }
  } catch (_) {}

  console.error("[safeParseJsonArray] Could not parse any JSON from the AI response.");
  return [];
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-4o-mini";

async function openRouterChat(messages, maxTokens = 8000) {
  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "Trisara Study App",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.5,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// Generate quiz questions from combined module content
export async function generateMegaQuizQuestions(allContent, count = 25) {
  const prompt = `
You are an expert educator designing a FINAL MEGA QUIZ for deep learning assessment.

Your task is to generate EXACTLY ${count} high-quality MCQs from the given content.

----------------------------------------
🎯 STRICT REQUIREMENTS
----------------------------------------

1. TOPIC COVERAGE:
- Identify all major topics from the content
- Distribute questions evenly across topics
- Each topic must have at least 2 questions

2. DIFFICULTY DISTRIBUTION:
- Easy → 30%
- Medium → 40%
- Hard → 30%

3. QUESTION TYPE DISTRIBUTION:
- Factual (basic definitions) → 30%
- Conceptual (understanding, reasoning) → 40%
- Application (problem-solving, scenarios, code-based) → 30%

4. APPLICATION QUESTIONS (VERY IMPORTANT):
- Must include real-world or problem-solving scenarios
- Include code-based or logical reasoning where applicable
- Avoid only theoretical questions

----------------------------------------
🧠 QUESTION DESIGN RULES
----------------------------------------

- Each question must test understanding, NOT memorization
- Avoid repeated or similar questions
- Ensure ONLY ONE correct answer
- Make questions clear and unambiguous
- Mix theoretical and practical thinking
- All 4 options MUST be clearly different from each other
- Avoid placeholder text like "..." in options
- For code-based questions, provide meaningful variations in logic/output
- Options must be concise and not exceed 1–2 lines

----------------------------------------
📦 OUTPUT FORMAT (STRICT JSON ONLY)
----------------------------------------

Return ONLY a JSON array. No markdown, no code fences, no explanation before or after:

[
  {
    "id": number,
    "question": "string",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctAnswer": "must exactly match one of the option strings",
    "difficulty": "easy | medium | hard",
    "topic": "topic_name",
    "questionType": "factual | conceptual | application"
  }
]

----------------------------------------
RULES:
----------------------------------------
- The correctAnswer must be the FULL TEXT of the correct option
- It must EXACTLY match one of the options
- Do NOT return A/B/C/D as answer
- Keep all option strings SHORT (under 100 characters each) to avoid truncation
- Keep explanation fields OUT of the JSON — no extra keys

----------------------------------------
⚠️ FINAL VALIDATION (MANDATORY BEFORE OUTPUT)
----------------------------------------

Before returning:
- Verify total questions = ${count}
- Verify difficulty distribution is balanced
- Verify all topics are covered
- Ensure at least 30% questions are application-based

----------------------------------------
📚 CONTENT:
----------------------------------------

${allContent}

Return ONLY the JSON array. Start your response with [ and end with ].
`;

  const text = await openRouterChat([{ role: "user", content: prompt }], 8000);
  return safeParseJsonArray(text);
}

export async function generateSubtopics(subject, count = 8) {
  const prompt = `
Return ONLY a JSON array of ${count} short subtopics for:
"${subject}"

Example:
["Topic 1", "Topic 2", "Topic 3"]

Start your response with [ and end with ].
`;

  const text = await openRouterChat(
    [{ role: "user", content: prompt }],
    512
  );
  return safeParseJsonArray(text);
}