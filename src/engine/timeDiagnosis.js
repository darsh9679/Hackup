/**
 * Time-based diagnosis
 * Analyzes response patterns based on time spent per question
 */
export function analyzeTime(answers, questions) {
  let guessingCount = 0;
  let lowFluencyCount = 0;
  let confusionCount = 0;
  let stableCount = 0;
  const perQuestion = [];

  questions.forEach((q, i) => {
    const answer = answers[i];
    if (!answer) return;

    const isCorrect = answer.selected === q.correctAnswer;
    const timeLimit = q.timeLimitSeconds || 45;
    const timeTaken = answer.timeTaken || 0;

    // Define thresholds relative to time limit
    const fastThreshold = timeLimit * 0.25;  // < 25% of time = very fast
    const slowThreshold = timeLimit * 0.75;  // > 75% of time = slow

    let pattern = "stable";

    if (timeTaken < fastThreshold && !isCorrect) {
      pattern = "guessing";
      guessingCount++;
    } else if (timeTaken > slowThreshold && isCorrect) {
      pattern = "lowFluency";
      lowFluencyCount++;
    } else if (timeTaken > slowThreshold && !isCorrect) {
      pattern = "confusion";
      confusionCount++;
    } else if (isCorrect) {
      pattern = "stable";
      stableCount++;
    }

    perQuestion.push({
      questionId: q.id,
      timeTaken,
      timeLimit,
      isCorrect,
      pattern,
    });
  });

  const total = perQuestion.length || 1;

  return {
    guessing: guessingCount / total > 0.2,
    lowFluency: lowFluencyCount / total > 0.2,
    confusion: confusionCount / total > 0.2,
    stable: stableCount / total > 0.5,
    counts: { guessingCount, lowFluencyCount, confusionCount, stableCount },
    perQuestion,
  };
}
