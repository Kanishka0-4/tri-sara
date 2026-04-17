// Utility functions for Mega Quiz analytics

export function calculateAccuracy(responses) {
  if (!responses.length) return 0;
  const correct = responses.filter(r => r.is_correct).length;
  return correct / responses.length;
}

export function calculateAvgTime(responses) {
  if (!responses.length) return 0;
  const total = responses.reduce((sum, r) => sum + (r.time_taken || 0), 0);
  return total / responses.length;
}

export function difficultyWisePerformance(responses) {
  const result = {};
  responses.forEach(r => {
    if (!result[r.difficulty]) result[r.difficulty] = { correct: 0, total: 0 };
    if (r.is_correct) result[r.difficulty].correct++;
    result[r.difficulty].total++;
  });
  Object.keys(result).forEach(level => {
    result[level].accuracy = result[level].correct / result[level].total;
  });
  return result;
}

export function topicWisePerformance(responses) {
  const result = {};
  responses.forEach(r => {
    if (!result[r.topic]) result[r.topic] = { correct: 0, total: 0 };
    if (r.is_correct) result[r.topic].correct++;
    result[r.topic].total++;
  });
  Object.keys(result).forEach(topic => {
    result[topic].accuracy = result[topic].correct / result[topic].total;
  });
  return result;
}

export function confidenceCalibration(responses) {
  const result = {};
  responses.forEach(r => {
    if (!result[r.confidence_level]) result[r.confidence_level] = { correct: 0, total: 0 };
    if (r.is_correct) result[r.confidence_level].correct++;
    result[r.confidence_level].total++;
  });
  Object.keys(result).forEach(level => {
    result[level].accuracy = result[level].correct / result[level].total;
  });
  return result;
}

export function engagementScore(responses, totalQuestions) {
  // Example: combine completion rate, avg time, consistency
  const completionRate = responses.length / totalQuestions;
  const avgTime = calculateAvgTime(responses);
  // Consistency: std deviation of time taken
  const times = responses.map(r => r.time_taken || 0);
  const mean = avgTime;
  const variance = times.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / times.length;
  const stdDev = Math.sqrt(variance);
  // Lower stdDev = more consistent
  return (completionRate * 0.5) + (1 / (1 + avgTime) * 0.3) + (1 / (1 + stdDev) * 0.2);
}

export function learningGain(preScore, postScore) {
  if (preScore === undefined || postScore === undefined) return null;
  return (postScore - preScore) / (100 - preScore);
}
