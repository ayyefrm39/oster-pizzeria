import React, { useState } from 'react';
import { Menu as MenuIcon, X, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useCart } from '@/lib/cart';
import { useSettings } from '@/lib/settings';
import { getStatusNow, formatNextOpening } from '@/lib/openingHours';
import LanguageSelector from './LanguageSelector';

export default function Header({ onOrderClick }) {
  const { t, lang } = useI18n();
  const { count } = useCart();
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const status = getStatusNow(settings.openingHours);

  const navLinks = [
    { label: t('hem'), href: '/' },
    { label: t('meny'), href: '/meny' },
    { label: t('om_oss'), href: '/#om' },
    { label: t('kontakt'), href: '/#kontakt' },
  ];

  const handleNav = (href) => {
    setOpen(false);
    if (href.startsWith('/#')) {
      navigate('/');
      setTimeout(() => {
        const id = href.slice(2);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      navigate(href);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <button onClick={() => handleNav('/')} className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#1f5d3a] flex items-center justify-center shadow-sm">
            <span className="text-white text-lg leading-none">♥</span>
          </div>
          <div className="text-start leading-tight">
            <div className="font-bold text-[15px] text-stone-900 tracking-tight">Öster Pizzeria</div>
            <div className="text-[10px] text-stone-500 -mt-0.5">Eslöv</div>
          </div>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(l => (
            <button key={l.href} onClick={() => handleNav(l.href)} className="text-sm font-medium text-stone-700 hover:text-[#1f5d3a] transition-colors">
              {l.label}
            </button>
          ))}
        </nav>

        {/* Status pill - desktop */}
        <div className="hidden lg:flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.open ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.open ? 'bg-green-500 animate-pulse' : 'bg-stone-400'}`}></span>
            {status.open ? t('oppet_nu') : formatNextOpening(status.nextChange, lang)}
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:block"><LanguageSelector /></div>
          <Link to="/varukorg" className="relative p-2 rounded-full hover:bg-stone-100 transition-colors" aria-label={t('varukorg')}>
            <ShoppingBag className="w-5 h-5 text-stone-700" />
            {count > 0 && (
              <span className="absolute -top-0.5 -end-0.5 bg-[#c8332a] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">{count}</span>
            )}
          </Link>
          <button onClick={onOrderClick || (() => navigate('/meny'))} className="hidden sm:inline-flex items-center bg-[#c8332a] hover:bg-[#b02b22] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors">
            {t('bestall_online')}
          </button>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-full hover:bg-stone-100">
            {open ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-stone-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(l => (
              <button key={l.href} onClick={() => handleNav(l.href)} className="block w-full text-start py-2.5 text-base font-medium text-stone-800">
                {l.label}
              </button>
            ))}
            <div className="pt-2 pb-1 flex items-center justify-between">
              <LanguageSelector />
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.open ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.open ? 'bg-green-500' : 'bg-stone-400'}`}></span>
                {status.open ? t('oppet_nu') : t('stangt')}
              </span>
            </div>
            <button onClick={() => { setOpen(false); onOrderClick ? onOrderClick() : navigate('/meny'); }} className="w-full mt-2 bg-[#c8332a] text-white font-semibold py-3 rounded-xl">
              {t('bestall_online')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
