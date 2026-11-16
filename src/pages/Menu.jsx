import React, { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import MenuItemCard from '@/components/MenuItemCard';
import ProductModal from '@/components/ProductModal';
import { useSettings } from '@/lib/settings';
import { getStatusNow } from '@/lib/openingHours';

export default function Menu() {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCat, setActiveCat] = useState('all');
  const [query, setQuery] = useState('');
  const [modalItem, setModalItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const status = getStatusNow(settings.openingHours);

  useEffect(() => {
    Promise.all([
      base44.entities.MenuCategory.filter({ active: true }, 'sortOrder', 100),
      base44.entities.MenuItem.filter({ active: true }, 'created_date', 500)
    ]).then(([cats, its]) => {
      setCategories(cats);
      setItems(its);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = items;
    if (activeCat === 'popular') list = items.filter(i => i.popular);
    else if (activeCat !== 'all') list = items.filter(i => i.categoryId === activeCat);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q));
    }
    return list;
  }, [items, activeCat, query]);

  const grouped = useMemo(() => {
    if (activeCat !== 'all' || query.trim()) return null;
    const map = {};
    items.forEach(i => { (map[i.categoryId] = map[i.categoryId] || []).push(i); });
    return categories.map(c => ({ cat: c, list: map[c.id] || [] })).filter(g => g.list.length);
  }, [items, categories, activeCat, query]);

  const cats = [{ id: 'popular', name: t('populart') }, { id: 'all', name: t('meny') }, ...categories.map(c => ({ id: c.id, name: c.name }))];

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 pb-28">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute top-1/2 -translate-y-1/2 start-3.5 w-5 h-5 text-stone-400" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('sok_menyn')} className="w-full bg-white border border-stone-200 rounded-full ps-11 pe-10 py-3 text-sm focus:outline-none focus:border-[#1f5d3a]" />
        {query && <button onClick={() => setQuery('')} className="absolute top-1/2 -translate-y-1/2 end-3 text-stone-400"><X className="w-5 h-5" /></button>}
      </div>

      {/* Closed / paused banner */}
      {!status.open && (
        <div className="mb-4 p-3 rounded-xl bg-stone-100 text-stone-600 text-sm text-center">{t('stangd_msg')}</div>
      )}
      {settings.ordersPaused && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-sm text-center">{t('orders_paused_msg')}</div>
      )}

      {/* Sticky category nav */}
      <div className="sticky top-16 z-20 -mx-4 px-4 pb-2 bg-stone-50/95 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {cats.map(c => (
            <button key={c.id} onClick={() => setActiveCat(c.id)} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCat === c.id ? 'bg-[#1f5d3a] text-white' : 'bg-white text-stone-600 border border-stone-200'}`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      {loading ? (
        <div className="space-y-3 mt-4">{Array.from({length: 6}).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-white animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400">{t('inga_resultat')}</div>
      ) : grouped ? (
        <div className="space-y-6 mt-4">
          {grouped.map(({ cat, list }) => (
            <div key={cat.id} id={`cat-${cat.id}`}>
              <h2 className="font-bold text-lg text-stone-900 mb-3">{cat.name}</h2>
              <div className="grid sm:grid-cols-2 gap-3">{list.map(item => <MenuItemCard key={item.id} item={item} onAdd={setModalItem} />)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3 mt-4">{filtered.map(item => <MenuItemCard key={item.id} item={item} onAdd={setModalItem} />)}</div>
      )}

      <ProductModal item={modalItem} onClose={() => setModalItem(null)} />
    </div>
  );
}
