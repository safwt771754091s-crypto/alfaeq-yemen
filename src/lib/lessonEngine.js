import { SUBJECTS, gradeName, gradeCycle, getUnits } from '../data/curriculum.js';
import { STRATEGIES, BLOOM, ASSESSMENT_TOOLS } from '../data/strategies.js';
import { topicIllustration, topicExamples } from './illustrations.js';

function pick(arr, seed) {
  return arr[Math.abs(hash(seed)) % arr.length];
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i++) {
    h = (h << 5) - h + String(str).charCodeAt(i);
    h |= 0;
  }
  return h;
}

// اختيار استراتيجيات مناسبة حسب المادة والصف
function strategiesFor(subjectId, grade) {
  const base = ['brainstorm', 'discussion', 'think_pair', 'differentiated', 'visual'];
  const map = {
    math: ['problem', 'inquiry', 'cooperative', 'concept_map'],
    science: ['inquiry', 'problem', 'cooperative', 'visual'],
    physics: ['inquiry', 'problem', 'concept_map'],
    chemistry: ['inquiry', 'problem', 'cooperative'],
    biology: ['inquiry', 'visual', 'cooperative'],
    arabic: ['roleplay', 'discussion', 'mindmap', 'kwl'],
    english: ['roleplay', 'gamification', 'visual', 'discussion'],
    social: ['discussion', 'roleplay', 'project'],
    history: ['discussion', 'roleplay', 'project'],
    geography: ['visual', 'inquiry', 'project'],
    islamic: ['discussion', 'roleplay', 'kwl'],
    quran: ['discussion', 'cooperative', 'gamification'],
    psychology: ['discussion', 'project', 'inquiry'],
    philosophy: ['discussion', 'questioning', 'inquiry']
  };
  const extra = map[subjectId] || [];
  let all = [...extra, ...base];
  if (grade <= 4) all = [...all, 'gamification', 'visual'];
  return all;
}

// توليد أهداف تعلم وفق مستويات بلوم
function buildObjectives(topic, subjectId, grade) {
  const levels = grade <= 4
    ? ['remember', 'understand', 'apply']
    : grade <= 9
      ? ['understand', 'apply', 'analyze']
      : ['apply', 'analyze', 'evaluate', 'create'];
  return levels.map((lv, i) => {
    const verb = BLOOM[lv].verbs[Math.abs(hash(topic + lv + i)) % BLOOM[lv].verbs.length];
    const tail = i === 0
      ? `المفاهيم الأساسية في «${topic}»`
      : i === 1
        ? `العلاقات والأنماط المرتبطة بـ«${topic}»`
        : `تطبيق ما تعلمه في «${topic}» على مواقف جديدة`;
    return `أن ${verb} الطالب ${tail}.`;
  });
}

function lessonElements(topic, subjectId, grade) {
  const subject = SUBJECTS[subjectId];
  const nm = subject ? subject.name : 'المادة';
  const ex = topicExamples(subjectId, topic);
  return [
    { title: 'عناصر الدرس', items: [
      `التعريف بالمفهوم الأساسي في «${topic}»`,
      `شرح المصطلحات والمفاهيم المرتبطة`,
      `أمثلة توضيحية من واقع بيئة الطالب اليمنية`,
      `تدريبات وأنشطة تطبيقية متدرجة`,
      `الربط بالدروس السابقة وتلخيص الأفكار الرئيسة`
    ]},
    { title: 'المحتوى العلمي', items: [
      `المفاهيم الأساسية لمادة ${nm}`,
      `القواعد والأنماط التي يحكمها «${topic}»`,
      `التطبيقات العملية والواقعية`,
      `الأخطاء الشائعة وتصويبها`
    ]},
    { title: 'أمثلة وتطبيقات', items: ex }
  ];
}

function warmUp(topic, subjectId) {
  const options = [
    `عرض صورة أو مشهد قصير مرتبط بـ«${topic}» وطرح سؤال مفتوح: ماذا تلاحظون؟`,
    `طرح سؤال محفّز: أين نرى «${topic}» في حياتنا اليومية؟`,
    `نشاط قصير (3 دقائق): تذكّر ما تعلمناه سابقاً وصله بموضوع اليوم.`,
    `لعبة سريعة لتوليد التوقعات حول عنوان الدرس.`,
    `قصة قصيرة أو مثال من بيئة الطالب يمهد لمفهوم «${topic}».`
  ];
  return pick(options, topic + subjectId);
}

