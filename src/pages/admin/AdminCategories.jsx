import React, { useState, useEffect } from 'react';
import { Plus, X, Edit, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { api } from '@/api/client';
import { useToast } from '@/components/ui/use-toast';

export default function AdminCategories() {
  const { toast } = useToast();
  const [cats, setCats] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const list = await api.entities.MenuCategory.filter({}, 'sortOrder', 100);
    setCats(list);
  };
  useEffect(() => { load(); }, []);

  const move = async (cat, dir) => {
    const idx = cats.indexOf(cat);
    const swap = cats[idx + dir];
    if (!swap) return;
    await Promise.all([
      api.entities.MenuCategory.update(cat.id, { sortOrder: swap.sortOrder }),
      api.entities.MenuCategory.update(swap.id, { sortOrder: cat.sortOrder })
    ]);
    load();
  };
  const toggleActive = async (cat) => {
    await api.entities.MenuCategory.update(cat.id, { active: !cat.active });
    load();
  };
  const remove = async (cat) => {
    if (!confirm(`Ta bort kategorin "${cat.name}"?`)) return;
    await api.entities.MenuCategory.delete(cat.id);
    toast({ title: 'Kategori borttagen' });
    load();
  };
  const save = async (form) => {
    if (editing.id) {
      await api.entities.MenuCategory.update(editing.id, form);
    } else {
      const maxOrder = cats.reduce((m, c) => Math.max(m, c.sortOrder || 0), 0);
      await api.entities.MenuCategory.create({ ...form, sortOrder: maxOrder + 1 });
    }
    toast({ title: 'Sparad' });
    setEditing(null); load();
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-stone-900">Kategorier</h1>
        <button onClick={() => setEditing({})} className="bg-[#1f5d3a] text-white font-semibold px-4 py-2 rounded-full text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Ny kategori</button>
      </div>
      <div className="space-y-2">
        {cats.map((c, i) => (
          <div key={c.id} className="bg-white rounded-xl p-3 flex items-center gap-3">
            <div className="flex flex-col">
              <button onClick={() => move(c, -1)} disabled={i === 0} className="text-stone-400 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
              <button onClick={() => move(c, 1)} disabled={i === cats.length - 1} className="text-stone-400 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm text-stone-900">{c.name}</div>
              {c.description && <div className="text-xs text-stone-500">{c.description}</div>}
            </div>
            <button onClick={() => toggleActive(c)} className="w-8 h-8 flex items-center justify-center text-stone-500">{c.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-stone-300" />}</button>
            <button aria-label={`Redigera ${c.name}`} onClick={() => setEditing(c)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500"><Edit className="w-4 h-4" /></button>
            <button onClick={() => remove(c)} className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-stone-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      {editing && <CatModal cat={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function CatModal({ cat, onClose, onSave }) {
  const [name, setName] = useState(cat.name || '');
  const [description, setDescription] = useState(cat.description || '');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-5 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{cat.id ? 'Redigera kategori' : 'Ny kategori'}</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <div><label htmlFor="category-name" className="block text-xs font-medium text-stone-500 mb-1">Namn</label><input id="category-name" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border border-stone-200 p-3 text-sm focus:outline-none focus:border-[#1f5d3a]" /></div>
          <div><label htmlFor="category-description" className="block text-xs font-medium text-stone-500 mb-1">Beskrivning</label><input id="category-description" value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-xl border border-stone-200 p-3 text-sm focus:outline-none focus:border-[#1f5d3a]" /></div>
        </div>
        <button onClick={() => onSave({ name, description, active: cat.active !== false })} className="w-full mt-5 bg-[#1f5d3a] text-white font-semibold py-3 rounded-full">Spara</button>
      </div>
    </div>
  );
}
