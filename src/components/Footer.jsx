import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';
import { sortedHours, dayNames } from '@/lib/openingHours';
import LanguageSelector from './LanguageSelector';

export default function Footer() {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const hours = sortedHours(settings.openingHours);

  return (
    <footer className="bg-stone-900 text-stone-300 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#1f5d3a] flex items-center justify-center">
              <span className="text-white text-lg">♥</span>
            </div>
            <div className="font-bold text-white">Öster Pizzeria</div>
          </div>
          <p className="text-sm text-stone-400 leading-relaxed">{t('om_oss_text')}</p>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm mb-3">{t('kontakt')}</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0" /> Södergatan 20, 241 30 Eslöv</li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0" /> 076-963 62 22</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> {t('oppettider')}</h4>
          <ul className="space-y-1 text-sm">
            {hours.map(h => (
              <li key={h.day} className="flex justify-between gap-4">
                <span>{dayNames[lang][h.day]}</span>
                <span className="text-stone-400">{h.open}–{h.close}{h.closesNextDay ? '¹' : ''}</span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-stone-500 mt-1">¹ Natt efter</p>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm mb-3">{t('meny')}</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-white">{t('hem')}</Link></li>
            <li><Link to="/meny" className="hover:text-white">{t('meny')}</Link></li>
            <li><Link to="/#om" className="hover:text-white">{t('om_oss')}</Link></li>
            <li><Link to="/#kontakt" className="hover:text-white">{t('kontakt')}</Link></li>
          </ul>
          <div className="mt-4"><LanguageSelector /></div>
        </div>
      </div>

      <div className="border-t border-stone-800">
        <div className="max-w-6xl mx-auto px-4 py-5 pb-24 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div>© Öster Pizzeria</div>
          <div className="flex items-center gap-4">
            <button className="hover:text-stone-300">{t('integritet')}</button>
            <button className="hover:text-stone-300">{t('cookies')}</button>
            <button className="hover:text-stone-300">{t('allergener')}</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
