const stockholmFormatter=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function stockholmParts(date){return Object.fromEntries(stockholmFormatter.formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));}
// Interpret a UTC-shaped wall-clock date in Stockholm, including DST offsets.
function stockholmInstant(wall){
 const target=+wall;let guess=target;
 for(let i=0;i<3;i++){const p=stockholmParts(new Date(guess));const offset=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute)-guess;guess=target-offset;}
 return new Date(guess);
}
function toMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function getStatusNow(openingHours, now = new Date()) {
  if (!openingHours || !openingHours.length) return { open: false, nextChange: null };
  const parts=stockholmParts(now);
  const wall=new Date(Date.UTC(parts.year,parts.month-1,parts.day,parts.hour,parts.minute));
  const day=wall.getUTCDay();
  const minutes=parts.hour*60+parts.minute;

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
        candidate = new Date(wall);
        candidate.setUTCHours(oh, om, 0, 0);
      } else {
        continue;
      }
    } else {
      candidate = new Date(wall);
      candidate.setUTCDate(candidate.getUTCDate() + i);
      candidate.setUTCHours(oh, om, 0, 0);
    }
    candidate=stockholmInstant(candidate);
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
  const isToday = date.toLocaleDateString('sv-SE',{timeZone:'Europe/Stockholm'}) === today.toLocaleDateString('sv-SE',{timeZone:'Europe/Stockholm'});
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toLocaleDateString('sv-SE',{timeZone:'Europe/Stockholm'}) === tomorrow.toLocaleDateString('sv-SE',{timeZone:'Europe/Stockholm'});
  const time = date.toLocaleTimeString(locale, {timeZone:'Europe/Stockholm', hour: '2-digit', minute: '2-digit' });
  if (lang === 'en') {
    if (isToday) return `Opens ${time}`;
    if (isTomorrow) return `Opens tomorrow ${time}`;
    return `Opens ${date.toLocaleDateString(locale, {timeZone:'Europe/Stockholm', weekday: 'long' })} ${time}`;
  }
  if (lang === 'ar') {
    if (isToday) return `يفتح ${time}`;
    return `يفتح ${date.toLocaleDateString(locale, {timeZone:'Europe/Stockholm', weekday: 'long' })} ${time}`;
  }
  if (isToday) return `Öppnar ${time}`;
  if (isTomorrow) return `Öppnar imorgon ${time}`;
  return `Öppnar ${date.toLocaleDateString(locale, {timeZone:'Europe/Stockholm', weekday: 'long' })} ${time}`;
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
