// Mega Quiz Generation Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { generateMegaQuizQuestions } from '../../../../lib/ai';

export async function POST(req: NextRequest) {
  let subjectId;
  try {
    const body = await req.json();
    subjectId = body.subjectId;
  } catch (e) {
    return NextResponse.json({ error: 'Invalid or missing JSON body. Please POST { subjectId }.' }, { status: 400 });
  }
  if (!subjectId) {
    return NextResponse.json({ error: 'Missing subjectId' }, { status: 400 });
  }

  // Fetch all topics for the subject's modules
  const modulesRes = await db.query(
    `SELECT topics FROM modules WHERE course_id = $1 ORDER BY module_order ASC`,
    [subjectId]
  );
  if (!modulesRes.rows.length) {
    return NextResponse.json({ error: 'No topics found for subject' }, { status: 404 });
  }

  // Flatten and combine all topics
  let allTopics: string[] = [];
  for (const row of modulesRes.rows) {
    if (Array.isArray(row.topics)) {
      allTopics = allTopics.concat(row.topics);
    } else if (typeof row.topics === 'string') {
      try {
        const parsed = JSON.parse(row.topics);
        if (Array.isArray(parsed)) allTopics = allTopics.concat(parsed);
      } catch {
        allTopics = allTopics.concat(row.topics.split(',').map(t => t.trim()));
      }
    }
  }

  // Remove duplicates and empty
  allTopics = [...new Set(allTopics)].filter(Boolean);
  if (!allTopics.length) {
    return NextResponse.json({ error: 'No valid topics found for subject' }, { status: 404 });
  }

  const quizQuestions = await generateMegaQuizQuestions(allTopics.join(', '), 25);

  return NextResponse.json({
    quiz: quizQuestions,
    message: 'Mega Quiz generated from all module topics.'
  });
}