import React from 'react';
import { X, Home, Store } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useCart } from '@/lib/cart';

export default function OrderTypeSelector({ open, onClose, onSelect }) {
  const { t } = useI18n();
  const { setOrderType } = useCart();
  if (!open) return null;

  const choose = (type) => {
    setOrderType(type);
    onSelect?.(type);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-stone-900">{t('hur_vill')}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <button onClick={() => choose('delivery')} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-stone-200 hover:border-[#1f5d3a] hover:bg-green-50/50 transition-all text-start">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <Home className="w-6 h-6 text-[#1f5d3a]" />
            </div>
            <div>
              <div className="font-semibold text-stone-900">{t('hemleverans')}</div>
              <div className="text-sm text-stone-500">{t('hemleverans_desc')}</div>
            </div>
          </button>
          <button onClick={() => choose('pickup')} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-stone-200 hover:border-[#1f5d3a] hover:bg-green-50/50 transition-all text-start">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6 text-[#1f5d3a]" />
            </div>
            <div>
              <div className="font-semibold text-stone-900">{t('avhamtning')}</div>
              <div className="text-sm text-stone-500">{t('avhamtning_desc')}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
