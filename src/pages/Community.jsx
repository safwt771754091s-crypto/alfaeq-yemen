import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, EmptyState, Modal, useToast, Confirm } from '../components/UI.jsx';
import { useApp } from '../state/store.jsx';

const KINDS = [
  { id: 'post', name: 'منشور', icon: Icon.Message },
  { id: 'question', name: 'سؤال', icon: Icon.Info },
  { id: 'resource', name: 'مورد', icon: Icon.Library }
];

const EMPTY = { title: '', body: '', kind: 'post', tags: '' };

export default function Community() {
  const { community, profile } = useApp();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [confirmId, setConfirmId] = useState(null);
  const [liked, setLiked] = useState({});
  const [commentFor, setCommentFor] = useState(null);
  const [comment, setComment] = useState('');

  const items = community.items;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const meta = (id) => KINDS.find((k) => k.id === id) || KINDS[0];

  const save = () => {
    if (!form.title.trim()) { toast.push('أدخل عنوان المنشور', 'error'); return; }
    community.add({ ...form, author: profile.name || 'معلم', likes: 0, comments: [] });
    toast.push('تم نشر المشاركة');
    setForm(EMPTY);
    setOpen(false);
  };

  const addComment = (post) => {
    if (!comment.trim()) return;
    community.update(post.id, { comments: [...(post.comments || []), { by: profile.name || 'معلم', text: comment, at: new Date().toISOString() }] });
    setComment('');
    setCommentFor(null);
    toast.push('تمت إضافة التعليق');
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Message}
        title="المجتمع"
        subtitle="مساحتك لمشاركة الخبرات والأسئلة والموارد مع زملائك المعلمين"
        actions={<button className="btn-primary" onClick={() => { setForm(EMPTY); setOpen(true); }}><Icon.Plus size={18} /> مشاركة جديدة</button>}
      />

      {items.length === 0 ? (
        <Card><EmptyState icon={Icon.Message} title="لا توجد مشاركات" subtitle="ابدأ بنشر سؤال أو مورد أو تجربة صفية ليستفيد منها الآخرون."
          action={<button className="btn-primary" onClick={() => setOpen(true)}><Icon.Plus size={18} /> أول مشاركة</button>} /></Card>
      ) : (
        <div className="space-y-4 max-w-3xl">
          {items.map((p) => {
            const M = meta(p.kind); const I = M.icon;
            const isLiked = liked[p.id];
            return (
              <Card key={p.id} className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="grid place-items-center w-11 h-11 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white font-extrabold">
                    {(p.author || 'م').slice(0, 1)}
                  </span>
                  <div className="grow">
                    <div className="font-extrabold text-slate-800">{p.author || 'معلم'}</div>
                    <div className="text-xs text-slate-400 font-bold">{new Date(p.createdAt).toLocaleDateString('ar-EG')}</div>
                  </div>
                  <span className="chip bg-brand-50 text-brand-700"><I size={14} /> {M.name}</span>
                  <button className="btn-danger !py-1.5 !px-2.5" onClick={() => setConfirmId(p.id)} aria-label="حذف"><Icon.Trash size={15} /></button>
                </div>
                <h3 className="font-extrabold text-slate-800 mb-1.5">{p.title}</h3>
                {p.body && <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{p.body}</p>}
                {p.tags && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.tags.split(/[,،]/).map((t) => t.trim()).filter(Boolean).map((t, i) => (
                      <span key={i} className="chip bg-slate-100 text-slate-600">#{t}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button onClick={() => setLiked((l) => ({ ...l, [p.id]: !l[p.id] }))}
                    className={`chip ${isLiked ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon.Heart size={15} /> {(p.likes || 0) + (isLiked ? 1 : 0)}
                  </button>
                  <button onClick={() => { setCommentFor(commentFor === p.id ? null : p.id); setComment(''); }}
                    className="chip bg-slate-100 text-slate-600">
                    <Icon.Message size={15} /> {(p.comments || []).length} تعليق
                  </button>
                </div>
                {(p.comments || []).length > 0 && (
                  <div className="mt-3 space-y-2">
                    {p.comments.map((c, i) => (
                      <div key={i} className="rounded-xl bg-slate-50 px-3 py-2">
                        <div className="text-xs font-extrabold text-brand-700">{c.by}</div>
                        <div className="text-sm text-slate-600">{c.text}</div>
                      </div>
                    ))}
                  </div>
                )}
                {commentFor === p.id && (
                  <div className="mt-3 flex gap-2">
                    <input className="input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="اكتب تعليقاً..." />
                    <button className="btn-primary shrink-0" onClick={() => addComment(p)}><Icon.Send size={18} /></button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="مشاركة جديدة"
        footer={<><button className="btn-ghost" onClick={() => setOpen(false)}>إلغاء</button><button className="btn-primary" onClick={save}><Icon.Send size={18} /> نشر</button></>}
      >
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="العنوان" required><input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="مثال: أفكار لتبسيط الجبر" /></Field>
            <Field label="النوع">
              <select className="input" value={form.kind} onChange={(e) => set('kind', e.target.value)}>
                {KINDS.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="المحتوى"><textarea className="input min-h-[120px]" value={form.body} onChange={(e) => set('body', e.target.value)} placeholder="شارك فكرتك أو سؤالك..." /></Field>
          <Field label="وسوم (اختياري)" hint="افصل بينها بفاصلة"><input className="input" value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="رياضيات، أنشطة" /></Field>
        </div>
      </Modal>

      <Confirm open={!!confirmId} onClose={() => setConfirmId(null)}
        onConfirm={() => { community.remove(confirmId); toast.push('تم حذف المشاركة'); }}
        title="حذف المشاركة" message="سيتم حذف هذه المشاركة. متابعة؟" />
      {toast.view}
    </div>
  );
}
