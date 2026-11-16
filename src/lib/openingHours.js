function toMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function getStatusNow(openingHours, now = new Date()) {
  if (!openingHours || !openingHours.length) return { open: false, nextChange: null };
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();

  // Yesterday's session spilling into today
  const yesterday = (day + 6) % 7;
  const ySession = openingHours.find(h => h.day === yesterday && h.closesNextDay);
  if (ySession) {
    const closeMin = toMinutes(ySession.close);
    if (minutes < closeMin) {
      return { open: true, closesAt: ySession.close, closesNextDay: true };
    }
  }

  const today = openingHours.find(h => h.day === day);
  if (today) {
    const openMin = toMinutes(today.open);
    const closeMin = toMinutes(today.close);
    if (today.closesNextDay) {
      if (minutes >= openMin) return { open: true, closesAt: today.close, closesNextDay: true };
    } else {
      if (minutes >= openMin && minutes < closeMin) {
        return { open: true, closesAt: today.close, closesNextDay: false };
      }
    }
  }

  // Find next opening time
  let nextChange = null;
  for (let i = 0; i < 8; i++) {
    const d = (day + i) % 7;
    const sess = openingHours.find(h => h.day === d);
    if (!sess) continue;
    const [oh, om] = sess.open.split(':').map(Number);
    let candidate;
    if (i === 0) {
      if (minutes < toMinutes(sess.open)) {
        candidate = new Date(now);
        candidate.setHours(oh, om, 0, 0);
      } else {
        continue;
      }
    } else {
      candidate = new Date(now);
      candidate.setDate(candidate.getDate() + i);
      candidate.setHours(oh, om, 0, 0);
    }
    if (candidate > now && (!nextChange || candidate < nextChange)) {
      nextChange = candidate;
    }
  }
  return { open: false, nextChange };
}

export function formatNextOpening(date, lang = 'sv') {
  if (!date) return '';
  const locale = lang === 'en' ? 'en-SE' : lang === 'ar' ? 'ar' : 'sv-SE';
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  if (lang === 'en') {
    if (isToday) return `Opens ${time}`;
    if (isTomorrow) return `Opens tomorrow ${time}`;
    return `Opens ${date.toLocaleDateString(locale, { weekday: 'long' })} ${time}`;
  }
  if (lang === 'ar') {
    if (isToday) return `يفتح ${time}`;
    return `يفتح ${date.toLocaleDateString(locale, { weekday: 'long' })} ${time}`;
  }
  if (isToday) return `Öppnar ${time}`;
  if (isTomorrow) return `Öppnar imorgon ${time}`;
  return `Öppnar ${date.toLocaleDateString(locale, { weekday: 'long' })} ${time}`;
}

export const dayNames = {
  sv: ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
};

export function sortedHours(openingHours) {
  if (!openingHours) return [];
  const order = [1,2,3,4,5,6,0];
  return [...openingHours].sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day));
}
