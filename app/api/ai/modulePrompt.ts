export function buildModulePrompt({
  subjectTitle,
  moduleTitle,
  topics,
  goal,
  profile,
}: {
  subjectTitle: string;
  moduleTitle: string;
  topics: string[];
  goal: string;
  profile: {
    visual: number;
    audio: number;
    text: number;
  };
}) {
  const safeTopics = topics ?? [];

  return `
You are an expert university educator generating adaptive learning material.

SUBJECT
${subjectTitle}

MODULE
${moduleTitle}

MODULE GOAL
${goal ?? ""}

--------------------------------------------------

SUBTOPICS (CHAPTER LIST)

${safeTopics.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Each subtopic MUST become exactly ONE chapter.

--------------------------------------------------

LEARNING PROFILE

Visual emphasis: ${profile.visual}%
Audio emphasis: ${profile.audio}%
Text emphasis:  ${profile.text}%

--------------------------------------------------

LEARNING PRIORITY ORDER

Rank the modalities from highest to lowest based on percentage.

Highest = primary mode  
Second  = supporting mode  
Lowest  = minimal mode  

The structure of the content MUST follow this ranking.

--------------------------------------------------

CONTENT ADAPTATION RULES

Adapt BOTH structure and explanation style dynamically according to ranking (not just tone).
The content should feel cohesive and unified.

--------------------------------------------------

CHAPTER-LEVEL ADAPTATION (STRICT AND MANDATORY)

All adaptation MUST happen at the CHAPTER level, NOT at the module level.

Each chapter must independently:
• Apply ranking-based structure (text, visual, audio)
• Adjust depth and explanation style
• Follow content block rules ([TEXT], [VISUAL], [AUDIO])

--------------------------------------------------

CHAPTER STRUCTURE REQUIREMENT

Each chapter MUST follow this structure:

1. [TEXT] → structured explanation based on text priority
2. [VISUAL] → concept visualization
3. [AUDIO] → intuitive explanation (if audio is not lowest)

--------------------------------------------------

CONSISTENCY RULE

All chapters must:
• maintain similar depth
• follow the same structure pattern
• feel cohesive as one module

--------------------------------------------------

CONTENT LENGTH CONTROL (VERY IMPORTANT)

The entire module must be realistically completable in 1 week assuming 1–2 hours of study per day.

Therefore:
• Each chapter should represent ~1–2 hours of study
• Maintain moderate depth across chapters
• Avoid overly long or overly short chapters
• Keep content balanced across all chapters

--------------------------------------------------

CONTENT STRUCTURE RULES (CRITICAL)

TEXT PRIORITY RULES

If TEXT is highest:
• Use structured bullet-point explanations
• Avoid long paragraphs
• Not more than 3 sentences per bullet
• Provide complete explanation in bullets in 300–400 words total

If TEXT is second:
• Provide summarized explanation in bullet points (8–12 points)
• Not more than 2 sentences per bullet within the range of 200–250 words
• The text points must explain the concept, but more concise than if TEXT were highest
• Should NOT contain the content of visual as-is
• Text should support visuals (not repeat them)

If TEXT is lowest:
• Only provide short summary (5–8 bullets)
• Do NOT fully explain concepts in text; word limit in the range 150–200

--------------------------------------------------

VISUAL PRIORITY RULES

If VISUAL is highest:
• Visual blocks must carry the main explanation
• Use flows, hierarchies, comparisons heavily
• Text should support visuals (not repeat them)
• At least 2 visuals per chapter, each explaining a different concept

If VISUAL is second:
• Use moderate visuals to explain relationships
• Visuals should support text (not repeat them)
• Use flows, hierarchies, comparisons in moderation, not as main explanation

If VISUAL is lowest:
• Use minimal or optional visuals
• Visuals can be decorative or supplementary, not essential for understanding

--------------------------------------------------

AUDIO PRIORITY RULES

If AUDIO is highest:
• Use conversational, natural explanation
• Include storytelling and intuitive reasoning
• Proper, clear explanation of concepts in audio; length sufficient to explain clearly without being too brief or too verbose
• If the user is not reading the text, the audio should stand alone and provide a complete understanding of the chapter
• Audio is NOT just a summary — it should provide a full explanation with examples, analogies, and intuitive reasoning

If AUDIO is second:
• Keep explanations clear and concise
• Use audio to clarify complex concepts or provide additional insights
• Should summarize main points AND provide additional insights/examples from the text
• Works as a gist to the text and visual content; length should not exceed 2/3 of the text reading time; should not be too brief

If AUDIO is lowest:
• Keep AUDIO block minimal or optional

--------------------------------------------------

CONTENT BLOCK FORMAT RULES (VERY IMPORTANT)

Each chapter MUST include:

[TEXT]
Structured explanation (based on text priority)
[/TEXT]

[VISUAL]
Diagram or structured representation
[/VISUAL]

[AUDIO]
Narration-style explanation (if audio is not lowest)
[/AUDIO]

--------------------------------------------------

CONTENT SEPARATION RULE

Text, visual, and audio MUST complement each other:
• Do NOT repeat the same explanation
• Do NOT duplicate sentences
• Each block must add unique value

--------------------------------------------------

BULLET QUALITY RULES

• Bullet points must be meaningful and information-rich
• Avoid vague or generic points
• Each bullet must convey a clear concept
• Do NOT repeat the same idea

--------------------------------------------------

VISUALIZATION RULES

Place each visual immediately after the concept it explains.

STRICT RULES (must follow):

1. Use ONLY these tags: [VISUAL] ... [/VISUAL]

2. Each VISUAL block MUST include:
   * type
   * title
   * data

3. Each "data" list MUST contain AT LEAST 2 items (never less).

4. Maintain strict indentation:
   * Use "-" for list items
   * Use 2 spaces for nested fields
   * Children must be properly indented

5. Do NOT add any explanation outside VISUAL blocks.

6. Generate 3–5 VISUAL blocks using different types.

---

SUPPORTED TYPES & REQUIRED STRUCTURE:

[VISUAL]
type: flow
title: <title>
data:
- step: <step 1>
  description: <description 1>
- step: <step 2>
  description: <description 2>
[/VISUAL]

[VISUAL]
type: cycle
title: <title>
data:
- step: <phase 1>
  description: <description 1>
- step: <phase 2>
  description: <description 2>
[/VISUAL]

[VISUAL]
type: hierarchy
title: <title>
data:
- concept: <concept 1>
  description: <description 1>
- concept: <concept 2>
  description: <description 2>
[/VISUAL]

[VISUAL]
type: hierarchy
title: <title>
data:
- name: <parent 1>
  description: <description>
  children:
  - name: <child 1>
    description: <description>
  - name: <child 2>
    description: <description>
- name: <parent 2>
  description: <description>
[/VISUAL]

[VISUAL]
type: comparison
title: <title>
data:
- concept: <concept 1>
  features:
  - <feature 1>
  - <feature 2>
  visual_example: <example>
- concept: <concept 2>
  features:
  - <feature 1>
  - <feature 2>
  visual_example: <example>
[/VISUAL]

--------------------------------------------------

WRITING STYLE RULES

The material must feel like well-written study notes.
• Prefer bullet points over paragraphs
• Avoid dense text blocks
• Maintain readability and spacing

--------------------------------------------------

CHAPTER SECTION RULES (CRITICAL — READ CAREFULLY)

Each chapter must be internally divided into four logical sections:
1. Analogy
2. Real-World Application
3. Example
4. Key Takeaways

CRITICAL: Do NOT output any headings for these sections.
Do NOT write "### Analogy", "### Real-World Application", "### Example", or "### Key Takeaways" anywhere.
Do NOT write "Section Analogy", "Section Example", or any variation.
These section names must NEVER appear in the output.

Instead, flow seamlessly between sections using only [TEXT], [VISUAL], and [AUDIO] blocks.
The content blocks themselves will make the structure clear — no headings needed.

Each section content MUST contain at least ONE of [TEXT], [VISUAL], [AUDIO].
The presence and depth of each block MUST follow modality priority:
  - Highest → primary explanation
  - Second  → supporting
  - Lowest  → minimal or optional

--------------------------------------------------

KEY TAKEAWAYS RULES

• Output the Key Takeaways section as a [TEXT] block at the end of each chapter
• Maximum 5 bullet points
• Must be concise and high-value
• Do NOT repeat content from earlier in the chapter
• Do NOT add a heading — just output the bullets inside a [TEXT] block

--------------------------------------------------

BLOCK PLACEMENT RULES

• Do NOT place TEXT/VISUAL/AUDIO blocks outside of chapter content
• Do NOT create any standalone blocks at module level
• Each block must add unique value (no duplication)
• If only one modality is used → it must fully explain the section
• If multiple are used → they must complement each other

--------------------------------------------------

IMPORTANT

Do NOT mention learning styles anywhere in the content.
The content should follow the learning style percentages strictly.

--------------------------------------------------

OUTPUT FORMAT RULES (STRICT)

1. Use Markdown formatting

2. Each chapter MUST start exactly like:
   ## Chapter X: Chapter Title

3. Do NOT add any headings inside chapters other than the chapter title itself.
   This means NO ### headings of any kind inside a chapter.

4. Do NOT add quizzes

5. Do NOT mention learning styles

6. Do NOT write explanations outside markdown

7. Return ONLY the markdown content

8. Always write content inside the tags [TEXT], [VISUAL], and [AUDIO] as specified.
   The opening tag must be immediately followed by the content, then the closing tag.
   Do NOT write any content outside these tags inside a chapter.

9. NEVER output section names like "Analogy", "Real-World Application", "Example", or
   "Key Takeaways" as headings or inline labels — not even as bold text or prefixes.

`.trim();
}