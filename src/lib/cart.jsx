import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext();

const STORAGE_KEY = 'oster_cart';
const TYPE_KEY = 'oster_order_type';

function loadCart() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const [orderType, setOrderType] = useState(() => localStorage.getItem(TYPE_KEY) || 'pickup');

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem(TYPE_KEY, orderType); }, [orderType]);

  const lineId = () => Math.random().toString(36).slice(2, 11);

  const addItem = useCallback((item) => {
    setItems(prev => [...prev, { ...item, lineId: lineId() }]);
  }, []);

  const updateQty = useCallback((lineId, qty) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.lineId !== lineId));
    } else {
      setItems(prev => prev.map(i => i.lineId === lineId ? { ...i, qty } : i));
    }
  }, []);

  const removeItem = useCallback((lineId) => {
    setItems(prev => prev.filter(i => i.lineId !== lineId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clear, count, subtotal, orderType, setOrderType }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}export function formatPrice(amount) {
  const n = Math.round(amount || 0);
  return `${n} kr`;
}

export function formatDate(date, lang = 'sv') {
  if (!date) return '';
  const locale = lang === 'en' ? 'en-SE' : lang === 'ar' ? 'ar' : 'sv-SE';
  return new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatTime(date, lang = 'sv') {
  if (!date) return '';
  const locale = lang === 'en' ? 'en-SE' : lang === 'ar' ? 'ar' : 'sv-SE';
  return new Date(date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(date, lang = 'sv') {
  if (!date) return '';
  return `${formatDate(date, lang)} ${formatTime(date, lang)}`;
}import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const translations = {
  sv: {
    // nav
    hem: "Hem", meny: "Meny", om_oss: "Om oss", kontakt: "Kontakt",
    bestall_online: "Beställ online", se_menyn: "Se menyn",
    // hero
    hero_title: "Öster Pizzeria är tillbaka i Eslöv",
    hero_sub: "Efter mer än 5 år är vi tillbaka – med samma goda smak och ännu fler läckra rätter.",
    avhamtning: "Avhämtning", hemleverans: "Hemleverans i Eslövs kommun",
    oppet_nu: "Öppet nu", stangt: "Stängt", oppnar: "Öppnar",
    // order type
    hur_vill: "Hur vill du beställa?",
    hemleverans_desc: "Vi levererar inom Eslövs kommun",
    avhamtning_desc: "Hämta på Södergatan 20",
    // popular
    populart: "Populärt just nu",
    lagg_till: "Lägg till",
    // menu
    sok_menyn: "Sök i menyn…", inga_resultat: "Inga resultat hittades",
    slutsald: "Tillfälligt slutsåld", popular_tag: "Populärt",
    // product
    kommentar_kok: "Kommentar till köket", kommentar_placeholder: "Ex. ingen lök, extra välgräddad…",
    lagg_varukorg: "Lägg i varukorgen", valj_storlek: "Välj storlek",
    // cart
    varukorg: "Varukorg", din_varukorg_ar_tom: "Din varukorg är tom",
    din_varukorg_ar_tom_desc: "Lägg till rätter från menyn för att börja en beställning.",
    visa_menyn: "Visa menyn", visa_varukorg: "Visa varukorg", varor: "varor", vara: "vara",
    delsumma: "Delsumma", leveransavgift: "Leveransavgift", gratis: "Gratis", total: "Total",
    ga_till_kassan: "Gå till kassan", tom: "Töm varukorg",
    // checkout
    kassa: "Kassa", bestallningssatt: "Beställningssätt",
    fornamn: "Förnamn", efternamn: "Efternamn", telefon: "Telefonnummer",
    gatuadress: "Gatuadress", postnummer: "Postnummer", ort: "Ort",
    portkod: "Portkod", vaning: "Våning", leveransinstruktioner: "Leveransinstruktioner",
    namn: "Namn", leveransadress: "Leveransadress",
    sa_snart: "Så snart som möjligt", valj_tid: "Välj tid",
    betalning: "Betalning", swish: "Swish", kort: "Kort", betala_plats: "Betala på plats",
    betala_leverans: "Betala vid leverans",
    betala_online: "Betala online", betala_plats_kort: "Betala vid avhämtning",
    betala_online_desc: "Du skickas vidare till en säker betalning via Stripe (kort, Klarna eller Swish). Vi ser aldrig dina kortuppgifter.",
    bearbetar: "Bearbetar…", valj_klockslag: "Välj klockslag",
    betald: "Betald", obetald: "Inte betald", betalning_vantar: "Väntar på betalning", aterbetald: "Återbetald",
    betala_nu: "Betala nu",
    betalning_avbruten: "Betalningen avbröts – beställningen ligger kvar och du kan slutföra betalningen här.",
    place_order: "Placera beställning", placera_beställning: "Placera beställning",
    order_sammanfattning: "Orderöversikt", min_order: "Minsta beställning för leverans",
    utanfor_omrade: "Vi levererar tyvärr inte till denna adress.", obligatoriskt: "Obligatoriskt",
    // confirmation
    tack_bestallning: "Tack för din beställning!", order_nummer: "Order",
    vantar_bekraftelse: "Väntar på bekräftelse från restaurangen",
    bekräftad: "Din beställning har bekräftats", beraknad_tid: "Beräknad tid",
    minut: "minuter", minuter: "minuter",
    bestallning_mottagen: "Beställning mottagen", tillagas: "Tillagas",
    klar_avhamtning: "Klar för avhämtning", pa_vag: "På väg", slutford: "Slutförd",
    nekades: "Beställningen nekades", avbruten: "Beställningen avbröts",
    visa_kvitto: "Visa kvitto", tillbaka_hem: "Tillbaka till hem",
    // statuses
    st_pending: "Väntar", st_accepted: "Bekräftad", st_preparing: "Tillagas",
    st_ready: "Klar", st_out_for_delivery: "På väg", st_completed: "Slutförd",
    st_rejected: "Nekad", st_cancelled: "Avbruten",
    // about
    om_oss_text: "Öster Pizzeria är tillbaka i Eslöv efter mer än fem år. Vi öppnar igen med samma goda smak, ett varmt välkomnande och ännu fler rätter på menyn.",
    // contact
    ring_oss: "Ring oss", hitta_hit: "Hitta hit", oppettider: "Öppettider",
    // footer
    integritet: "Integritetspolicy", cookies: "Cookies", allergener: "Allergener",
    // allergen
    allergier_note: "Har du allergier? Kontakta restaurangen innan du beställer.",
    // paused
    orders_paused_msg: "Vi har tillfälligt pausat onlinebeställningar på grund av hög belastning. Försök igen lite senare.",
    stangd_msg: "Restaurangen är tyvärr stängd just nu. Välkommen tillbaka under våra öppettider.",
    // misc
    kr: "kr", min: "min",
  },
  en: {
    hem: "Home", meny: "Menu", om_oss: "About", kontakt: "Contact",
    bestall_online: "Order online", se_menyn: "View menu",
    hero_title: "Öster Pizzeria is back in Eslöv",
    hero_sub: "After more than 5 years we're back – with the same great taste and even more delicious dishes.",
    avhamtning: "Pickup", hemleverans: "Delivery in Eslöv municipality",
    oppet_nu: "Open now", stangt: "Closed", oppnar: "Opens",
    hur_vill: "How would you like to order?",
    hemleverans_desc: "We deliver within Eslöv municipality",
