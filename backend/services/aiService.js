/**
 * AI Service for Lesson Content Generation.
 * Uses the local Sparsh Python backend (/api/generate).
 * Falls back to local sentence extraction if the backend is unavailable.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function generateLessonContent(text) {
  const cleanText = text ? text.substring(0, 3000).trim() : '';

  if (!cleanText) {
    throw new Error('No text provided for AI generation');
  }

  // 1. Try the local Python FastAPI backend
  try {
    const response = await fetch(`${BACKEND_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Backend returned status: ${response.status}`);
    }

    const data = await response.json();

    return {
      summary:    data.summary    || buildFallback(cleanText).summary,
      key_points: data.key_points || [],
      quiz:       data.quiz       || [],
    };

  } catch (error) {
    console.warn('[AI Service] Backend unavailable, using local extraction:', error.message);
    return buildFallback(cleanText);
  }
}

/**
 * Local fallback: builds summary, key_points and quiz from sentences
 * without any external API call.
 */
function buildFallback(text) {
  const sentences = text
    .replace(/\n/g, ' ')
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  const summary = sentences.slice(0, 3).join('. ') + (sentences.length > 3 ? '.' : '');

  const key_points = sentences.slice(3, 6).map(s => s + '.');

  const quiz = [
    {
      question: 'What is the main topic of this lesson?',
      answer: sentences[0] || 'Refer to the lesson content.',
    },
    {
      question: 'Name one important concept from this lesson.',
      answer: sentences[1] || 'Refer to the lesson content.',
    },
    {
      question: 'Summarize what you learned in one sentence.',
      answer: summary || 'Review the lesson.',
    },
  ];

  return { summary, key_points, quiz };
}
