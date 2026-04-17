
import Groq from "groq-sdk";
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
const MODEL = "llama-3.1-8b-instant";

// Generate 25-30 quiz questions from combined module content
export async function generateMegaQuizQuestions(allContent, count = 28) {
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

Return ONLY a JSON array:

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

Return ONLY JSON. No explanation, no extra text.
`;

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
    max_tokens: 4096,
  });

  const text = completion.choices[0].message.content;

  // Improved JSON extraction
  const match = text.match(/\[[\s\S]*\]/);

  try {
    return match ? JSON.parse(match[0]) : [];
  } catch (err) {
    console.error("Quiz parsing failed:", err);
    return [];
  }
}

export async function generateSubtopics(subject, count = 8) {
  const prompt = `
Return ONLY a JSON array of ${count} short subtopics for:
"${subject}"

Example:
["Topic 1", "Topic 2", "Topic 3"]
`;

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
  });

  const text = completion.choices[0].message.content;
  
  // Basic parsing in case Groq adds extra text
  const match = text.match(/\[[\s\S]*\]/);
  return match ? JSON.parse(match[0]) : [];
}