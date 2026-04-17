// Mega Quiz Submission Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeAuthToken } from '../../../../lib/auth';

import { db } from '../../../../lib/db';
import {
  calculateAccuracy,
  calculateAvgTime,
  difficultyWisePerformance,
  topicWisePerformance,
  confidenceCalibration,
  engagementScore,
  learningGain
} from '../../../../lib/megaQuizAnalytics';
// Removed sampleResult import

export async function POST(req: NextRequest) {
  // Get userId from JWT in cookies
  const token = (await cookies()).get('auth_token')?.value;
  const userId = token ? decodeAuthToken(token) : null;

  const body = await req.json();
  const { subjectId, responses, preScore } = body;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized: user not found' }, { status: 401 });
  }

  // Compute analytics
  const accuracy = calculateAccuracy(responses);
  const avg_time = calculateAvgTime(responses);
  const difficulty_performance = difficultyWisePerformance(responses);
  const topic_performance = topicWisePerformance(responses);
  const confidence_calibration = confidenceCalibration(responses);
  const engagement_score = engagementScore(responses, responses.length);
  const learning_gain = preScore !== undefined ? learningGain(preScore, accuracy * 100) : null;

  // Store attempt
  const attemptRes = await db.query(
    `INSERT INTO quiz_attempts (user_id, subject_id, score, engagement_score, learning_gain, started_at, completed_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`,
    [userId, subjectId, accuracy * 100, engagement_score * 100, learning_gain]
  );
  const attemptId = attemptRes.rows[0].id;

  // Store responses
  for (const r of responses) {
    // Build response_data JSON object
    const response_data = {
      question: r.question, // question text
      options: r.options,   // options array
      correct_answer: r.correct_answer,
      user_answer: r.selected_answer
    };
    await db.query(
      `INSERT INTO question_responses
        (attempt_id, subject_id, question_id, response_data, is_correct, time_taken, confidence_level, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        attemptId,
        subjectId,
        r.question_id,
        response_data,
        r.is_correct,
        r.time_taken,
        r.confidence_level
      ]
    );
  }

  // Store analytics summary
  const analyticsRes = await db.query(
    `INSERT INTO analytics_summary
      (attempt_id, subject_id, accuracy, avg_time, difficulty_performance, topic_performance, confidence_calibration, engagement_score, learning_gain, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING id`,
    [
      attemptId,
      subjectId,
      accuracy * 100,
      avg_time,
      JSON.stringify(difficulty_performance),
      JSON.stringify(topic_performance),
      JSON.stringify(confidence_calibration),
      engagement_score * 100,
      learning_gain
    ]
  );
  const analyticsId = analyticsRes.rows[0].id;

  // Update quiz_attempts with analytics_summary_id
  await db.query(
    `UPDATE quiz_attempts SET analytics_summary_id = $1 WHERE id = $2`,
    [analyticsId, attemptId]
  );

  const analytics = {
    accuracy,
    avg_time,
    difficulty_performance,
    topic_performance,
    confidence_calibration,
    engagement_score,
    learning_gain
  };

  return NextResponse.json({
    result: analytics,
    message: 'Quiz submission processed and stored.'
  });
}
