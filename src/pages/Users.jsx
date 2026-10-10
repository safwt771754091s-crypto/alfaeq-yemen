import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Card, SectionHeader, Field, Modal, Confirm, useToast } from '../components/UI.jsx';
import PermissionsEditor from '../components/PermissionsEditor.jsx';
import { useAuth, ALL_PERMISSIONS, DEFAULT_TEACHER_PERMISSIONS, permissionLabel } from '../state/auth.jsx';
import { formatDate } from '../lib/utils.js';

const ROLE_LABELS = { owner: 'مالك المنصة', admin: 'مدير', teacher: 'معلم', viewer: 'مطّلع (قراءة فقط)' };
const READONLY_PERMISSIONS = ['dashboard', 'curriculum', 'library', 'reports', 'activity', 'community', 'announcements', 'reminders', 'settings'];

function UserForm({ open, onClose, editing }) {
  const { addUser, updateUser, setPin } = useAuth();
  const toast = useToast();
  const isEdit = !!editing;
  const [f, setF] = useState(() => ({
    name: editing?.name || '',
    username: editing?.username || '',
    role: editing?.role || 'teacher',
    subject: editing?.subject || '',
    school: editing?.school || '',
    email: editing?.email || '',
    phone: editing?.phone || '',
    permissions: editing?.permissions || DEFAULT_TEACHER_PERMISSIONS.slice(),
    pin: '',
    pin2: ''
  }));
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const applyRolePreset = (role) => {
    set('role', role);
    if (role === 'admin') set('permissions', ALL_PERMISSIONS.slice());
    else if (role === 'viewer') set('permissions', READONLY_PERMISSIONS.slice());
    else if (role === 'teacher') set('permissions', DEFAULT_TEACHER_PERMISSIONS.slice());
  };

  const submit = (e) => {
    e.preventDefault();
    if (!f.name.trim()) { toast.push('أدخل الاسم', 'error'); return; }
    const uname = f.username.trim().toLowerCase();
    if (uname.length < 3) { toast.push('اسم المستخدم 3 أحرف على الأقل', 'error'); return; }
    const payload = {
      name: f.name, username: f.username, role: f.role, roleLabel: ROLE_LABELS[f.role] || 'معلم',
      subject: f.subject, school: f.school, email: f.email, phone: f.phone, permissions: f.permissions
    };
    if (isEdit) {
      updateUser(editing.id, payload);
      if (f.pin) {
        if (f.pin.length < 4) { toast.push('الرمز 4 خانات على الأقل', 'error'); return; }
        if (f.pin !== f.pin2) { toast.push('الرمزان غير متطابقين', 'error'); return; }
        setPin(editing.id, f.pin);
      }
      toast.push('تم تحديث المستخدم');
    } else {
      if (f.pin.length < 4) { toast.push('الرمز 4 خانات على الأقل', 'error'); return; }
      if (f.pin !== f.pin2) { toast.push('الرمزان غير متطابقين', 'error'); return; }
      addUser(payload, f.pin);
      toast.push('تمت إضافة المستخدم');
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `تعديل: ${editing.name}` : 'إضافة مستخدم'}
      size="lg"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>إلغاء</button>
          <button className="btn-primary" onClick={submit}><Icon.Check size={18} /> حفظ</button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="الاسم" required><input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="اسم المستخدم" required><input className="input" dir="ltr" value={f.username} onChange={(e) => set('username', e.target.value)} /></Field>
          <Field label="الدور">
            <select className="input" value={f.role} onChange={(e) => applyRolePreset(e.target.value)}>
              {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'owner').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="التخصص"><input className="input" value={f.subject} onChange={(e) => set('subject', e.target.value)} /></Field>
          <Field label="المدرسة"><input className="input" value={f.school} onChange={(e) => set('school', e.target.value)} /></Field>
          <Field label="الهاتف"><input className="input" dir="ltr" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={isEdit ? 'رمز دخول جديد (اختياري)' : 'رمز الدخول'} required={!isEdit}>
            <input className="input" type="password" value={f.pin} onChange={(e) => set('pin', e.target.value)} placeholder={isEdit ? 'اتركه فارغاً للإبقاء' : ''} />
          </Field>
          <Field label="تأكيد الرمز"><input className="input" type="password" value={f.pin2} onChange={(e) => set('pin2', e.target.value)} /></Field>
        </div>

        <div>
          <div className="section-title mb-3"><Icon.Shield size={18} /> الصلاحيات</div>
          <PermissionsEditor value={f.permissions} onChange={(v) => set('permissions', v)} />
        </div>
      </div>
    </Modal>
  );
}