// =============== مولّد تحضير الدرس ===============
export function generateLessonPlan({ subjectId, grade, title, duration = 45, section = 'scientific', objectives = [], notes = '' }) {
  const subject = SUBJECTS[subjectId];
  const nm = subject ? subject.name : 'المادة';
  const sIds = strategiesFor(subjectId, grade).slice(0, 4);
  const strategies = sIds.map((id) => STRATEGIES.find((s) => s.id === id)).filter(Boolean);

  const perPhase = Math.max(5, Math.round(duration * 0.15));
  const p2 = Math.round(duration * 0.35);
  const p3 = Math.round(duration * 0.3);
  const p4 = Math.max(5, duration - perPhase - p2 - p3);
  const phases = [
    {
      name: 'التمهيد والتهيئة',
      minutes: perPhase,
      activity: warmUp(title, subjectId),
      role: 'المعلم: يهيئ الطلاب ويطرح السؤال المحفّز. الطالب: يستكشف ويبدي ملاحظاته.'
    },
    {
      name: 'العرض والشرح',
      minutes: p2,
      activity: `شرح مفاهيم «${title}» مع الأمثلة التوضيحية والتمثيل البصري.`,
      role: 'المعلم: يشرح ويوضح بالأمثلة. الطالب: يتابع ويدوّن الملاحظات.'
    },
    {
      name: 'التطبيق والأنشطة',
      minutes: p3,
      activity: `أنشطة تعاونية وتدريبات تطبيقية على «${title}» بمستويات متفاوتة.`,
      role: 'المعلم: يوجّه ويلاحظ. الطالب: يعمل في مجموعات ويطبّق.'
    },
    {
      name: 'التقويم والختام',
      minutes: p4,
      activity: 'تقويم ختامي (أسئلة قصيرة) وتلخيص أهم الأفكار وتكليف الواجب.',
      role: 'المعلم: يقوّم ويلخص. الطالب: يجيب ويشارك في التلخيص.'
    }
  ];

  const genObjectives = objectives.length ? objectives : buildObjectives(title, subjectId, grade);
  const elements = lessonElements(title, subjectId, grade);
  const assessments = [
    ASSESSMENT_TOOLS[0], ASSESSMENT_TOOLS[1], ASSESSMENT_TOOLS[3], ASSESSMENT_TOOLS[6]
  ];

  return {
    subjectId,
    subjectName: nm,
    grade,
    gradeName: gradeName(grade),
    cycle: gradeCycle(grade),
    section,
    title,
    duration,
    notes,
    createdAt: new Date().toISOString(),
    objectives: genObjectives,
    warmUp: warmUp(title, subjectId),
    elements,
    examples: topicExamples(subjectId, title),
    illustration: topicIllustration({ subjectId, topic: title }),
    strategies,
    phases,
    assessment: assessments,
    homework: `واجب منزلي: تمارين تطبيقية على «${title}» تراعي الفروق الفردية (تمارين أساسية + تمرين إثرائي).`,
    resources: [
      'الكتاب المقرر',
      'السبورة وأقلامها',
      'وسائل تعليمية / عرض تقديمي',
      'أوراق نشاط',
      'جهاز العرض (إن توفر)'
    ]
  };
}

