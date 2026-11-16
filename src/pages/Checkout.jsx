import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, CreditCard, Banknote, Store, Bike } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useCart } from '@/lib/cart';
import { useSettings } from '@/lib/settings';
import { base44 } from '@/api/base44Client';
import { formatPrice } from '@/lib/format';
import { getStatusNow } from '@/lib/openingHours';

const ESLOV_POSTAL = ['241'];

const pad = (n) => String(n).padStart(2, '0');

export default function Checkout() {
  const { t } = useI18n();
  const { items, subtotal, clear, orderType, setOrderType } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', street: '', postal: '', city: 'Eslöv', apartment: '', floor: '', instructions: '', name: '', notes: '' });
  const [timing, setTiming] = useState('asap');
  const [scheduledTime, setScheduledTime] = useState('');
  const [payment, setPayment] = useState('stripe');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const status = getStatusNow(settings.openingHours);

  const deliveryAvailable = settings.deliveryEnabled !== false;
  const pickupAvailable = settings.pickupEnabled !== false;
  const isDelivery = orderType === 'delivery' && deliveryAvailable;

  const meetsMin = !isDelivery || subtotal >= (settings.minDeliveryOrder || 0);
  const deliveryFee = !isDelivery ? 0 : (subtotal >= (settings.freeDeliveryThreshold || 0) && settings.freeDeliveryThreshold > 0 ? 0 : (settings.deliveryFee || 0));
  const total = subtotal + deliveryFee;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const postalValid = !isDelivery || ESLOV_POSTAL.some(p => form.postal.startsWith(p));
  const canSubmit = useMemo(() => {
    if (items.length === 0) return false;
    if (!deliveryAvailable && !pickupAvailable) return false;
    if (!status.open && !settings.acceptPreOrders) return false;
    if (settings.ordersPaused) return false;
    if (isDelivery && !meetsMin) return false;
    if (timing === 'scheduled' && !scheduledTime) return false;
    if (!form.phone || form.phone.length < 6) return false;
    if (isDelivery) {
      if (!form.firstName || !form.lastName || !form.street || !form.postal || !form.city) return false;
      if (!postalValid) return false;
    } else if (!form.name) return false;
    return true;
  }, [items, form, isDelivery, meetsMin, postalValid, status.open, settings.acceptPreOrders, settings.ordersPaused, timing, scheduledTime, deliveryAvailable, pickupAvailable]);

  const scheduledFor = () => {
    if (timing !== 'scheduled' || !scheduledTime) return '';
    const now = new Date();
    const [h, m] = scheduledTime.split(':').map(Number);
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(h)}:${pad(m)}`;
  };

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError('');
    const payload = {
      orderType: isDelivery ? 'delivery' : 'pickup',
      customer: {
        name: isDelivery ? `${form.firstName} ${form.lastName}`.trim() : form.name,
        phone: form.phone,
      },
      deliveryAddress: isDelivery
        ? { street: form.street, postal: form.postal, city: form.city, apartment: form.apartment, floor: form.floor, instructions: form.instructions }
        : {},
      items: items.map(i => ({ itemId: i.itemId, qty: i.qty, size: i.size || null, extras: i.extras || [], notes: i.notes || '' })),
      customerNotes: form.notes,
      paymentMethod: payment,
      scheduledFor: scheduledFor(),
    };
    try {
      const res = await base44.functions.invoke('createOrder', payload);
      const data = res?.data || {};
      if (data.error) throw new Error(data.error);
      clear();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      navigate(`/order/${data.orderId}?token=${encodeURIComponent(data.token || '')}`);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Kunde inte skicka beställningen. Försök igen.');
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return <div className="max-w-md mx-auto px-4 py-20 text-center">
      <p className="text-stone-500">{t('din_varukorg_ar_tom')}</p>
      <Link to="/meny" className="inline-block mt-4 bg-[#1f5d3a] text-white font-semibold px-6 py-3 rounded-full">{t('visa_menyn')}</Link>
    </div>;
  }

  const payments = [
    { id: 'stripe', label: t('betala_online'), desc: t('betala_online_desc'), icon: CreditCard },
    { id: 'cash', label: isDelivery ? t('betala_leverans') : t('betala_plats_kort'), desc: '', icon: isDelivery ? Bike : Store },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 pb-28">
      <Link to="/varukorg" className="inline-flex items-center gap-1 text-sm text-stone-500 mb-4"><ArrowLeft className="w-4 h-4" /> {t('varukorg')}</Link>
      <h1 className="text-xl font-bold text-stone-900 mb-4">{t('kassa')}</h1>

      {!status.open && !settings.acceptPreOrders && (
        <div className="mb-4 p-3 rounded-xl bg-stone-100 text-stone-600 text-sm text-center">{t('stangd_msg')}</div>
      )}
      {settings.ordersPaused && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-sm text-center">{t('orders_paused_msg')}</div>
      )}

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 space-y-4">
          {/* Order type */}
          {(deliveryAvailable || pickupAvailable) && (
            <div className="bg-white rounded-2xl p-4">
              <h2 className="font-semibold text-stone-900 mb-3">{t('bestallningssatt')}</h2>
              <div className="flex gap-2 bg-stone-100 p-1 rounded-full">
                {pickupAvailable && (
                  <button onClick={() => setOrderType('pickup')} className={`flex-1 py-2.5 rounded-full text-sm font-medium ${!isDelivery ? 'bg-[#1f5d3a] text-white' : 'text-stone-600'}`}>{t('avhamtning')}</button>
                )}
                {deliveryAvailable && (
                  <button onClick={() => setOrderType('delivery')} className={`flex-1 py-2.5 rounded-full text-sm font-medium ${isDelivery ? 'bg-[#1f5d3a] text-white' : 'text-stone-600'}`}>{t('hemleverans')}</button>
                )}
              </div>
            </div>
          )}

          {/* Customer info */}
          <div className="bg-white rounded-2xl p-4 space-y-3">
            {isDelivery ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('fornamn')} value={form.firstName} onChange={v => set('firstName', v)} required />
                  <Field label={t('efternamn')} value={form.lastName} onChange={v => set('lastName', v)} required />
                </div>
                <Field label={t('telefon')} value={form.phone} onChange={v => set('phone', v)} type="tel" required />
                <Field label={t('gatuadress')} value={form.street} onChange={v => set('street', v)} required />
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('postnummer')} value={form.postal} onChange={v => set('postal', v)} type="tel" required error={!postalValid ? t('utanfor_omrade') : ''} />
                  <Field label={t('ort')} value={form.city} onChange={v => set('city', v)} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('portkod')} value={form.apartment} onChange={v => set('apartment', v)} />
                  <Field label={t('vaning')} value={form.floor} onChange={v => set('floor', v)} />
                </div>
                <Field label={t('leveransinstruktioner')} value={form.instructions} onChange={v => set('instructions', v)} textarea />
              </>
            ) : (
              <>
                <Field label={t('namn')} value={form.name} onChange={v => set('name', v)} required />
                <Field label={t('telefon')} value={form.phone} onChange={v => set('phone', v)} type="tel" required />
              </>
            )}
          </div>

          {/* Timing */}
          <div className="bg-white rounded-2xl p-4">
            <h2 className="font-semibold text-stone-900 mb-3">{t('sa_snart')}</h2>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setTiming('asap')} className={`p-3 rounded-xl border-2 text-sm font-medium ${timing === 'asap' ? 'border-[#1f5d3a] bg-green-50' : 'border-stone-200'}`}>{t('sa_snart')}</button>
              <button onClick={() => setTiming('scheduled')} disabled={!settings.acceptPreOrders} className={`p-3 rounded-xl border-2 text-sm font-medium disabled:opacity-40 ${timing === 'scheduled' ? 'border-[#1f5d3a] bg-green-50' : 'border-stone-200'}`}>{t('valj_tid')}</button>
            </div>
            {timing === 'scheduled' && settings.acceptPreOrders && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-stone-500 mb-1">{t('valj_klockslag')} *</label>
                <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="w-full rounded-xl border border-stone-200 p-3 text-sm focus:outline-none focus:border-[#1f5d3a]" />
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl p-4">
            <h2 className="font-semibold text-stone-900 mb-3">{t('betalning')}</h2>
            <div className="space-y-2">
              {payments.map(p => {
                const Icon = p.icon;
                return (
                  <button key={p.id} onClick={() => setPayment(p.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${payment === p.id ? 'border-[#1f5d3a] bg-green-50' : 'border-stone-200'}`}>
                    <Icon className="w-5 h-5 text-stone-600" />
                    <span className="font-medium text-sm flex-1 text-start">{p.label}</span>
                    {payment === p.id && <Check className="w-5 h-5 text-[#1f5d3a]" />}
                  </button>
                );
              })}
            </div>
            {payment === 'stripe' && (
              <div className="mt-3 p-3 rounded-xl bg-stone-50 text-xs text-stone-500 flex items-start gap-2">
                <Banknote className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{t('betala_online_desc')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-4 lg:sticky lg:top-20">
            <h2 className="font-semibold text-stone-900 mb-3">{t('order_sammanfattning')}</h2>
            <div className="space-y-2 mb-3 max-h-52 overflow-y-auto">
              {items.map(i => (
                <div key={i.lineId} className="flex justify-between gap-3 text-sm">
                  <span className="text-stone-600">{i.qty}× {i.name}{i.size ? ` (${i.size})` : ''}{i.extras?.length ? ` · ${i.extras.join(', ')}` : ''}</span>
                  <span className="text-stone-800 whitespace-nowrap">{formatPrice(i.price * i.qty)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-3 border-t border-stone-100">
              <div className="flex justify-between text-sm text-stone-600"><span>{t('delsumma')}</span><span>{formatPrice(subtotal)}</span></div>
              {isDelivery && <div className="flex justify-between text-sm text-stone-600"><span>{t('leveransavgift')}</span><span>{deliveryFee === 0 ? t('gratis') : formatPrice(deliveryFee)}</span></div>}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-stone-100"><span>{t('total')}</span><span>{formatPrice(total)}</span></div>
            </div>
            {error && <div className="mt-3 text-sm text-red-600 text-center">{error}</div>}
            <button onClick={submit} disabled={!canSubmit || submitting} className="w-full mt-4 bg-[#c8332a] hover:bg-[#b02b22] disabled:bg-stone-300 text-white font-semibold py-4 rounded-full transition-colors active:scale-[0.98]">
              {submitting ? t('bearbetar') : t('place_order')}
            </button>
            {!meetsMin && isDelivery && <div className="mt-2 text-xs text-amber-600 text-center">{t('min_order')}: {formatPrice(settings.minDeliveryOrder)}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required, textarea, error }) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-500 mb-1">{label}{required && ' *'}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} className="w-full rounded-xl border border-stone-200 p-3 text-sm resize-none focus:outline-none focus:border-[#1f5d3a]" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} inputMode={type === 'tel' ? 'tel' : 'text'} className={`w-full rounded-xl border p-3 text-sm focus:outline-none ${error ? 'border-red-300 focus:border-red-500' : 'border-stone-200 focus:border-[#1f5d3a]'}`} />
      )}
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
}
