import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
    avhamtning_desc: "Pick up at Södergatan 20",
    populart: "Popular right now",
    lagg_till: "Add",
    sok_menyn: "Search the menu…", inga_resultat: "No results found",
    slutsald: "Temporarily sold out", popular_tag: "Popular",
    kommentar_kok: "Note for the kitchen", kommentar_placeholder: "E.g. no onion, extra crispy…",
    lagg_varukorg: "Add to cart", valj_storlek: "Choose size",
    varukorg: "Cart", din_varukorg_ar_tom: "Your cart is empty",
    din_varukorg_ar_tom_desc: "Add dishes from the menu to start an order.",
    visa_menyn: "View menu", visa_varukorg: "View cart", varor: "items", vara: "item",
    delsumma: "Subtotal", leveransavgift: "Delivery fee", gratis: "Free", total: "Total",
    ga_till_kassan: "Go to checkout", tom: "Clear cart",
    kassa: "Checkout", bestallningssatt: "Order method",
    fornamn: "First name", efternamn: "Last name", telefon: "Phone number",
    gatuadress: "Street address", postnummer: "Postal code", ort: "City",
    portkod: "Door code", vaning: "Floor", leveransinstruktioner: "Delivery instructions",
    namn: "Name", leveransadress: "Delivery address",
    sa_snart: "As soon as possible", valj_tid: "Choose time",
    betalning: "Payment", swish: "Swish", kort: "Card", betala_plats: "Pay at restaurant",
    betala_leverans: "Pay on delivery",
    betala_online: "Pay online", betala_plats_kort: "Pay on pickup",
    betala_online_desc: "You are redirected to a secure Stripe payment (card, Klarna or Swish). We never see your card details.",
    bearbetar: "Processing…", valj_klockslag: "Choose a time",
    betald: "Paid", obetald: "Not paid", betalning_vantar: "Awaiting payment", aterbetald: "Refunded",
    betala_nu: "Pay now",
    betalning_avbruten: "The payment was cancelled – your order is saved and you can complete the payment here.",
    place_order: "Place order", placera_beställning: "Place order",
    order_sammanfattning: "Order summary", min_order: "Minimum order for delivery",
    utanfor_omrade: "Sorry, we don't deliver to this address.", obligatoriskt: "Required",
    tack_bestallning: "Thank you for your order!", order_nummer: "Order",
    vantar_bekraftelse: "Awaiting confirmation from the restaurant",
    bekräftad: "Your order has been confirmed", beraknad_tid: "Estimated time",
    minut: "minute", minuter: "minutes",
    bestallning_mottagen: "Order received", tillagas: "Preparing",
    klar_avhamtning: "Ready for pickup", pa_vag: "On the way", slutford: "Completed",
    nekades: "Order rejected", avbruten: "Order cancelled",
    visa_kvitto: "View receipt", tillbaka_hem: "Back to home",
    st_pending: "Pending", st_accepted: "Confirmed", st_preparing: "Preparing",
    st_ready: "Ready", st_out_for_delivery: "On the way", st_completed: "Completed",
    st_rejected: "Rejected", st_cancelled: "Cancelled",
    om_oss_text: "Öster Pizzeria is back in Eslöv after more than five years. We reopen with the same great taste, a warm welcome and even more dishes on the menu.",
    ring_oss: "Call us", hitta_hit: "Get directions", oppettider: "Opening hours",
    integritet: "Privacy policy", cookies: "Cookies", allergener: "Allergens",
    allergier_note: "Have allergies? Contact the restaurant before ordering.",
    orders_paused_msg: "We have temporarily paused online orders due to high demand. Please try again later.",
    stangd_msg: "The restaurant is currently closed. Welcome back during our opening hours.",
    kr: "kr", min: "min",
  },
  ar: {
    hem: "الرئيسية", meny: "القائمة", om_oss: "من نحن", kontakt: "اتصل بنا",
    bestall_online: "اطلب أونلاين", se_menyn: "عرض القائمة",
    hero_title: "عُودة أöster بيتزيريا إلى إسليوف",
    hero_sub: "بعد أكثر من 5 سنوات عُدنا – بنفس الطعم الرائع وأطباق أشهى.",
    avhamtning: "استلام", hemleverans: "توصيل في بلدية إسليوف",
    oppet_nu: "مفتوح الآن", stangt: "مغلق", oppnar: "يفتح",
    hur_vill: "كيف تريد الطلب؟",
    hemleverans_desc: "نوصّل ضمن بلدية إسليوف",
    avhamtning_desc: "الاستلام من سودرغاتان 20",
    populart: "الأكثر طلباً الآن",
    lagg_till: "إضافة",
    sok_menyn: "ابحث في القائمة…", inga_resultat: "لا توجد نتائج",
    slutsald: "نفد مؤقتاً", popular_tag: "مفضل",
    kommentar_kok: "ملاحظة للمطبخ", kommentar_placeholder: "مثال: بدون بصل، مقرمش أكثر…",
    lagg_varukorg: "أضف إلى السلة", valj_storlek: "اختر الحجم",
    varukorg: "السلة", din_varukorg_ar_tom: "سلتك فارغة",
    din_varukorg_ar_tom_desc: "أضف أطباقاً من القائمة لبدء طلب.",
    visa_menyn: "عرض القائمة", visa_varukorg: "عرض السلة", varor: "عناصر", vara: "عنصر",
    delsumma: "المجموع الفرعي", leveransavgift: "رسوم التوصيل", gratis: "مجاني", total: "الإجمالي",
    ga_till_kassan: "إتمام الطلب", tom: "إفراغ السلة",
    kassa: "الدفع", bestallningssatt: "طريقة الطلب",
    fornamn: "الاسم الأول", efternamn: "اسم العائلة", telefon: "رقم الهاتف",
    gatuadress: "العنوان", postnummer: "الرمز البريدي", ort: "المدينة",
    portkod: "رمز الباب", vaning: "الطابق", leveransinstruktioner: "تعليمات التوصيل",
    namn: "الاسم", leveransadress: "عنوان التوصيل",
    sa_snart: "في أسرع وقت", valj_tid: "اختر الوقت",
    betalning: "الدفع", swish: "سويش", kort: "بطاقة", betala_plats: "ادفع في المطعم",
    betala_leverans: "ادفع عند التوصيل",
    betala_online: "ادفع أونلاين", betala_plats_kort: "ادفع عند الاستلام",
    betala_online_desc: "سيتم تحويلك إلى دفع آمن عبر Stripe. لا نرى بيانات بطاقتك أبداً.",
    bearbetar: "جارٍ المعالجة…", valj_klockslag: "اختر الوقت",
    betald: "مدفوع", obetald: "غير مدفوع", betalning_vantar: "بانتظار الدفع", aterbetald: "مُسترد",
    betala_nu: "ادفع الآن",
    betalning_avbruten: "تم إلغاء الدفع – طلبك محفوظ ويمكنك إتمام الدفع هنا.",
    place_order: "تأكيد الطلب", placera_beställning: "تأكيد الطلب",
    order_sammanfattning: "ملخص الطلب", min_order: "الحد الأدنى للطلب للتوصيل",
    utanfor_omrade: "عذراً، لا نوصل إلى هذا العنوان.", obligatoriskt: "مطلوب",
    tack_bestallning: "شكراً لطلبك!", order_nummer: "طلب",
    vantar_bekraftelse: "بانتظار تأكيد المطعم",
    bekräftad: "تم تأكيد طلبك", beraknad_tid: "الوقت المقدر",
    minut: "دقيقة", minuter: "دقيقة",
    bestallning_mottagen: "تم استلام الطلب", tillagas: "قيد التحضير",
    klar_avhamtning: "جاهز للاستلام", pa_vag: "في الطريق", slutford: "مكتمل",
    nekades: "تم رفض الطلب", avbruten: "تم إلغاء الطلب",
    visa_kvitto: "عرض الإيصال", tillbaka_hem: "العودة للرئيسية",
    st_pending: "بانتظار", st_accepted: "مؤكد", st_preparing: "قيد التحضير",
    st_ready: "جاهز", st_out_for_delivery: "في الطريق", st_completed: "مكتمل",
    st_rejected: "مرفوض", st_cancelled: "ملغى",
    om_oss_text: "عادت أöster بيتزيريا إلى إسليوف بعد أكثر من خمس سنوات. ن reopen بنفس الطعم الرائع وترحيب دافئ وأطباق أكثر.",
    ring_oss: "اتصل بنا", hitta_hit: "الاتجاهات", oppettider: "ساعات العمل",
    integritet: "سياسة الخصوصية", cookies: "ملفات تعريف الارتباط", allergener: "مسببات الحساسية",
    allergier_note: "هل لديك حساسية؟ اتصل بالمطعم قبل الطلب.",
    orders_paused_msg: "أوقفنا الطلبات أونلاين مؤقتاً بسبب الطلب العالي. حاول مرة أخرى لاحقاً.",
    stangd_msg: "المطعم مغلق حالياً. مرحباً بك مرة أخرى خلال ساعات العمل.",
    kr: "kr", min: "د",
  }
};

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('oster_lang') || 'sv');
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('oster_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const t = useCallback((key) => {
    return (translations[lang] && translations[lang][key]) || translations.sv[key] || key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, dir, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) return { lang: 'sv', setLang: () => {}, dir: 'ltr', t: (k) => translations.sv[k] || k };
  return ctx;
}// Opening hours engine. openingHours: array of {day, open, close, closesNextDay}
// day = JS getDay(): 0=Sunday ... 6=Saturday
