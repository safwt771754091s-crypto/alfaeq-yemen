import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, useToast } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';
import { useAuth } from '../state/auth.jsx';
import {
  GAME_META, GRADE_BANDS, LEVELS, metaOf, pool, shuffle
} from '../lib/mathBank.js';

// ===== أصوات بسيطة (Web Audio) =====
function useSound() {
  const on = useRef(true);
  const ctxRef = useRef(null);
  const beep = useCallback((freq, dur = 0.12, type = 'sine') => {
    if (!on.current) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!ctxRef.current) ctxRef.current = new Ctx();
      const ctx = ctxRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.value = 0.06;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.stop(ctx.currentTime + dur);
    } catch { /* تجاهل */ }
  }, []);
  const click = useCallback(() => beep(440, 0.06), [beep]);
  const good = useCallback(() => { beep(660, 0.1); setTimeout(() => beep(880, 0.12), 90); }, [beep]);
  const bad = useCallback(() => beep(180, 0.22, 'square'), [beep]);
  const finish = useCallback(() => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.14), i * 110)); }, [beep]);
  return { on, click, good, bad, finish };
}

const bandName = (id) => GRADE_BANDS.find((b) => b.id === id)?.name || '';
const levelName = (id) => LEVELS.find((l) => l.id === id)?.name || '';

function pctOf(score, max) {
  return max > 0 ? Math.round((score / max) * 100) : 0;
}
function starsFor(pct) {
  if (pct >= 90) return '⭐⭐⭐';
  if (pct >= 70) return '⭐⭐';
  if (pct >= 50) return '⭐';
  return '—';
}

// ===== ترويسة اللعب المشتركة =====
function PlayHeader({ meta, score, streak, extra }) {
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap rounded-2xl bg-gradient-to-l from-brand-700 to-brand-600 text-white px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">{meta.icon}</span>
        <span className="font-extrabold">{meta.name}</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 text-sm font-extrabold">
        {extra}
        <span className="rounded-full bg-white/15 px-3 py-1">النقاط: {score}</span>
        <span className="rounded-full bg-sand-500/90 px-3 py-1">🔥 {streak}</span>
      </div>
    </div>
  );
}

// ===== 1) اختبار سريع =====
function QuizMode({ band, level, sound, onFinish }) {
  const items = useMemo(() => pool(band, 'mc', level).slice(0, 10), [band, level]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sel, setSel] = useState(null);
  const logs = useRef([]);
  const it = items[idx];
  if (!it) return <div className="text-center py-10 font-bold text-slate-500">لا توجد أسئلة كافية</div>;

  const choose = (i) => {
    if (sel !== null) return;
    setSel(i);
    const ok = i === it.a;
    const gain = ok ? 10 + streak * 2 : 0;
    if (ok) { sound.good(); setScore((s) => s + gain); setStreak((s) => s + 1); }
    else { sound.bad(); setStreak(0); }
    logs.current.push({ q: it.q, ok, correct: it.choices[it.a] });
    setTimeout(() => {
      if (idx + 1 >= items.length) onFinish({ score: score + gain, max: items.length * 10, total: items.length, correct: logs.current.filter((l) => l.ok).length, logs: logs.current });
      else { setIdx(idx + 1); setSel(null); }
    }, ok ? 650 : 1200);
  };

  return (
    <div className="space-y-4">
      <PlayHeader meta={metaOf('quiz')} score={score} streak={streak} extra={<span className="rounded-full bg-white/15 px-3 py-1">{idx + 1}/{items.length}</span>} />
      <Card className="p-6">
        <div className="text-4xl sm:text-5xl font-extrabold text-center text-slate-800 tabular-nums my-3">{it.q} = ؟</div>
        <div className="grid grid-cols-2 gap-3 mt-5">
          {it.choices.map((c, i) => {
            let cls = 'bg-white border-slate-200 hover:border-brand-400 text-slate-700';
            if (sel !== null && i === it.a) cls = 'bg-emerald-500 border-emerald-500 text-white';
            else if (sel === i) cls = 'bg-rose-500 border-rose-500 text-white';
            return <button key={i} disabled={sel !== null} onClick={() => choose(i)} className={`rounded-2xl border-2 px-4 py-4 text-2xl font-extrabold transition ${cls}`}>{c}</button>;
          })}
        </div>
      </Card>
    </div>
  );
}

