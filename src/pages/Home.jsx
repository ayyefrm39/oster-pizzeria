import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Store, Bike, Clock, Phone, MapPin, ArrowRight, Star } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';
import { base44 } from '@/api/base44Client';
import { getStatusNow, formatNextOpening, sortedHours, dayNames } from '@/lib/openingHours';
import { Image } from '@/components/ui/image';
import MenuItemCard from '@/components/MenuItemCard';
import ProductModal from '@/components/ProductModal';
import { useCart } from '@/lib/cart';

const HERO = 'https://media.base44.com/images/public/6a9aae5156bb8dde83fa0986/f3d18ee18_generated_image.png';

export default function Home() {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const ctx = /** @type {{openOrderType?: () => void}} */ (useOutletContext());
  const [popular, setPopular] = useState([]);
  const [modalItem, setModalItem] = useState(null);
  const status = getStatusNow(settings.openingHours);

  useEffect(() => {
    base44.entities.MenuItem.filter({ popular: true, active: true, soldOut: false }, '-created_date', 6)
      .then(setPopular).catch(() => {});
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative">
        <div className="relative h-[60vh] min-h-[420px] max-h-[560px] overflow-hidden">
          <Image src={HERO} alt="Öster Pizzeria" className="w-full h-full object-cover" fittingType="fill" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          <div className="absolute inset-0 flex flex-col justify-end pb-10 px-5">
            <div className="max-w-xl mx-auto w-full text-white">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium mb-4">
                <span className={`w-2 h-2 rounded-full ${status.open ? 'bg-green-400 animate-pulse' : 'bg-stone-300'}`} />
                {status.open ? t('oppet_nu') : formatNextOpening(status.nextChange, lang)}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">{t('hero_title')}</h1>
              <p className="mt-3 text-white/85 text-base sm:text-lg leading-relaxed max-w-md">{t('hero_sub')}</p>
              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <button onClick={() => ctx?.openOrderType?.()} className="bg-[#c8332a] hover:bg-[#b02b22] text-white font-semibold px-6 py-3.5 rounded-full text-base transition-colors active:scale-95 flex items-center justify-center gap-2">
                  {t('bestall_online')} <ArrowRight className="w-5 h-5" />
                </button>
                <button onClick={() => navigate('/meny')} className="bg-white/15 backdrop-blur hover:bg-white/25 text-white font-semibold px-6 py-3.5 rounded-full text-base border border-white/30 transition-colors">
                  {t('se_menyn')}
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Order options strip */}
        <div className="max-w-4xl mx-auto -mt-8 px-4 relative z-10">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/meny')} className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3 text-start hover:shadow-xl transition-shadow">
              <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center shrink-0"><Store className="w-6 h-6 text-[#1f5d3a]" /></div>
              <div>
                <div className="font-semibold text-stone-900 text-sm">{t('avhamtning')}</div>
                <div className="text-xs text-stone-500">Södergatan 20</div>
              </div>
            </button>
            <button onClick={() => navigate('/meny')} className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3 text-start hover:shadow-xl transition-shadow">
              <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center shrink-0"><Bike className="w-6 h-6 text-[#1f5d3a]" /></div>
              <div>
                <div className="font-semibold text-stone-900 text-sm">{t('hemleverans')}</div>
                <div className="text-xs text-stone-500">Eslövs kommun</div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* POPULAR */}
      <section className="max-w-4xl mx-auto px-4 mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2"><Star className="w-5 h-5 text-[#c8332a]" /> {t('populart')}</h2>
          <button onClick={() => navigate('/meny')} className="text-sm font-medium text-[#1f5d3a]">{t('se_menyn')}</button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {popular.length === 0 && Array.from({length: 4}).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-stone-100 animate-pulse" />)}
          {popular.map(item => <MenuItemCard key={item.id} item={item} onAdd={setModalItem} />)}
        </div>
      </section>

      {/* ABOUT */}
      <section id="om" className="max-w-4xl mx-auto px-4 mt-16 scroll-mt-20">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#1f5d3a] flex items-center justify-center"><span className="text-white">♥</span></div>
            <h2 className="text-xl font-bold text-stone-900">{t('om_oss')}</h2>
          </div>
          <p className="text-stone-600 leading-relaxed text-base">{t('om_oss_text')}</p>
        </div>
      </section>

      {/* CONTACT */}
      <section id="kontakt" className="max-w-4xl mx-auto px-4 mt-12 scroll-mt-20">
        <h2 className="text-xl font-bold text-stone-900 mb-4">{t('kontakt')}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-6 border border-stone-100">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#1f5d3a] mt-0.5 shrink-0" />
                <div><div className="font-semibold text-stone-900">Öster Pizzeria</div><div className="text-sm text-stone-500">Södergatan 20, 241 30 Eslöv</div></div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#1f5d3a] shrink-0" />
                <a href="tel:0769636222" className="font-medium text-stone-900">076-963 62 22</a>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <a href="tel:0769636222" className="flex-1 bg-[#1f5d3a] text-white text-center font-semibold py-2.5 rounded-full text-sm">{t('ring_oss')}</a>
                <a href="https://www.google.com/maps/search/?api=1&query=Södergatan+20+Eslöv" target="_blank" rel="noreferrer" className="flex-1 bg-stone-100 text-stone-800 text-center font-semibold py-2.5 rounded-full text-sm">{t('hitta_hit')}</a>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-stone-100">
            <div className="flex items-center gap-2 mb-3"><Clock className="w-5 h-5 text-[#1f5d3a]" /><h3 className="font-semibold text-stone-900">{t('oppettider')}</h3></div>
            <ul className="space-y-1.5 text-sm">
              {sortedHours(settings.openingHours).map(h => (
                <li key={h.day} className="flex justify-between">
                  <span className="text-stone-600">{dayNames[lang][h.day]}</span>
                  <span className="text-stone-800 font-medium">{h.open}–{h.close}{h.closesNextDay ? ' ¹' : ''}</span>
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-stone-400 mt-2">¹ Natt efter</p>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800 text-center">{t('allergier_note')}</div>
      </section>

      <ProductModal item={modalItem} onClose={() => setModalItem(null)} />
    </div>
  );
}
