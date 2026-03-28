/**
 * Accuracy-based diagnosis
 * Calculates per-concept accuracy and classifies strength levels
 */
export function analyzeAccuracy(answers, questions) {
  const conceptStats = {};

  questions.forEach((q, i) => {
    const answer = answers[i];
    if (!answer) return;
    const isCorrect = answer.selected === q.correctAnswer;

    q.concepts.forEach(concept => {
      if (!conceptStats[concept]) {
        conceptStats[concept] = { correct: 0, total: 0 };
      }
      conceptStats[concept].total += 1;
      if (isCorrect) conceptStats[concept].correct += 1;
    });
  });

  const conceptScores = {};
  const weakConcepts = [];
  const strongConcepts = [];

  Object.entries(conceptStats).forEach(([concept, stats]) => {
    const score = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    conceptScores[concept] = score;

    if (score < 50) weakConcepts.push(concept);
    if (score >= 80) strongConcepts.push(concept);
  });

  return { conceptScores, weakConcepts, strongConcepts };
}
