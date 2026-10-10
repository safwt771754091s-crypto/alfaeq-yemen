// مولّد الرسوم التوضيحية (SVG) — يعمل بدون إنترنت.
// يولّد صورة مضمّنة (data URI) مبنية على المادة والموضوع، بتصميم بسيط أنيق.
// ملاحظة: هذه رسوم تخطيطية تعليمية وليست صوراً فوتوغرافية.

const PALETTES = [
  { bg: '#ecfdf5', fg: '#04775f', accent: '#c8903f', soft: '#a7f3d0' },
  { bg: '#eff6ff', fg: '#2563eb', accent: '#f59e0b', soft: '#bfdbfe' },
  { bg: '#fef2f2', fg: '#dc2626', accent: '#0f766e', soft: '#fecaca' },
  { bg: '#f5f3ff', fg: '#7c3aed', accent: '#c8903f', soft: '#ddd6fe' },
  { bg: '#fff7ed', fg: '#ea580c', accent: '#0f766e', soft: '#fed7aa' },
  { bg: '#f0fdfa', fg: '#0d9488', accent: '#b45309', soft: '#99f6e4' }
];

function hash(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i++) {
    h = (h << 5) - h + String(str).charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// رسم مخصص لكل عائلة مواد
function motif(subjectId, c) {
  const stroke = `stroke="${c.fg}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  const fill = `fill="${c.fg}"`;
  const soft = `fill="${c.soft}"`;
  switch (subjectId) {
    case 'math':
    case 'physics':
    case 'chemistry':
      return `
        <polygon points="120,220 210,60 300,220" ${soft}/>
        <polygon points="120,220 210,60 300,220" ${stroke}/>
        <circle cx="330" cy="120" r="52" ${soft}/>
        <circle cx="330" cy="120" r="52" ${stroke}/>
        <rect x="60" y="250" width="360" height="40" rx="10" ${soft}/>`;
    case 'science':
    case 'biology':
      return `
        <path d="M150 60 h120 l-14 90 a70 70 0 0 1 -92 0 z" ${soft}/>
        <path d="M150 60 h120 l-14 90 a70 70 0 0 1 -92 0 z" ${stroke}/>
        <circle cx="185" cy="180" r="12" ${fill}/><circle cx="235" cy="200" r="9" ${fill}/>
        <line x1="210" y1="60" x2="210" y2="220" ${stroke}/>
        <circle cx="330" cy="150" r="16" ${fill}/><circle cx="360" cy="110" r="10" ${fill}/>
        <circle cx="100" cy="150" r="16" ${fill}/><circle cx="72" cy="188" r="10" ${fill}/>`;
    case 'arabic':
    case 'english':
      return `
        <path d="M90 250 q120 -170 250 -60 q22 -70 90 -90" ${stroke}/>
        <circle cx="90" cy="250" r="10" ${fill}/>
        <path d="M120 90 h180" ${stroke}/>
        <rect x="120" y="120" width="200" height="60" rx="12" ${soft}/>`;
    case 'social':
    case 'history':
    case 'geography':
      return `
        <path d="M120 60 v220 l150 -40 v-200 z" ${soft}/>
        <path d="M120 60 v220 l150 -40 v-200 z" ${stroke}/>
        <circle cx="320" cy="110" r="30" ${fill}/>
        <path d="M60 250 q120 -40 380 0" ${stroke}/>`;
    case 'islamic':
    case 'quran':
      return `
        <path d="M210 60 a90 90 0 1 0 0 180 a70 70 0 1 1 0 -180 z" ${soft}/>
        <path d="M210 60 a90 90 0 1 0 0 180 a70 70 0 1 1 0 -180 z" ${stroke}/>
        <polygon points="210,90 226,140 280,140 236,172 252,222 210,190 168,222 184,172 140,140 194,140" ${fill}/>`;
    case 'psychology':
    case 'philosophy':
      return `
        <circle cx="200" cy="140" r="80" ${soft}/>
        <circle cx="200" cy="140" r="80" ${stroke}/>
        <path d="M200 60 v160 M120 140 h160 M155 95 l90 90 M245 95 l-90 90" ${stroke}/>`;
    default:
      return `
        <circle cx="200" cy="140" r="80" ${soft}/>
        <circle cx="200" cy="140" r="80" ${stroke}/>
        <path d="M200 100 v80 M160 140 h80" ${stroke}/>`;
  }
}

// يرجع data URI لصورة SVG للدرس
export function topicIllustration({ subjectId = '', topic = '', width = 400, height = 260 } = {}) {
  const h = hash(subjectId + topic);
  const c = PALETTES[h % PALETTES.length];
  const label = topic.length > 26 ? topic.slice(0, 25) + '…' : topic;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c.bg}"/><stop offset="1" stop-color="#ffffff"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" rx="20" fill="url(#bg)"/>
  <g transform="translate(20,20)">${motif(subjectId, c)}</g>
  <rect x="0" y="${height - 44}" width="${width}" height="44" fill="${c.fg}" opacity="0.9"/>
  <text x="${width / 2}" y="${height - 15}" font-family="Tajawal, sans-serif" font-size="17" font-weight="700" fill="#ffffff" text-anchor="middle" direction="rtl">${esc(label)}</text>
</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// أمثلة مرتبطة بالموضوع تُبنى حسب المادة
export function topicExamples(subjectId, topic) {
  const t = topic || 'الموضوع';
  const bySubject = {
    math: [
      `مثال عملي: لدينا 5 صناديق في كل صندوق 8 برتقالات — احسب المجموع المتعلق بـ«${t}».`,
      `مسألة من واقع السوق: اشترى محمد 3 كجم أرز بسعر الوحدة... فما الإجمالي؟ (تطبيق مباشر على «${t}»).`
    ],
    science: [
      `تجربة صفية بسيطة: لاحظ ما يحدث عند... وسجّل النتيجة لاستنتاج مفهوم «${t}».`,
      `مثال من البيئة اليمنية يوضح «${t}» في الحياة اليومية.`
    ],
    physics: [
      `مثال: احسب السرعة إذا قطعت سيارة 120 كم في ساعتين (تطبيق على «${t}»).`,
      `تطبيق يومي: تأثير «${t}» على الأدوات المنزلية البسيطة.`
    ],
    chemistry: [
      `مثال: تفاعل بسيط يمكن ملاحظته في المطبخ يوضح «${t}».`,
      `احسب النسبة المئوية للمركب المرتبط بـ«${t}».`
    ],
    biology: [
      `مثال من جسم الإنسان أو نبات محلي يوضح «${t}».`,
      `ارسم/صف دورة حيوية مرتبطة بـ«${t}».`
    ],
    arabic: [
      `مثال بلاغي/نحوي على «${t}» من نص شعري أو آية كريمة.`,
      `جملة تطبيقية: أعرب ما تحته خط واستخرج الشاهد على «${t}».`
    ],
    english: [
      `Example: use "${t}" in a short real-life sentence about your school day.`,
      `Practice: write two sentences applying "${t}".`
    ],
    social: [
      `مثال من الواقع اليمني يوضح «${t}» (مدينة، قبيلة، نشاط اقتصادي).`,
      `حالة دراسية: كيف يؤثر «${t}» على المجتمع المحلي؟`
    ],
    history: [
      `مثال تاريخي: حدث أو شخصية مرتبطة بـ«${t}» ورتب الأسباب والنتائج.`,
      `قارن بين موقفين تاريخيين حول «${t}».`
    ],
    geography: [
      `مثال: استخرج من الخريطة موقعاً/مظهّراً مرتبطاً بـ«${t}».`,
      `اربط «${t}» بالمناخ والسكان في اليمن.`
    ],
    islamic: [
      `مثال عملي: تطبيق «${t}» في معاملاتك اليومية.`,
      `استخرج حكماً/دليلاً شرعياً يتصل بـ«${t}».`
    ],
    quran: [
      `مثال: آية كريمة أو حديث شريف يتصل بـ«${t}» مع بيان المعنى.`,
      `طبّق التجويد/التفسير المرتبط بـ«${t}» على آية قصيرة.`
    ],
    psychology: [
      `مثال سلوكي من محيط الطالب يوضح «${t}».`,
      `حالة: كيف نفسّر سلوكاً واقعياً في ضوء «${t}»؟`
    ],
    philosophy: [
      `مثال: رأيان متعارضان حول «${t}» — ناقش أيهما أقرب للعقل؟`,
      `سؤال فلسفي واقعي مرتبط بـ«${t}».`
    ]
  };
  const list = bySubject[subjectId] || [
    `مثال توضيحي من واقع الطالب مرتبط بـ«${t}».`,
    `تطبيق عملي مباشر على «${t}».`
  ];
  return list;
}
