import React from 'react';

const ResultDashboard = ({ result }: { result: any }) => {
  if (!result) return (
    <div className="flex items-center justify-center min-h-[300px] bg-black text-yellow-300 rounded-xl border-2 border-yellow-400 shadow-lg p-8">
      Loading results...
    </div>
  );
  // Insights
  let insights = [];
  if (result.confidence_calibration) {
    const conf = result.confidence_calibration;
    if (conf["Very High"] && conf["Very High"].accuracy < 0.7) insights.push("High confidence but low accuracy indicates guessing.");
    if (conf["Low"] && conf["Low"].accuracy > 0.7) insights.push("Low confidence but high accuracy: you underestimate yourself.");
  }
  if (result.topic_performance) {
    // Type guard for topic_performance entries
    const topics = Object.entries(result.topic_performance) as [string, { accuracy: number }][];
    topics.sort((a, b) => (b[1]?.accuracy ?? 0) - (a[1]?.accuracy ?? 0));
    if (topics.length > 0) {
      insights.push(`You perform best in ${topics[0][0]}`);
      insights.push(`You struggle with ${topics[topics.length - 1][0]}`);
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-black rounded-2xl border-2 border-yellow-400 shadow-2xl p-8 flex flex-col gap-6 text-yellow-100">
      <h2 className="text-3xl font-bold text-yellow-300 mb-4 text-center">Quiz Results</h2>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-2">
        <div className="bg-gray-900 border-2 border-yellow-400 rounded-lg px-6 py-4 text-center flex-1">
          <div className="text-lg font-semibold text-yellow-200">Overall Score</div>
          <div className="text-3xl font-bold text-yellow-400">{(result.accuracy * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-gray-900 border-2 border-blue-400 rounded-lg px-6 py-4 text-center flex-1">
          <div className="text-lg font-semibold text-blue-200">Avg Time / Q</div>
          <div className="text-2xl font-bold text-blue-400">{result.avg_time?.toFixed(2)}s</div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-900 border-2 border-yellow-400 rounded-lg p-4">
          <strong className="text-yellow-300">Topic-wise Performance:</strong>
          <ul className="mt-2 space-y-1">
            {result.topic_performance && Object.entries(result.topic_performance).map(([topic, perf]: any) => (
              <li key={topic} className="flex justify-between"><span>{topic}</span> <span className="font-bold">{(perf.accuracy * 100).toFixed(1)}%</span></li>
            ))}
          </ul>
        </div>
        <div className="bg-gray-900 border-2 border-blue-400 rounded-lg p-4">
          <strong className="text-blue-300">Difficulty-wise Accuracy:</strong>
          <ul className="mt-2 space-y-1">
            {result.difficulty_performance && Object.entries(result.difficulty_performance).map(([level, perf]: any) => (
              <li key={level} className="flex justify-between"><span>{level}</span> <span className="font-bold">{(perf.accuracy * 100).toFixed(1)}%</span></li>
            ))}
          </ul>
        </div>
        <div className="bg-gray-900 border-2 border-yellow-400 rounded-lg p-4">
          <strong className="text-yellow-300">Confidence vs Accuracy:</strong>
          <ul className="mt-2 space-y-1">
            {result.confidence_calibration && Object.entries(result.confidence_calibration).map(([level, perf]: any) => (
              <li key={level} className="flex justify-between"><span>{level}</span> <span className="font-bold">{(perf.accuracy * 100).toFixed(1)}%</span></li>
            ))}
          </ul>
        </div>
        <div className="bg-gray-900 border-2 border-blue-400 rounded-lg p-4">
          <strong className="text-blue-300">Engagement Score:</strong>
          <div className="mt-2 text-2xl font-bold">{(result.engagement_score * 100).toFixed(1)}%</div>
          {result.learning_gain !== null && <div className="mt-2 text-yellow-200">Learning Gain: <span className="font-bold">{(result.learning_gain * 100).toFixed(1)}%</span></div>}
        </div>
      </div>
      <div className="bg-gray-900 border-2 border-yellow-400 rounded-lg p-4 mt-4">
        <strong className="text-yellow-300">Insights:</strong>
        <ul className="mt-2 list-disc list-inside space-y-1">
          {insights.map((i, idx) => <li key={idx} className="text-yellow-100">{i}</li>)}
        </ul>
      </div>
    </div>
  );
};

export default ResultDashboard;
