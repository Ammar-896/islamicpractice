/* ═══════════════════════════════════════════════
   ISLAMIC EXAM APP — CORE LOGIC
   ═══════════════════════════════════════════════ */

let currentSet   = null;
let userAnswers  = {};   // { questionId: value }
let aiResults    = {};   // { questionId: { score, feedback } }

/* ─── CARD ACCENT COLORS ──────────────────────── */
const ACCENTS = [
  '#c9a227','#2cb67d','#3d8ef0','#7c5cbf',
  '#e8643c','#38a169','#e8b84b','#5b8dd9',
  '#c97b27','#c9a227',
];

/* ─── RENDER HOME ─────────────────────────────── */
function renderHome() {
  const grid = document.getElementById('sets-grid');
  grid.innerHTML = '';
  EXAM_SETS.forEach((set, i) => {
    const mcqCount   = set.questions.filter(q => q.type === 'mcq').length;
    const tfCount    = set.questions.filter(q => q.type === 'tf').length;
    const fillCount  = set.questions.filter(q => q.type === 'fill').length;
    const shortCount = set.questions.filter(q => q.type === 'short').length;

    const card = document.createElement('div');
    card.className = 'set-card';
    card.style.setProperty('--card-accent', ACCENTS[i] || '#c9a227');
    card.innerHTML = `
      <span class="set-icon">${set.icon}</span>
      <div class="set-num">المجموعة ${arabicNum(set.id)} · ${set.questions.length} سؤالاً</div>
      <div class="set-title">${set.title}</div>
      <div class="set-sub">${set.subtitle}</div>
      <div class="set-stats">
        ${mcqCount   ? `<span class="stat-badge">اختيار متعدد: ${mcqCount}</span>` : ''}
        ${tfCount    ? `<span class="stat-badge">صح/خطأ: ${tfCount}</span>` : ''}
        ${fillCount  ? `<span class="stat-badge">تعبئة: ${fillCount}</span>` : ''}
        ${shortCount ? `<span class="stat-badge">مقالي: ${shortCount}</span>` : ''}
      </div>
      <button class="set-start-btn" onclick="startExam(${set.id})">▶ ابدأ الاختبار</button>
    `;
    grid.appendChild(card);
  });
}

/* ─── ARABIC NUMERALS ─────────────────────────── */
function arabicNum(n) {
  return ['','الأول','الثاني','الثالث','الرابع','الخامس',
          'السادس','السابع','الثامن','التاسع','العاشر'][n] || n;
}

/* ─── START EXAM ──────────────────────────────── */
function startExam(setId) {
  currentSet  = EXAM_SETS.find(s => s.id === setId);
  userAnswers = {};
  aiResults   = {};

  document.getElementById('exam-icon').textContent    = currentSet.icon;
  document.getElementById('exam-title').textContent   = currentSet.title;
  document.getElementById('exam-subtitle').textContent= currentSet.subtitle;

  renderQuestions();
  updateProgress();

  showScreen('exam');
  window.scrollTo(0, 0);
}

/* ─── RENDER QUESTIONS ────────────────────────── */
function renderQuestions() {
  const container = document.getElementById('questions-container');
  container.innerHTML = '';

  currentSet.questions.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'q-card';
    card.id = `qcard-${q.id}`;

    const typeLabel = { mcq:'اختيار متعدد', tf:'صح / خطأ', fill:'تعبئة الفراغ', short:'سؤال مقالي' }[q.type];

    card.innerHTML = `
      <div class="q-header">
        <div class="q-num">${idx + 1}</div>
        <div class="q-text">${q.text}</div>
        <span class="q-type-badge ${q.type}">${typeLabel}</span>
      </div>
      <div class="q-topic-tag">${q.topic}</div>
      <div class="q-body" style="margin-top:.85rem">${renderQBody(q)}</div>
    `;
    container.appendChild(card);
  });
}