// ===== 2) سباق الوقت =====
function ArcadeMode({ band, level, sound, onFinish }) {
  const bank = useMemo(() => pool(band, 'mc', level), [band, level]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [time, setTime] = useState(60);
  const [sel, setSel] = useState(null);
  const correctCount = useRef(0);
  const ended = useRef(false);
  const it = bank.length ? bank[idx % bank.length] : null;

  useEffect(() => {
    const t = setInterval(() => setTime((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if ((time <= 0 || lives <= 0) && !ended.current && it) { ended.current = true; sound.finish(); onFinish({ score, max: correctCount.current * 10 + 10, total: correctCount.current, correct: correctCount.current, logs: [] }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, lives]);

  if (!it) return <div className="text-center py-10 font-bold text-slate-500">لا توجد أسئلة كافية</div>;

  const choose = (i) => {
    if (sel !== null || time <= 0 || ended.current) return;
    setSel(i);
    const ok = i === it.a;
    const gain = ok ? 10 + streak * 2 : 0;
    if (ok) { sound.good(); correctCount.current++; setScore((s) => s + gain); setStreak((s) => s + 1); }
    else { sound.bad(); setStreak(0); setLives((l) => l - 1); }
    setTimeout(() => { setIdx((x) => x + 1); setSel(null); }, ok ? 350 : 700);
  };

  return (
    <div className="space-y-4">
      <PlayHeader meta={metaOf('arcade')} score={score} streak={streak}
        extra={<><span className="rounded-full bg-rose-500/90 px-3 py-1">⏱️ {Math.max(0, time)}</span><span className="rounded-full bg-white/15 px-3 py-1">{'❤️'.repeat(Math.max(0, lives)) || '—'}</span></>} />
      <Card className="p-6">
        <div className="text-4xl sm:text-5xl font-extrabold text-center text-slate-800 tabular-nums my-3">{it.q} = ؟</div>
        <div className="grid grid-cols-2 gap-3 mt-5">
          {it.choices.map((c, i) => {
            let cls = 'bg-white border-slate-200 hover:border-brand-400 text-slate-700';
            if (sel !== null && i === it.a) cls = 'bg-emerald-500 border-emerald-500 text-white';
            else if (sel === i) cls = 'bg-rose-500 border-rose-500 text-white';
            return <button key={i} disabled={sel !== null} onClick={() => choose(i)} className={`rounded-2xl border-2 px-4 py-4 text-2xl font-extrabold transition ${cls}`}>{c}</button>;
          })}
        </div>
      </Card>
    </div>
  );
}

// ===== 3) صح أم خطأ =====
function TrueFalseMode({ band, level, sound, onFinish }) {
  const items = useMemo(() => pool(band, 'tf', level).slice(0, 12), [band, level]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sel, setSel] = useState(null);
  const logs = useRef([]);
  const it = items[idx];
  if (!it) return <div className="text-center py-10 font-bold text-slate-500">لا توجد أسئلة كافية</div>;

  const answer = (val) => {
    if (sel !== null) return;
    setSel(val);
    const ok = val === it.a;
    const gain = ok ? 10 + streak * 2 : 0;
    if (ok) { sound.good(); setScore((s) => s + gain); setStreak((s) => s + 1); }
    else { sound.bad(); setStreak(0); }
    logs.current.push({ q: it.q, ok });
    setTimeout(() => {
      if (idx + 1 >= items.length) onFinish({ score: score + gain, max: items.length * 10, total: items.length, correct: logs.current.filter((l) => l.ok).length, logs: logs.current });
      else { setIdx(idx + 1); setSel(null); }
    }, ok ? 550 : 1100);
  };

  return (
    <div className="space-y-4">
      <PlayHeader meta={metaOf('tf')} score={score} streak={streak} extra={<span className="rounded-full bg-white/15 px-3 py-1">{idx + 1}/{items.length}</span>} />
      <Card className="p-6">
        <div className="text-xl sm:text-2xl font-extrabold text-center text-slate-800 my-4 leading-relaxed">{it.q}</div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button disabled={sel !== null} onClick={() => answer(true)}
            className={`rounded-2xl border-2 px-4 py-5 text-xl font-extrabold transition ${sel === true && it.a ? 'bg-emerald-500 border-emerald-500 text-white' : sel === true ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-slate-200 hover:border-emerald-400 text-emerald-700'}`}>✅ صح</button>
          <button disabled={sel !== null} onClick={() => answer(false)}
            className={`rounded-2xl border-2 px-4 py-5 text-xl font-extrabold transition ${sel === false && !it.a ? 'bg-emerald-500 border-emerald-500 text-white' : sel === false ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-slate-200 hover:border-rose-400 text-rose-600'}`}>❌ خطأ</button>
        </div>
        {sel !== null && <div className={`mt-4 text-center font-extrabold ${sel === it.a ? 'text-emerald-600' : 'text-rose-600'}`}>{sel === it.a ? 'أحسنت! 🎉' : `الإجابة الصحيحة: ${it.a ? 'صح' : 'خطأ'}`}</div>}
      </Card>
    </div>
  );
}

// ===== 4) اكتب الإجابة =====
function InputMode({ band, level, sound, onFinish }) {
  const items = useMemo(() => pool(band, 'num', level).slice(0, 10), [band, level]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [val, setVal] = useState('');
  const [fb, setFb] = useState(null);
  const logs = useRef([]);
  const it = items[idx];
  if (!it) return <div className="text-center py-10 font-bold text-slate-500">لا توجد أسئلة كافية</div>;

  const press = (k) => {
    if (fb) return;
    if (k === '⌫') setVal((v) => v.slice(0, -1));
    else if (k === '−' && val === '') setVal('−');
    else if (/\d/.test(k)) setVal((v) => (v.length < 8 ? v + k : v));
  };
  const submit = () => {
    if (val === '' || fb) return;
    const ok = Number(val) === it.a;
    const gain = ok ? 10 + streak * 2 : 0;
    if (ok) { sound.good(); setScore((s) => s + gain); setStreak((s) => s + 1); }
    else { sound.bad(); setStreak(0); }
    setFb(ok ? 'ok' : 'no');
    logs.current.push({ q: it.q, ok, correct: it.a });
    setTimeout(() => {
      if (idx + 1 >= items.length) onFinish({ score: score + gain, max: items.length * 10, total: items.length, correct: logs.current.filter((l) => l.ok).length, logs: logs.current });
      else { setIdx(idx + 1); setVal(''); setFb(null); }
    }, 1000);
  };

  const KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '−', '0', '⌫'];
  return (
    <div className="space-y-4">
      <PlayHeader meta={metaOf('input')} score={score} streak={streak} extra={<span className="rounded-full bg-white/15 px-3 py-1">{idx + 1}/{items.length}</span>} />
      <Card className="p-6">
        <div className="text-3xl sm:text-4xl font-extrabold text-center text-slate-800 tabular-nums my-2">{it.q} = ؟</div>
        <div className={`text-center text-3xl font-extrabold h-14 my-2 tabular-nums ${fb === 'ok' ? 'text-emerald-600' : fb === 'no' ? 'text-rose-600' : 'text-brand-700'}`}>{val || '—'}{fb === 'no' && <span className="block text-base">الصحيح: {it.a}</span>}</div>
        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto" dir="ltr">
          {KEYS.map((k) => (
            <button key={k} onClick={() => press(k)} className="rounded-xl bg-slate-100 hover:bg-brand-100 py-3 text-xl font-extrabold text-slate-700 transition">{k}</button>
          ))}
        </div>
        <button onClick={submit} className="btn-primary w-full max-w-xs mx-auto mt-3 flex items-center justify-center gap-2"><Icon.Check size={18} /> تحقق</button>
      </Card>
    </div>
  );
}

// ===== 5) المطابقة =====
function MatchMode({ band, level, sound, onFinish }) {
  const rounds = useMemo(() => pool(band, 'pairs', level).slice(0, 3), [band, level]);
  const [r, setR] = useState(0);
  const [score, setScore] = useState(0);
  const [matched, setMatched] = useState([]);
  const [pickA, setPickA] = useState(null);
  const [wrong, setWrong] = useState(null);
  const round = rounds[r];
  const left = useMemo(() => (round ? shuffle(round.pairs.map((p, i) => ({ i, text: p[0] }))) : []), [round]);
  const right = useMemo(() => (round ? shuffle(round.pairs.map((p, i) => ({ i, text: p[1] }))) : []), [round]);
  if (!round) return <div className="text-center py-10 font-bold text-slate-500">لا توجد جولات كافية</div>;

  const tap = (side, i) => {
    if (matched.includes(i)) return;
    if (side === 'L') { setPickA(i); return; }
    if (pickA === null) return;
    if (pickA === i) {
      sound.good();
      setScore((s) => s + 15);
      const nm = [...matched, i];
      setMatched(nm); setPickA(null);
      if (nm.length === round.pairs.length) {
        setTimeout(() => {
          if (r + 1 >= rounds.length) onFinish({ score: score + 15, max: rounds.length * round.pairs.length * 15, total: rounds.length, correct: rounds.length, logs: [] });
          else { setR(r + 1); setMatched([]); setPickA(null); }
        }, 700);
      }
    } else {
      sound.bad();
      setWrong({ L: pickA, R: i });
      setTimeout(() => { setWrong(null); setPickA(null); }, 700);
    }
  };

  const cell = (side, o) => {
    const done = matched.includes(o.i);
    const active = side === 'L' ? pickA === o.i : false;
    const bad = wrong && ((side === 'L' && wrong.L === o.i) || (side === 'R' && wrong.R === o.i));
    return (
      <button key={`${side}${o.i}`} disabled={done} onClick={() => tap(side, o.i)}
        className={`w-full rounded-xl border-2 px-3 py-3 text-sm font-extrabold transition ${done ? 'bg-emerald-50 border-emerald-300 text-emerald-600 opacity-60' : bad ? 'bg-rose-100 border-rose-400 text-rose-600' : active ? 'bg-brand-100 border-brand-400 text-brand-700' : 'bg-white border-slate-200 hover:border-brand-400 text-slate-700'}`}>{o.text}</button>
    );
  };

  return (
    <div className="space-y-4">
      <PlayHeader meta={metaOf('match')} score={score} streak={matched.length} extra={<span className="rounded-full bg-white/15 px-3 py-1">جولة {r + 1}/{rounds.length}</span>} />
      <Card className="p-5">
        <div className="text-center font-extrabold text-slate-600 mb-4">{round.title} — طابق كل عنصر بمقابله</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">{left.map((o) => cell('L', o))}</div>
          <div className="space-y-2">{right.map((o) => cell('R', o))}</div>
        </div>
      </Card>
    </div>
  );
}

// ===== 6) الترتيب =====
function OrderMode({ band, level, sound, onFinish }) {
  const rounds = useMemo(() => pool(band, 'order', level).slice(0, 4), [band, level]);
  const [r, setR] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState([]);
  const [wrong, setWrong] = useState(null);
  const round = rounds[r];
  const tiles = useMemo(() => (round ? shuffle(round.values.map((v, i) => ({ i, v }))) : []), [round]);
  const sorted = useMemo(() => (round ? [...round.values].sort((a, b) => (round.dir === 'asc' ? a - b : b - a)) : []), [round]);
  if (!round) return <div className="text-center py-10 font-bold text-slate-500">لا توجد جولات كافية</div>;

  const fmt = (v) => String(v).replace('.', '٫');
  const tap = (o) => {
    if (chosen.includes(o.i) || wrong === o.i) return;
    const next = [...chosen, o.i];
    const expected = sorted[next.length - 1];
    if (round.values[o.i] === expected) {
      sound.click();
      setChosen(next);
      if (next.length === round.values.length) {
        sound.good(); setScore((s) => s + 20);
        setTimeout(() => {
          if (r + 1 >= rounds.length) onFinish({ score: score + 20, max: rounds.length * 20, total: rounds.length, correct: rounds.length, logs: [] });
          else { setR(r + 1); setChosen([]); }
        }, 700);
      }
    } else { sound.bad(); setWrong(o.i); setTimeout(() => setWrong(null), 600); }
  };

  return (
    <div className="space-y-4">
      <PlayHeader meta={metaOf('order')} score={score} streak={chosen.length} extra={<span className="rounded-full bg-white/15 px-3 py-1">جولة {r + 1}/{rounds.length}</span>} />
      <Card className="p-5">
        <div className="text-center font-extrabold text-slate-600 mb-1">{round.q}</div>
        <div className="text-center text-xs font-bold text-slate-400 mb-4">اضغط العناصر بالترتيب الصحيح</div>
        <div className="flex flex-wrap justify-center gap-2">
          {tiles.map((o) => {
            const done = chosen.includes(o.i);
            return (
              <button key={o.i} onClick={() => tap(o)} disabled={done}
                className={`w-20 h-16 rounded-2xl border-2 text-xl font-extrabold transition ${done ? 'bg-emerald-500 border-emerald-500 text-white' : wrong === o.i ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-slate-200 hover:border-brand-400 text-slate-700'}`}>{fmt(o.v)}</button>
            );
          })}
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-5 min-h-[40px]">
          {chosen.map((i) => <span key={i} className="rounded-lg bg-brand-50 text-brand-700 px-3 py-1 font-extrabold">{fmt(round.values[i])}</span>)}
        </div>
      </Card>
    </div>
  );
}

const MODES = { quiz: QuizMode, arcade: ArcadeMode, tf: TrueFalseMode, input: InputMode, match: MatchMode, order: OrderMode };

// ===== شاشة النتائج =====
function ResultScreen({ result, meta, playerName, onAgain, onHome }) {
  const pct = pctOf(result.score, result.max);
  return (
    <div className="space-y-4">
      <Card className="p-6 text-center">
        <div className="text-5xl mb-2">{meta.icon}</div>
        <div className="text-2xl font-extrabold text-slate-800">انتهت اللعبة!</div>
        <div className="text-4xl font-extrabold text-brand-700 my-3 tabular-nums">{result.score} نقطة</div>
        <div className="text-3xl">{starsFor(pct)}</div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="rounded-xl bg-brand-50 py-2"><div className="text-xl font-extrabold text-brand-700">{result.correct}</div><div className="text-[11px] font-bold text-slate-500">إجابات صحيحة</div></div>
          <div className="rounded-xl bg-amber-50 py-2"><div className="text-xl font-extrabold text-amber-700">{result.total}</div><div className="text-[11px] font-bold text-slate-500">الجولات</div></div>
          <div className="rounded-xl bg-emerald-50 py-2"><div className="text-xl font-extrabold text-emerald-700">{pct}%</div><div className="text-[11px] font-bold text-slate-500">الدقة</div></div>
        </div>
        <div className="text-xs text-slate-400 font-bold mt-3">اللاعب: {playerName || 'زائر'} • {levelName(result.level)} • {bandName(result.band)}</div>
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          <button className="btn-primary" onClick={onAgain}><Icon.Refresh size={18} /> العب مرة أخرى</button>
          <button className="btn-ghost" onClick={onHome}><Icon.Home size={18} /> القائمة الرئيسية</button>
        </div>
      </Card>

      {result.logs?.length > 0 && (
        <Card className="p-5">
          <div className="section-title mb-3"><Icon.ListChecks size={18} /> مراجعة الإجابات</div>
          <div className="space-y-2">
            {result.logs.map((l, i) => (
              <div key={i} className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-bold ${l.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                <span>{l.q}</span>
                <span className="shrink-0">{l.ok ? '✓' : `✗ ${l.correct != null ? `(${l.correct})` : ''}`}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function MathGames() {
  const { games, profile } = useApp();
  const { currentUser } = useAuth();
  const toast = useToast();
  const sound = useSound();

  const [view, setView] = useState('home');
  const [band, setBand] = useState('g4_6');
  const [level, setLevel] = useState('medium');
  const [meta, setMeta] = useState(null);
  const [result, setResult] = useState(null);
  const [muted, setMuted] = useState(false);
  const playerName = currentUser?.name || profile?.name || 'زائر';

  const savedResults = games.items || [];
  const totalXP = savedResults.reduce((s, r) => s + (r.score || 0), 0);
  const bestScore = savedResults.reduce((s, r) => Math.max(s, r.score || 0), 0);
  const leaderboard = useMemo(() => [...savedResults].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 6), [savedResults]);

  const startGame = (m) => { sound.click(); setMeta(m); setResult(null); setView('play'); };

  const finish = (res) => {
    sound.finish();
    games.add({
      game: meta.id, gameName: meta.name, band, bandName: bandName(band), level, levelName: levelName(level),
      score: res.score, max: res.max, correct: res.correct, total: res.total, player: playerName,
      title: `${meta.name} — ${playerName}`
    });
    setResult({ ...res, band, level });
    setView('result');
  };

  const toggleMute = () => { const next = !sound.on.current; sound.on.current = next; setMuted(!next); toast.push(next ? 'الصوت مفعّل' : 'الصوت مكتوم'); };

  if (view === 'home') {
    return (
      <div className="space-y-5">
        <SectionHeader icon={Icon.Gamepad} title="ألعاب الرياضيات" subtitle="٦ ألعاب تفاعلية لتقوية الحساب الذهني — اعرضها على شاشة الصف أو دع الطلاب يلعبون" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 text-center"><div className="text-2xl">⭐</div><div className="text-xl font-extrabold text-brand-700 tabular-nums">{totalXP}</div><div className="text-[11px] font-bold text-slate-500">مجموع النقاط</div></Card>
          <Card className="p-4 text-center"><div className="text-2xl">🎮</div><div className="text-xl font-extrabold text-brand-700 tabular-nums">{savedResults.length}</div><div className="text-[11px] font-bold text-slate-500">جلسات لعبتها</div></Card>
          <Card className="p-4 text-center"><div className="text-2xl">🏆</div><div className="text-xl font-extrabold text-brand-700 tabular-nums">{bestScore}</div><div className="text-[11px] font-bold text-slate-500">أفضل نتيجة</div></Card>
          <button onClick={toggleMute} className="text-center"><Card className="p-4 h-full text-center"><div className="text-2xl">{muted ? '🔇' : '🔊'}</div><div className="text-[11px] font-bold text-slate-500">{muted ? 'مكتوم' : 'الصوت مفعّل'}</div></Card></button>
        </div>

        <Card className="p-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-extrabold text-slate-400 mb-2">المرحلة الدراسية</div>
              <div className="flex flex-wrap gap-2">
                {GRADE_BANDS.map((b) => (
                  <button key={b.id} onClick={() => setBand(b.id)} className={`chip ${band === b.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{b.icon} {b.name}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-extrabold text-slate-400 mb-2">المستوى</div>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map((l) => (
                  <button key={l.id} onClick={() => setLevel(l.id)} className={`chip ${level === l.id ? 'bg-sand-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{l.name}</button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAME_META.map((m) => (
            <button key={m.id} onClick={() => startGame(m)} className="text-right">
              <Card className="p-5 h-full hover:-translate-y-0.5 hover:shadow-lg transition">
                <div className="text-4xl mb-2">{m.icon}</div>
                <div className="font-extrabold text-slate-800 text-lg">{m.name}</div>
                <p className="text-sm text-slate-500 font-bold mt-1 leading-relaxed">{m.desc}</p>
                <span className="inline-flex items-center gap-1 mt-3 chip bg-brand-50 text-brand-700"><Icon.Play size={13} /> العب الآن</span>
              </Card>
            </button>
          ))}
        </div>

        <Card className="p-5">
          <div className="section-title mb-3"><Icon.Award size={18} /> لوحة المتصدرين</div>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-slate-400 font-bold">لا توجد نتائج بعد — ابدأ لعبة لتظهر هنا 🎮</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((r, i) => (
                <div key={r.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                  <span className={`grid place-items-center w-8 h-8 rounded-full font-extrabold text-white shrink-0 ${i === 0 ? 'bg-sand-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-brand-400'}`}>{i + 1}</span>
                  <div className="min-w-0">
                    <div className="font-extrabold text-slate-700 text-sm truncate">{r.title || r.gameName}</div>
                    <div className="text-[11px] font-bold text-slate-400">{r.bandName} • {r.gameName}</div>
                  </div>
                  <span className="mr-auto font-extrabold text-brand-700 tabular-nums">{r.score}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {savedResults.length > 0 && (
          <button className="btn-ghost" onClick={() => { if (window.confirm('مسح كل نتائج الألعاب؟')) { savedResults.forEach((r) => games.remove(r.id)); toast.push('تم مسح النتائج'); } }}>
            <Icon.Trash size={18} /> مسح النتائج
          </button>
        )}
        {toast.view}
      </div>
    );
  }

  if (view === 'result' && result) {
    return (
      <div className="space-y-5">
        <ResultScreen result={result} meta={meta} playerName={playerName}
          onAgain={() => { setResult(null); setView('play'); }} onHome={() => setView('home')} />
        {toast.view}
      </div>
    );
  }

  const Mode = meta ? MODES[meta.id] : null;
  return (
    <div className="space-y-5">
      <button className="btn-ghost" onClick={() => { if (window.confirm('إنهاء اللعبة والعودة للقائمة؟')) setView('home'); }}><Icon.ChevronRight size={18} /> رجوع للقائمة</button>
      {Mode && <Mode key={`${meta.id}-${band}-${level}-${view}`} band={band} level={level} sound={sound} onFinish={finish} />}
      {toast.view}
    </div>
  );
}
