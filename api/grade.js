// api/grade.js — Vercel Serverless Function
// Grades open-ended answers using Groq AI

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { question, studentAnswer, modelAnswer, topic } = req.body;

  if (!question || studentAnswer === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return res.status(500).json({ score: 5, feedback: 'مفتاح API غير متوفر. يرجى ضبط متغير البيئة GROQ_API_KEY.' });
  }

  const userText = studentAnswer.trim() || '(لم يُجَب)';

  const prompt = `أنت مصحح متخصص في مادة التربية الإسلامية للصف السابع الإعدادي.

الموضوع: ${topic || 'تربية إسلامية'}
السؤال: ${question}

الإجابة النموذجية:
${modelAnswer || 'غير متوفرة'}

إجابة الطالب:
${userText}

المطلوب: قيّم إجابة الطالب من 10 درجات مع مراعاة ما يلي:
- لا يُشترط التطابق الحرفي مع الإجابة النموذجية
- المعنى الصحيح والفهم الجيد يُعطى درجة كاملة
- الإجابة الجزئية الصحيحة تُعطى درجة جزئية
- الإجابة الخاطئة أو الفارغة تُعطى صفراً أو درجة منخفضة

أجب بصيغة JSON فقط بدون أي نص إضافي أو علامات markdown:
{"score": <رقم من 0 إلى 10>, "feedback": "<تعليق مختصر بالعربية يشرح سبب الدرجة ونقاط القوة والضعف>"}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API error:', errText);
      return res.status(200).json({ score: 5, feedback: 'تعذّر التصحيح التلقائي في هذه اللحظة.' });
    }

    const data    = await response.json();
    const content = data?.choices?.[0]?.message?.content || '{}';

    // Clean and parse JSON
    const cleaned = content
      .replace(/```json|```/g, '')
      .replace(/[\r\n]+/g, ' ')
      .trim();

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      // Try to extract score from text
      const scoreMatch = cleaned.match(/"score"\s*:\s*(\d+)/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
      result = { score, feedback: 'تم التقييم.' };
    }

    // Clamp score
    result.score = Math.min(10, Math.max(0, Number(result.score) || 0));

    return res.status(200).json(result);

  } catch (error) {
    console.error('Grade handler error:', error);
    return res.status(200).json({
      score: 5,
      feedback: 'حدث خطأ أثناء التصحيح التلقائي. راجع الإجابة النموذجية المعروضة.'
    });
  }
}
