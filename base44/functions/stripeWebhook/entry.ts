import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { retrieveSession, markOrderPaid } from '../../shared/stripe.ts';

function hex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function validSignature(payload, header, secret) {
  const parts = {};
  String(header || '').split(',').forEach((kv) => {
    const i = kv.indexOf('=');
    if (i > 0) parts[kv.slice(0, i)] = kv.slice(i + 1);
  });
  if (!parts.t || !parts.v1) return false;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(parts.t + '.' + payload));
  return hex(signature) === parts.v1;
}

function extractSessionId(raw) {
  try {
    const parsed = JSON.parse(raw);
    const object = parsed && parsed.data && parsed.data.object;
    if (object && object.object === 'checkout.session') return object.id;
  } catch (e) { /* not JSON */ }
  try {
    return new URLSearchParams(raw).get('data[object][id]');
  } catch (e) {
    return null;
  }
}

/**
 * Stripe webhook. Authenticity is established two ways:
 *  - with STRIPE_WEBHOOK_SECRET set, the signature is verified over the raw body;
 *  - otherwise the referenced Checkout Session is re-fetched from Stripe with the
 *    server-side secret key, so an unverified caller can never mark an order paid.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const raw = await req.text();
    const webhookSecret = secrets.get('STRIPE_WEBHOOK_SECRET');

    let sessionId = null;
    let eventType = null;

    if (webhookSecret) {
      const header = req.headers.get('stripe-signature');
      if (!header) return Response.json({ error: 'Missing signature' }, { status: 400 });
      if (!(await validSignature(raw, header, webhookSecret))) {
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
      let event = {};
      try { event = JSON.parse(raw); } catch (e) { event = {}; }
      eventType = event.type;
      sessionId = event.data && event.data.object && event.data.object.object === 'checkout.session'
        ? event.data.object.id
        : null;
    } else {
      sessionId = extractSessionId(raw);
      if (!sessionId) return Response.json({ error: 'Missing session' }, { status: 400 });
    }

    if (!sessionId) return Response.json({ received: true, ignored: true });

    let session = null;
    try { session = await retrieveSession(sessionId); } catch (e) { session = null; }
    if (!session) return Response.json({ error: 'Unknown session' }, { status: 400 });

    const orderId = session.metadata && session.metadata.orderId;
    if (orderId && session.payment_status === 'paid') {
      await markOrderPaid(base44, orderId, session.id, session.payment_intent);
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
