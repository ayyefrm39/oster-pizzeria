import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { createCheckoutSession, appOrigin } from '../../shared/stripe.ts';

const DAY_MAP = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function toMinutes(value) {
  const parts = String(value || '0:0').split(':');
  return (Number(parts[0]) || 0) * 60 + (Number(parts[1]) || 0);
}

function isOpenNow(hours) {
  if (!Array.isArray(hours) || hours.length === 0) return true;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Stockholm', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const idx = DAY_MAP[parts.find((p) => p.type === 'weekday').value];
  const now = (Number(parts.find((p) => p.type === 'hour').value) % 24) * 60
    + Number(parts.find((p) => p.type === 'minute').value);
  const yesterday = (idx + 6) % 7;
  return hours.some((entry) => {
    const open = toMinutes(entry.open);
    const close = toMinutes(entry.close);
    if (entry.closesNextDay) {
      return (entry.day === idx && now >= open) || (entry.day === yesterday && now < close);
    }
    return entry.day === idx && now >= open && now < close;
  });
}

function clean(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function priceLine(line, menuItem) {
  const groups = menuItem.optionGroups || [];
  let unit = Number(menuItem.price) || 0;
  let sizeName = null;

  const sizeGroup = groups.find((g) => g.type === 'size');
  if (line.size) {
    const opt = sizeGroup && sizeGroup.options.find((o) => o.name === line.size);
    if (!opt) return null;
    unit += Number(opt.price) || 0;
    sizeName = opt.name;
  }

  const extras = [];
  for (const name of Array.isArray(line.extras) ? line.extras : []) {
    const group = groups.find((g) => g.type !== 'remove' && g.options.some((o) => o.name === name));
    const opt = group && group.options.find((o) => o.name === name);
    if (!opt) return null;
    unit += Number(opt.price) || 0;
    extras.push(name);
  }

  return { unit, sizeName, extras };
}

export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderType, customer, deliveryAddress, items, customerNotes, paymentMethod, scheduledFor } = body || {};

    if (orderType !== 'pickup' && orderType !== 'delivery') {
      return Response.json({ error: 'Ogiltigt beställningssätt.' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return Response.json({ error: 'Varukorgen är tom eller för stor.' }, { status: 400 });
    }
    if (!customer || !clean(customer.name, 80) || clean(customer.phone, 30).length < 6) {
      return Response.json({ error: 'Namn och telefonnummer krävs.' }, { status: 400 });
    }
    if (paymentMethod !== 'stripe' && paymentMethod !== 'cash') {
      return Response.json({ error: 'Ogiltigt betalsätt.' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const settingsList = await base44.asServiceRole.entities.RestaurantSettings.list();
    const settings = (settingsList && settingsList[0]) || {};

    if (settings.ordersPaused) {
      return Response.json({ error: 'Onlinebeställningar är tillfälligt pausade. Försök igen senare.' }, { status: 409 });
    }
    if (!settings.acceptPreOrders && !isOpenNow(settings.openingHours)) {
      return Response.json({ error: 'Restaurangen är stängd just nu.' }, { status: 409 });
    }
    if (orderType === 'delivery' && settings.deliveryEnabled === false) {
      return Response.json({ error: 'Hemleverans är inte tillgänglig just nu.' }, { status: 409 });
    }
    if (orderType === 'pickup' && settings.pickupEnabled === false) {
      return Response.json({ error: 'Avhämtning är inte tillgänglig just nu.' }, { status: 409 });
    }

    const ids = [...new Set(items.map((i) => i && i.itemId).filter(Boolean))];
    if (ids.length === 0) return Response.json({ error: 'Ogiltiga rätter.' }, { status: 400 });
    const menuItems = await base44.asServiceRole.entities.MenuItem.filter({ id: { $in: ids } });
    const byId = Object.fromEntries(menuItems.map((m) => [m.id, m]));

    let subtotal = 0;
    const priced = [];
    for (const line of items) {
      const menuItem = byId[line && line.itemId];
      if (!menuItem || menuItem.active === false || menuItem.soldOut === true) {
        return Response.json({ error: 'En rätt i varukorgen är inte längre tillgänglig.' }, { status: 409 });
      }
      const qty = Math.floor(Number(line.qty));
      if (!qty || qty < 1 || qty > 50) {
        return Response.json({ error: 'Ogiltigt antal.' }, { status: 400 });
      }
      const resolved = priceLine(line, menuItem);
      if (!resolved) {
        return Response.json({ error: 'Ogiltigt tillval eller storlek.' }, { status: 400 });
      }
      subtotal += resolved.unit * qty;
      priced.push({
        name: menuItem.name + (resolved.sizeName ? ' (' + resolved.sizeName + ')' : ''),
        qty,
        price: resolved.unit,
        basePrice: Number(menuItem.price) || 0,
        extras: resolved.extras,
        size: resolved.sizeName || '',
        notes: clean(line.notes, 300),
      });
    }

    let deliveryFee = 0;
    if (orderType === 'delivery') {
      const minOrder = Number(settings.minDeliveryOrder) || 0;
      if (subtotal < minOrder) {
        return Response.json({ error: 'Minsta beställning för leverans är ' + minOrder + ' kr.' }, { status: 409 });
      }
      const freeOver = Number(settings.freeDeliveryThreshold) || 0;
      deliveryFee = freeOver > 0 && subtotal >= freeOver ? 0 : (Number(settings.deliveryFee) || 0);
    }
    const total = subtotal + deliveryFee;

    const recent = await base44.asServiceRole.entities.Order.list('-orderNumber', 1);
    const highest = recent && recent.length ? Number(recent[0].orderNumber) || 1041 : 1041;
    const orderNumber = Math.max(highest + 1, 1042);

    const address = deliveryAddress || {};
    const order = await base44.asServiceRole.entities.Order.create({
      orderNumber,
      orderType,
      status: 'pending',
      customer: { name: clean(customer.name, 80), phone: clean(customer.phone, 30) },
      deliveryAddress: orderType === 'delivery'
        ? {
            street: clean(address.street, 120),
            postal: clean(address.postal, 12),
            city: clean(address.city, 60),
            apartment: clean(address.apartment, 20),
            floor: clean(address.floor, 20),
            instructions: clean(address.instructions, 300),
          }
        : {},
      items: priced,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'stripe' ? 'pending' : 'unpaid',
      trackingToken: crypto.randomUUID(),
      customerNotes: clean(customerNotes, 300),
      estimatedReadyTime: Number(settings.estimatedPrepTime) || 25,
      scheduledFor: clean(scheduledFor, 40),
      isDemo: false,
    });

    if (paymentMethod === 'cash') {
      return Response.json({ orderId: order.id, token: order.trackingToken, checkoutUrl: null });
    }

    const session = await createCheckoutSession(order, appOrigin(req));
    await base44.asServiceRole.entities.Order.update(order.id, { stripeSessionId: session.id });
    return Response.json({ orderId: order.id, token: order.trackingToken, checkoutUrl: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