// =============== مولّد العرض التقديمي (الشرائح) ===============
export function generateSlides({ subjectId, grade, title, duration = 45, lessonPlan = null, slideCount = 10, customImage = '' }) {
  const subject = SUBJECTS[subjectId];
  const nm = subject ? subject.name : 'المادة';
  const plan = lessonPlan || generateLessonPlan({ subjectId, grade, title, duration });
  const units = getUnits(grade, subjectId);
  const relatedUnit = units.find((u) => u.lessons.some((l) => l === title));

  const slides = [];
  const mainImage = customImage || topicIllustration({ subjectId, topic: title });
  const examples = (plan.examples && plan.examples.length) ? plan.examples : topicExamples(subjectId, title);
  // شريحة العنوان
  slides.push({
    layout: 'title',
    heading: title,
    sub: `${nm} — ${gradeName(grade)}`,
    bullets: [],
    image: mainImage
  });
  // أهداف الدرس
  slides.push({
    layout: 'bullets',
    heading: 'أهداف الدرس',
    sub: '',
    bullets: plan.objectives.slice(0, 4)
  });
  // التهيئة
  slides.push({
    layout: 'quote',
    heading: 'تهيئة',
    sub: plan.warmUp,
    bullets: []
  });
  // صورة توضيحية
  slides.push({
    layout: 'visual',
    heading: 'صورة توضيحية',
    sub: relatedUnit ? `الوحدة: ${relatedUnit.title}` : `مشهد تعليمي مرتبط بـ«${title}»`,
    bullets: [],
    image: mainImage
  });
  // المحتوى — موزع على عدة شرائح
  const conceptSlides = Math.max(3, slideCount - 6);
  const elementItems = plan.elements.flatMap((e) => e.items);
  for (let i = 0; i < conceptSlides; i++) {
    const chunk = elementItems.slice(
      Math.floor((i * elementItems.length) / conceptSlides),
      Math.floor(((i + 1) * elementItems.length) / conceptSlides)
    );
    slides.push({
      layout: 'bullets',
      heading: i === 0 ? `المفاهيم الأساسية — ${title}` : `محتوى (${i + 1})`,
      sub: relatedUnit ? `الوحدة: ${relatedUnit.title}` : '',
      bullets: chunk.length ? chunk : [`عنصر ${i + 1} من محتوى «${title}»`]
    });
  }
  // أمثلة وتطبيقات
  slides.push({
    layout: 'examples',
    heading: 'أمثلة وتطبيقات',
    sub: `أمثلة واقعية مرتبطة بـ«${title}»`,
    bullets: examples,
    image: customImage || topicIllustration({ subjectId, topic: title + ' مثال' })
  });
  // نشاط صفي
  slides.push({
    layout: 'activity',
    heading: 'نشاط صفي',
    sub: `تطبيق عملي على «${title}» في مجموعات تعاونية.`,
    bullets: ['توزيع الأدوار', 'تنفيذ النشاط', 'عرض النتائج', 'التغذية الراجعة']
  });
  // التقويم
  slides.push({
    layout: 'bullets',
    heading: 'تقويم سريع',
    sub: 'أسئلة ختامية للتأكد من تحقق الأهداف',
    bullets: [
      `ما أهم ما تعلمته في «${title}»؟`,
      'اذكر مثالاً من واقعك.',
      'ما النقطة التي تحتاج إلى مراجعة؟'
    ]
  });
  // الخاتمة
  slides.push({
    layout: 'end',
    heading: 'الخاتمة',
    sub: plan.homework,
    bullets: ['شكراً لحسن استماعكم', `المادة: ${nm}`, gradeName(grade)]
  });

  return {
    subjectId,
    subjectName: nm,
    grade,
    title,
    createdAt: new Date().toISOString(),
    slides
  };
}

// =============== تصدير الشرائح إلى Markdown ===============
export function slidesToMarkdown(pres) {
  const lines = [];
  lines.push(`# ${pres.title}`);
  lines.push(`**المادة:** ${pres.subjectName} — **${gradeName(pres.grade)}**`);
  lines.push('');
  pres.slides.forEach((s, i) => {
    lines.push(`---`);
    lines.push('');
    if (s.layout === 'title') {
      lines.push(`# ${s.heading}`);
      if (s.sub) lines.push(`## ${s.sub}`);
      if (s.image) lines.push(`\n![${s.heading}](${s.image})\n`);
    } else {
      lines.push(`## ${s.heading}`);
      if (s.sub) lines.push(`> ${s.sub}`);
      if (s.image) lines.push(`\n![${s.heading}](${s.image})\n`);
      if (s.bullets?.length) {
        lines.push('');
        s.bullets.forEach((b) => lines.push(`- ${b}`));
      }
    }
    lines.push('');
    lines.push(`<!-- slide ${i + 1} -->`);
    lines.push('');
  });
  return lines.join('\n');
}

// =============== تصدير الشرائح إلى PowerPoint (PPTX) ===============
// يبني حزمة PPTX صالحة (OOXML) دون مكتبات خارجية.
// إن توفّر المتصفح نُحوّل الرسوم التوضيحية (SVG) إلى PNG ونضمّنها في الشرائح.
export async function slidesToPptx(pres) {
  const imageMap = await buildImageMap(pres);
  const files = buildPptxFiles(pres, imageMap);
  const blob = await zipFiles(files);
  return blob;
}