function renderQBody(q) {
  if (q.type === 'mcq') {
    const letters = ['أ','ب','ج','د'];
    return `<ul class="options-list">${q.options.map((opt, i) => `
      <li class="option-item" onclick="selectMCQ('${q.id}', ${i}, this)">
        <span class="option-dot"></span>
        <span class="option-letter">${letters[i]}</span>
        <span class="option-text">${opt}</span>
        <input type="radio" name="q-${q.id}" value="${i}"/>
      </li>`).join('')}</ul>`;
  }
  if (q.type === 'tf') {
    return `<div class="tf-buttons">
      <button class="tf-btn" onclick="selectTF('${q.id}', true, this)">✓ صحيح</button>
      <button class="tf-btn" onclick="selectTF('${q.id}', false, this)">✗ خطأ</button>
    </div>`;
  }
  if (q.type === 'fill') {
    return `<input class="q-input" id="inp-${q.id}" type="text" placeholder="اكتب إجابتك هنا…"
      oninput="userAnswers['${q.id}'] = this.value.trim(); markAnswered('${q.id}')" dir="rtl"/>
      ${q.hint ? `<div class="q-hint">💡 تلميح: ${q.hint}</div>` : ''}`;
  }
  if (q.type === 'short') {
    return `<textarea class="q-textarea" id="inp-${q.id}" rows="4"
      placeholder="اكتب إجابتك هنا…"
      oninput="userAnswers['${q.id}'] = this.value.trim(); markAnswered('${q.id}')" dir="rtl"></textarea>`;
  }
}

/* ─── INTERACTION HANDLERS ────────────────────── */
function selectMCQ(qid, idx, el) {
  const list = el.closest('.options-list');
  list.querySelectorAll('.option-item').forEach(li => li.classList.remove('selected'));
  el.classList.add('selected');
  userAnswers[qid] = idx;
  markAnswered(qid);
}

function selectTF(qid, val, el) {
  const container = el.parentElement;
  container.querySelectorAll('.tf-btn').forEach(b => {
    b.classList.remove('selected-true', 'selected-false');
  });
  el.classList.add(val ? 'selected-true' : 'selected-false');
  userAnswers[qid] = val;
  markAnswered(qid);
}

function markAnswered(qid) {
  const card = document.getElementById(`qcard-${qid}`);
  if (card) card.classList.add('answered');
  updateProgress();
}

/* ─── PROGRESS ────────────────────────────────── */
function updateProgress() {
  if (!currentSet) return;
  const total     = currentSet.questions.length;
  const answered  = Object.keys(userAnswers).length;
  const pct       = (answered / total) * 100;
  document.getElementById('progress-fill').style.width  = pct + '%';
  document.getElementById('progress-label').textContent = `${answered} / ${total}`;
}

