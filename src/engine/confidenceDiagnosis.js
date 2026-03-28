/**
 * Confidence-based diagnosis
 * Detects misconceptions, uncertainty, and mastery based on confidence selections
 */
export function analyzeConfidence(answers, questions) {
  const misconceptions = [];
  const uncertainKnowledge = [];
  const weakFoundation = [];
  const mastery = [];

  questions.forEach((q, i) => {
    const answer = answers[i];
    if (!answer) return;

    const isCorrect = answer.selected === q.correctAnswer;
    const confidence = answer.confidence; // "low", "medium", "high"

    if (confidence === "high" && !isCorrect) {
      // Misconception — student is confident but wrong
      q.concepts.forEach(c => {
        if (!misconceptions.includes(c)) misconceptions.push(c);
      });
    } else if (confidence === "low" && isCorrect) {
      // Uncertain knowledge — got it right but not confident
      q.concepts.forEach(c => {
        if (!uncertainKnowledge.includes(c)) uncertainKnowledge.push(c);
      });
    } else if (confidence === "low" && !isCorrect) {
      // Weak foundation — knows they don't know
      q.concepts.forEach(c => {
        if (!weakFoundation.includes(c)) weakFoundation.push(c);
      });
    } else if (confidence === "high" && isCorrect) {
      // Mastery — confident and correct
      q.concepts.forEach(c => {
        if (!mastery.includes(c)) mastery.push(c);
      });
    }
  });

  return { misconceptions, uncertainKnowledge, weakFoundation, mastery };
}