function dataUrlToBytes(dataUrl) {
  const comma = dataUrl.indexOf(',');
  const meta = dataUrl.slice(0, comma);
  const data = dataUrl.slice(comma + 1);
  if (meta.includes('base64')) {
    const bin = typeof atob === 'function'
      ? atob(data)
      : Buffer.from(data, 'base64').toString('binary');
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new TextEncoder().encode(decodeURIComponent(data));
}

// يحوّل كل صورة SVG (data URI) إلى PNG عبر canvas. يعمل فقط في المتصفح.
async function rasterizeDataUri(dataUri, w = 800, h = 520) {
  if (typeof document === 'undefined' || !dataUri) return null;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          resolve(dataUrlToBytes(canvas.toDataURL('image/png')));
        } catch (e) { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = dataUri;
    } catch (e) { resolve(null); }
  });
}

async function buildImageMap(pres) {
  const map = {};
  if (typeof document === 'undefined') return map;
  let n = 0;
  for (const s of pres.slides) {
    if (s.image && !map[s.image]) {
      const bytes = await rasterizeDataUri(s.image);
      if (bytes) {
        n++;
        map[s.image] = { name: `image${n}.png`, bytes };
      }
    }
  }
  return map;
}

function xmlEscape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function pictureXml(relId, x, y, cx, cy, id = 20) {
  return `
  <p:pic>
    <p:nvPicPr>
      <p:cNvPr id="${id}" name="Picture ${id}"/>
      <p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>
      <p:nvPr/>
    </p:nvPicPr>
    <p:blipFill>
      <a:blip r:embed="${relId}"/>
      <a:stretch><a:fillRect/></a:stretch>
    </p:blipFill>
    <p:spPr>
      <a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
      <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
    </p:spPr>
  </p:pic>`;
}