function MyProfile() {
  const { currentUser, changeOwnPin } = useAuth();
  const toast = useToast();
  const [pins, setPins] = useState({ cur: '', nw: '', nw2: '' });

  const submit = (e) => {
    e.preventDefault();
    if (pins.nw.length < 4) { toast.push('الرمز الجديد 4 خانات على الأقل', 'error'); return; }
    if (pins.nw !== pins.nw2) { toast.push('الرمزان غير متطابقين', 'error'); return; }
    if (!changeOwnPin(pins.cur, pins.nw)) { toast.push('الرمز الحالي غير صحيح', 'error'); return; }
    setPins({ cur: '', nw: '', nw2: '' });
    toast.push('تم تغيير رمز الدخول');
  };

  return (
    <div className="space-y-5">
      <SectionHeader icon={Icon.Users} title="ملفي الشخصي" subtitle="بياناتك ورمز الدخول — إدارة المستخدمين متاحة لمالك المنصة فقط" />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="section-title mb-4"><Icon.Users size={18} /> البيانات</div>
          <div className="space-y-2 text-sm">
            <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="text-slate-500 font-bold">الاسم: </span><span className="font-extrabold text-slate-700">{currentUser?.name}</span></div>
            <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="text-slate-500 font-bold">اسم المستخدم: </span><span className="font-extrabold text-slate-700" dir="ltr">{currentUser?.username}</span></div>
            <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="text-slate-500 font-bold">الدور: </span><span className="font-extrabold text-slate-700">{currentUser?.roleLabel}</span></div>
            <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="text-slate-500 font-bold">الصفوف المسموحة: </span><span className="font-extrabold text-slate-700">{(currentUser?.permissions || []).length}</span></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="section-title mb-4"><Icon.Key size={18} /> تغيير رمز الدخول</div>
          <form onSubmit={submit} className="space-y-4">
            <Field label="الرمز الحالي" required><input className="input" type="password" value={pins.cur} onChange={(e) => setPins({ ...pins, cur: e.target.value })} /></Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="الرمز الجديد" required><input className="input" type="password" value={pins.nw} onChange={(e) => setPins({ ...pins, nw: e.target.value })} /></Field>
              <Field label="تأكيد الجديد" required><input className="input" type="password" value={pins.nw2} onChange={(e) => setPins({ ...pins, nw2: e.target.value })} /></Field>
            </div>
            <button type="submit" className="btn-primary"><Icon.Key size={18} /> تحديث الرمز</button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function Users() {
  const { users, isOwner, updateUser, deleteUser, setPin, currentUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(null); // {open, editing}
  const [confirm, setConfirm] = useState(null);
  const [resetFor, setResetFor] = useState(null);
  const [newPin, setNewPin] = useState('');

  if (!isOwner) return <MyProfile />;

  const doReset = () => {
    if (newPin.length < 4) { toast.push('الرمز 4 خانات على الأقل', 'error'); return; }
    setPin(resetFor.id, newPin);
    setResetFor(null); setNewPin('');
    toast.push('تم تعيين رمز جديد');
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Icon.Shield}
        title="المستخدمون والصلاحيات"
        subtitle="إدارة حسابات المعلمين وتحديد صلاحيات كل مستخدم"
        actions={<button className="btn-primary" onClick={() => setForm({ open: true, editing: null })}><Icon.Plus size={18} /> إضافة مستخدم</button>}
      />

      <Card className="p-2 sm:p-3">
        <div className="divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3 flex-wrap">
              <span className={`grid place-items-center w-11 h-11 rounded-2xl text-white font-extrabold shrink-0 ${u.role === 'owner' ? 'bg-gradient-to-br from-sand-500 to-sand-600' : 'bg-gradient-to-br from-brand-500 to-brand-700'}`}>
                {(u.name || 'م').slice(0, 1)}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-slate-800">{u.name}</span>
                  <span className={`chip ${u.role === 'owner' ? 'bg-sand-50 text-sand-700' : 'bg-brand-50 text-brand-700'}`}>
                    {u.role === 'owner' && <Icon.Crown size={13} />} {u.roleLabel}
                  </span>
                  {u.fixed && <span className="chip bg-slate-100 text-slate-500">ثابت</span>}
                  {u.active === false && <span className="chip bg-rose-50 text-rose-600">موقوف</span>}
                  {u.id === currentUser.id && <span className="chip bg-emerald-50 text-emerald-700">أنت</span>}
                </div>
                <div className="text-xs text-slate-400 font-bold mt-0.5" dir="ltr">
                  {u.username}{u.school ? ` • ${u.school}` : ''} • {u.createdAt ? formatDate(u.createdAt.slice(0, 10)) : ''}
                </div>
                <div className="text-[11px] text-slate-400 font-bold">{u.role === 'owner' ? 'كل الصلاحيات' : `${(u.permissions || []).length} صلاحية`}</div>
              </div>
              <div className="mr-auto flex items-center gap-1.5 flex-wrap">
                <button className="btn-outline !px-3 !py-2 text-xs" onClick={() => setForm({ open: true, editing: u })}><Icon.Edit size={15} /> تعديل</button>
                <button className="btn-outline !px-3 !py-2 text-xs" onClick={() => { setResetFor(u); setNewPin(''); }}><Icon.Key size={15} /> رمز</button>
                {!u.fixed && (
                  <>
                    <button className="btn-ghost !px-3 !py-2 text-xs" onClick={() => updateUser(u.id, { active: u.active === false })}>
                      {u.active === false ? <><Icon.Check size={15} /> تنشيط</> : 'إيقاف'}
                    </button>
                    <button className="btn-ghost !px-3 !py-2 text-xs text-rose-600" onClick={() => setConfirm(u)}><Icon.Trash size={15} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="section-title mb-2"><Icon.Info size={18} /> كيف تعمل الصلاحيات؟</div>
        <p className="text-sm text-slate-500 font-bold leading-relaxed">
          مالك المنصة <b>{users.find((u) => u.id === 'owner')?.name}</b> يملك كل الصلاحيات دائماً ولا يمكن حذفه أو إيقافه.
          لكل دور صلاحيات افتراضية (مدير = الكل، مطّلع = قراءة فقط، معلم = كل الأدوات ما عدا إدارة المستخدمين)،
          ويمكنك تخصيص الصلاحيات صفحةً صفحة. الصفحات غير المسموح بها لا تظهر في قائمة المستخدم.
        </p>
      </Card>

      {form?.open && <UserForm open onClose={() => setForm(null)} editing={form.editing} key={form.editing?.id || 'new'} />}

      <Modal open={!!resetFor} onClose={() => setResetFor(null)} title={`تعيين رمز جديد: ${resetFor?.name || ''}`} size="sm"
        footer={<><button className="btn-ghost" onClick={() => setResetFor(null)}>إلغاء</button><button className="btn-primary" onClick={doReset}>حفظ</button></>}>
        <Field label="رمز الدخول الجديد" required>
          <input className="input" type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="4 خانات على الأقل" />
        </Field>
      </Modal>

      <Confirm
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => { deleteUser(confirm.id); toast.push('تم حذف المستخدم'); }}
        title="حذف مستخدم"
        message={`سيتم حذف حساب «${confirm?.name}» نهائياً. متابعة؟`}
      />
      {toast.view}
    </div>
  );
}

export { permissionLabel };
