import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, X, Phone, MapPin, Bike, Package, ChefHat, Undo2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useSettings } from '@/lib/settings';
import { formatPrice, formatTime } from '@/lib/format';
import { useToast } from '@/components/ui/use-toast';

const TABS = [
  { id: 'nya', label: 'Nya', statuses: ['pending'] },
  { id: 'pagaende', label: 'Pågående', statuses: ['accepted', 'preparing', 'ready', 'out_for_delivery'] },
  { id: 'klara', label: 'Klara', statuses: ['ready', 'out_for_delivery'] },
  { id: 'slutforda', label: 'Slutförda', statuses: ['completed', 'rejected', 'cancelled'] },
];

const PREP_TIMES = [15, 20, 25, 30, 40, 45, 60];

function playBeep() {
  try {
    const ctx = new (window.AudioContext)();
    let t = ctx.currentTime;
    [880, 1320, 880].forEach(f => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = f; o.type = 'sine';
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.start(t); o.stop(t + 0.26);
      t += 0.28;
    });
  } catch (e) {}
}

export default function AdminDashboard() {
  const { settings, setSettings } = useSettings();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('nya');
  const [accepting, setAccepting] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [refunding, setRefunding] = useState(null);
  const [seenIds, setSeenIds] = useState(() => new Set(JSON.parse(localStorage.getItem('oster_seen_orders') || '[]')));
  const [newCount, setNewCount] = useState(0);
  const lastCountRef = useRef(0);

  const load = useCallback(async () => {
    const list = await base44.entities.Order.list('-created_date', 200);
    setOrders(list);
  }, []);

  useEffect(() => {
    load();
    const unsub = base44.entities.Order.subscribe(() => { load(); });
    const interval = setInterval(load, 15000);
    return () => { try { unsub(); } catch {} clearInterval(interval); };
  }, [load]);

  // New order detection + sound
  const pendingOrders = orders.filter(o => o.status === 'pending');
  useEffect(() => {
    const pending = orders.filter(o => o.status === 'pending');
    if (pending.length > lastCountRef.current && lastCountRef.current !== 0) {
      playBeep();
    }
    lastCountRef.current = pending.length;
    const unseen = pending.filter(o => !seenIds.has(o.id));
    setNewCount(unseen.length);
  }, [orders, seenIds]);

  const markSeen = (id) => {
    setSeenIds(prev => {
      const next = new Set(prev); next.add(id);
      localStorage.setItem('oster_seen_orders', JSON.stringify([...next]));
      return next;
    });
  };

  const updateOrder = async (id, data) => {
    await base44.entities.Order.update(id, data);
    await load();
  };

  const acceptOrder = async (minutes) => {
    await updateOrder(accepting, { status: 'accepted', estimatedReadyTime: minutes });
    markSeen(accepting);
    setAccepting(null);
  };

  const rejectOrder = async () => {
    await updateOrder(rejecting, { status: 'rejected' });
    markSeen(rejecting);
    setRejecting(null);
  };

  const markPaid = async (id) => {
    await updateOrder(id, { paymentStatus: 'paid', paidAt: new Date().toISOString() });
    toast({ title: 'Markerad som betald' });
  };

  const refundOrder = async () => {
    const id = refunding;
    setRefunding(null);
    try {
      await base44.functions.invoke('refundOrder', { orderId: id });
      toast({ title: 'Betalningen återbetald' });
    } catch (e) {
      toast({ title: 'Kunde inte återbetala', description: e?.response?.data?.error || e?.message, variant: 'destructive' });
    }
    await load();
  };

  const togglePause = async () => {
    const newVal = !settings.ordersPaused;
    setSettings(s => ({ ...s, ordersPaused: newVal }));
    await base44.entities.RestaurantSettings.update(settings.id, { ordersPaused: newVal });
  };

  const filtered = orders.filter(o => TABS.find(tb => tb.id === tab).statuses.includes(o.status));
  const tabCounts = TABS.reduce((acc, tb) => {
    acc[tb.id] = orders.filter(o => tb.statuses.includes(o.status)).length;
    return acc;
  }, {});

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Beställningar</h1>
          <p className="text-sm text-stone-500">{settings.restaurantName} · {formatTime(new Date(), 'sv')}</p>
        </div>
        <button onClick={togglePause} className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-colors ${settings.ordersPaused ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
          <span className={`w-2 h-2 rounded-full bg-white ${!settings.ordersPaused ? 'animate-pulse' : ''}`} />
          {settings.ordersPaused ? 'Onlinebeställningar pausade' : 'Tar emot beställningar'}
        </button>
      </div>

      {/* New order alert */}
      {newCount > 0 && (
        <div className="mb-4 p-4 rounded-2xl bg-red-50 border-2 border-red-200 flex items-center gap-3 animate-pulse">
          <Bell className="w-6 h-6 text-red-500" />
          <div className="flex-1"><div className="font-bold text-red-700">🔔 NY BESTÄLLNING</div><div className="text-sm text-red-600">{newCount} obehandlad(e) beställning(ar)</div></div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium ${tab === tb.id ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 border border-stone-200'}`}>
            {tb.label} {tabCounts[tb.id] > 0 && <span className="opacity-70">({tabCounts[tb.id]})</span>}
          </button>
        ))}
      </div>

      {/* Orders */}
      <div className="space-y-3">
        {filtered.length === 0 && <div className="text-center py-16 text-stone-400">Inga beställningar</div>}
        {filtered.map(order => (
          <OrderCard key={order.id} order={order} unseen={!seenIds.has(order.id) && order.status === 'pending'}
            onAccept={() => { setAccepting(order.id); markSeen(order.id); }}
            onReject={() => setRejecting(order.id)}
            onMarkPaid={() => markPaid(order.id)}
            onRefund={() => setRefunding(order.id)}
            onUpdate={updateOrder} />
        ))}
      </div>

      {/* Accept modal */}
      {accepting && (
        <Modal title="När är ordern klar?" onClose={() => setAccepting(null)}>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {PREP_TIMES.map(m => (
              <button key={m} onClick={() => acceptOrder(m)} className="p-4 rounded-xl bg-[#1f5d3a] text-white font-bold hover:bg-[#174a2c]">{m} min</button>
            ))}
          </div>
          <p className="text-xs text-stone-500 text-center">Välj beräknad tillagningstid</p>
        </Modal>
      )}

      {/* Reject modal */}
      {rejecting && (
        <Modal title="Neka beställning?" onClose={() => setRejecting(null)}>
          <p className="text-sm text-stone-600 mb-4 text-center">Är du säker på att du vill neka order #{orders.find(o => o.id === rejecting)?.orderNumber}?</p>
          <div className="flex gap-2">
            <button onClick={() => setRejecting(null)} className="flex-1 py-3 rounded-xl bg-stone-100 font-semibold">Avbryt</button>
            <button onClick={rejectOrder} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold">Neka</button>
          </div>
        </Modal>
      )}

      {/* Refund modal */}
      {refunding && (
        <Modal title="Återbetala beställning?" onClose={() => setRefunding(null)}>
          <p className="text-sm text-stone-600 mb-4 text-center">Betalningen för order #{orders.find(o => o.id === refunding)?.orderNumber} återbetalas i sin helhet via Stripe.</p>
          <div className="flex gap-2">
            <button onClick={() => setRefunding(null)} className="flex-1 py-3 rounded-xl bg-stone-100 font-semibold">Avbryt</button>
            <button onClick={refundOrder} className="flex-1 py-3 rounded-xl bg-stone-900 text-white font-semibold">Återbetala</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const PAY_STYLE = {
  paid: 'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-800',
  unpaid: 'bg-stone-100 text-stone-600',
  refunded: 'bg-stone-100 text-stone-500',
  failed: 'bg-red-50 text-red-700',
};

const PAY_LABEL = { paid: 'Betald', pending: 'Väntar på betalning', unpaid: 'Obetald', refunded: 'Återbetald', failed: 'Misslyckad' };

function OrderCard({ order, unseen, onAccept, onReject, onMarkPaid, onRefund, onUpdate }) {
  const isDelivery = order.orderType === 'delivery';
  const paymentLabel = order.paymentMethod === 'stripe' ? 'Kort/Klarna/Swish (Stripe)' : (isDelivery ? 'Betala vid leverans' : 'Betala vid avhämtning');
  const created = new Date(order.created_date);

  return (
    <div className={`bg-white rounded-2xl overflow-hidden ${unseen ? 'ring-2 ring-red-400' : 'border border-stone-200'}`}>
      {unseen && <div className="bg-red-500 text-white text-xs font-bold px-4 py-1.5 flex items-center gap-2"><Bell className="w-3.5 h-3.5" /> NY BESTÄLLNING</div>}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-stone-900">#{order.orderNumber}</span>
            {order.isDemo && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">DEMO</span>}
          </div>
          <span className="text-sm text-stone-400">{formatTime(created, 'sv')}</span>
        </div>

        <div className="flex items-center flex-wrap gap-2 mb-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isDelivery ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
            {isDelivery ? '🛵 Hemleverans' : '🥡 Avhämtning'}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PAY_STYLE[order.paymentStatus] || PAY_STYLE.unpaid}`}>
            {PAY_LABEL[order.paymentStatus] || 'Obetald'}
          </span>
          <span className="text-xs text-stone-500">{paymentLabel}</span>
        </div>

        <div className="space-y-1 mb-3">
          {order.items.map((it, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium text-stone-800">{it.qty}× {it.name}</span>
              {it.extras?.length > 0 && <span className="text-stone-500"> + {it.extras.join(', ')}</span>}
              {it.notes && <div className="text-xs text-stone-400 italic ms-4">"{it.notes}"</div>}
            </div>
          ))}
        </div>

        {order.customerNotes && <div className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2 mb-3">Kommentar: {order.customerNotes}</div>}

        <div className="flex items-center justify-between pt-3 border-t border-stone-100">
          <div className="text-sm">
            <div className="font-bold text-stone-900">{formatPrice(order.total)}</div>
            <div className="text-xs text-stone-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {order.customer?.phone}</div>
            {isDelivery && order.deliveryAddress && <div className="text-xs text-stone-500 flex items-start gap-1"><MapPin className="w-3 h-3 mt-0.5" /> {order.deliveryAddress.street}, {order.deliveryAddress.postal} {order.deliveryAddress.city}</div>}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3">
          {order.status === 'pending' && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={onReject} className="py-3 rounded-xl bg-stone-100 text-stone-700 font-semibold flex items-center justify-center gap-1.5"><X className="w-5 h-5" /> Neka</button>
              <button onClick={onAccept} className="py-3 rounded-xl bg-[#1f5d3a] text-white font-semibold flex items-center justify-center gap-1.5"><Check className="w-5 h-5" /> Acceptera</button>
            </div>
          )}
          {order.status === 'accepted' && (
            <button onClick={() => onUpdate(order.id, { status: 'preparing' })} className="w-full py-3 rounded-xl bg-amber-500 text-white font-semibold flex items-center justify-center gap-1.5"><ChefHat className="w-5 h-5" /> Börja tillaga</button>
          )}
          {order.status === 'preparing' && (
            <button onClick={() => onUpdate(order.id, { status: isDelivery ? 'out_for_delivery' : 'ready' })} className="w-full py-3 rounded-xl bg-blue-500 text-white font-semibold flex items-center justify-center gap-1.5"><Package className="w-5 h-5" /> Markera som klar</button>
          )}
          {order.status === 'ready' && (
            <button onClick={() => onUpdate(order.id, { status: 'completed' })} className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold flex items-center justify-center gap-1.5"><Check className="w-5 h-5" /> Slutför order</button>
          )}
          {order.status === 'out_for_delivery' && (
            <button onClick={() => onUpdate(order.id, { status: 'completed' })} className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold flex items-center justify-center gap-1.5"><Bike className="w-5 h-5" /> Slutför order</button>
          )}
          {(order.status === 'completed' || order.status === 'rejected' || order.status === 'cancelled') && (
            <div className="text-center text-sm text-stone-400 py-2">{order.status === 'completed' ? 'Slutförd' : order.status === 'rejected' ? 'Nekad' : 'Avbruten'}</div>
          )}

          {order.paymentMethod === 'cash' && order.paymentStatus !== 'paid' && order.status !== 'rejected' && order.status !== 'cancelled' && (
            <button onClick={onMarkPaid} className="w-full mt-2 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-semibold text-sm flex items-center justify-center gap-1.5"><Check className="w-4 h-4" /> Markera som betald</button>
          )}
          {order.paymentMethod === 'stripe' && order.paymentStatus === 'paid' && (
            <button onClick={onRefund} className="w-full mt-2 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-semibold text-sm flex items-center justify-center gap-1.5"><Undo2 className="w-4 h-4" /> Återbetala</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-5 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-lg text-stone-900 mb-4 text-center">{title}</h3>
        {children}
      </div>
    </div>
  );
}
