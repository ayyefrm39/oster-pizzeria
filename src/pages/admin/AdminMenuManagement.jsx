import OptionGroupsEditor from '@/components/OptionGroupsEditor';
import React, { useState, useEffect } from 'react';
import { Plus, X, Edit, Trash2, Search } from 'lucide-react';
import { api } from '@/api/client';
import { formatPrice } from '@/lib/format';
import { useToast } from '@/components/ui/use-toast';

export default function AdminMenuManagement() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [its, cats] = await Promise.all([
      api.entities.MenuItem.list('created_date', 500),
      api.entities.MenuCategory.filter({}, 'sortOrder', 100)
    ]);
    setItems(its); setCategories(cats); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const catName = (id) => categories.find(c => c.id === id)?.name || '—';

  const toggleSoldOut = async (item) => {
    await api.entities.MenuItem.update(item.id, { soldOut: !item.soldOut });
    toast({ title: item.soldOut ? 'Markerad som tillgänglig' : 'Markerad som slutsåld' });
    load();
  };
  const toggleActive = async (item) => {
    await api.entities.MenuItem.update(item.id, { active: !item.active });
    load();
  };
  const deleteItem = async (item) => {
    if (!confirm(`Ta bort "${item.name}"?`)) return;
    await api.entities.MenuItem.delete(item.id);
    toast({ title: 'Borttagen' });
    load();
  };

  const filtered = items.filter(i => (filterCat === 'all' || i.categoryId === filterCat) && (!query || i.name.toLowerCase().includes(query.toLowerCase())));

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-stone-900">Menyhantering</h1>
        <button onClick={() => setEditing({})} className="bg-[#1f5d3a] text-white font-semibold px-4 py-2 rounded-full text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Ny artikel</button>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-stone-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Sök…" className="w-full bg-white border border-stone-200 rounded-full ps-9 pe-3 py-2 text-sm focus:outline-none focus:border-[#1f5d3a]" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-white border border-stone-200 rounded-full px-3 py-2 text-sm max-w-[45%]">
          <option value="all">Alla kategorier</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? <div className="text-center py-12 text-stone-400">Laddar…</div> : (
        <div className="space-y-2">
          {filtered.map(item => (
            <div key={item.id} className="bg-white rounded-xl p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden shrink-0">
                {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">🍕</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-stone-900 truncate">{item.name}</span>
                  {item.popular && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 rounded-full">Populär</span>}
                </div>
                <div className="text-xs text-stone-500">{catName(item.categoryId)} · {formatPrice(item.price)}</div>
              </div>
              <button onClick={() => toggleSoldOut(item)} className={`text-xs font-bold px-3 py-2 rounded-full ${item.soldOut ? 'bg-red-500 text-white' : 'bg-stone-100 text-stone-600'}`}>
                {item.soldOut ? 'SLUTSÅLD' : 'Tillgänglig'}
              </button>
              <button onClick={() => toggleActive(item)} className={`w-8 h-8 rounded-full flex items-center justify-center ${item.active ? 'text-green-600' : 'text-stone-300'}`} title={item.active ? 'Synlig' : 'Dold'}>
                <span className={`w-9 h-5 rounded-full relative ${item.active ? 'bg-green-500' : 'bg-stone-300'}`}><span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${item.active ? 'end-0.5' : 'start-0.5'}`} /></span>
              </button>
              <button aria-label={`Redigera ${item.name}`} onClick={() => setEditing(item)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500"><Edit className="w-4 h-4" /></button>
              <button onClick={() => deleteItem(item)} className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-stone-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {editing && <EditModal item={editing} categories={categories} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  );
}

function EditModal({ item, categories, onClose, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: item.name || '', description: item.description || '', categoryId: item.categoryId || categories[0]?.id || '',
    price: item.price || 0, image: item.image || '', popular: item.popular || false, active: item.active !== false,
    familyPrice: item.familyPrice || 0, optionGroups: item.optionGroups || [], soldOut: item.soldOut || false
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const [saving,setSaving]=useState(false);
  const save = async () => {
    if (!form.name || !form.categoryId) { toast({ title: 'Namn och kategori krävs', variant: 'destructive' }); return; }
    const payload={...form};
    setSaving(true);
    try {
    if (item.id) {
      await api.entities.MenuItem.update(item.id, payload);
      toast({ title: 'Uppdaterad' });
    } else {
      await api.entities.MenuItem.create(payload);
      toast({ title: 'Skapad' });
    }
    onSaved(); onClose();
    } finally {setSaving(false);}
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">{item.id ? 'Redigera artikel' : 'Ny artikel'}</h3>
            <button onClick={onClose}><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-3">
            <Input label="Namn" value={form.name} onChange={v => set('name', v)} />
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Kategori</label>
              <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} className="w-full rounded-xl border border-stone-200 p-3 text-sm">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Input label="Beskrivning" value={form.description} onChange={v => set('description', v)} />
            <Input label="Pris (kr)" value={form.price} onChange={v => set('price', Number(v))} type="number" />
            <Input label="Familjepris (kr, 0 om ej tillämpligt)" value={form.familyPrice} onChange={v => set('familyPrice', Number(v))} type="number" />
            <Input label="Bild-URL" value={form.image} onChange={v => set('image', v)} />
            <label className="block text-xs text-stone-500">Ladda upp bild (PNG, JPEG eller WebP, högst 5 MB)
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={async e=>{const file=e.target.files?.[0];if(file){const result=await api.upload(file);set('image',result.url);}}} className="block mt-2 text-sm"/>
            </label>
            <OptionGroupsEditor value={form.optionGroups} onChange={v=>set('optionGroups',v)}/>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.popular} onChange={e => set('popular', e.target.checked)} /> Populär</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.soldOut} onChange={e => set('soldOut', e.target.checked)} /> Slutsåld</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} /> Synlig</label>
            </div>
          </div>
          <button disabled={saving} onClick={save} className="w-full mt-5 bg-[#1f5d3a] text-white font-semibold py-3 rounded-full">Spara</button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }) {
  return <div>
    <label htmlFor={label} className="block text-xs font-medium text-stone-500 mb-1">{label}</label>
    <input id={label} type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-stone-200 p-3 text-sm focus:outline-none focus:border-[#1f5d3a]" />
  </div>;
}
