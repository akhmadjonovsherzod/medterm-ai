// Gemini client.
// All Gemini requests go through the Cloudflare Worker.
// The Gemini API key is never stored or exposed in the frontend.

const AI_SYSTEM = `You are MedTerm MicroLearn's Medical English Terminology Tutor.
Your role is educational: help medical and healthcare students learn professional English terminology using microlearning, active recall, concise explanations, contextual examples, and occasional Uzbek support.
Keep answers short and structured. Focus on terminology, not diagnosis or treatment.
Never present yourself as a doctor. Never diagnose, prescribe, or provide personalized treatment advice.
If a user asks for diagnosis or treatment, say: "I can help explain the medical terminology involved, but I can't diagnose a medical condition or provide personalized treatment advice."
When useful, structure terminology as: Term, Definition, Uzbek meaning, Medical context, Example, Related terms, Quick check.
Use the learner's current lesson context when supplied.`;


// --------------------------------------------------
// Cloudflare Worker endpoint
// --------------------------------------------------

function geminiEndpoint() {
  if (!window.PROXY_URL) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  return window.PROXY_URL;
}


// --------------------------------------------------
// Main Gemini request
// --------------------------------------------------

async function callGemini(contents, generationConfig = {}) {
  const url = geminiEndpoint();

  const res = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: AI_SYSTEM
          }
        ]
      },

      contents,

      generationConfig: {
        responseMimeType: "text/plain",
        maxOutputTokens: 900,
        ...generationConfig
      }
    })
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data?.error?.message ||
      `Gemini request failed (${res.status})`
    );
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map(p => p.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("EMPTY_AI_RESPONSE");
  }

  return text;
}


// --------------------------------------------------
// AI Tutor
// --------------------------------------------------

window.askTutor = async function(message, context = "") {
  const contents = [
    {
      role: "user",
      parts: [
        {
          text:
            `Lesson context: ${context}\n\n` +
            `Student question: ${message}`
        }
      ]
    }
  ];

  return callGemini(contents);
};


// --------------------------------------------------
// AI Lesson Generator
// --------------------------------------------------

window.generateLessonWithAI = async function(
  topic,
  difficulty,
  count
) {
  const prompt = `Create a ${count}-term micro-lesson about "${topic}" for medical students at ${difficulty} level.

Return JSON only as an array.

Each object must contain:
term, pronunciation, definition, uzbek, example, category, difficulty.

Keep definitions concise and medically accurate.`;

  const raw = await callGemini(
    [
      {
        role: "user",
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    {
      responseMimeType: "application/json",
      maxOutputTokens: 1800
    }
  );

  const parsed = JSON.parse(
    raw
      .replace(/^```json\s*/, "")
      .replace(/```$/, "")
      .trim()
  );

  if (!Array.isArray(parsed) || parsed.length < 1) {
    throw new Error("INVALID_LESSON");
  }

  return parsed.slice(0, count);
};