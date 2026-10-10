import Icon from './Icon.jsx';
import { PERMISSION_GROUPS } from '../state/auth.jsx';

export default function PermissionsEditor({ value, onChange, disabled }) {
  const toggle = (id) => {
    if (disabled) return;
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };
  return (
    <div className="space-y-3">
      {PERMISSION_GROUPS.map((g) => (
        <div key={g.group}>
          <div className="text-[11px] font-extrabold text-slate-400 mb-1.5">{g.group}</div>
          <div className="flex flex-wrap gap-2">
            {g.items.map(([id, label]) => {
              const on = value.includes(id);
              return (
                <button
                  type="button"
                  key={id}
                  disabled={disabled}
                  onClick={() => toggle(id)}
                  className={`chip transition ${on ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'} ${disabled ? 'opacity-60' : ''}`}
                >
                  {on && <Icon.Check size={13} />} {label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
