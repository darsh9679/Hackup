import { dsaConceptNames } from "../data/dsaGraph";
import { osConceptNames } from "../data/osGraph";
import { dbmsConceptNames } from "../data/dbmsGraph";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

function getApiKey() {
  return import.meta.env.VITE_GROQ_API_KEY;
}

function getConceptsForSubject(subject) {
  switch (subject) {
    case "DSA": return dsaConceptNames;
    case "OS": return osConceptNames;
    case "DBMS": return dbmsConceptNames;
    default: return [];
  }
}

function extractJSON(text) {
  try { return JSON.parse(text); } catch {}
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch {}
  }
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try { return JSON.parse(arrayMatch[0]); } catch {}
  }
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch {}
  }
  throw new Error("Could not parse JSON from AI response");
}

/**
 * Education level complexity descriptors
 */
const EDUCATION_DESCRIPTORS = {
  school: {
    label: "School (Classes 6–12)",
    complexity: "Use simple, clear language. Questions should test basic definitions, fundamental concepts, and straightforward applications. Avoid jargon or advanced terminology.",
    depth: "basic",
  },
  college: {
    label: "College / Diploma",
    complexity: "Use intermediate language. Questions should test understanding, comparisons, and moderate application of concepts. Include some technical terms with context.",
    depth: "intermediate",
  },
  undergraduate: {
    label: "Undergraduate (Bachelor's)",
    complexity: "Use standard academic language. Questions should test deep understanding, analysis, and practical application. Include technical terminology and multi-step reasoning.",
    depth: "standard",
  },
  graduate: {
    label: "Graduate (Master's)",
    complexity: "Use advanced academic language. Questions should test synthesis, evaluation, and edge cases. Expect familiarity with research-level concepts and advanced applications.",
    depth: "advanced",
  },
  phd: {
    label: "PhD / Research",
    complexity: "Use expert-level language. Questions should test cutting-edge concepts, research methodology, theoretical depth, and nuanced understanding. Include complex multi-concept scenarios.",
    depth: "expert",
  },
};

/**
 * Generate concepts for a custom subject + education level using AI
 */
async function generateConceptsForSubject(customSubject, educationLevel, numConcepts = 10) {
  const eduInfo = EDUCATION_DESCRIPTORS[educationLevel] || EDUCATION_DESCRIPTORS.undergraduate;

  const prompt = `You are an expert curriculum designer. Your ONLY job is to generate a concept dependency graph STRICTLY and EXCLUSIVELY for the subject "${customSubject}" at the ${eduInfo.label} level.

STRICT RULES — YOU MUST FOLLOW THESE:
- ALL concepts MUST be directly part of "${customSubject}" — nothing else.
- Do NOT include concepts from unrelated fields or other subjects.
- Do NOT include generic or broad topics that are not specific to "${customSubject}".
- Generate exactly ${numConcepts} core concepts/topics that a student studying "${customSubject}" at ${eduInfo.label} level must know.
- Order them from foundational to advanced.
- The first 2-3 concepts should have NO prerequisites (they are foundational to "${customSubject}").
- Later concepts should list 1-3 prerequisites from earlier concepts in the same list.
- Descriptions should be 1 short sentence specific to "${customSubject}".
- The depth/terminology must match ${eduInfo.label} level: ${eduInfo.complexity}

Return ONLY a valid JSON array (no extra text, no explanation) with this format:
[
  { "id": "Concept Name", "name": "Concept Name", "prerequisites": [], "description": "Short description" },
  { "id": "Concept Name 2", "name": "Concept Name 2", "prerequisites": ["Concept Name"], "description": "Short description" }
]

Generate exactly ${numConcepts} concepts ONLY for "${customSubject}". Return ONLY the JSON array.`;

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: `Generate exactly ${numConcepts} concepts ONLY for the subject "${customSubject}" at ${eduInfo.label} level. Every concept must be exclusively about "${customSubject}". Return ONLY the JSON array.` },
      ],
      temperature: 0.5,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from Groq API");

  const concepts = extractJSON(content);
  if (!Array.isArray(concepts) || concepts.length === 0) {
    throw new Error("Invalid concepts format from AI");
  }

  // Sanitize
  return concepts.map(c => ({
    id: c.id || c.name,
    name: c.name || c.id,
    prerequisites: Array.isArray(c.prerequisites) ? c.prerequisites : [],
    description: c.description || "",
  }));
}

/**
 * Generate quiz questions using Groq AI
 * Supports both hardcoded subjects (DSA, OS, DBMS) and custom subjects
 *
 * @param {string} subject - Subject ID ("DSA", "OS", "DBMS", or "custom")
 * @param {number} numQuestions - Number of questions
 * @param {string} difficulty - "easy" | "medium" | "hard"
 * @param {Object} [customOptions] - For custom subjects: { educationLevel, customSubject }
 * @returns {Promise<{ questions: Array, concepts: Array|null }>}
 */
