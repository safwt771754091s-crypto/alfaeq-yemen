import { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, EmptyState, Tabs, useToast, Confirm } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { GRADES, subjectsForGrade, getLessons } from '../data/curriculum.js';
import { generateSlides, slidesToMarkdown, slidesToPptx } from '../lib/lessonEngine.js';
import { download, downloadBlob, slugify } from '../lib/utils.js';

function SlidePreview({ slide, index, total }) {
  const layouts = {
    title: 'bg-gradient-to-br from-brand-600 to-brand-800 text-white',
    end: 'bg-gradient-to-br from-slate-800 to-slate-900 text-white',
    quote: 'bg-gradient-to-br from-sand-100 to-sand-200 text-sand-900',
    activity: 'bg-gradient-to-br from-sky-50 to-sky-100 text-slate-800',
    bullets: 'bg-white text-slate-800'
  };
  const cls = layouts[slide.layout] || layouts.bullets;
  const isTitle = slide.layout === 'title';
  const isEnd = slide.layout === 'end';
  const light = isTitle || isEnd;

  return (
    <div className={`slide-16-9 rounded-2xl overflow-hidden border border-slate-200 shadow-soft flex flex-col ${cls}`}>
      <div className={`h-2 w-full ${light ? 'bg-white/30' : 'bg-brand-600'}`} />
      <div className={`grow p-5 sm:p-7 flex flex-col ${isTitle || isEnd ? 'items-center justify-center text-center' : ''}`}>
        {slide.layout === 'quote' && <Icon.Lightbulb size={26} className="mb-2 opacity-70" />}
        {slide.layout === 'activity' && <Icon.Target size={26} className="mb-2 text-sky-600" />}
        <h3 className={`font-extrabold ${isTitle ? 'text-2xl sm:text-4xl' : 'text-lg sm:text-2xl'} ${isTitle || isEnd ? '' : 'text-slate-800'}`}>
          {slide.heading}
        </h3>
        {slide.sub && (
          <p className={`mt-2 text-sm sm:text-base font-bold ${light ? 'opacity-90' : slide.layout === 'quote' ? 'text-sand-700' : 'text-slate-500'}`}>
            {slide.sub}
          </p>
        )}
        {slide.bullets?.length > 0 && (
          <ul className={`mt-4 space-y-2 w-full ${isTitle || isEnd ? 'text-center' : ''}`}>
            {slide.bullets.map((b, i) => (
              <li key={i} className={`flex gap-2 text-sm ${isTitle || isEnd ? 'justify-center' : ''}`}>
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${light ? 'bg-white/70' : 'bg-brand-500'}`} />
                <span className={light ? '' : 'text-slate-600'}>{b}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={`px-5 py-2 text-[10px] font-bold flex items-center justify-between ${light ? 'bg-black/10' : 'bg-slate-50 text-slate-400'}`}>
        <span>منصة المعلم الذكية</span>
        <span>{index + 1} / {total}</span>
      </div>
    </div>
  );
}

export default function Presentations({ go, params }) {
  const { presentations, addPresentation, deletePresentation, profile } = useApp();
  const toast = useToast();
  const [form, setForm] = useState({
    subjectId: params?.subjectId || profile.mainSubject || 'arabic',
    grade: params?.grade || 7,
    title: params?.title || '',
    duration: 45,
    slideCount: 10
  });
  const [deck, setDeck] = useState(null);
  const [saved, setSaved] = useState(false);
  const [view, setView] = useState('new');
  const [active, setActive] = useState(0);
  const [confirmDel, setConfirmDel] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (params?.title) setForm((f) => ({ ...f, ...params })); }, [params]);

  const subjects = useMemo(() => subjectsForGrade(form.grade), [form.grade]);
  const suggestions = useMemo(
    () => (form.subjectId ? getLessons(form.grade, form.subjectId).map((x) => x.lesson) : []),
    [form.grade, form.subjectId]
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const generate = (e) => {
    e?.preventDefault();
    if (!form.title.trim()) { toast.push('أدخل عنوان الدرس', 'error'); return; }
    const d = generateSlides(form);
    setDeck(d);
    setActive(0);
    setSaved(false);
    setView('new');
    toast.push(`تم توليد ${d.slides.length} شريحة`);
  };

  const save = () => {
    if (!deck) return;
    addPresentation(deck);
    setSaved(true);
    toast.push('تم حفظ العرض');
  };

  const exportPptx = async () => {
    if (!deck) return;
    setBusy(true);
    try {
      const blob = await slidesToPptx(deck);
      downloadBlob(`${slugify(deck.title)}.pptx`, blob);
      toast.push('تم تصدير ملف PowerPoint');
    } catch (err) {
      console.error(err);
      toast.push('تعذّر التصدير', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Slides}
        title="مولّد العروض التقديمية"
        subtitle="شرائح جاهزة من شريحة العنوان حتى الخاتمة — عرض مباشر أو تصدير PowerPoint / Markdown"
        actions={
          <Tabs
            tabs={[{ id: 'new', name: 'عرض جديد' }, { id: 'saved', name: `المحفوظة (${presentations.length})` }]}
            active={view}
            onChange={setView}
          />
        }
      />

      {view === 'saved' ? (
        <Card className="p-5">
          {presentations.length === 0 ? (
            <EmptyState icon={Icon.Slides} title="لا توجد عروض محفوظة" subtitle="ولّد عرضاً جديداً واحفظه ليظهر هنا." />
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {presentations.map((p) => (
                <div key={p.id} className="rounded-2xl border border-slate-200 p-4 hover:shadow-soft transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-800 truncate">{p.title}</div>
                      <div className="text-xs text-slate-500 font-bold mt-0.5">{p.subjectName} • {p.grade} • {p.slides.length} شرائح</div>
                    </div>
                    <button className="btn-danger !px-2.5 !py-1.5" onClick={() => setConfirmDel(p)}><Icon.Trash size={16} /></button>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <button className="btn-outline !px-3 !py-1.5 !text-xs" onClick={() => { setDeck(p); setActive(0); setSaved(true); setView('new'); window.scrollTo({ top: 0 }); }}>
                      <Icon.Eye size={15} /> عرض
                    </button>
                    <button className="btn-outline !px-3 !py-1.5 !text-xs" onClick={() => download(`${slugify(p.title)}.md`, slidesToMarkdown(p))}>
                      <Icon.Download size={15} /> Markdown
                    </button>
                    <button className="btn-primary !px-3 !py-1.5 !text-xs" onClick={async () => { const b = await slidesToPptx(p); downloadBlob(`${slugify(p.title)}.pptx`, b); }}>
                      <Icon.Download size={15} /> PowerPoint
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <>
          <Card className="p-4 sm:p-5">
            <form onSubmit={generate} className="space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Field label="المادة" required>
                  <select className="input" value={form.subjectId} onChange={(e) => set('subjectId', e.target.value)}>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                  </select>
                </Field>
                <Field label="الصف" required>
                  <select className="input" value={form.grade} onChange={(e) => set('grade', Number(e.target.value))}>
                    {GRADES.map((g) => <option key={g.n} value={g.n}>{g.name}</option>)}
                  </select>
                </Field>
                <Field label="عدد الشرائح (تقريبي)">
                  <input type="number" min={6} max={20} className="input" value={form.slideCount} onChange={(e) => set('slideCount', Number(e.target.value))} />
                </Field>
                <Field label="زمن الحصة (دقيقة)">
                  <input type="number" min={20} max={120} step={5} className="input" value={form.duration} onChange={(e) => set('duration', Number(e.target.value))} />
                </Field>
              </div>
              <Field label="عنوان الدرس" required>
                <input className="input" list="pres-suggestions" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="عنوان الدرس" required />
                <datalist id="pres-suggestions">{suggestions.map((s, i) => <option key={i} value={s} />)}</datalist>
              </Field>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="btn-primary"><Icon.Slides size={18} /> توليد العرض</button>
                {deck && (
                  <>
                    <button type="button" className="btn-sand" onClick={save} disabled={saved}><Icon.CheckCircle size={18} /> {saved ? 'محفوظ' : 'حفظ'}</button>
                    <button type="button" className="btn-outline" onClick={exportPptx} disabled={busy}><Icon.Download size={18} /> {busy ? 'جارٍ التصدير...' : 'تصدير PowerPoint'}</button>
                    <button type="button" className="btn-outline" onClick={() => download(`${slugify(deck.title)}.md`, slidesToMarkdown(deck))}><Icon.Download size={18} /> Markdown</button>
                    <button type="button" className="btn-ghost" onClick={() => window.print()}><Icon.Print size={18} /> طباعة الشرائح</button>
                  </>
                )}
              </div>
            </form>
          </Card>

          {deck ? (
            <div className="space-y-4">
              <Card className="p-4 print-area">
                <div className="flex items-center justify-between gap-3 mb-4 no-print">
                  <div className="section-title"><Icon.Presentation size={18} /> عرض مباشر — {deck.title}</div>
                  <div className="flex items-center gap-2">
                    <button className="btn-ghost !px-3 !py-2" onClick={() => setActive((a) => Math.max(0, a - 1))} disabled={active === 0}>
                      <Icon.ChevronRight size={18} />
                    </button>
                    <span className="text-sm font-bold text-slate-500 tabular-nums">{active + 1} / {deck.slides.length}</span>
                    <button className="btn-ghost !px-3 !py-2" onClick={() => setActive((a) => Math.min(deck.slides.length - 1, a + 1))} disabled={active === deck.slides.length - 1}>
                      <Icon.ChevronLeft size={18} />
                    </button>
                  </div>
                </div>
                <SlidePreview slide={deck.slides[active]} index={active} total={deck.slides.length} />
              </Card>

              <Card className="p-4">
                <div className="section-title mb-3"><Icon.File size={18} /> كل الشرائح ({deck.slides.length})</div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {deck.slides.map((s, i) => (
                    <button key={i} onClick={() => setActive(i)} className={`text-right rounded-xl transition ${active === i ? 'ring-2 ring-brand-500' : ''}`}>
                      <SlidePreview slide={s} index={i} total={deck.slides.length} />
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-6">
              <EmptyState icon={Icon.Slides} title="لم يتم توليد عرض بعد" subtitle="أدخل بيانات الدرس ثم اضغط «توليد العرض»." />
            </Card>
          )}
        </>
      )}

      <Confirm
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => { deletePresentation(confirmDel.id); toast.push('تم الحذف'); }}
        title="حذف العرض"
        message={`هل تريد حذف عرض «${confirmDel?.title}»؟`}
      />
      {toast.view}
    </div>
  );
}
