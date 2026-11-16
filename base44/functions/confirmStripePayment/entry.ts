import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { retrieveSession, markOrderPaid } from '../../shared/stripe.ts';

/**
 * Verifies the payment directly against Stripe with the server-side secret key.
 * The caller proves ownership of the order with its long random tracking token.
 */
export default async function (req) {
  try {
    const { orderId, token } = await req.json().catch(() => ({}));
    if (!orderId || !token) return Response.json({ error: 'orderId och token krävs' }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const order = await base44.asServiceRole.entities.Order
      .get(orderId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!order || !order.trackingToken || order.trackingToken !== token) {
      return Response.json({ error: 'Beställningen hittades inte' }, { status: 404 });
    }
    if (order.paymentStatus === 'paid') return Response.json({ paid: true, paymentStatus: 'paid' });
    if (order.paymentMethod !== 'stripe' || !order.stripeSessionId) {
      return Response.json({ paid: false, paymentStatus: order.paymentStatus });
    }

    const session = await retrieveSession(order.stripeSessionId);
    if (session && session.payment_status === 'paid' && session.metadata && session.metadata.orderId === orderId) {
      await markOrderPaid(base44, orderId, session.id, session.payment_intent);
      return Response.json({ paid: true, paymentStatus: 'paid' });
    }
    return Response.json({ paid: false, paymentStatus: order.paymentStatus });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
