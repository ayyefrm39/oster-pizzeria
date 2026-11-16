import React, { useState, useEffect } from 'react';
import { AlertTriangle, Save } from 'lucide-react';
import { api } from '@/api/client';
import { useSettings } from '@/lib/settings';
import { useToast } from '@/components/ui/use-toast';
import { dayNames } from '@/lib/openingHours';

const DAYS = [1, 2, 3, 4, 5, 6, 0];

export default function AdminSettings() {
  const { toast } = useToast();
  const { settings, setSettings, reload } = useSettings();
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (settings?.id) setForm(JSON.parse(JSON.stringify(settings)));
  }, [settings?.id]);

  if (!form) return <div className="p-6 text-stone-400">Laddar…</div>;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setHour = (day, field, value) => {
    setForm(f => {
      const hours = [...(f.openingHours || [])];
      const idx = hours.findIndex(h => h.day === day);
      if (idx >= 0) hours[idx] = { ...hours[idx], [field]: value };
      else hours.push({ day, open: '10:00', close: '20:00', closesNextDay: false, [field]: value });
      return { ...f, openingHours: hours };
    });
  };

  const save = async () => {
    await api.entities.RestaurantSettings.update(form.id, {
      privacyPolicy:form.privacyPolicy,cookieInfo:form.cookieInfo,allergenInfo:form.allergenInfo,restaurantName: form.restaurantName, address: form.address, phone: form.phone,
      openingHours: form.openingHours, deliveryEnabled: form.deliveryEnabled, pickupEnabled: form.pickupEnabled,
      deliveryFee: form.deliveryFee, minDeliveryOrder: form.minDeliveryOrder, freeDeliveryThreshold: form.freeDeliveryThreshold,
      estimatedPrepTime: form.estimatedPrepTime, acceptPreOrders: form.acceptPreOrders, ordersPaused: form.ordersPaused,
      deliveryAreas: form.deliveryAreas
    });
    setSettings(s => ({ ...s, ...form }));
    toast({ title: 'Inställningar sparade' });
  };

  const togglePause = async () => {
    const newVal = !form.ordersPaused;
    set('ordersPaused', newVal);
    await api.entities.RestaurantSettings.update(form.id, { ordersPaused: newVal });
    setSettings(s => ({ ...s, ordersPaused: newVal }));
    toast({ title: newVal ? 'Onlinebeställningar pausade' : 'Onlinebeställningar aktiverade' });
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-stone-900">Inställningar</h1>

      {/* Pause button */}
      <div className={`rounded-2xl p-4 border-2 ${form.ordersPaused ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-bold text-stone-900 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Pausa onlinebeställningar</div>
            <p className="text-sm text-stone-600 mt-1">Kunder ser ett meddelande om att beställningar tillfälligt är pausade.</p>
          </div>
          <button onClick={togglePause} className={`px-5 py-2.5 rounded-full font-semibold text-sm shrink-0 ${form.ordersPaused ? 'bg-red-500 text-white' : 'bg-green-600 text-white'}`}>
            {form.ordersPaused ? 'Pausad – aktivera' : 'Pausa nu'}
          </button>
        </div>
      </div>

      {/* Restaurant info */}
      <Section title="Restaurang">
        <Field label="Namn" value={form.restaurantName} onChange={v => set('restaurantName', v)} />
        <Field label="Adress" value={form.address} onChange={v => set('address', v)} />
        <Field label="Telefon" value={form.phone} onChange={v => set('phone', v)} />
      </Section>

      {/* Opening hours */}
      <Section title="Öppettider">
        <div className="space-y-2">
          {DAYS.map(d => {
            const h = (form.openingHours || []).find(x => x.day === d) || { day: d, open: '10:00', close: '20:00', closesNextDay: false };
            return (
              <div key={d} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="w-24 text-stone-600">{dayNames.sv[d]}</span>
                <input type="time" value={h.open} onChange={e => setHour(d, 'open', e.target.value)} className="rounded-lg border border-stone-200 px-2 py-1.5" />
                <span className="text-stone-400">–</span>
                <input type="time" value={h.close} onChange={e => setHour(d, 'close', e.target.value)} className="rounded-lg border border-stone-200 px-2 py-1.5" />
                <label className="flex items-center gap-1 text-xs text-stone-500"><input type="checkbox" checked={!!h.closesNextDay} onChange={e => setHour(d, 'closesNextDay', e.target.checked)} /> nästa dag</label>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Delivery */}
      <Section title="Leverans">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Leveransavgift (kr)" value={form.deliveryFee} onChange={v => set('deliveryFee', Number(v))} type="number" />
          <Field label="Minsta beställning (kr)" value={form.minDeliveryOrder} onChange={v => set('minDeliveryOrder', Number(v))} type="number" />
          <Field label="Gratis leverans över (kr)" value={form.freeDeliveryThreshold} onChange={v => set('freeDeliveryThreshold', Number(v))} type="number" />
          <Field label="Beräknad tid (min)" value={form.estimatedPrepTime} onChange={v => set('estimatedPrepTime', Number(v))} type="number" />
        </div>
        <Field label="Leveransområden" value={form.deliveryAreas} onChange={v => set('deliveryAreas', v)} />
        <div className="flex gap-4 pt-2">
          <label className="flex flex-wrap items-center gap-2 text-sm"><input type="checkbox" checked={form.deliveryEnabled} onChange={e => set('deliveryEnabled', e.target.checked)} /> Leverans aktiv</label>
          <label className="flex flex-wrap items-center gap-2 text-sm"><input type="checkbox" checked={form.pickupEnabled} onChange={e => set('pickupEnabled', e.target.checked)} /> Avhämtning aktiv</label>
          <label className="flex flex-wrap items-center gap-2 text-sm"><input type="checkbox" checked={form.acceptPreOrders} onChange={e => set('acceptPreOrders', e.target.checked)} /> Förtidsbeställning</label>
        </div>
      </Section>

      <Section title="Kundinformation">
        <Field label="Integritetspolicy" value={form.privacyPolicy} onChange={v=>set('privacyPolicy',v)}/>
        <Field label="Cookies" value={form.cookieInfo} onChange={v=>set('cookieInfo',v)}/>
        <Field label="Allergener" value={form.allergenInfo} onChange={v=>set('allergenInfo',v)}/>
      </Section>
      <button onClick={save} className="w-full bg-[#1f5d3a] text-white font-semibold py-3.5 rounded-full flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Spara inställningar</button>
    </div>
  );
}

function Section({ title, children }) {
  return <div className="bg-white rounded-2xl p-4 space-y-3"><h2 className="font-semibold text-stone-900">{title}</h2>{children}</div>;
}
function Field({ label, value, onChange, type = 'text' }) {
  return <div><label htmlFor={label} className="block text-xs font-medium text-stone-500 mb-1">{label}</label><input id={label} type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-stone-200 p-3 text-sm focus:outline-none focus:border-[#1f5d3a]" /></div>;
}
