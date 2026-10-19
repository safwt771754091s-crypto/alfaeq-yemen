import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, useToast } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { GRADES, gradeName, subjectsForGrade, SUBJECTS } from '../data/curriculum.js';
import { buildBook } from '../lib/bookEngine.js';
import {
  speechSupported, asrSupported, voiceProfileFor, rateForGrade,
  createRecognizer, VOICE_PROFILES, toYemeni
} from '../lib/voice.js';
import { speakSmart, stopSmart, loadVoiceConfig, resolveProvider } from '../lib/voiceProvider.js';
import {
  buildVoiceLesson, evaluateAnswer, feedbackSpeech, agentReply, dialogSuggestions,
  summarizeSession
} from '../lib/voiceLessonEngine.js';
import { openSession, recordAttempt, recordDialog, endSession, getSessions, subscribeSessions } from '../lib/voiceSession.js';

// الدرس الصوتي التفاعلي — شرح بصوت المعلمة، سؤال فهم في نهاية كل فقرة،
// وحوار صوتي بين الطالب والوكيل. الإجابة صوتية أو نصّية (احتياطي).
export default function VoiceLesson({ params = {} }) {
  const { companion, saveCompanion, studyLog, logActivity } = useApp();
  const toast = useToast();
  const grade = companion.grade || 1;
  const subjects = useMemo(() => subjectsForGrade(grade), [grade]);

  const [subjectId, setSubjectId] = useState(params.subjectId || subjects[0]?.id || 'arabic');
  const [lessonTitle, setLessonTitle] = useState(params.lesson || '');
  const [voiceId, setVoiceId] = useState('teacher_female');

  const [session, setSession] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [segIndex, setSegIndex] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | narrating | asking | evaluating | dialog
  const [liveTranscript, setLiveTranscript] = useState('');
  const [answerDraft, setAnswerDraft] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [dialog, setDialog] = useState([]); // [{role,text,spoken}]
  const [askDraft, setAskDraft] = useState('');
  const [history, setHistory] = useState(() => getSessions());
  const [timeLeft, setTimeLeft] = useState(null);

  const recRef = useRef(null);
  const timerRef = useRef(null);
  const speakWarned = useRef(false);
  const voice = useMemo(() => voiceProfileFor(voiceId), [voiceId]);
  const voiceCfg = useMemo(() => loadVoiceConfig(), []);
  const [activeProvider, setActiveProvider] = useState(() => resolveProvider(loadVoiceConfig(), typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => subscribeSessions(() => setHistory(getSessions())), []);
  useEffect(() => () => { stopSmart(); recRef.current?.abort?.(); clearInterval(timerRef.current); }, []);

  const book = useMemo(() => buildBook({ grade, subjectId }), [grade, subjectId]);
  const lessons = useMemo(() => book.chapters.flatMap((c) => c.lessons.map((l) => l.title)), [book]);
  const current = lesson?.segments?.[segIndex] || null;

  const speakOut = (text, { onEnd, rate } = {}) => {
    const supported = speechSupported() || resolveProvider(voiceCfg, true) !== 'local';
    if (!supported) {
      if (!speakWarned.current) { toast.push('الجهاز لا يدعم النطق الصوتي — اقرأ النصّ المعروض'); speakWarned.current = true; }
      return;
    }
    const r = rate != null ? rate : rateForGrade(grade);
    speakSmart(text, { profileId: voiceId, rate: r, cfg: voiceCfg, onEnd }).then((res) => {
      if (res.provider !== activeProvider) setActiveProvider(res.provider);
      if (res.fellBack && !speakWarned.current) { toast.push('تعذّر الصوت السحابي — تم التحويل للمحرّك المحلي'); speakWarned.current = true; }
    });
  };

  // ===== بدء الدرس =====
  const startLesson = () => {
    if (!lessonTitle) { toast.push('اختر الدرس أولاً'); return; }
    const built = buildVoiceLesson({ grade, subjectId, lesson: lessonTitle, subjectName: SUBJECTS[subjectId]?.name || '' });
    const s = openSession({ grade, subjectId, lesson: lessonTitle, subjectName: SUBJECTS[subjectId]?.name || '' });
    setLesson(built);
    setSession(s);
    setSegIndex(0);
    setLastResult(null);
    setDialog([]);
    setPhase('narrating');
    logActivity(`درس صوتي: ${lessonTitle}`);
    narrate(built.segments[0]);
  };

  // قراءة فقرة ثم طرح سؤالها
  const narrate = (seg) => {
    if (!seg) return;
    setPhase('narrating');
    speakOut(`${seg.narration}`, {
      onEnd: () => { setPhase('asking'); speakOut(seg.question); }
    });
  };

  const replayQuestion = () => { if (current) { setPhase('asking'); speakOut(current.question); } };

  const goSegment = (i) => {
    if (!lesson) return;
    const idx = Math.max(0, Math.min(lesson.segments.length - 1, i));
    setSegIndex(idx);
    setLastResult(null);
    setAnswerDraft('');
    setLiveTranscript('');
    narrate(lesson.segments[idx]);
  };

  // ===== الإجابة الصوتية =====
  const startListening = () => {
    if (!asrSupported()) { toast.push('التعرّف الصوتي غير مدعوم — استخدم الكتابة'); return; }
    stopSmart();
    setLiveTranscript('');
    setPhase('asking');
    const rec = createRecognizer({
      lang: voice.lang || 'ar-YE',
      onResult: ({ final, interim }) => setLiveTranscript(final || interim),
      onEnd: (finalText) => { if (finalText) submitAnswer(finalText); },
      onError: (err) => {
        if (err !== 'aborted' && err !== 'no-speech') toast.push('تعذّر التقاط الصوت — جرّب الكتابة', 'error');
      }
    });
    if (!rec) { toast.push('التعرّف الصوتي غير مدعوم'); return; }
    recRef.current = rec;
    rec.start();
    // مهلة سماع قصيرة (ثوانٍ) ثم إتاحة الكتابة
    let t = 8;
    setTimeLeft(t);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      t -= 1; setTimeLeft(t);
      if (t <= 0) { clearInterval(timerRef.current); rec.stop(); setTimeLeft(null); }
    }, 1000);
  };

  const submitAnswer = (text) => {
    const ans = String(text || answerDraft || liveTranscript || '').trim();
    if (!current || !ans) { toast.push('لم نسمع إجابة — جرّب مرة أخرى'); return; }
    clearInterval(timerRef.current); setTimeLeft(null);
    const res = evaluateAnswer(current, ans);
    setLastResult({ ...res, answer: ans });
    if (session) recordAttempt(session.id, {
      segmentId: current.id, question: current.question, answer: ans,
      evaluated: true, correct: res.correct, score: res.score, focus: current.focus
    });
    setPhase('evaluating');
    speakOut(feedbackSpeech({ correct: res.correct, missed: res.missed, focus: current.focus }));
  };

  // ===== الحوار مع الوكيل =====
  const askAgent = (text) => {
    const q = String(text || askDraft || '').trim();
    if (!q) return;
    stopSmart();
    const reply = agentReply({ question: q, grade, subjectId });
    const entry = { role: 'agent', text: reply.short, spoken: reply.spoken, grounded: reply.grounded, needsTeacher: reply.needsTeacher };
    setDialog((d) => [...d, { role: 'student', text: q }, entry]);
    if (session) {
      recordDialog(session.id, { role: 'student', text: q });
      recordDialog(session.id, { role: 'agent', text: reply.short, grounded: reply.grounded, needsTeacher: reply.needsTeacher });
    }
    setAskDraft('');
    setPhase('dialog');
    speakOut(reply.spoken || toYemeni(reply.short), { onEnd: () => setPhase('asking') });
  };

  const onSuggest = (s) => {
    if (s.label === 'كرّر السؤال') { replayQuestion(); return; }
    askAgent(s.question);
  };

  const finish = () => {
    if (!session) return;
    const summary = summarizeSession({ attempts: session.attempts || [], dialog: session.dialog || [] });
    endSession(session.id, summary);
    setSession((s) => ({ ...s, summary }));
    setPhase('idle');
    stopSmart();
    studyLog.add({
      title: `درس صوتي «${lessonTitle}»`,
      lesson: lessonTitle, subjectId,
      date: new Date().toISOString().slice(0, 10),
      percent: summary.percent
    });
    toast.push(`أنهيت الدرس — نتيجة الفهم ${summary.percent}%`);
  };

  const suggestions = dialogSuggestions(lessonTitle);
  const summary = session?.summary;

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Speaker}
        title="الدرس الصوتي التفاعلي"
        subtitle="تسمع الشرح بصوت المعلمة، وتجاوب على أسئلة الفهم، وتحاور الوكيل الذكي — يعمل دون إنترنت"
      />

      {/* إعداد الجلسة */}
      <Card className="p-5">
        <div className="grid sm:grid-cols-4 gap-3">
          <label className="block">
            <span className="text-xs font-extrabold text-slate-500">الصف</span>
            <select className="input mt-1" value={grade} onChange={(e) => { setLessonTitle(''); saveCompanion({ grade: Number(e.target.value) }); }}>
              {GRADES.map((g) => <option key={g.n} value={g.n}>{gradeName(g.n)}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-extrabold text-slate-500">المادة</span>
            <select className="input mt-1" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setLessonTitle(''); }}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-extrabold text-slate-500">الدرس</span>
            <select className="input mt-1" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)}>
              <option value="">— اختر الدرس —</option>
              {lessons.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-extrabold text-slate-500">صوت المعلم</span>
            <select className="input mt-1" value={voiceId} onChange={(e) => setVoiceId(e.target.value)}>
              {Object.values(VOICE_PROFILES).map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button className="btn-primary" onClick={startLesson}><Icon.Play size={18} /> ابدأ الدرس الصوتي</button>
          <button className="btn-outline" onClick={stopSmart}><Icon.Stop size={16} /> إيقاف الصوت</button>
          {!speechSupported() && <span className="chip bg-amber-50 text-amber-700">تنبيه: جهازك لا يدعم النطق — سيظهر النص للقراءة</span>}
          {!asrSupported() && <span className="chip bg-slate-100 text-slate-600">الإجابة الصوتية غير متاحة — استخدم الكتابة</span>}
          <span className="chip bg-slate-100 text-slate-600 self-center">{voice.describe}</span>
          <span className={`chip self-center ${activeProvider === 'local' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>
            <Icon.Speaker size={12} /> {activeProvider === 'local' ? 'صوت محلي (بدون إنترنت)' : (activeProvider === 'azure' ? 'صوت Azure الطبيعي' : 'صوت Google')}
          </span>
        </div>
      </Card>

      {/* مشغّل الدرس */}
      {lesson && current && !summary && (
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-l from-brand-600 to-brand-500 text-white">
            <div className="min-w-0">
              <div className="text-xs font-bold text-white/80">{SUBJECTS[subjectId]?.name} • {gradeName(grade)}</div>
              <div className="font-extrabold truncate">{lessonTitle}</div>
            </div>
            <span className="chip bg-white/20 text-white shrink-0">فقرة {segIndex + 1} / {lesson.segments.length}</span>
          </div>

          {/* شريط تقدّم الفقرات */}
          <div className="flex gap-1 px-4 pt-3">
            {lesson.segments.map((s, i) => (
              <button key={s.id} onClick={() => goSegment(i)} title={`فقرة ${i + 1}`}
                className={`h-2 flex-1 rounded-full transition ${i < segIndex ? 'bg-emerald-400' : i === segIndex ? 'bg-brand-500' : 'bg-slate-200'}`} />
            ))}
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* نصّ الفقرة (transcript مرافق للصوت) */}
            <div className="rounded-2xl bg-[#fffdf5] border border-slate-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon.Speaker size={16} className="text-brand-600" />
                <span className="font-extrabold text-slate-700 text-sm">فقرة الشرح {segIndex + 1}</span>
                <button className="btn-ghost !py-1 text-xs mr-auto" onClick={() => narrate(current)}><Icon.Volume size={14} /> أعد الشرح</button>
              </div>
              <p className="text-slate-700 font-bold leading-loose">{current.narration}</p>
            </div>

            {/* سؤال الفهم */}
            <div className="rounded-2xl bg-violet-50 border border-violet-100 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">❓</span>
                <span className="font-extrabold text-violet-800">سؤال الفهم</span>
                <button className="btn-ghost !py-1 text-xs mr-auto" onClick={replayQuestion}><Icon.Volume size={14} /> أعد السؤال</button>
              </div>
              <p className="text-slate-700 font-extrabold">{current.question}</p>
              <p className="text-xs text-slate-400 font-bold mt-1">كلمات مفتاحية: {current.keywords.join(' • ')}</p>
            </div>

            {/* منطقة الإجابة */}
            <div className="rounded-2xl border border-slate-100 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <button className={`btn-primary ${phase === 'asking' ? '' : ''}`} onClick={startListening} disabled={!asrSupported()}>
                  <Icon.Mic size={18} /> {timeLeft != null ? `أسمعك... ${timeLeft}` : 'أجب بصوتك'}
                </button>
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <input className="input" value={answerDraft} onChange={(e) => setAnswerDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitAnswer()} placeholder="أو اكتب إجابتك هنا..." />
                  <button className="btn-outline shrink-0" onClick={() => submitAnswer()}><Icon.Check size={16} /> أرسل</button>
                </div>
              </div>
              {liveTranscript && <div className="mt-2 text-sm font-bold text-slate-500">سمعت: <span className="text-brand-700">{liveTranscript}</span></div>}

              {lastResult && (
                <div className={`mt-3 rounded-2xl p-3 border ${lastResult.correct ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{lastResult.correct ? '✅' : '💡'}</span>
                    <span className={`font-extrabold ${lastResult.correct ? 'text-emerald-800' : 'text-amber-800'}`}>{lastResult.feedback}</span>
                    <span className="chip bg-white text-slate-600 mr-auto">درجة {lastResult.score}%</span>
                  </div>
                  {!lastResult.correct && lastResult.missed?.length > 0 && (
                    <p className="text-xs font-bold text-slate-500 mt-1">ركّز على: {lastResult.missed.slice(0, 3).join(' • ')}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button className="btn-outline !py-1.5 text-sm" onClick={() => { setLastResult(null); setAnswerDraft(''); setLiveTranscript(''); }}>
                      <Icon.Refresh size={14} /> حاول مرة أخرى
                    </button>
                    {segIndex < lesson.segments.length - 1
                      ? <button className="btn-primary !py-1.5 text-sm" onClick={() => goSegment(segIndex + 1)}>الفقرة التالية <Icon.ChevronLeft size={16} /></button>
                      : <button className="btn-primary !py-1.5 text-sm" onClick={finish}><Icon.CheckCircle size={16} /> أنهِ الدرس</button>}
                  </div>
                </div>
              )}
            </div>

            {/* الحوار مع الوكيل */}
            <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon.Bot size={18} className="text-sky-600" />
                <span className="font-extrabold text-sky-800">حاور الوكيل الذكي</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => onSuggest(s)} className="chip bg-white text-sky-700 hover:bg-sky-100">{s.label}</button>
                ))}
              </div>
              {dialog.length > 0 && (
                <div className="space-y-2 mb-3 max-h-56 overflow-auto">
                  {dialog.map((d, i) => (
                    <div key={i} className={`flex ${d.role === 'student' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm font-bold ${d.role === 'student' ? 'bg-white text-slate-700 border border-slate-200' : 'bg-sky-600 text-white'}`}>
                        {d.text}
                        {d.needsTeacher && <span className="block text-[10px] opacity-80 mt-1">📩 حُوّل سؤالك للمعلم</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input className="input" value={askDraft} onChange={(e) => setAskDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && askAgent()} placeholder="اسأل الوكيل عن أي نقطة غامضة..." />
                <button className="btn-primary shrink-0" onClick={() => askAgent()}><Icon.Send size={18} /> اسأل</button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ملخّص النتيجة */}
      {summary && (
        <Card className="p-5 border-r-4 border-emerald-400">
          <div className="flex items-center gap-3 mb-3">
            <span className="grid place-items-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 text-2xl">🎉</span>
            <div>
              <div className="text-xl font-extrabold text-slate-800">أنهيت الدرس الصوتي</div>
              <div className="text-sm font-bold text-slate-500">{lessonTitle} • نتيجة الفهم {summary.percent}% ({summary.level})</div>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <Stat label="إجابات صحيحة" value={`${summary.correct}/${summary.total}`} />
            <Stat label="أسئلة للحوار" value={String(summary.asked)} />
            <Stat label="المستوى" value={summary.level} />
          </div>
          {summary.strengths.length > 0 && <p className="mt-3 text-sm font-bold text-emerald-700">نقاط قوة: {summary.strengths.join(' • ')}</p>}
          {summary.needsWork.length > 0 && <p className="mt-1 text-sm font-bold text-amber-700">يحتاج مراجعة: {summary.needsWork.join(' • ')}</p>}
          <p className="mt-2 text-sm font-bold text-slate-600">{summary.advice}</p>
          <div className="flex gap-2 mt-3">
            <button className="btn-primary" onClick={() => { setLesson(null); setSession(null); }}><Icon.Refresh size={16} /> درس آخر</button>
            <button className="btn-outline" onClick={() => { setLesson(null); setSession(null); setLessonTitle(''); }}>اختيار درس جديد</button>
          </div>
        </Card>
      )}

      {/* سجل الجلسات */}
      <Card className="p-5">
        <SectionHeader icon={Icon.Chart} title="سجلّي الصوتي" subtitle="جلساتك السابقة ونتائج الفهم" />
        {history.length ? (
          <div className="space-y-2 mt-2">
            {history.slice(0, 8).map((s) => (
              <div key={s.id} className="flex items-center gap-2 rounded-2xl border border-slate-100 px-3 py-2">
                <Icon.Speaker size={16} className="text-brand-500" />
                <span className="font-bold text-slate-700 text-sm">{s.lesson}</span>
                <span className="text-xs text-slate-400 font-bold">{s.subjectName} • {gradeName(s.grade)}</span>
                {s.summary
                  ? <span className="chip bg-emerald-50 text-emerald-700 mr-auto">فهم {s.summary.percent}%</span>
                  : <span className="chip bg-amber-50 text-amber-700 mr-auto">غير مكتمل</span>}
              </div>
            ))}
          </div>
        ) : <p className="text-sm font-bold text-slate-400 mt-2">لا توجد جلسات بعد — ابدأ درساً صوتياً.</p>}
      </Card>
      {toast.view}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 text-center">
      <div className="text-xl font-extrabold text-slate-800">{value}</div>
      <div className="text-xs font-bold text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
