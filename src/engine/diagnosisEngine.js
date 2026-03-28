import { analyzeAccuracy } from "./accuracyDiagnosis";
import { analyzeTime } from "./timeDiagnosis";
import { analyzeConfidence } from "./confidenceDiagnosis";
import { analyzeGraph } from "./graphDiagnosis";
import { confidenceEngine } from "./confidenceEngine";

/**
 * Main diagnosis engine — combines all four diagnostic signals
 * into a comprehensive structured result.
 *
 * @param {string} subject - "DSA" | "OS" | "DBMS" | "custom"
 * @param {Array} answers - [{selected, timeTaken, confidence}, ...]
 * @param {Array} questions - generated question objects
 * @param {Array|null} dynamicConcepts - AI-generated concept graph (for custom subjects)
 * @returns {Object} Full diagnosis output
 */
export function runDiagnosis(subject, answers, questions, dynamicConcepts = null) {
  // 0. AI-Assisted Confidence Inference
  // Automatically infers confidence using answer correctness, time taken, etc.
  const inferredConfidenceArray = confidenceEngine(answers, questions);
  
  // Inject legacy string backwards-compatibility back into the answers array
  // so existing engines continue functioning out of the box.
  answers.forEach((ans, idx) => {
    if (ans && inferredConfidenceArray[idx]) {
      // Ignore user-provided confidence if any was passed, and overwrite it safely
      ans.confidence = inferredConfidenceArray[idx].legacyConfidence;
      ans.confidenceScore = inferredConfidenceArray[idx].confidenceScore;
      ans.confidenceType = inferredConfidenceArray[idx].confidenceType;
      ans.confidenceExplanation = inferredConfidenceArray[idx].explanation;
    }
  });

  // 1. Accuracy analysis
  const accuracy = analyzeAccuracy(answers, questions);

  // 2. Time analysis
  const timeDiag = analyzeTime(answers, questions);

  // 3. Confidence analysis
  const confidenceDiag = analyzeConfidence(answers, questions);

  // 4. Graph-based root cause detection (pass dynamic concepts if available)
  const graphDiag = analyzeGraph(subject, accuracy.weakConcepts, accuracy.conceptScores, dynamicConcepts);

  // Build behavior analysis summary
  const behaviorAnalysis = {
    guessing: timeDiag.guessing,
    lowFluency: timeDiag.lowFluency,
    confusion: timeDiag.confusion,
    stable: timeDiag.stable,
    misconceptions: confidenceDiag.misconceptions,
    uncertainKnowledge: confidenceDiag.uncertainKnowledge,
    weakFoundation: confidenceDiag.weakFoundation,
    mastery: confidenceDiag.mastery,
    timeCounts: timeDiag.counts,
  };

  // Build chat context for AI tutor
  const chatContext = {
    summary: buildSummary(subject, accuracy, graphDiag, behaviorAnalysis),
    recommendedTopics: graphDiag.learningPath.slice(0, 5).map(p => p.concept),
    tone: "supportive and simple",
  };

  // Calculate overall score
  const totalCorrect = answers.filter((a, i) =>
    a && a.selected === questions[i]?.correctAnswer
  ).length;
  const overallScore = Math.round((totalCorrect / questions.length) * 100);

  return {
    subject,
    overallScore,
    totalQuestions: questions.length,
    correctAnswers: totalCorrect,
    conceptScores: accuracy.conceptScores,
    weakConcepts: accuracy.weakConcepts,
    strongConcepts: accuracy.strongConcepts,
    rootCause: graphDiag.rootCause,
    behaviorAnalysis,
    learningPath: graphDiag.learningPath,
    graphData: graphDiag.graphData,
    chatContext,
    confidenceInference: inferredConfidenceArray,
    answers,
    questions,
  };
}

function buildSummary(subject, accuracy, graphDiag, behavior) {
  const parts = [];
  parts.push(`The student completed a ${subject} diagnostic quiz.`);

  if (accuracy.weakConcepts.length === 0) {
    parts.push("Overall performance is strong with no major weak areas detected.");
    return parts.join(" ");
  }

  parts.push(`Weak areas identified: ${accuracy.weakConcepts.join(", ")}.`);

  if (graphDiag.rootCause) {
    parts.push(`The root cause appears to be ${graphDiag.rootCause.concept}, which affects downstream understanding.`);
  }

  if (behavior.guessing) parts.push("The student shows signs of guessing on some questions.");
  if (behavior.misconceptions.length > 0) {
    parts.push(`Misconceptions detected in: ${behavior.misconceptions.join(", ")}.`);
  }
  if (behavior.confusion) parts.push("Some confusion patterns were observed.");

  return parts.join(" ");
}
