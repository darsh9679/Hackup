/**
 * AI-Assisted Confidence Inference Engine
 * Infers student confidence based on answer correctness, time taken, and difficulty.
 */

/**
 * Calculate numerical confidence score (0 to 1) based on heuristics.
 * @param {Object} input
 * @returns {number}
 */
export function calculateBaseConfidence(input) {
  const { isCorrect, timeTaken, avgExpectedTime, difficulty } = input;
  
  // timeRatio < 1 means faster than average; > 1 means slower
  const timeRatio = timeTaken / (avgExpectedTime || 30);
  const isFast = timeRatio < 0.8;
  const isSlow = timeRatio > 1.2;
  
  let score = 0.5; // default
  
  if (isCorrect) {
    if (isFast) {
      score = 0.85 + Math.random() * 0.1; // 0.85 - 0.95
    } else if (isSlow) {
      score = 0.5 + Math.random() * 0.2; // 0.5 - 0.7
    } else {
      score = 0.7 + Math.random() * 0.1; // 0.7 - 0.8
    }
  } else {
    if (isFast) {
      score = 0.6 + Math.random() * 0.25; // 0.6 - 0.85 (overconfident/rushed)
    } else if (isSlow) {
      score = 0.2 + Math.random() * 0.2; // 0.2 - 0.4 (confused/lost)
    } else {
      score = 0.4 + Math.random() * 0.2; // 0.4 - 0.6
    }
  }
  
  // Adjust slightly for difficulty
  if (difficulty === "hard") {
    score -= 0.05;
  } else if (difficulty === "easy") {
    score += 0.05;
  }
  
  return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
}

/**
 * Classify the computed score and input context into a psychological type.
 * @param {Object} input
 * @param {number} score
 * @returns {string} type
 */
export function classifyConfidence(input, score) {
  const { isCorrect, timeTaken, avgExpectedTime } = input;
  const timeRatio = timeTaken / (avgExpectedTime || 30);
  const isFast = timeRatio < 0.6;
  const isSlow = timeRatio > 1.5;
  
  if (isCorrect) {
    if (isSlow) return "underconfidence";
    return "true_confidence";
  } else {
    if (isFast) return "overconfidence";
    if (isSlow) return "confusion";
    return "guessing";
  }
}

/**
 * Generate a static explanation based on the type.
 */
export function generateAIExplanation(type, isCorrect) {
  switch (type) {
    case "true_confidence":
      return "Answered correctly with steady pacing, showing strong mastery.";
    case "overconfidence":
      return "Answered quickly but incorrectly. It seems rushed or based on a direct misconception.";
    case "underconfidence":
      return "Answered correctly, but took longer than expected suggesting hesitation or double-checking.";
    case "confusion":
      return "Spent significant time on this but got it wrong, indicating fundamental confusion about the concept.";
    case "guessing":
      return "Answered incorrectly in average time, possibly pointing to a guess rather than deep understanding.";
    default:
      return "Standard analytical response.";
  }
}

/**
 * Main inference engine entrypoint
 * Processes an entire diagnostic run or a single question.
 * @param {Array} answers
 * @param {Array} questions
 * @returns {Array} Array of decorated confidence objects
 */
export function confidenceEngine(answers, questions) {
  return answers.map((ans, idx) => {
    if (!ans) return null; // Unanswered
    
    const q = questions[idx];
    const isCorrect = ans.selected === q.correctAnswer;
    const timeTaken = ans.timeTaken || 0;
    const avgExpectedTime = q.timeLimitSeconds ? q.timeLimitSeconds * 0.6 : 30; // Assume 60% of time limit is average
    
    const input = {
      questionId: q.id || idx,
      isCorrect,
      timeTaken,
      avgExpectedTime,
      difficulty: q.difficulty || "medium",
      concept: q.concepts?.[0] || "Unknown"
    };
    
    const confidenceScore = calculateBaseConfidence(input);
    const confidenceType = classifyConfidence(input, confidenceScore);
    const explanation = generateAIExplanation(confidenceType, isCorrect);
    
    // Convert to legacy string for backwards compatibility ("low", "medium", "high")
    let legacyConfidence = "medium";
    if (confidenceScore >= 0.75) legacyConfidence = "high";
    else if (confidenceScore <= 0.45) legacyConfidence = "low";
    
    return {
      confidenceScore: parseFloat(confidenceScore.toFixed(2)),
      confidenceType,
      explanation,
      legacyConfidence
    };
  });
}
