const API = 'https://api.stripe.com/v1';

function secretKey() {
  const k = secrets.get('STRIPE_SECRET_KEY');
  if (!k) throw new Error('Stripe-nyckeln saknas i appens hemligheter.');
  return k;
}

function encodeForm(value, prefix, out) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => encodeForm(item, prefix + '[' + i + ']', out));
  } else if (value && typeof value === 'object') {
    Object.keys(value).forEach((k) => {
      if (value[k] === undefined || value[k] === null) return;
      encodeForm(value[k], prefix ? prefix + '[' + k + ']' : k, out);
    });
  } else if (value !== undefined && value !== null) {
    out.push(encodeURIComponent(prefix) + '=' + encodeURIComponent(String(value)));
  }
  return out;
}

export async function stripeRequest(method, path, body) {
  const headers = { Authorization: 'Bearer ' + secretKey() };
  let payload;
  if (body) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    payload = encodeForm(body, '', []).join('&');
  }
  const res = await fetch(API + path, { method, headers, body: payload, signal: AbortSignal.timeout(20000) });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
  if (!res.ok) {
    const message = data && data.error && data.error.message ? data.error.message : 'Stripe-fel (' + res.status + ')';
    const err = new Error(message);
    err.stripe = true;
    throw err;
  }
  return data;
}

export function appOrigin(req) {
  const header = req.headers.get('X-Base44-App-Url');
  const origin = header || new URL(req.url).origin;
  return origin.replace(/\/$/, '');
}

export function sessionLineItems(order) {
  const lines = (order.items || []).map((line) => ({
    price_data: {
      currency: 'sek',
      unit_amount: Math.round(Number(line.price) * 100),
      product_data: { name: String(line.name).slice(0, 120) },
    },
    quantity: Number(line.qty),
  }));
  if (Number(order.deliveryFee) > 0) {
    lines.push({
      price_data: {
        currency: 'sek',
        unit_amount: Math.round(Number(order.deliveryFee) * 100),
        product_data: { name: 'Leveransavgift' },
      },
      quantity: 1,
    });
  }
  return lines;
}

export async function createCheckoutSession(order, origin) {
  const back = origin + '/order/' + order.id + '?token=' + encodeURIComponent(order.trackingToken);
  return stripeRequest('POST', '/checkout/sessions', {
    mode: 'payment',
    locale: 'sv',
    client_reference_id: order.id,
    success_url: back + '&betald=1',
    cancel_url: back + '&avbruten=1',
    metadata: { orderId: order.id, orderNumber: String(order.orderNumber) },
    line_items: sessionLineItems(order),
  });
}

export async function retrieveSession(sessionId) {
  if (!sessionId) return null;
  return stripeRequest('GET', '/checkout/sessions/' + encodeURIComponent(sessionId), null);
}

/** Idempotent: a paid order is never marked twice. */
export async function markOrderPaid(base44, orderId, sessionId, paymentIntentId) {
  const order = await base44.asServiceRole.entities.Order
    .get(orderId)
    .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
  if (!order) return null;
  if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') return order;
  return base44.asServiceRole.entities.Order.update(orderId, {
    paymentStatus: 'paid',
    paidAt: new Date().toISOString(),
    stripeSessionId: sessionId || order.stripeSessionId || '',
    stripePaymentIntentId: paymentIntentId || order.stripePaymentIntentId || '',
  });
}
