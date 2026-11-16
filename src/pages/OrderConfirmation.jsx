import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, MapPin, Phone, Receipt, CreditCard, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { formatPrice } from '@/lib/format';
import OrderStatusTracker from '@/components/OrderStatusTracker';

const PAY_STYLE = {
  paid: 'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-800',
  unpaid: 'bg-stone-100 text-stone-600',
  refunded: 'bg-stone-100 text-stone-500',
  failed: 'bg-red-50 text-red-700',
};

export default function OrderConfirmation() {
  const { id } = useParams();
  const { t } = useI18n();
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';
  const cancelledPayment = params.get('avbruten') === '1';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) { setNotFound(true); setLoading(false); return; }
    try {
      const res = await base44.functions.invoke('getOrderStatus', { orderId: id, token });
      const data = res?.data?.order;
      if (!data) setNotFound(true);
      else setOrder(data);
    } catch (e) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    (async () => {
      if (params.get('betald') === '1') {
        try { await base44.functions.invoke('confirmStripePayment', { orderId: id, token }); } catch (e) { /* webhook may already have settled it */ }
      }
      await load();
    })();
  }, [id, token, load]);

  // Reconcile a Stripe payment that the webhook may not have delivered yet.
  useEffect(() => {
    if (order && order.paymentMethod === 'stripe' && order.paymentStatus === 'pending') {
      base44.functions.invoke('confirmStripePayment', { orderId: id, token }).then(load).catch(() => {});
    }
  }, [order?.paymentStatus, order?.paymentMethod, id, token, load]);

  useEffect(() => {
    if (!token || notFound) return undefined;
    const timer = setInterval(load, 12000);
    return () => clearInterval(timer);
  }, [load, token, notFound]);

  const payNow = async () => {
    setPaying(true);
    setError('');
    try {
      const res = await base44.functions.invoke('createPaymentSession', { orderId: id, token });
      const data = res?.data || {};
      if (data.checkoutUrl) { window.location.href = data.checkoutUrl; return; }
      setError(data.error || '');
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || '');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="max-w-md mx-auto px-4 py-20 text-center text-stone-400">{t('bearbetar')}</div>;
  if (notFound || !order) {
    return <div className="max-w-md mx-auto px-4 py-20 text-center">
      <p className="text-stone-500">Beställningen hittades inte.</p>
      <Link to="/" className="text-[#1f5d3a]">{t('tillbaka_hem')}</Link>
    </div>;
  }

  const isDelivery = order.orderType === 'delivery';
  const paymentLabel = order.paymentMethod === 'stripe'
    ? t('betala_online')
    : (isDelivery ? t('betala_leverans') : t('betala_plats_kort'));
  const payStatusLabel = order.paymentStatus === 'paid' ? t('betald')
    : order.paymentStatus === 'refunded' ? t('aterbetald')
    : order.paymentStatus === 'pending' ? t('betalning_vantar')
    : t('obetald');
  const canPay = order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded'
    && order.status !== 'rejected' && order.status !== 'cancelled';

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-9 h-9 text-[#1f5d3a]" />
        </div>
        <h1 className="text-xl font-bold text-stone-900">{t('tack_bestallning')}</h1>
        <div className="text-sm text-stone-500 mt-1">{t('order_nummer')} #{order.orderNumber}</div>
      </div>

      {cancelledPayment && order.paymentStatus !== 'paid' && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800 text-center">{t('betalning_avbruten')}</div>
      )}

      {/* Payment */}
      <div className="bg-white rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-stone-700"><CreditCard className="w-4 h-4 text-stone-400" /> {paymentLabel}</div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PAY_STYLE[order.paymentStatus] || PAY_STYLE.unpaid}`}>{payStatusLabel}</span>
        </div>
        {canPay && order.paymentMethod === 'stripe' && (
          <button onClick={payNow} disabled={paying} className="w-full mt-3 bg-[#c8332a] hover:bg-[#b02b22] disabled:bg-stone-300 text-white font-semibold py-3 rounded-full flex items-center justify-center gap-2">
            {paying ? t('bearbetar') : <>{t('betala_nu')} <RefreshCw className="w-4 h-4" /></>}
          </button>
        )}
        {error && <div className="mt-2 text-xs text-red-600 text-center">{error}</div>}
      </div>

      {/* Status */}
      <div className="bg-white rounded-2xl p-5 mb-4">
        <OrderStatusTracker order={order} />
        <div className="mt-4 text-center">
          {order.status === 'pending' && <p className="text-sm text-stone-500">{t('vantar_bekraftelse')}</p>}
          {(order.status === 'accepted' || order.status === 'preparing') && (
            <p className="text-sm text-stone-700">{t('bekräftad')} · {t('beraknad_tid')}: <span className="font-semibold">{order.estimatedReadyTime} {t('minuter')}</span></p>
          )}
          {order.scheduledFor && <p className="text-sm text-stone-600 mt-1 flex items-center justify-center gap-1.5"><Clock className="w-4 h-4" /> {order.scheduledFor}</p>}
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm"><Receipt className="w-4 h-4 text-stone-400" /><span className="font-semibold text-stone-900">{isDelivery ? t('hemleverans') : t('avhamtning')}</span></div>
        <div className="space-y-1.5">
          {order.items.map((it, i) => (
            <div key={i} className="flex justify-between gap-3 text-sm">
              <span className="text-stone-600">{it.qty}× {it.name}{it.extras?.length ? ` · ${it.extras.join(', ')}` : ''}</span>
              <span className="text-stone-800 whitespace-nowrap">{formatPrice(it.price * it.qty)}</span>
            </div>
          ))}
        </div>
        <div className="pt-3 border-t border-stone-100 space-y-1.5">
          <div className="flex justify-between text-sm text-stone-500"><span>{t('delsumma')}</span><span>{formatPrice(order.subtotal)}</span></div>
          {isDelivery && <div className="flex justify-between text-sm text-stone-500"><span>{t('leveransavgift')}</span><span>{order.deliveryFee === 0 ? t('gratis') : formatPrice(order.deliveryFee)}</span></div>}
          <div className="flex justify-between font-bold"><span>{t('total')}</span><span>{formatPrice(order.total)}</span></div>
        </div>
        <div className="pt-3 border-t border-stone-100 text-sm space-y-1.5">
          <div className="flex items-center gap-1.5 text-stone-600"><Phone className="w-3.5 h-3.5" /> {order.customerPhone}</div>
          {isDelivery && order.deliveryAddress?.street && <div className="flex items-start gap-1.5 text-stone-600"><MapPin className="w-3.5 h-3.5 mt-0.5" /> {order.deliveryAddress.street}, {order.deliveryAddress.postal} {order.deliveryAddress.city}</div>}
          {order.customerNotes && <div className="text-xs text-stone-500 italic">"{order.customerNotes}"</div>}
        </div>
      </div>

      <Link to="/" className="block text-center mt-5 text-sm font-medium text-[#1f5d3a]">{t('tillbaka_hem')}</Link>
    </div>
  );
}
