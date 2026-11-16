import React from 'react';
import { useI18n } from '@/lib/i18n';

export default function LanguageSelector() {
  const { lang, setLang } = useI18n();
  const langs = [
    { code: 'sv', label: 'SV' },
    { code: 'en', label: 'EN' },
    { code: 'ar', label: 'العربية' },
  ];
  return (
    <div className="inline-flex items-center bg-stone-100 rounded-full p-0.5 text-xs font-semibold">
      {langs.map(l => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-2 py-1 rounded-full transition-colors ${lang === l.code ? 'bg-white text-[#1f5d3a] shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
