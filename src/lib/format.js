export function formatPrice(amount) {
  const n = new Intl.NumberFormat('sv-SE',{maximumFractionDigits:2}).format(amount || 0);
  return `${n} kr`;
}

export function formatDate(date, lang = 'sv') {
  if (!date) return '';
  const locale = lang === 'en' ? 'en-SE' : lang === 'ar' ? 'ar' : 'sv-SE';
  return new Date(date).toLocaleDateString(locale, {timeZone:'Europe/Stockholm', day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatTime(date, lang = 'sv') {
  if (!date) return '';
  const locale = lang === 'en' ? 'en-SE' : lang === 'ar' ? 'ar' : 'sv-SE';
  return new Date(date).toLocaleTimeString(locale, {timeZone:'Europe/Stockholm', hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(date, lang = 'sv') {
  if (!date) return '';
  return `${formatDate(date, lang)} ${formatTime(date, lang)}`;
}
