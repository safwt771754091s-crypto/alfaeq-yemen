import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';

export function Card({ className = '', children, ...rest }) {
  return <div className={`card ${className}`} {...rest}>{children}</div>;
}

export function SectionHeader({ icon: I, title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
      <div className="flex items-center gap-3">
        {I && (
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-brand-50 text-brand-700">
            <I size={22} />
          </span>
        )}
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function Field({ label, hint, children, required }) {
  return (
    <label className="block">
      <span className="label">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', h);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 no-print">
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col animate-fade-in`}>
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <h3 className="text-lg font-extrabold text-slate-800">{title}</h3>
          <button className="btn-ghost !px-2.5 !py-2" onClick={onClose} aria-label="إغلاق">
            <Icon.Close size={18} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto grow">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2 flex-wrap">{footer}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon: I = Icon.Info, title, subtitle, action }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 grid place-items-center text-slate-400 mb-3">
        <I size={30} />
      </div>
      <h3 className="font-extrabold text-slate-700">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{subtitle}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function StatCard({ icon: I, label, value, tone = 'brand', sub }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    sand: 'bg-sand-100 text-sand-700',
    sky: 'bg-sky-50 text-sky-700',
    rose: 'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-700',
    violet: 'bg-violet-50 text-violet-700'
  };
  return (
    <div className="stat-card">
      <span className={`grid place-items-center w-12 h-12 rounded-2xl shrink-0 ${tones[tone] || tones.brand}`}>
        {I && <I size={24} />}
      </span>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold text-slate-800 leading-tight">{value}</div>
        <div className="text-xs font-bold text-slate-500 truncate">{label}</div>
        {sub && <div className="text-[11px] text-slate-400 truncate">{sub}</div>}
      </div>
    </div>
  );
}

export function ProgressBar({ value, tone = 'brand', showLabel = true }) {
  const tones = {
    brand: 'bg-brand-500',
    sand: 'bg-sand-500',
    rose: 'bg-rose-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500'
  };
  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 rounded-full bg-slate-100 grow overflow-hidden">
        <div className={`h-full rounded-full ${tones[tone] || tones.brand}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      {showLabel && <span className="text-xs font-bold text-slate-500 tabular-nums w-12 text-left">{value}%</span>}
    </div>
  );
}

let toastId = 0;
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = (message, tone = 'success') => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  };
  const view = (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 no-print">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-fade-in rounded-xl px-4 py-2.5 text-sm font-bold shadow-lg text-white ${
            t.tone === 'error' ? 'bg-rose-600' : t.tone === 'info' ? 'bg-slate-800' : 'bg-brand-600'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
  return { push, view };
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl bg-slate-100 overflow-x-auto no-print">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition ${
            active === t.id ? 'bg-white text-brand-700 shadow-soft' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}

export function Confirm({ open, onClose, onConfirm, title, message, danger = true }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title || 'تأكيد'}
      size="sm"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>إلغاء</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={() => { onConfirm(); onClose(); }}>
            تأكيد
          </button>
        </>
      }
    >
      <p className="text-slate-600">{message}</p>
    </Modal>
  );
}