export async function generateQuestions(subject, numQuestions, difficulty, customOptions = null) {
  const isCustom = subject === "custom" && customOptions;
  let concepts;
  let conceptNames;
  let subjectLabel;
  let educationContext = "";

  if (isCustom) {
    const { educationLevel, customSubject } = customOptions;
    const eduInfo = EDUCATION_DESCRIPTORS[educationLevel] || EDUCATION_DESCRIPTORS.undergraduate;

    // Generate concept graph dynamically
    const numConcepts = Math.min(12, Math.max(6, Math.ceil(numQuestions / 2)));
    concepts = await generateConceptsForSubject(customSubject, educationLevel, numConcepts);
    conceptNames = concepts.map(c => c.name);
    subjectLabel = customSubject;
    educationContext = `
EDUCATION LEVEL: ${eduInfo.label}
COMPLEXITY: ${eduInfo.complexity}
`;
  } else {
    conceptNames = getConceptsForSubject(subject);
    subjectLabel = subject;
    concepts = null; // Use hardcoded graphs
  }

  const timeLimits = { easy: 60, medium: 45, hard: 30 };
  const timeLimit = timeLimits[difficulty] || 45;
  const minPerConcept = Math.max(2, Math.ceil(numQuestions / conceptNames.length));

  const systemPrompt = `You are an expert quiz question generator. Your ONLY task is to generate exactly ${numQuestions} multiple-choice questions STRICTLY and EXCLUSIVELY about "${subjectLabel}".
${educationContext}
⚠️ STRICT SUBJECT LOCK — THIS IS MANDATORY:
- ALL questions MUST be about "${subjectLabel}" and ONLY "${subjectLabel}".
- Do NOT generate questions about other subjects, related fields, or general topics.
- Every single question must test knowledge that is specifically and directly part of "${subjectLabel}".
- If the subject is "${subjectLabel}", ALL questions must be about "${subjectLabel}" exclusively.

ADDITIONAL RULES:
- Difficulty level: ${difficulty}
- Available concepts (ONLY use these): ${JSON.stringify(conceptNames)}
- Generate AT LEAST ${minPerConcept} questions per concept. Distribute questions EVENLY across ALL concepts.
- Do NOT generate only 1 question per concept — that makes diagnosis impossible.
- Each question must be tagged with 1-2 concepts from the list above ONLY.
- Questions should test deep understanding, not just recall.
- For easy: test definitions, basic properties, and simple examples within "${subjectLabel}".
- For medium: test application, comparison, and analysis within "${subjectLabel}".
- For hard: test edge cases, tricky scenarios, and synthesis within "${subjectLabel}".
- All 4 options must be plausible, distinct, and specific to "${subjectLabel}" (no obviously wrong answers).
- The correctAnswer must EXACTLY match one of the 4 options.
- Time limit per question: ${timeLimit} seconds

Return ONLY a valid JSON array (no extra text, no explanation, no markdown) with this exact format:
[
  {
    "id": 1,
    "text": "Question text here about ${subjectLabel}?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B",
    "concepts": ["Concept1"],
    "difficulty": "${difficulty}",
    "timeLimitSeconds": ${timeLimit}
  }
]

Generate exactly ${numQuestions} questions, ALL about "${subjectLabel}". Return ONLY the JSON array.`;

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate ${numQuestions} ${difficulty} questions NOW. Every single question must be EXCLUSIVELY about "${subjectLabel}". Concepts to cover: ${JSON.stringify(conceptNames)}. Each concept needs at least ${minPerConcept} questions. Distribute evenly. Return ONLY the JSON array.` },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from Groq API");

  const questions = extractJSON(content);
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Invalid questions format from AI");
  }

  // Validate and sanitize each question
  const sanitizedQuestions = questions.map((q, i) => ({
    id: i + 1,
    text: q.text || `Question ${i + 1}`,
    options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["A", "B", "C", "D"],
    correctAnswer: q.correctAnswer || q.options?.[0] || "A",
    concepts: Array.isArray(q.concepts) ? q.concepts.filter(c => conceptNames.includes(c)) : [],
    difficulty: q.difficulty || difficulty,
    timeLimitSeconds: q.timeLimitSeconds || timeLimit,
  }));

  return {
    questions: sanitizedQuestions,
    concepts: concepts, // null for hardcoded subjects, array for custom
  };
}

/**
 * Chat with AI tutor using diagnosis context
 */
export async function chatWithTutor(userMessage, diagnosisContext, chatHistory = []) {
  const systemPrompt = `You are LearnLens AI Tutor — a friendly, supportive learning coach. A student just completed a diagnostic quiz and you have their full diagnosis results.

DIAGNOSIS CONTEXT:
- Subject: ${diagnosisContext.subject}
- Education Level: ${diagnosisContext.educationLevel || "Not specified"}
- Overall Score: ${diagnosisContext.overallScore}%
- Correct: ${diagnosisContext.correctAnswers}/${diagnosisContext.totalQuestions}
- Weak Concepts: ${diagnosisContext.weakConcepts?.join(", ") || "None"}
- Strong Concepts: ${diagnosisContext.strongConcepts?.join(", ") || "None"}
- Root Cause: ${diagnosisContext.rootCause?.concept || "None"} (confidence: ${diagnosisContext.rootCause?.confidence || 0})
- Root Cause Reason: ${diagnosisContext.rootCause?.reason || "N/A"}
- Concept Scores: ${JSON.stringify(diagnosisContext.conceptScores || {})}
- Behavior: Guessing=${diagnosisContext.behaviorAnalysis?.guessing}, Low Fluency=${diagnosisContext.behaviorAnalysis?.lowFluency}, Confusion=${diagnosisContext.behaviorAnalysis?.confusion}
- Misconceptions in: ${diagnosisContext.behaviorAnalysis?.misconceptions?.join(", ") || "None"}
- Uncertain Knowledge in: ${diagnosisContext.behaviorAnalysis?.uncertainKnowledge?.join(", ") || "None"}
- Learning Path: ${diagnosisContext.learningPath?.map(p => p.concept).join(" → ") || "N/A"}

INSTRUCTIONS:
- Answer questions about the student's diagnosis in simple, encouraging language
- Explain WHY specific concepts are weak, relating to prerequisites
- Give concrete study tips and explanations
- If asked about a concept, explain it simply with examples
- Stay focused on the diagnosis context — you are NOT a general chatbot
- Be concise but helpful (2-4 paragraphs max)
- Use analogies and simple examples when explaining concepts
- Encourage the student and maintain a supportive tone`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...chatHistory.map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response. Please try again.";
}