/* ─── SUBMIT ──────────────────────────────────── */
function submitExam() {
  // Warn for unanswered
  const unanswered = currentSet.questions.filter(q => userAnswers[q.id] === undefined);
  if (unanswered.length > 0) {
    unanswered.forEach(q => {
      const card = document.getElementById(`qcard-${q.id}`);
      if (card) {
        card.classList.add('unanswered-warn');
        setTimeout(() => card.classList.remove('unanswered-warn'), 800);
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    if (!confirm(`لم تجب على ${unanswered.length} سؤال/أسئلة. هل تريد التسليم على أي حال؟`)) return;
  }

  buildResults();
  showScreen('results');
  window.scrollTo(0, 0);
}

/* ─── BUILD RESULTS ───────────────────────────── */
function buildResults() {
  const body = document.getElementById('results-body');
  body.innerHTML = '';

  let autoCorrect = 0, autoTotal = 0;
  const aiQueue = [];

  currentSet.questions.forEach((q, idx) => {
    const userVal = userAnswers[q.id];
    const card    = document.createElement('div');
    card.className = 'r-card';
    card.id = `rcard-${q.id}`;

    const typeLabel = { mcq:'اختيار متعدد', tf:'صح / خطأ', fill:'تعبئة', short:'مقالي' }[q.type];

    let statusIcon, scoreHtml, answerRows, extraHtml = '';
    let cardClass = '';

    if (q.type === 'mcq') {
      autoTotal++;
      const correct = userVal === q.correct;
      if (correct) { autoCorrect++; cardClass = 'r-correct'; statusIcon = '✅'; }
      else         { cardClass = 'r-wrong';   statusIcon = '❌'; }

      const userText  = q.options[userVal]    ?? '(لم يُجَب)';
      const rightText = q.options[q.correct];
      scoreHtml   = `<span class="r-score-badge ${correct ? 'correct' : 'wrong'}">${correct ? '✓ صحيح' : '✗ خطأ'}</span>`;
      answerRows  = `
        ${!correct ? `<div class="r-answer-row"><span class="lbl">إجابتك:</span> <span class="val-wrong">${userText}</span></div>` : ''}
        <div class="r-answer-row"><span class="lbl">الإجابة الصحيحة:</span> <span class="val-correct">${rightText}</span></div>`;
    }
    else if (q.type === 'tf') {
      autoTotal++;
      const correct = userVal === q.correct;
      if (correct) { autoCorrect++; cardClass = 'r-correct'; statusIcon = '✅'; }
      else         { cardClass = 'r-wrong'; statusIcon = '❌'; }

      scoreHtml  = `<span class="r-score-badge ${correct ? 'correct' : 'wrong'}">${correct ? '✓ صحيح' : '✗ خطأ'}</span>`;
      answerRows = `
        ${!correct ? `<div class="r-answer-row"><span class="lbl">إجابتك:</span> <span class="val-wrong">${userVal === true ? 'صحيح' : 'خطأ'}</span></div>` : ''}
        <div class="r-answer-row"><span class="lbl">الإجابة الصحيحة:</span> <span class="val-correct">${q.correct ? 'صحيح ✓' : 'خطأ ✗'}</span></div>`;
    }
    else if (q.type === 'fill') {
      // Lenient: check if user answer contains key words
      const userText = (userVal || '').trim();
      const refText  = q.answer.trim();
      const isExact  = normalizeAr(userText).includes(normalizeAr(refText.split('—')[0].split(' ')[0])) ||
                       normalizeAr(refText).includes(normalizeAr(userText.split(' ')[0]));
      if (isExact) { autoCorrect++; cardClass = 'r-correct'; statusIcon = '✅'; }
      else { cardClass = 'r-wrong'; statusIcon = '❌'; }
      autoTotal++;

      scoreHtml  = `<span class="r-score-badge ${isExact ? 'correct' : 'wrong'}">${isExact ? '✓ صحيح' : '✗ راجع إجابتك'}</span>`;
      answerRows = `
        <div class="r-answer-row"><span class="lbl">إجابتك:</span> <span class="${isExact ? 'val-correct' : 'val-student'}">${userText || '(لم يُجَب)'}</span></div>
        ${!isExact ? `<div class="r-answer-row"><span class="lbl">الإجابة النموذجية:</span> <span class="val-correct">${refText}</span></div>` : ''}`;
    }
    else if (q.type === 'short') {
      cardClass  = 'r-pending'; statusIcon = '⏳';
      scoreHtml  = `<span class="r-score-badge pending" id="score-badge-${q.id}">جارٍ التصحيح…</span>`;
      answerRows = `<div class="r-answer-row"><span class="lbl">إجابتك:</span> <span class="val-student">${(userVal || '(لم يُجَب)').replace(/\n/g,'<br/>')}</span></div>`;
      extraHtml  = `<div class="r-ai-pending" id="ai-pending-${q.id}"><div class="spinner"></div> يُصحَّح بالذكاء الاصطناعي…</div>
                    <div class="r-ai-feedback hidden" id="ai-fb-${q.id}"></div>`;
      aiQueue.push(q);
    }

    const expHtml = q.explanation
      ? `<div class="r-explanation">💡 ${q.explanation}</div>` : '';

    card.classList.add(cardClass);
    card.innerHTML = `
      <div class="r-header">
        <span class="r-status-icon">${statusIcon}</span>
        <span class="r-question">${idx + 1}. ${q.text}</span>
        ${scoreHtml}
      </div>
      ${answerRows}
      ${expHtml}
      ${extraHtml}
    `;
    body.appendChild(card);
  });

  // Score card (auto-graded portion)
  updateScoreCard(autoCorrect, autoTotal, aiQueue.length);

  // Show grading status
  if (aiQueue.length > 0) {
    document.getElementById('grading-status').classList.remove('hidden');
    gradeWithAI(aiQueue).then(() => {
      document.getElementById('grading-status').classList.add('hidden');
    });
  }
}

/* ─── SCORE CARD ──────────────────────────────── */
function updateScoreCard(correct, total, pendingAI) {
  const pct  = total > 0 ? Math.round((correct / total) * 100) : 0;
  const emoji = pct >= 90 ? '🏆' : pct >= 75 ? '⭐' : pct >= 60 ? '👍' : '📖';
  const label = pct >= 90 ? 'ممتاز!' : pct >= 75 ? 'جيد جداً' : pct >= 60 ? 'جيد' : 'تحتاج مراجعة';

  document.getElementById('score-emoji').textContent   = emoji;
  document.getElementById('score-number').textContent  = `${pct}%`;
  document.getElementById('score-label').textContent   = label;
  document.getElementById('score-detail').textContent  =
    `${correct} من ${total} إجابة صحيحة (الأسئلة الموضوعية)` +
    (pendingAI > 0 ? ` · ${pendingAI} سؤال مقالي جارٍ تصحيحه` : '');
}

/* ─── AI GRADING ──────────────────────────────── */
async function gradeWithAI(questions) {
  for (const q of questions) {
    const userVal = userAnswers[q.id] || '';
    try {
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question:       q.text,
          studentAnswer:  userVal,
          modelAnswer:    q.modelAnswer,
          topic:          q.topic,
        })
      });
      const data = await res.json();
      renderAIResult(q, data.score, data.feedback);
    } catch (err) {
      renderAIResult(q, null, 'تعذّر التصحيح التلقائي. يرجى المقارنة يدوياً مع الإجابة النموذجية.');
    }
  }
}

