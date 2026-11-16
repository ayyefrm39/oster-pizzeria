import React, { useState } from 'react';
import { Outlet, Link, useLocation, NavLink } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, ListOrdered, Settings, Store, Menu as MenuIcon, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function AdminLayout() {
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const nav = [
    { to: '/admin', label: 'Beställningar', icon: LayoutDashboard, end: true },
    { to: '/admin/meny', label: 'Menyhantering', icon: UtensilsCrossed },
    { to: '/admin/kategorier', label: 'Kategorier', icon: ListOrdered },
    { to: '/admin/installningar', label: 'Inställningar', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex w-60 bg-stone-900 text-stone-300 flex-col fixed inset-y-0">
        <div className="p-5 flex items-center gap-2 border-b border-stone-800">
          <div className="w-9 h-9 rounded-full bg-[#1f5d3a] flex items-center justify-center"><span className="text-white">♥</span></div>
          <div><div className="font-bold text-white text-sm">Öster Pizzeria</div><div className="text-[10px] text-stone-500">Admin</div></div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive ? 'bg-stone-800 text-white' : 'text-stone-400 hover:text-white hover:bg-stone-800/50'}`}>
              <n.icon className="w-5 h-5" /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-stone-800">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-400 hover:text-white hover:bg-stone-800/50"><Store className="w-5 h-5" /> Till kundsidan</Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 bg-stone-900 text-white px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-[#1f5d3a] flex items-center justify-center"><span>♥</span></div><span className="font-bold text-sm">Admin</span></div>
        <button onClick={() => setSidebarOpen(true)}><MenuIcon className="w-6 h-6" /></button>
      </div>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 bg-stone-900 text-stone-300 flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-stone-800">
              <span className="font-bold text-white">Admin</span>
              <button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <nav className="flex-1 p-3 space-y-1" onClick={() => setSidebarOpen(false)}>
              {nav.map(n => (
                <NavLink key={n.to} to={n.to} end={n.end} className={({isActive}) => `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium ${isActive ? 'bg-stone-800 text-white' : 'text-stone-400'}`}>
                  <n.icon className="w-5 h-5" /> {n.label}
                </NavLink>
              ))}
              <Link to="/" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-stone-400"><Store className="w-5 h-5" /> Till kundsidan</Link>
            </nav>
          </div>
        </div>
      )}

      <div className="flex-1 lg:ms-60 pt-14 lg:pt-0">
        <Outlet />
      </div>
    </div>
  );
}
