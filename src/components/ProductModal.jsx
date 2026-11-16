import React, { useState, useMemo } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import { Image } from '@/components/ui/image';

export default function ProductModal({ item, onClose = undefined }) {
  const { t } = useI18n();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState({}); // groupId -> array of option names
  const [size, setSize] = useState(null);
  const [notes, setNotes] = useState('');

  const groups = item?.optionGroups || [];

  const unitPrice = useMemo(() => {
    let p = item?.price ?? 0;
    if (size) p += size.price;
    Object.entries(selected).forEach(([gid, opts]) => {
      const g = groups.find(g => g.id === gid);
      if (!g) return;
      (Array.isArray(opts) ? opts : [opts]).forEach(name => {
        const opt = g.options.find(o => o.name === name);
        if (opt) p += opt.price;
      });
    });
    return p;
  }, [size, selected, item, groups]);

  const toggleOption = (group, optName) => {
    setSelected(prev => {
      const cur = prev[group.id] || [];
      if (group.multiple) {
        return { ...prev, [group.id]: cur.includes(optName) ? cur.filter(n => n !== optName) : [...cur, optName] };
      } else {
        return { ...prev, [group.id]: cur[0] === optName ? [] : [optName] };
      }
    });
  };

  const valid=groups.every(g=>!g.required || (g.type==='size'?!!size:(selected[g.id] || []).length>0));
  const handleAdd = () => {
    if(!valid)return;
    const extras = [];
    Object.entries(selected).forEach(([gid, opts]) => {
      const g = groups.find(g => g.id === gid);
      if (!g || g.type === 'remove') return;
      (Array.isArray(opts) ? opts : [opts]).forEach(name => extras.push(name));
    });
    const removed = [];
    Object.entries(selected).forEach(([gid, opts]) => {
      const g = groups.find(g => g.id === gid);
      if (!g || g.type !== 'remove') return;
      (Array.isArray(opts) ? opts : [opts]).forEach(name => removed.push(name));
    });
    const allNotes = [removed.join(', '), notes].filter(Boolean).join(' · ');
    addItem({
      itemId: item.id,
      name: item.name,
      image: item.image,
      basePrice: item.price,
      price: unitPrice,
      qty,
      size: size ? size.name : null,
      extras,
      notes: allNotes,
    });
    onClose();
  };

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
        <div className="relative">
          {item.image ? (
            <div className="w-full h-48 sm:h-56 overflow-hidden sm:rounded-t-3xl">
              <Image src={item.image} alt={item.name} className="w-full h-full object-cover" fittingType="fill" />
            </div>
          ) : (
            <div className="w-full h-32 bg-gradient-to-br from-green-50 to-stone-100 sm:rounded-t-3xl flex items-center justify-center"><span className="text-5xl">🍕</span></div>
          )}
          <button onClick={onClose} className="absolute top-3 end-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5">
          <h2 className="text-xl font-bold text-stone-900">{item.name}</h2>
          {item.description && <p className="text-sm text-stone-500 mt-1">{item.description}</p>}
          <div className="text-lg font-bold text-[#1f5d3a] mt-1">{formatPrice(item.price)}</div>

          <div className="mt-5 space-y-5">
            {groups.filter(g => g.type === 'size').map(g => (
              <div key={g.id}>
                <div className="font-semibold text-sm text-stone-800 mb-2">{g.name} <span className="text-red-500">*</span></div>
                <div className="grid grid-cols-2 gap-2">
                  {g.options.map(opt => {
                    const active = size && size.name === opt.name;
                    return (
                      <button key={opt.name} onClick={() => setSize(opt)} className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${active ? 'border-[#1f5d3a] bg-green-50' : 'border-stone-200'}`}>
                        <span className="font-medium text-sm">{opt.name}</span>
                        <span className="text-sm text-stone-500">{opt.price > 0 ? `+${formatPrice(opt.price)}` : ''}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {groups.filter(g => g.type === 'extras').map(g => (
              <div key={g.id}>
                <div className="font-semibold text-sm text-stone-800 mb-2">{g.name}</div>
                <div className="space-y-1">
                  {g.options.map(opt => {
                    const cur = selected[g.id] || [];
                    const active = cur.includes(opt.name);
                    return (
                      <button key={opt.name} onClick={() => toggleOption(g, opt.name)} className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50">
                        <span className="flex items-center gap-2.5">
                          <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${active ? 'bg-[#1f5d3a] border-[#1f5d3a]' : 'border-stone-300'}`}>
                            {active && <span className="w-2 h-2 bg-white rounded-sm" />}
                          </span>
                          <span className="text-sm">{opt.name}</span>
                        </span>
                        <span className="text-sm text-stone-500">{opt.price > 0 ? `+${formatPrice(opt.price)}` : ''}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {groups.filter(g => g.type === 'remove').map(g => (
              <div key={g.id}>
                <div className="font-semibold text-sm text-stone-800 mb-2">{g.name}</div>
                <div className="space-y-1">
                  {g.options.map(opt => {
                    const cur = selected[g.id] || [];
                    const active = cur.includes(opt.name);
                    return (
                      <button key={opt.name} onClick={() => toggleOption(g, opt.name)} className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-stone-50">
                        <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${active ? 'bg-[#1f5d3a] border-[#1f5d3a]' : 'border-stone-300'}`}>
                          {active && <span className="w-2 h-2 bg-white rounded-sm" />}
                        </span>
                        <span className="text-sm">{opt.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {groups.filter(g => g.type === 'sauces').map(g => (
              <div key={g.id}>
                <div className="font-semibold text-sm text-stone-800 mb-2">{g.name}</div>
                <div className="grid grid-cols-2 gap-2">
                  {g.options.map(opt => {
                    const cur = selected[g.id] || [];
                    const active = cur[0] === opt.name;
                    return (
                      <button key={opt.name} onClick={() => toggleOption(g, opt.name)} className={`p-3 rounded-xl border-2 text-sm transition-all text-start ${active ? 'border-[#1f5d3a] bg-green-50' : 'border-stone-200'}`}>
                        {opt.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div>
              <div className="font-semibold text-sm text-stone-800 mb-2">{t('kommentar_kok')}</div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('kommentar_placeholder')} rows={2} className="w-full rounded-xl border border-stone-200 p-3 text-sm resize-none focus:outline-none focus:border-[#1f5d3a]" />
            </div>
          </div>
        </div>

        {/* Sticky add bar */}
        <div className="sticky bottom-0 bg-white border-t border-stone-100 p-4 flex items-center gap-3">
          <div className="flex items-center gap-1 bg-stone-100 rounded-full p-1">
            <button aria-label="Minska antal" onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center"><Minus className="w-4 h-4" /></button>
            <span className="w-8 text-center font-semibold">{qty}</span>
            <button disabled={qty>=50} aria-label="Öka antal" onClick={() => setQty(qty + 1)} className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center"><Plus className="w-4 h-4" /></button>
          </div>
          <button disabled={!valid} onClick={handleAdd} className="flex-1 bg-[#c8332a] hover:bg-[#b02b22] disabled:opacity-40 text-white font-semibold py-3 rounded-full transition-colors active:scale-[0.98]">
            {t('lagg_varukorg')} – {formatPrice(unitPrice * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}