function renderAIResult(q, score, feedback) {
  const pendingEl = document.getElementById(`ai-pending-${q.id}`);
  const fbEl      = document.getElementById(`ai-fb-${q.id}`);
  const badgeEl   = document.getElementById(`score-badge-${q.id}`);
  const cardEl    = document.getElementById(`rcard-${q.id}`);

  if (pendingEl) pendingEl.remove();

  const s = score !== null ? score : '—';
  const pct = score !== null ? Math.round((score / 10) * 100) : null;
  const cls = pct !== null ? (pct >= 75 ? 'correct' : pct >= 40 ? 'partial' : 'wrong') : 'pending';

  if (badgeEl) {
    badgeEl.className = `r-score-badge ${cls}`;
    badgeEl.textContent = score !== null ? `${s} / 10` : '—';
  }
  if (cardEl) {
    cardEl.classList.remove('r-pending');
    cardEl.classList.add(pct !== null && pct >= 60 ? 'r-correct' : pct !== null && pct < 60 ? 'r-wrong' : 'r-pending');
  }

  if (fbEl) {
    fbEl.classList.remove('hidden');

    const modelAnswerHtml = q.modelAnswer
      ? `<div style="margin-top:.5rem;padding-top:.5rem;border-top:1px solid rgba(255,255,255,.08)">
           <span class="feedback-label">الإجابة النموذجية:</span>
           <span style="color:var(--text2)">${q.modelAnswer.replace(/\n/g,'<br/>')}</span>
         </div>` : '';

    fbEl.innerHTML = `
      <span class="feedback-label">🤖 تقييم الذكاء الاصطناعي:</span>
      ${feedback}
      ${modelAnswerHtml}
    `;
  }
}

/* ─── NORMALIZE ARABIC ────────────────────────── */
function normalizeAr(str) {
  return (str || '')
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[يى]/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim().toLowerCase();
}

/* ─── NAVIGATION ──────────────────────────────── */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${name}`).classList.add('active');
}
function goHome() {
  currentSet  = null;
  userAnswers = {};
  aiResults   = {};
  showScreen('home');
  window.scrollTo(0, 0);
}
function retryExam() {
  if (currentSet) startExam(currentSet.id);
}

/* ─── INIT ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderHome();
});
