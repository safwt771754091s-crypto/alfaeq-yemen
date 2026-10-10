// بنك أسئلة ألعاب الرياضيات — مُكيَّف للمنهج اليمني (التعليم الأساسي 1-9 والثانوي)
// الأنواع: mc (اختيار من متعدد) · tf (صح/خطأ) · num (إدخال رقم) · pairs (مطابقة) · order (ترتيب)

export const LEVELS = [
  { id: 'easy', name: 'سهل', range: 10 },
  { id: 'medium', name: 'متوسط', range: 30 },
  { id: 'hard', name: 'متقدم', range: 100 }
];

export const GRADE_BANDS = [
  { id: 'g1_3', name: 'الصفوف ١-٣', icon: '🧮' },
  { id: 'g4_6', name: 'الصفوف ٤-٦', icon: '📐' },
  { id: 'g7_9', name: 'الصفوف ٧-٩', icon: '📘' },
  { id: 'sec', name: 'الثانوية', icon: '🎓' }
];

export const GAME_META = [
  { id: 'quiz', name: 'اختبار سريع', icon: '⚡', desc: '١٠ أسئلة اختيار من متعدد مع نقاط سرعة.', need: 'mc', len: 10 },
  { id: 'arcade', name: 'سباق الوقت', icon: '⏱️', desc: '٦٠ ثانية وأجب بأسرع ما تستطيع (٣ أرواح).', need: 'mc', timed: 60 },
  { id: 'tf', name: 'صح أم خطأ', icon: '✅', desc: 'قَيّم العبارات والسلسلة تضاعف نقاطك.', need: 'tf', len: 12 },
  { id: 'input', name: 'اكتب الإجابة', icon: '⌨️', desc: 'بلا خيارات — اكتب الحل بنفسك.', need: 'num', len: 10 },
  { id: 'match', name: 'المطابقة', icon: '🧩', desc: 'طابق كل مصطلح بمقابله.', need: 'pairs', len: 3 },
  { id: 'order', name: 'الترتيب', icon: '🎚️', desc: 'رتّب الأعداد تصاعدياً أو تنازلياً.', need: 'order', len: 4 }
];

export const ALL_TYPES = ['mc', 'tf', 'num', 'pairs', 'order'];

// ===== مولّدات إجرائية للأسئلة الحسابية =====
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mcQuestion(q, answer, distractors) {
  const uniq = [];
  for (const d of distractors) {
    if (String(d) !== String(answer) && !uniq.some((u) => String(u) === String(d))) uniq.push(d);
  }
  let k = 1;
  while (uniq.length < 3) {
    const cand = typeof answer === 'number' ? answer + k : `${answer}${k}`;
    if (String(cand) !== String(answer) && !uniq.some((u) => String(u) === String(cand))) uniq.push(cand);
    k += 1;
    if (k > 30) break;
  }
  const opts = shuffle([answer, ...uniq.slice(0, 3)]);
  const a = opts.findIndex((o) => String(o) === String(answer));
  if (a === -1 || opts.length < 2) return null;
  return { t: 'mc', q, choices: opts.map(String), a };
}

function genArithmetic(band, level) {
  const r = LEVELS.find((l) => l.id === level)?.range || 20;
  const op = pick(['+', '−', '×', '÷']);
  let a, b, ans, text;
  if (op === '+') { a = rnd(1, r); b = rnd(1, r); ans = a + b; text = `${a} + ${b}`; }
  else if (op === '−') { a = rnd(1, r + 20); b = rnd(1, a); ans = a - b; text = `${a} − ${b}`; }
  else if (op === '×') { a = rnd(2, Math.max(5, Math.round(r / 2))); b = rnd(2, 12); ans = a * b; text = `${a} × ${b}`; }
  else { b = rnd(2, 12); ans = rnd(2, 12); a = b * ans; text = `${a} ÷ ${b}`; }
  const d = [ans + rnd(1, 5), Math.abs(ans - rnd(1, 5)), ans + rnd(6, 10)];
  const mc = mcQuestion(text, ans, d);
  return { mc, num: { t: 'num', q: text, a: ans, hint: 'اكتب الناتج بالأرقام' } };
}

