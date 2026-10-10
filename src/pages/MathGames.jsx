import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, useToast } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';

const GAMES = [
  { id: 'add', name: 'الجمع السريع', icon: '➕', range: [1, 20], op: '+' },
  { id: 'sub', name: 'الطرح', icon: '➖', range: [1, 20], op: '−' },
  { id: 'mul', name: 'جدول الضرب', icon: '✖️', range: [1, 12], op: '×' }
];

function makeQuestion(game, level) {
  const max = level === 'easy' ? 10 : level === 'medium' ? 20 : 50;
  let a = Math.floor(Math.random() * max) + 1;
  let b = Math.floor(Math.random() * max) + 1;
  if (game.op === '−' && b > a) [a, b] = [b, a];
  const answer = game.op === '+' ? a + b : game.op === '−' ? a - b : a * b;
  return { text: `${a} ${game.op} ${b}`, answer };
}

export default function MathGames() {
  const { profile } = useApp();
  const toast = useToast();
  const [game, setGame] = useState(GAMES[0]);
  const [level, setLevel] = useState('easy');
  const [q, setQ] = useState(() => makeQuestion(GAMES[0], 'easy'));
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const start = (g = game, lv = level) => {
    setGame(g); setLevel(lv);
    setQ(makeQuestion(g, lv)); setInput(''); setFeedback(null);
  };

  const check = () => {
    if (input === '') return;
    const ok = Number(input) === q.answer;
    if (ok) {
      const ns = score + 1;
      setScore(ns);
      setStreak((s) => { const v = s + 1; setBest((b) => Math.max(b, v)); return v; });
      setFeedback({ ok: true, text: 'أحسنت! إجابة صحيحة 🎉' });
      setQ(makeQuestion(game, level));
    } else {
      setStreak(0);
      setFeedback({ ok: false, text: `الإجابة الصحيحة: ${q.answer}` });
      setQ(makeQuestion(game, level));
    }
    setInput('');
  };

  const reset = () => { setScore(0); setStreak(0); setFeedback(null); start(); };

  return (
    <div className="space-y-5">
      <SectionHeader icon={Icon.Gamepad} title="ألعاب الرياضيات" subtitle="ألعاب سريعة لتقوية الحساب الذهني — اعرضها على الشاشة لطلابك" />

      <div className="grid lg:grid-cols-[300px_1fr] gap-4 items-start">
        <Card className="p-5 space-y-4">
          <Field label="اللعبة">
            <div className="grid grid-cols-1 gap-2">
              {GAMES.map((g) => (
                <button key={g.id} onClick={() => start(g, level)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-bold flex items-center gap-2 transition ${game.id === g.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400'}`}>
                  <span>{g.icon}</span> {g.name}
                </button>
              ))}
            </div>
          </Field>
          <Field label="المستوى">
            <select className="input" value={level} onChange={(e) => start(game, e.target.value)}>
              <option value="easy">سهل</option>
              <option value="medium">متوسط</option>
              <option value="hard">متقدم</option>
            </select>
          </Field>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-brand-50 px-2 py-2"><div className="text-xl font-extrabold text-brand-700">{score}</div><div className="text-[11px] font-bold text-slate-500">النقاط</div></div>
            <div className="rounded-xl bg-amber-50 px-2 py-2"><div className="text-xl font-extrabold text-amber-700">{streak}</div><div className="text-[11px] font-bold text-slate-500">متتالية</div></div>
            <div className="rounded-xl bg-emerald-50 px-2 py-2"><div className="text-xl font-extrabold text-emerald-700">{best}</div><div className="text-[11px] font-bold text-slate-500">الأفضل</div></div>
          </div>
          <button className="btn-ghost w-full" onClick={reset}><Icon.Refresh size={18} /> إعادة</button>
        </Card>

        <Card className="p-6">
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white p-8 text-center">
            <div className="text-sm font-bold opacity-90 mb-2">{game.name} — {level === 'easy' ? 'سهل' : level === 'medium' ? 'متوسط' : 'متقدم'}</div>
            <div className="text-5xl sm:text-6xl font-extrabold tabular-nums tracking-wide my-4">{q.text} = ؟</div>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <input
                type="number"
                inputMode="numeric"
                className="w-40 text-center text-3xl font-extrabold rounded-2xl px-4 py-3 text-slate-800"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && check()}
                placeholder="؟"
                autoFocus
              />
              <button className="btn-sand !px-6 !py-3" onClick={check}><Icon.Check size={20} /> تحقق</button>
            </div>
          </div>

          {feedback && (
            <div className={`mt-4 rounded-xl px-4 py-3 text-center font-extrabold ${feedback.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
              {feedback.text}
            </div>
          )}

          <p className="text-xs text-slate-400 font-bold text-center mt-4">
            💡 نصيحة للأستاذ {profile.name || ''}: يمكنك عرض السؤال على شاشة الصف واختيار طالب للإجابة.
          </p>
        </Card>
      </div>
      {toast.view}
    </div>
  );
}
