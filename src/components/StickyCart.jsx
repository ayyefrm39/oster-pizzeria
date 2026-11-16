import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/format';

export default function StickyCart() {
  const { t } = useI18n();
  const { count, subtotal } = useCart();
  if (count === 0) return null;
  return (
    <div className="fixed bottom-0 inset-x-0 z-30 px-3 pb-3 pointer-events-none">
      <Link to="/varukorg" className="pointer-events-auto max-w-md mx-auto flex items-center justify-between gap-3 bg-[#1f5d3a] text-white px-4 py-3 rounded-2xl shadow-lg active:scale-[0.99] transition-transform">
        <span className="flex items-center gap-2.5">
          <span className="relative">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-2 -end-2 bg-white text-[#1f5d3a] text-[10px] font-bold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center">{count}</span>
          </span>
          <span className="font-semibold text-sm">{t('visa_varukorg')} · {count} {count === 1 ? t('vara') : t('varor')}</span>
        </span>
        <span className="font-bold">{formatPrice(subtotal)}</span>
      </Link>
    </div>
  );
}
