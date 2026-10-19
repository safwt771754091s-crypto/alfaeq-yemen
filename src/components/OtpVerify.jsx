import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { Field, useToast } from './UI.jsx';
import { createOtp, verifyOtp, sendOtp, otpRemainingMs } from '../lib/verification.js';

// مكوّن تحقق برمز OTP — يُرسل عبر واتساب أو البريد، ويعرض الرمز للتسليم اليدوي عند تعذّر الإرسال.
// scope: مفتاح الطلب (مثلاً 'login' أو 'verify:userId')
export default function OtpVerify({ scope, channel, target, purpose = 'التحقق', name = '', onVerified, compact = false }) {
  const toast = useToast();
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [shownCode, setShownCode] = useState('');
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (!sent) return;
    const t = setInterval(() => setLeft(Math.ceil(otpRemainingMs(scope) / 1000)), 1000);
    return () => clearInterval(t);
  }, [sent, scope]);

  const doSend = () => {
    const { code: c } = createOtp({ scope, channel, target, purpose, name });
    setShownCode(c);
    setSent(true);
    const res = sendOtp({ channel, target, code: c, name, purpose });
    if (res.ok) toast.push(channel === 'whatsapp' ? 'فُتح واتساب لإرسال الرمز' : 'فُتح البريد لإرسال الرمز');
    else toast.push('تعذّر الإرسال تلقائياً — استخدم الرمز المعروض', 'info');
  };

  const doVerify = () => {
    const res = verifyOtp(scope, code);
    if (!res.ok) { toast.push(res.error, 'error'); return; }
    toast.push('تم التحقق بنجاح');
    onVerified && onVerified();
  };

  const channelLabel = channel === 'whatsapp' ? 'واتساب' : 'البريد الإلكتروني';

  return (
    <div className={compact ? '' : 'space-y-4'}>
      {!sent ? (
        <button type="button" className="btn-primary w-full !py-3" onClick={doSend}>
          {channel === 'whatsapp' ? <Icon.WhatsApp size={20} /> : <Icon.Mail size={20} />}
          إرسال رمز التحقق عبر {channelLabel}
        </button>
      ) : (
        <>
          <div className="rounded-2xl bg-brand-50 p-3 text-sm text-brand-800 font-bold leading-relaxed">
            أُرسل رمز التحقق إلى <b dir="ltr">{target}</b> عبر {channelLabel}. أدخله خلال 5 دقائق.
            {left > 0 && <span className="block text-xs text-brand-600 mt-1">متبقٍ {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>}
          </div>
          <div className="rounded-2xl bg-sand-50 p-3 text-center">
            <div className="text-xs text-sand-700 font-bold mb-1">رمز التحقق (للتسليم اليدوي إن لم يُفتح التطبيق):</div>
            <div className="text-2xl font-extrabold tracking-[0.3em] text-sand-800" dir="ltr">{shownCode}</div>
          </div>
          <Field label="أدخل رمز التحقق" required>
            <input className="input text-center tracking-[0.4em] text-xl font-extrabold" dir="ltr" maxLength={6}
              value={code} onChange={(e) => setCode(e.target.value)} placeholder="••••••" />
          </Field>
          <div className="flex gap-2">
            <button type="button" className="btn-primary grow !py-3" onClick={doVerify}><Icon.Check size={20} /> تحقّق</button>
            <button type="button" className="btn-outline" onClick={doSend}><Icon.Refresh size={18} /> رمز جديد</button>
          </div>
        </>
      )}
      {toast.view}
    </div>
  );
}
