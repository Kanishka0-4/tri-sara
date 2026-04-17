// Mega Quiz Analytics Endpoint
import { NextRequest, NextResponse } from 'next/server';

import { db } from '../../../../lib/db';
import { cookies } from 'next/headers';
import { decodeAuthToken } from '../../../../lib/auth';
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
  // Parse request for analytics
  const body = await req.json();
  const { subjectId } = body;

  // Get userId from JWT in cookies
  const token = (await cookies()).get('auth_token')?.value;
  const userId = token ? decodeAuthToken(token) : null;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized: user not found' }, { status: 401 });
  }

  // Get latest mega quiz attempt for this user and subject
  const attemptRes = await db.query(
    `SELECT * FROM quiz_attempts WHERE user_id = $1 AND subject_id = $2 AND completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT 1`,
    [userId, subjectId]
  );
  if (!attemptRes.rows.length) {
    return NextResponse.json({ analytics: null, message: 'No mega quiz attempt found.' });
  }
  const attempt = attemptRes.rows[0];

  // Get all responses for this attempt
  const responsesRes = await db.query(
    `SELECT * FROM question_responses WHERE attempt_id = $1`,
    [attempt.id]
  );
  const responses = responsesRes.rows;

  // Compose analytics result (full)
  const accuracy = attempt.score / 100;
  const avg_time = calculateAvgTime(responses);
  const difficulty_performance = difficultyWisePerformance(responses);
  const topic_performance = topicWisePerformance(responses);
  const confidence_calibration = confidenceCalibration(responses);
  const engagement_score = attempt.engagement_score ? attempt.engagement_score / 100 : engagementScore(responses, responses.length);
  const learning_gain = attempt.learning_gain !== undefined ? attempt.learning_gain : null;
  const analytics = {
    accuracy,
    avg_time,
    difficulty_performance,
    topic_performance,
    confidence_calibration,
    engagement_score,
    learning_gain,
    responses,
    completed_at: attempt.completed_at
  };
  return NextResponse.json({ analytics });
}
