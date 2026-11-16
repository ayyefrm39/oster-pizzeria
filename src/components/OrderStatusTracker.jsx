import React from 'react';
import { Check, Clock, Package, Bike, ChefHat, XCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const STEPS = ['pending', 'accepted', 'preparing', 'ready', 'completed'];

export default function OrderStatusTracker({ order }) {
  const { t } = useI18n();
  const isDelivery = order.orderType === 'delivery';
  const steps = isDelivery
    ? ['pending', 'accepted', 'preparing', 'out_for_delivery', 'completed']
    : STEPS;

  const rejected = order.status === 'rejected' || order.status === 'cancelled';
  if (rejected) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100">
        <XCircle className="w-6 h-6 text-red-500 shrink-0" />
        <div>
          <div className="font-semibold text-red-700">{order.status === 'rejected' ? t('nekades') : t('avbruten')}</div>
        </div>
      </div>
    );
  }

  const currentIdx = steps.indexOf(order.status);
  const icons = { pending: Clock, accepted: Check, preparing: ChefHat, ready: Package, out_for_delivery: Bike, completed: Check };

  return (
    <div className="py-2">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => {
          const Icon = icons[step] || Check;
          const done = i < currentIdx;
          const active = i === currentIdx;
          const label = isDelivery && step === 'ready' ? t('pa_vag') : t(`st_${step}`);
          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${done ? 'bg-[#1f5d3a] text-white' : active ? 'bg-[#c8332a] text-white animate-pulse' : 'bg-stone-100 text-stone-400'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] text-center leading-tight w-16 ${active || done ? 'font-semibold text-stone-800' : 'text-stone-400'}`}>{label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 rounded-full transition-colors ${i < currentIdx ? 'bg-[#1f5d3a]' : 'bg-stone-200'}`} style={{ marginTop: '-20px' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
