// GET: Get all module quiz scores for a subject and user
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const userId = token ? decodeAuthToken(token) : null;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    if (!subjectId) {
      return NextResponse.json({ error: "Missing subjectId" }, { status: 400 });
    }
    const result = await pool.query(
      `SELECT module_order, score, total, retry_after FROM module_quiz WHERE subject_id = $1 AND user_id = $2 ORDER BY module_order ASC`,
      [subjectId, userId]
    );
    return NextResponse.json({ scores: result.rows });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch module scores" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { Pool } from "pg";
import { cookies } from "next/headers";
import { decodeAuthToken } from "@/lib/auth";
import { generateModuleContent } from "../../ai/generateModuleContent";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function adjustVARKWeights(
  profile: { visual: number; audio: number; text: number },
  scorePercent: number
) {
  let { visual, audio, text } = profile;
  if (scorePercent >= 70) {
    return { visual, audio, text };
  } else if (scorePercent >= 40) {
    const arr = [visual, audio, text];
    const sorted = [...arr].sort((a, b) => b - a);
    const secondIdx = arr.indexOf(sorted[1]);
    arr[secondIdx] += 10;
    arr[arr.indexOf(sorted[0])] -= 10;
    return { visual: arr[0], audio: arr[1], text: arr[2] };
  } else {
    return { visual: 40, audio: 20, text: 40};
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const userId = token ? decodeAuthToken(token) : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subjectId, moduleOrder, score, total, profile, quiz } = body;

    if (!subjectId || !moduleOrder || score == null || !total || !profile || !quiz) {
      return NextResponse.json(
        { error: "Missing fields (require subjectId, moduleOrder, score, total, profile, quiz)" },
        { status: 400 }
      );
    }

    const scoreInt = parseInt(score, 10);
    const totalInt = parseInt(total, 10);
    if (isNaN(scoreInt) || isNaN(totalInt)) {
      return NextResponse.json({ error: "Score and total must be integers" }, { status: 400 });
    }


    const percent = Math.round((scoreInt / totalInt) * 100);
    let retryAfter = null;

    if (percent < 50) {
      retryAfter = Date.now() + 7 * 24 * 60 * 60 * 1000; // 1 week
    }
    let newProfile = adjustVARKWeights(profile, percent);

    // ── Additional Adaptation: Adjust by time spent per block type ──
    try {
      // Use moduleOrder (INTEGER) for module_id in module_block_time
      const moduleIdInt = parseInt(moduleOrder, 10);
      if (!isNaN(moduleIdInt)) {
        // Fetch time spent per block type
        const timeRes = await pool.query(
          `SELECT block_type, time_spent_seconds FROM module_block_time WHERE user_id = $1 AND subject_id = $2 AND module_id = $3`,
          [userId, subjectId, moduleIdInt]
        );
        if (timeRes.rows.length > 0) {
          // Map block_type to VARK keys
          const varkMap = { visual: 'visual', audio: 'audio', text: 'text' } as const;
          type VarkKey = keyof typeof varkMap;
          // Only consider VARK types present in profile
          const times = timeRes.rows.filter(
            (r) => {
              const key = r.block_type as VarkKey;
              return key in varkMap && varkMap[key] in newProfile;
            }
          );
          if (times.length >= 2) {
            // Find max and min
            let max = times[0], min = times[0];
            for (const t of times) {
              if (t.time_spent_seconds > max.time_spent_seconds) max = t;
              if (t.time_spent_seconds < min.time_spent_seconds) min = t;
            }
            // Type guard for block_type
            const maxKey = varkMap[max.block_type as VarkKey] as keyof typeof newProfile;
            const minKey = varkMap[min.block_type as VarkKey] as keyof typeof newProfile;
            // Adjust +5% to max, -5% to min
            newProfile[maxKey] = Math.min(100, newProfile[maxKey] + 5);
            newProfile[minKey] = Math.max(0, newProfile[minKey] - 5);
            // Normalize to sum 100%
            const total = newProfile.visual + newProfile.audio + newProfile.text;
            if (total !== 100) {
              // Scale all so sum is 100
              newProfile.visual = Math.round((newProfile.visual / total) * 100);
              newProfile.audio = Math.round((newProfile.audio / total) * 100);
              newProfile.text = 100 - newProfile.visual - newProfile.audio;
            }
          }
        }
      }
    } catch (err) {
      console.warn('Could not adjust VARK by block time:', err);
    }

    // Update score in module_quiz
    try {
      const result = await pool.query(
        `UPDATE module_quiz
          SET score = $1,
              total = $2,
              retry_after = $3
          WHERE subject_id = $4 AND module_order = $5 AND user_id = $6`,
      [scoreInt, totalInt, retryAfter, subjectId, moduleOrder, userId]
      );

      if (result.rowCount === 0) {
        return NextResponse.json(
          { error: "No module_quiz row found. Was the quiz generated first?" },
          { status: 404 }
        );
      }

    } catch (err) {
      const e = err as any;
      console.error("Failed to update module_quiz or module progress", e);
      return NextResponse.json(
        { error: "Failed to save quiz score or update progress", details: e?.message || String(e) },
        { status: 500 }
      );
    }


    // Update user learning profile
    try {
      const result = await pool.query(
        `UPDATE users SET learning_profile = $1 WHERE id = $2`,
        [JSON.stringify(newProfile), userId]
      );

      if (result.rowCount === 0) {
        return NextResponse.json({ error: "User not found for profile update" }, { status: 404 });
      }
    } catch (err) {
      const e = err as any;
      console.error("Failed to update user learning_profile", e);
      return NextResponse.json(
        { error: "Failed to update user profile", details: e?.message || String(e) },
        { status: 500 }
      );
    }

    // ── Learning Gain Calculation and Storage ──

    let preScore = 0, preTotal = 1; // avoid division by zero
    let postScore = scoreInt, postTotal = totalInt;
    let preModuleOrder = parseInt(moduleOrder, 10) - 1;
    let moduleId = null;
    // Always get moduleId from modules table for current subject/moduleOrder
    try {
      const moduleRes = await pool.query(
        `SELECT id FROM modules WHERE course_id = $1 AND module_order = $2`,
        [subjectId, moduleOrder]
      );
      if (moduleRes.rows.length > 0) {
        moduleId = moduleRes.rows[0].id;
      }
    } catch (err) {
      console.warn("Could not fetch module id for learning_gain", err);
    }

    if (parseInt(moduleOrder, 10) === 1) {
      // First module: get preScore from pre_quiz_attempts using userId and the integer module_id from pre_quiz_attempts
      // Find the pre_quiz_attempts row for this user and subject (course)
      const preQuizRes = await pool.query(
        `SELECT score, module_id FROM pre_quiz_attempts WHERE user_id = $1 ORDER BY attempt_date DESC LIMIT 1`,
        [userId]
      );
      if (preQuizRes.rows.length > 0) {
        preScore = parseFloat(preQuizRes.rows[0].score);
        const preQuizModuleId = preQuizRes.rows[0].module_id;
        // Try to get preTotal from pre_quiz_questions count using the integer module_id
        const preTotalRes = await pool.query(
          `SELECT COUNT(*) FROM pre_quiz_questions WHERE module_id = $1`,
          [preQuizModuleId]
        );
        if (preTotalRes.rows.length > 0) {
          preTotal = parseInt(preTotalRes.rows[0].count, 10);
        }
      }
    } else {
      // Not first module: get preScore from previous module_quiz
      const prevQuizRes = await pool.query(
        `SELECT score, total FROM module_quiz WHERE user_id = $1 AND subject_id = $2 AND module_order = $3`,
        [userId, subjectId, preModuleOrder]
      );
      if (prevQuizRes.rows.length > 0) {
        preScore = parseFloat(prevQuizRes.rows[0].score);
        preTotal = parseInt(prevQuizRes.rows[0].total, 10);
      }
    }

    // Normalize
    const preNorm = preTotal > 0 ? preScore / preTotal : 0;
    const postNorm = postTotal > 0 ? postScore / postTotal : 0;
    // Learning gain formula: gain = (post - pre) / (1 - pre)
    let gain = null;
    if (preNorm < 1) {
      gain = (postNorm - preNorm) / (1 - preNorm);
    }

    // Insert into learning_gain
    try {
      await pool.query(
        `INSERT INTO learning_gain (user_id, subject_id, module_id, pre_score, post_score, gain, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, subjectId, moduleId, preNorm, postNorm, gain]
      );
    } catch (err) {
      console.error("Failed to insert learning_gain row", err);
      // Do not block response on this error
    }

    // ── Trigger next module generation in the background ──
const nextModuleOrder = parseInt(moduleOrder, 10) + 1;

(async () => {
  try {
    const existingContent = await pool.query(
      `SELECT id FROM module_content WHERE subject_id = $1 AND module_order = $2`,
      [subjectId, nextModuleOrder]
    );

    if (existingContent.rows.length > 0) {
      console.log(`📦 Module ${nextModuleOrder} already exists, skipping generation`);
      return;
    }

    const nextModule = await pool.query(
      `SELECT title, goal, topics FROM modules
       WHERE course_id = $1 AND module_order = $2`,
      [subjectId, nextModuleOrder]
    );

    if (nextModule.rows.length === 0) {
      console.log(`ℹ️ No module ${nextModuleOrder} found — this was the last module`);
      return;
    }

    const subjectRes = await pool.query(
      `SELECT title FROM module_subjects WHERE id = $1`,
      [subjectId]
    );

    if (subjectRes.rows.length === 0) {
      console.warn(`⚠️ Subject ${subjectId} not found`);
      return;
    }

    const subjectTitle = subjectRes.rows[0].title;
    const mod = nextModule.rows[0];

    console.log(`🤖 Generating Module ${nextModuleOrder} for subject ${subjectId}...`);

    await generateModuleContent({
      subjectId: parseInt(subjectId, 10),
      subjectTitle,
      module: {
        title: mod.title,
        topics: mod.topics,
        expected_outcome: mod.goal,
      },
      moduleOrder: nextModuleOrder,
    });

    console.log(`✅ Module ${nextModuleOrder} generated`);
  } catch (err) {
    console.error(`❌ Background generation of module ${nextModuleOrder} failed:`, err);
  }
})();


    return NextResponse.json({ newProfile, percent });
  } catch (err: any) {
    console.error("Score save failed", err);
    return NextResponse.json(
      { error: "Score save failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}