function genFraction(band, level) {
  const den = pick([2, 3, 4, 5, 6, 8]);
  const num = rnd(1, den - 1);
  const kind = rnd(0, 2);
  if (kind === 0) {
    return { mc: mcQuestion(`ما هو البسط في الكسر ${num}/${den}؟`, num, [den, num + 1, den - num]) };
  }
  if (kind === 1) {
    const pct = Math.round((num / den) * 100);
    return { mc: mcQuestion(`الكسر ${num}/${den} يمثّل كم بالمئة تقريباً؟`, `${pct}%`, [`${pct + 10}%`, `${Math.max(0, pct - 15)}%`, `${pct + 25}%`]) };
  }
  return { mc: mcQuestion(`ما مقلوب الكسر ${num}/${den}؟`, `${den}/${num}`, [`${num}/${num}`, `${den}/${den}`, `${num + 1}/${den}`]) };
}

function genGeometry(band) {
  const shapes = [
    { n: 'المثلث', sides: 3 }, { n: 'المربع', sides: 4 }, { n: 'الخماسي', sides: 5 },
    { n: 'السداسي', sides: 6 }, { n: 'الثماني', sides: 8 }, { n: 'العشاري', sides: 10 }
  ];
  const s = pick(shapes);
  return { mc: mcQuestion(`كم عدد أضلاع الشكل ${s.n}؟`, s.sides, [s.sides + 1, s.sides - 1, s.sides + 2]) };
}

function genSquares(band) {
  const n = rnd(2, 15);
  if (rnd(0, 1)) return { mc: mcQuestion(`مربع العدد ${n} = ؟`, n * n, [n * n + n, n * 2, n * n - n]) };
  const sq = n * n;
  return { mc: mcQuestion(`الجذر التربيعي للعدد ${sq} = ؟`, n, [n + 1, n - 1, sq / 2]) };
}

function genSecond(band) {
  const kind = rnd(0, 2);
  if (kind === 0) { // حل معادلة خطية
    const x = rnd(2, 10), c = rnd(1, 15);
    return { mc: mcQuestion(`حل المعادلة: س + ${c} = ${x + c}`, x, [x + 1, x - 1, x + c]) };
  }
  if (kind === 1) { // الأس
    const a = pick([2, 3, 5]), n = rnd(2, 3);
    return { mc: mcQuestion(`${a}^${n} = ؟`, Math.pow(a, n), [a * n, Math.pow(a, n) + a, a + n]) };
  }
  const a = rnd(2, 12), b = rnd(2, 12);
  return { mc: mcQuestion(`حلل: ما هو العامل المشترك للعددين ${a * 3} و ${b * 3}؟`, 3, [2, a, b]) };
}

// ===== محتوى مُنسّق (مطابقة وترتيب) =====
const CURATED = {
  g1_3: {
    pairs: [
      { title: 'المجاميع البسيطة', pairs: [['٣ + ٤', '٧'], ['٥ + ٥', '١٠'], ['٦ + ٢', '٨'], ['٩ − ٣', '٦']] },
      { title: 'العدد واسمه', pairs: [['١', 'واحد'], ['٥', 'خمسة'], ['٩', 'تسعة'], ['١٠', 'عشرة']] }
    ],
    order: [
      { q: 'رتّب تصاعدياً', values: [rnd(1, 9), rnd(10, 19), rnd(20, 29), rnd(30, 39)], dir: 'asc' },
      { q: 'رتّب تنازلياً', values: [rnd(40, 49), rnd(30, 39), rnd(20, 29), rnd(1, 19)], dir: 'desc' }
    ]
  },
  g4_6: {
    pairs: [
      { title: 'جدول الضرب', pairs: [['٦ × ٧', '٤٢'], ['٨ × ٩', '٧٢'], ['٧ × ٧', '٤٩'], ['٣ × ١٢', '٣٦']] },
      { title: 'الوحدات', pairs: [['متر', 'قياس الطول'], ['كيلوغرام', 'قياس الكتلة'], ['ثانية', 'قياس الزمن'], ['لتر', 'قياس الحجم']] },
      { title: 'الكسور العشرية', pairs: [['١/٢', '٠٫٥'], ['١/٤', '٠٫٢٥'], ['٣/٤', '٠٫٧٥'], ['١/١٠', '٠٫١']] }
    ],
    order: [
      { q: 'رتّب تصاعدياً', values: [12, 5, 27, 3], dir: 'asc' },
      { q: 'رتّب تنازلياً', values: [100, 64, 250, 88], dir: 'desc' },
      { q: 'رتّب الكسور العشرية تصاعدياً', values: [0.5, 0.25, 0.75, 0.1], dir: 'asc' }
    ]
  },
  g7_9: {
    pairs: [
      { title: 'المربعات والجذور', pairs: [['٩', '٣'], ['١٦', '٤'], ['٢٥', '٥'], ['٦٤', '٨']] },
      { title: 'المعادلات', pairs: [['س + ٣ = ٧', 'س = ٤'], ['٢س = ١٠', 'س = ٥'], ['س − ٥ = ١', 'س = ٦'], ['س ÷ ٢ = ٣', 'س = ٦']] },
      { title: 'المصطلحات الهندسية', pairs: [['محيط', 'مجموع الأضلاع'], ['مساحة', 'الحيز الداخلي'], ['قطر', 'يمر بالمركز'], ['زاوية قائمة', '٩٠°']] }
    ],
    order: [
      { q: 'رتّب تصاعدياً', values: [15, -3, 8, 0, -10], dir: 'asc' },
      { q: 'رتّب تنازلياً', values: [2.5, 1.75, 3.2, 0.9], dir: 'desc' },
      { q: 'رتّب القوى تصاعدياً', values: [2, 4, 8, 16], dir: 'asc' }
    ]
  },
  sec: {
    pairs: [
      { title: 'المتطابقات', pairs: [['(أ+ب)²', 'أ²+٢أب+ب²'], ['(أ−ب)²', 'أ²−٢أب+ب²'], ['أ²−ب²', '(أ−ب)(أ+ب)'], ['٠', 'جا²+جتا²']] },
      { title: 'الدوال', pairs: [['جا', 'المقابل/الوتر'], ['جتا', 'المجاور/الوتر'], ['ظا', 'المقابل/المجاور'], ['لو', 'اللوغاريتم']] },
      { title: 'الأسس', pairs: [['أ⁰', '١'], ['أ¹', 'أ'], ['أ⁻¹', '١/أ'], ['أ^½', '√أ']] }
    ],
    order: [
      { q: 'رتّب تصاعدياً', values: [1, 1 / 2, 1 / 4, 1 / 8], dir: 'asc' },
      { q: 'رتّب تنازلياً', values: [Math.pow(2, 5), Math.pow(2, 4), Math.pow(2, 3), Math.pow(2, 2)], dir: 'desc' }
    ]
  }
};