function slideXml(slide, index, total, deckTitle, imageRelId) {
  const isTitle = slide.layout === 'title';
  const isEnd = slide.layout === 'end';
  const hasImage = !!imageRelId;
  const titleSize = isTitle ? 4400 : 3000;
  const bodySize = 2000;
  const shapes = [];

  // الشريط الجانبي الملون
  shapes.push(`
  <p:sp>
    <p:nvSpPr><p:cNvPr id="2" name="Accent"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
    <p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="380000"/></a:xfrm>
      <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
      <a:solidFill><a:srgbClr val="04775F"/></a:solidFill></p:spPr>
    <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="ar-SA"/></a:p></p:txBody>
  </p:sp>`);

  // العنوان
  shapes.push(`
  <p:sp>
    <p:nvSpPr><p:cNvPr id="3" name="Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
    <p:spPr><a:xfrm><a:off x="838200" y="${isTitle ? 1500000 : 600000}"/><a:ext cx="10515600" cy="1200000"/></a:xfrm>
      <a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
    <p:txBody><a:bodyPr anchor="ctr" rtlCol="1"/><a:lstStyle/>
      <a:p><a:pPr algn="${isTitle || isEnd ? 'ctr' : 'r'}" rtl="1"/><a:r><a:rPr lang="ar-SA" sz="${titleSize}" b="1"><a:solidFill><a:srgbClr val="0B3B33"/></a:solidFill><a:latin typeface="Tajawal"/><a:cs typeface="Tajawal"/></a:rPr><a:t>${xmlEscape(slide.heading)}</a:t></a:r></a:p>
    </p:txBody>
  </p:sp>`);

  // العنوان الفرعي
  if (slide.sub) {
    shapes.push(`
    <p:sp>
      <p:nvSpPr><p:cNvPr id="4" name="Sub"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
      <p:spPr><a:xfrm><a:off x="838200" y="${isTitle ? 2500000 : 1350000}"/><a:ext cx="10515600" cy="700000"/></a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
      <p:txBody><a:bodyPr anchor="t" rtlCol="1"/><a:lstStyle/>
        <a:p><a:pPr algn="${isTitle || isEnd ? 'ctr' : 'r'}" rtl="1"/><a:r><a:rPr lang="ar-SA" sz="2000"><a:solidFill><a:srgbClr val="475569"/></a:solidFill><a:cs typeface="Tajawal"/></a:rPr><a:t>${xmlEscape(slide.sub)}</a:t></a:r></a:p>
      </p:txBody>
    </p:sp>`);
  }

  // الصورة التوضيحية + تخطيط المحتوى حسب وجود الصورة
  let bodyOffX = 838200, bodyOffY = 2500000, bodyCx = 10515600, bodyCy = 3800000;
  if (hasImage) {
    if (slide.layout === 'visual' || isTitle) {
      // صورة كبيرة في الأسفل، والمحتوى أعلى
      const imgX = 4596000, imgY = isTitle ? 3600000 : 2200000;
      const imgCx = 3000000, imgCy = 1950000;
      shapes.push(pictureXml(imageRelId, imgX, imgY, imgCx, imgCy));
      bodyCx = 10515600;
      bodyOffY = 2200000;
      bodyCy = 1200000;
    } else {
      // المحتوى على اليمين (RTL) والصورة على اليسار
      shapes.push(pictureXml(imageRelId, 700000, 2300000, 4600000, 3100000));
      bodyOffX = 5600000;
      bodyCx = 5750000;
    }
  }

  // القائمة النقطية
  if (slide.bullets?.length) {
    const paras = slide.bullets.map((b) => `
      <a:p><a:pPr algn="r" rtl="1" marL="342900" indent="-342900"><a:buChar char="•"/></a:pPr>
        <a:r><a:rPr lang="ar-SA" sz="${bodySize}"><a:solidFill><a:srgbClr val="1E293B"/></a:solidFill><a:cs typeface="Tajawal"/></a:rPr><a:t>${xmlEscape(b)}</a:t></a:r></a:p>`).join('');
    shapes.push(`
    <p:sp>
      <p:nvSpPr><p:cNvPr id="5" name="Body"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
      <p:spPr><a:xfrm><a:off x="${bodyOffX}" y="${bodyOffY}"/><a:ext cx="${bodyCx}" cy="${bodyCy}"/></a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
      <p:txBody><a:bodyPr anchor="t" rtlCol="1"/><a:lstStyle/>${paras}
      </p:txBody>
    </p:sp>`);
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="6858000"/><a:chOff x="0" y="0"/><a:chExt cx="12192000" cy="6858000"/></a:xfrm></p:grpSpPr>
    ${shapes.join('\n')}
    <p:sp>
      <p:nvSpPr><p:cNvPr id="9" name="Footer"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
      <p:spPr><a:xfrm><a:off x="838200" y="6400000"/><a:ext cx="10515600" cy="350000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
      <p:txBody><a:bodyPr rtlCol="1"/><a:lstStyle/><a:p><a:pPr algn="l" rtl="1"/><a:r><a:rPr lang="ar-SA" sz="1200"><a:solidFill><a:srgbClr val="94A3B8"/></a:solidFill></a:rPr><a:t>منصة المعلم الذكية • ${xmlEscape(deckTitle)} • ${index + 1}/${total}</a:t></a:r></a:p></p:txBody>
    </p:sp>
  </p:spTree></p:cSld>
  <p:clrMapOvr><a:overrideClrMapping bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:clrMapOvr>
</p:sld>`;
}

function buildPptxFiles(pres, imageMap = {}) {
  const total = pres.slides.length;
  const files = {};

  const hasImages = Object.keys(imageMap).length > 0;
  const imageDefaults = hasImages
    ? '<Default Extension="png" ContentType="image/png"/>'
    : '';

  files['[Content_Types].xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  ${imageDefaults}
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  ${pres.slides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('\n  ')}
</Types>`;

  files['_rels/.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

  files['docProps/core.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${xmlEscape(pres.title)}</dc:title>
  <dc:creator>منصة المعلم الذكية</dc:creator>
  <cp:lastModifiedBy>منصة المعلم الذكية</cp:lastModifiedBy>
</cp:coreProperties>`;

  files['docProps/app.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>منصة المعلم الذكية</Application>
  <Slides>${total}</Slides>
</Properties>`;

  files['ppt/presentation.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" rtl="1">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>
    ${pres.slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join('\n    ')}
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;

  const presRels = [`<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>`];
  pres.slides.forEach((_, i) => {
    presRels.push(`<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`);
  });
  files['ppt/_rels/presentation.xml.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${presRels.join('\n  ')}
</Relationships>`;

  // master + layout + theme (مبسّطة لكن صالحة)
  files['ppt/slideMasters/slideMaster1.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="6858000"/><a:chOff x="0" y="0"/><a:chExt cx="12192000" cy="6858000"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
  <p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>
</p:sldMaster>`;

  files['ppt/slideMasters/_rels/slideMaster1.xml.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`;

  files['ppt/slideLayouts/slideLayout1.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank"><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="6858000"/><a:chOff x="0" y="0"/><a:chExt cx="12192000" cy="6858000"/></a:xfrm></p:grpSpPr>
  </p:spTree></p:cSld>
  <p:clrMapOvr><a:overrideClrMapping bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:clrMapOvr>
</p:sldLayout>`;

  files['ppt/slideLayouts/_rels/slideLayout1.xml.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`;

  files['ppt/theme/theme1.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="SmartTeacher">
  <a:themeElements>
    <a:clrScheme name="SmartTeacher">
      <a:dk1><a:srgbClr val="0B3B33"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1E293B"/></a:dk2><a:lt2><a:srgbClr val="F1F5F9"/></a:lt2>
      <a:accent1><a:srgbClr val="04775F"/></a:accent1><a:accent2><a:srgbClr val="C8903F"/></a:accent2>
      <a:accent3><a:srgbClr val="10B98D"/></a:accent3><a:accent4><a:srgbClr val="E0C48C"/></a:accent4>
      <a:accent5><a:srgbClr val="0EA5E9"/></a:accent5><a:accent6><a:srgbClr val="6366F1"/></a:accent6>
      <a:hlink><a:srgbClr val="0EA5E9"/></a:hlink><a:folHlink><a:srgbClr val="6366F1"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="SmartTeacher">
      <a:majorFont><a:latin typeface="Tajawal"/><a:ea typeface=""/><a:cs typeface="Tajawal"/></a:majorFont>
      <a:minorFont><a:latin typeface="Tajawal"/><a:ea typeface=""/><a:cs typeface="Tajawal"/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="SmartTeacher">
      <a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`;

  pres.slides.forEach((s, i) => {
    const img = s.image ? imageMap[s.image] : null;
    const rels = [`<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>`];
    if (img) {
      files[`ppt/media/${img.name}`] = img.bytes;
      // rId2 = الصورة
      rels.push(`<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${img.name}"/>`);
    }
    files[`ppt/slides/slide${i + 1}.xml`] = slideXml(s, i, total, pres.title, img ? 'rId2' : null);
    files[`ppt/slides/_rels/slide${i + 1}.xml.rels`] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${rels.join('\n  ')}
</Relationships>`;
  });

  return files;
}

// =============== ZIP writer (store, no compression) ===============
function crc32(bytes) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0 ^ -1;
  for (let i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function strToBytes(str) {
  return new TextEncoder().encode(str);
}

function dosDateTime(d = new Date()) {
  const time = ((d.getHours() & 0x1f) << 11) | ((d.getMinutes() & 0x3f) << 5) | ((d.getSeconds() / 2) & 0x1f);
  const date = (((d.getFullYear() - 1980) & 0x7f) << 9) | (((d.getMonth() + 1) & 0x0f) << 5) | (d.getDate() & 0x1f);
  return { time, date };
}

function zipFiles(files) {
  const encoder = new TextEncoder();
  const entries = Object.entries(files);
  const { time, date } = dosDateTime();
  const chunks = [];
  const central = [];
  let offset = 0;

  const u16 = (n) => new Uint8Array([n & 0xff, (n >>> 8) & 0xff]);
  const u32 = (n) => new Uint8Array([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]);
  const concat = (...arrs) => {
    const len = arrs.reduce((a, b) => a + b.length, 0);
    const out = new Uint8Array(len);
    let p = 0;
    arrs.forEach((a) => { out.set(a, p); p += a.length; });
    return out;
  };

  entries.forEach(([name, content]) => {
    const nameBytes = encoder.encode(name);
    const dataBytes = typeof content === 'string' ? strToBytes(content) : content;
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    const local = concat(
      u32(0x04034b50),
      u16(20), u16(0), u16(0), u16(time), u16(date),
      u32(crc), u32(size), u32(size),
      u16(nameBytes.length), u16(0),
      nameBytes,
      dataBytes
    );
    chunks.push(local);

    central.push(concat(
      u32(0x02014b50),
      u16(20), u16(20), u16(0), u16(0), u16(time), u16(date),
      u32(crc), u32(size), u32(size),
      u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0),
      u32(offset),
      nameBytes
    ));

    offset += local.length;
  });

  const centralBytes = concat(...central);
  const centralOffset = offset;
  const end = concat(
    u32(0x06054b50),
    u16(0), u16(0),
    u16(entries.length), u16(entries.length),
    u32(centralBytes.length), u32(centralOffset),
    u16(0)
  );

  return new Blob([concat(...chunks), centralBytes, end], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  });
}
