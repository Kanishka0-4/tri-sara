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

  /* ------------------------------------------------------------------ */
  /* STEP 1 — Rank modalities, handle ties deterministically             */
  /* ------------------------------------------------------------------ */

  type Modality = { name: string; value: number };

  const modalities: Modality[] = [
    { name: "TEXT",   value: profile.text   },
    { name: "VISUAL", value: profile.visual },
    { name: "AUDIO",  value: profile.audio  },
  ];

  // Sort descending; on a tie, prefer TEXT > VISUAL > AUDIO (arbitrary but consistent)
  const tieOrder: Record<string, number> = { TEXT: 0, VISUAL: 1, AUDIO: 2 };
  modalities.sort((a, b) =>
    b.value !== a.value ? b.value - a.value : tieOrder[a.name] - tieOrder[b.name]
  );

  const [primary, secondary, tertiary] = modalities;

  const rankOf = (name: string): "highest" | "second" | "lowest" => {
    if (primary.name   === name) return "highest";
    if (secondary.name === name) return "second";
    return "lowest";
  };

  /* ------------------------------------------------------------------ */
  /* STEP 2 — Per-modality rule strings (ALL 3 ranks × 3 modalities)    */
  /* ------------------------------------------------------------------ */

  // ── TEXT ──
  const textRules: Record<"highest" | "second" | "lowest", string> = {
    highest: `
[TEXT] block is PRIMARY — it carries the main explanation.
- Write exactly 12–14 bullet points. No more, no fewer.
- Max 2 sentences per bullet.
- Total word count: 280–340 words.
- Every bullet must be concrete and information-rich — no filler, no repetition.
- Do NOT pad with generic closing statements like "X is important for developers".
[/TEXT]`.trim(),

    second: `
[TEXT] block is SUPPORTING — it reinforces the primary modality.
- Write exactly 7–9 bullet points. No more, no fewer.
- Max 2 sentences per bullet.
- Total word count: 160–210 words.
- Text must complement the visual — do NOT restate what the visual already shows.
- Do NOT pad with generic closing statements.
[/TEXT]`.trim(),

    lowest: `
[TEXT] block is MINIMAL — brief orientation only.
- Write exactly 4–6 bullet points. No more, no fewer.
- 1 sentence per bullet.
- Total word count: 100–140 words.
- Only name and define key terms. Leave all explanation to the primary modality.
[/TEXT]`.trim(),
  };

  // ── VISUAL ──
  const visualRules: Record<"highest" | "second" | "lowest", string> = {
    highest: `
[VISUAL] block is PRIMARY — visuals carry the main explanation.
- Include exactly 2 VISUAL blocks per chapter, each explaining a DIFFERENT concept.
- Choose the most appropriate type for each concept (flow, cycle, hierarchy, comparison).
- Each visual must be detailed: at least 4 data items.
- Text and audio must support visuals, not repeat them.
- A student must be able to understand the chapter concept from visuals alone.
[/VISUAL]`.trim(),

    second: `
[VISUAL] block is SUPPORTING — visuals reinforce and extend the text.
- Include exactly 1 VISUAL block per chapter.
- Choose the type that best maps the concept's structure.
- Must have at least 3 data items — do not produce a thin visual.
- Must show something the text does not explicitly state (a relationship, a structure, a contrast).
[/VISUAL]`.trim(),

    lowest: `
[VISUAL] block is MINIMAL — one simple supplementary visual only.
- Include exactly 1 VISUAL block per chapter, kept simple.
- Maximum 3 data items.
- The visual is decorative/supplementary — understanding must not depend on it.
[/VISUAL]`.trim(),
  };

  // ── AUDIO ──
  const audioRules: Record<"highest" | "second" | "lowest", string> = {
  highest: `
[AUDIO] block is a FULL CHAPTER NARRATION — primary learning mode.
- Write 220–280 words in a warm, friendly teacher voice.
- Must cover the ENTIRE chapter: analogy, core concept, real-world example, and conclusion.
- Structure (follow this order):
  1. Open with a vivid analogy that makes the whole concept click.
  2. Walk through the concept step by step as if lecturing to a student.
  3. Give a detailed real-world example with specific names/numbers/scenarios.
  4. Close with a sentence connecting this chapter to the bigger subject.
- A student who ONLY listens to this audio must fully understand the entire chapter.
- This is NOT a summary — it is a complete standalone lecture in audio form.
[/AUDIO]`.trim(),

  second: `
[AUDIO] block is a CHAPTER OVERVIEW NARRATION — supporting learning mode.
- Write 130–170 words in a clear, engaging conversational tone.
- Must cover the ENTIRE chapter at a medium level of detail.
- Structure (follow this order):
  1. Open with a short analogy or hook.
  2. Explain the core concept and its key components conversationally.
  3. Give one concrete real-world example.
  4. Close with the single most important takeaway from the chapter.
- Should feel like a concise podcast segment covering the chapter topic.
- Must NOT simply repeat bullet points from the text — synthesise and narrate.
[/AUDIO]`.trim(),

  lowest: `
[AUDIO] block is a CHAPTER SUMMARY NARRATION — minimal learning mode.
- Write 60–90 words in a punchy, clear tone.
- Must still reference the full chapter — not just one concept.
- Structure:
  1. One analogy or hook sentence.
  2. Two or three sentences covering the most important points of the chapter.
  3. One closing sentence with the key takeaway.
- Think of it as a 30-second recap that gives a complete picture of the chapter.
[/AUDIO]`.trim(),
};

  const textRule   = textRules[rankOf("TEXT")];
  const visualRule = visualRules[rankOf("VISUAL")];
  const audioRule  = audioRules[rankOf("AUDIO")];

  /* ------------------------------------------------------------------ */
  /* STEP 3 — Assemble prompt                                            */
  /* ------------------------------------------------------------------ */

  return `
You are an expert university educator. Generate structured learning content for the module below.

SUBJECT: ${subjectTitle}
MODULE:  ${moduleTitle}
GOAL:    ${goal ?? ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHAPTERS TO GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${safeTopics.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Generate exactly ${safeTopics.length} chapters. Each chapter maps to exactly one subtopic above.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEARNER PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Text:   ${profile.text}%
Visual: ${profile.visual}%
Audio:  ${profile.audio}%

Modality priority (highest → lowest):
1. ${primary.name}   (${primary.value}%) ← PRIMARY
2. ${secondary.name} (${secondary.value}%) ← SUPPORTING
3. ${tertiary.name}  (${tertiary.value}%) ← MINIMAL

This ranking MUST be clearly reflected in the depth and length of each block.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RANKING ENFORCEMENT — CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The modality ranking MUST be physically visible in the output.
A reader must be able to look at any chapter and immediately identify
which modality is primary just from the volume and depth of content.

STRICT RULES:
- The PRIMARY block must always be noticeably longer and deeper than SUPPORTING.
- The SUPPORTING block must always be noticeably longer and deeper than MINIMAL.
- If two modalities have equal percentages, their blocks must be equal in depth.
- NEVER let the TEXT block dominate if it is not ranked PRIMARY.
- Do NOT add extra bullets or sentences to any block beyond the specified range.
- Do NOT pad any block with generic conclusions, motivational statements,
  or phrases like "mastering X will help you become a better developer."
  Every sentence must carry unique informational value.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT BLOCK FORMAT — MANDATORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every chapter MUST contain blocks in this EXACT order and format:

[TEXT]
content here
[/TEXT]

[VISUAL]
content here
[/VISUAL]

[AUDIO]
content here
[/AUDIO]

[TEXT]
key takeaway bullets here
[/TEXT]

CRITICAL TAG RULES:
- Every opening tag [TEXT], [VISUAL], [AUDIO] MUST have a matching closing tag [/TEXT], [/VISUAL], [/AUDIO]
- Closing tags MUST have a forward slash: [/TEXT] not [TEXT]
- No content may appear outside these tags inside a chapter
- Do NOT nest tags inside each other

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEPTH RULES PER BLOCK — FOLLOW EXACTLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${textRule}

${visualRule}

${audioRule}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VISUAL BLOCK FORMATS — USE ONLY THESE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[VISUAL]
type: flow
title: <title>
data:
- step: <step>
  description: <description>
- step: <step>
  description: <description>
[/VISUAL]

[VISUAL]
type: cycle
title: <title>
data:
- step: <phase>
  description: <description>
- step: <phase>
  description: <description>
[/VISUAL]

[VISUAL]
type: hierarchy
title: <title>
data:
- name: <parent>
  description: <description>
  children:
  - name: <child>
    description: <description>
  - name: <child>
    description: <description>
[/VISUAL]

[VISUAL]
type: comparison
title: <title>
data:
- concept: <concept>
  features:
  - <feature>
  - <feature>
  visual_example: <example>
- concept: <concept>
  features:
  - <feature>
  - <feature>
  visual_example: <example>
[/VISUAL]

Each data list must have at least 2 items. Do not invent new types.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHAPTER RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Every chapter starts with: ## Chapter X: Chapter Title

2. No headings of ANY kind inside chapters — no ###, no bold labels, no ALL CAPS labels.
   FORBIDDEN examples (never output these):
   - "KEY TAKEAWAYS"
   - "• KEY TAKEAWAYS"
   - "**Key Takeaways**"
   - "### Analogy"
   - "Real-World Application:"
   Just output the block tags and content. No labels whatsoever.

3. Each chapter must cover: an analogy, a real-world application, a worked example,
   and key takeaways — woven naturally into the blocks without any labels.

4. The LAST block of every chapter must be a [TEXT]...[/TEXT] block containing
   exactly 3–5 concise synthesis bullet points as key takeaways.
   These must NOT repeat content from earlier in the chapter.
   CORRECT format:
   [TEXT]
   - Key insight one synthesised from the chapter.
   - Key insight two that connects concepts together.
   - Key insight three with a practical implication.
   [/TEXT]

5. TEXT, VISUAL, and AUDIO must each add unique value — no duplicated explanations.

6. Each chapter = ~1–2 hours of study material. Do not write thin chapters.
   Strictly follow the bullet count and word count limits in the depth rules above.

7. Never mention learning styles or modality names in the content.

8. Do NOT add quizzes, module intros, or module conclusions.

9. Return ONLY markdown chapter content — nothing else.
`.trim();
}