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

  // Pre-check: irrelevant / test / non-Arabic answers → instant 0
  const lowerUser = userText.toLowerCase();
  const isGibberish = (
    lowerUser.includes('test') ||
    lowerUser.includes('hello') ||
    lowerUser.includes('asdf') ||
    lowerUser.includes('lorem') ||
    /^[a-z\s\d]{1,30}$/i.test(userText) ||   // pure Latin text (not a real Arabic answer)
    userText.length < 5                         // too short to be a real answer
  );

  if (isGibberish) {
    return res.status(200).json({
      score: 0,
      feedback: 'الإجابة غير ذات صلة بالسؤال أو مكتوبة بلغة غير عربية. الدرجة: صفر.'
    });
  }

  const prompt = `أنت مصحح صارم ومتخصص في مادة التربية الإسلامية للصف السابع الإعدادي.

الموضوع: ${topic || 'تربية إسلامية'}
السؤال: ${question}

الإجابة النموذجية:
${modelAnswer || 'غير متوفرة'}

إجابة الطالب:
${userText}

قواعد التصحيح الصارمة:
- إجابة لا علاقة لها بالسؤال = 0 درجة فوراً
- إجابة صحيحة المعنى ومكتملة = 9-10 درجات
- إجابة صحيحة جزئياً = 4-7 حسب نسبة الاكتمال
- إجابة خاطئة أو مجرد كلمة أو جملة عشوائية = 0-2 درجة
- لا تكن كريماً في الدرجات — الدرجة يجب أن تعكس جودة الإجابة بدقة
- إجابة "test" أو كلام بالإنجليزي أو كلام لا معنى له = 0 درجة

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