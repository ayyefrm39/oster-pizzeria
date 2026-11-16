import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useCart } from '@/lib/cart';
import { useSettings } from '@/lib/settings';
import { formatPrice } from '@/lib/format';

export default function Cart() {
  const { t } = useI18n();
  const { items, updateQty, removeItem, clear, subtotal, orderType, setOrderType } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const isDelivery = orderType === 'delivery';
  const meetsMin = !isDelivery || subtotal >= (settings.minDeliveryOrder || 0);
  const deliveryFee = !isDelivery ? 0 : (subtotal >= (settings.freeDeliveryThreshold || 0) && settings.freeDeliveryThreshold > 0 ? 0 : (settings.deliveryFee || 0));
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-5"><ShoppingBag className="w-9 h-9 text-stone-400" /></div>
        <h1 className="text-xl font-bold text-stone-900">{t('din_varukorg_ar_tom')}</h1>
        <p className="text-stone-500 mt-2 text-sm">{t('din_varukorg_ar_tom_desc')}</p>
        <Link to="/meny" className="inline-block mt-6 bg-[#1f5d3a] text-white font-semibold px-6 py-3 rounded-full">{t('visa_menyn')}</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 pb-28">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-stone-900">{t('varukorg')}</h1>
        <button onClick={clear} className="text-sm text-stone-400 hover:text-red-500 flex items-center gap-1"><Trash2 className="w-4 h-4" /> {t('tom')}</button>
      </div>

      {/* Order type toggle */}
      <div className="flex gap-2 mb-4 bg-white p-1 rounded-full border border-stone-200">
        <button disabled={!settings.pickupEnabled} onClick={() => setOrderType('pickup')} className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${orderType === 'pickup' ? 'bg-[#1f5d3a] text-white' : 'text-stone-600'}`}>{t('avhamtning')}</button>
        <button disabled={!settings.deliveryEnabled} onClick={() => setOrderType('delivery')} className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${orderType === 'delivery' ? 'bg-[#1f5d3a] text-white' : 'text-stone-600'}`}>{t('hemleverans')}</button>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.lineId} className="bg-white rounded-2xl p-3 flex gap-3">
            <div className="w-16 h-16 rounded-xl bg-stone-100 overflow-hidden shrink-0">
              {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🍕</div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-stone-900 text-sm">{item.name}{item.size ? ` · ${item.size}` : ''}</div>
              {item.extras?.length > 0 && <div className="text-xs text-stone-500 mt-0.5">{item.extras.join(', ')}</div>}
              {item.notes && <div className="text-xs text-stone-400 mt-0.5 italic truncate">{item.notes}</div>}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 bg-stone-100 rounded-full p-1">
                  <button aria-label={`Minska antal ${item.name}`} onClick={() => updateQty(item.lineId, item.qty - 1)} className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center"><Minus className="w-3.5 h-3.5" /></button>
                  <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                  <button aria-label={`Öka antal ${item.name}`} disabled={item.qty>=50} onClick={() => updateQty(item.lineId, item.qty + 1)} className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center"><Plus className="w-3.5 h-3.5" /></button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm">{formatPrice(item.price * item.qty)}</span>
                  <button aria-label={`Ta bort ${item.name}`} onClick={() => removeItem(item.lineId)} className="text-stone-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl p-4 mt-4 space-y-2">
        <div className="flex justify-between text-sm text-stone-600"><span>{t('delsumma')}</span><span>{formatPrice(subtotal)}</span></div>
        {isDelivery && <div className="flex justify-between text-sm text-stone-600"><span>{t('leveransavgift')}</span><span>{deliveryFee === 0 ? t('gratis') : formatPrice(deliveryFee)}</span></div>}
        <div className="flex justify-between font-bold text-lg pt-2 border-t border-stone-100"><span>{t('total')}</span><span>{formatPrice(total)}</span></div>
        {isDelivery && !meetsMin && <div className="text-xs text-amber-600">{t('min_order')}: {formatPrice(settings.minDeliveryOrder)}</div>}
      </div>

      <button onClick={() => navigate('/kassa')} className="w-full mt-4 bg-[#c8332a] hover:bg-[#b02b22] text-white font-semibold py-4 rounded-full text-base transition-colors active:scale-[0.98]">
        {t('ga_till_kassan')}
      </button>
      <Link to="/meny" className="flex items-center justify-center gap-1 mt-3 text-sm text-stone-500"><ArrowLeft className="w-4 h-4" /> {t('visa_menyn')}</Link>
    </div>
  );
}
