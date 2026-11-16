import React from 'react';
import { Plus, Flame } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/format';
import { Image } from '@/components/ui/image';

export default function MenuItemCard({ item, onAdd, onSoldOut = undefined }) {
  const { t } = useI18n();
  const soldOut = item.soldOut;

  return (
    <div className="group flex gap-3 p-3 rounded-2xl bg-white border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all">
      <button onClick={() => !soldOut && onAdd(item)} className="flex-1 flex gap-3 text-start min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-stone-900 text-[15px] leading-tight truncate">{item.name}</h3>
            {item.popular && <Flame className="w-3.5 h-3.5 text-[#c8332a] shrink-0" />}
          </div>
          {item.description && <p className="text-xs text-stone-500 mt-1 line-clamp-2">{item.description}</p>}
          <div className="mt-2 font-bold text-stone-900">{formatPrice(item.price)}</div>
        </div>
        {item.image ? (
          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-stone-100 relative">
            <Image src={item.image} alt={item.name} className="w-full h-full object-cover" fittingType="fill" />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-xl shrink-0 bg-gradient-to-br from-green-50 to-stone-100 flex items-center justify-center">
            <span className="text-2xl">🍕</span>
          </div>
        )}
      </button>
      {!soldOut ? (
        <button onClick={() => onAdd(item)} className="self-center w-9 h-9 rounded-full bg-[#1f5d3a] hover:bg-[#174a2c] text-white flex items-center justify-center shrink-0 transition-colors active:scale-95">
          <Plus className="w-5 h-5" />
        </button>
      ) : (
        <div className="self-center text-xs font-semibold text-stone-400 bg-stone-100 px-3 py-2 rounded-full shrink-0">{t('slutsald')}</div>
      )}
    </div>
  );
}