// ===== توليد مجموعة أسئلة من نوع معيّن =====
export function pool(bandId, type, level = 'medium') {
  const band = GRADE_BANDS.find((b) => b.id === bandId) || GRADE_BANDS[1];
  const curated = CURATED[band.id] || {};

  if (type === 'pairs') {
    const rounds = shuffle(curated.pairs || []).map((r) => ({ t: 'pairs', title: r.title, pairs: shuffle(r.pairs) }));
    return rounds;
  }
  if (type === 'order') {
    return shuffle(curated.order || []).map((r) => ({ t: 'order', q: r.q, values: r.values, dir: r.dir }));
  }

  // mc / tf / num — إجرائي + متنوّع
  const gens = band.id === 'sec' ? [genSecond, genSquares, genArithmetic]
    : band.id === 'g7_9' ? [genSquares, genFraction, genGeometry, genArithmetic]
    : band.id === 'g4_6' ? [genArithmetic, genFraction, genGeometry]
    : [genArithmetic, genGeometry];

  const out = [];
  let guard = 0;
  while (out.length < 30 && guard++ < 400) {
    const g = pick(gens)(band, level);
    if (type === 'mc' && g.mc) out.push(g.mc);
    else if (type === 'num' && g.num) out.push(g.num);
    else if (type === 'tf' && g.mc) {
      // حوّل سؤال الاختيار إلى صح/خطأ
      const correct = g.mc.choices[g.mc.a];
      const wrong = g.mc.choices.find((c, i) => i !== g.mc.a);
      const shown = rnd(0, 1) ? correct : wrong;
      out.push({ t: 'tf', q: `${g.mc.q} = ${shown}`, a: shown === correct });
    }
  }
  // أضف بعض أسئلة صح/خطأ لمفاهيم عامة
  if (type === 'tf') {
    const facts = [
      ['مجموع زوايا المثلث ١٨٠ درجة', true],
      ['المربع له ٥ أضلاع', false],
      ['العدد ١ عدد أوّلي', false],
      ['كل مربع مستطيل', true],
      ['الصفر عدد طبيعي موجب', false],
      ['العدد ٢ هو أصغر عدد أوّلي', true],
      ['١٠٠ عدد زوجي', true],
      ['الجذر التربيعي لـ ٩ يساوي ٤', false]
    ];
    shuffle(facts).forEach(([q, a]) => out.push({ t: 'tf', q, a }));
  }
  return shuffle(out);
}

export function metaOf(id) {
  return GAME_META.find((g) => g.id === id) || GAME_META[0];
}

export { shuffle, rnd, pick };
