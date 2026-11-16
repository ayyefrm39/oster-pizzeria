import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { stripeRequest } from '../../shared/stripe.ts';

/** Admin only: refunds a paid Stripe payment in full. */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { orderId } = await req.json().catch(() => ({}));
    if (!orderId) return Response.json({ error: 'orderId krävs' }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order
      .get(orderId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!order) return Response.json({ error: 'Beställningen hittades inte' }, { status: 404 });
    if (order.paymentStatus === 'refunded') return Response.json({ refunded: true, alreadyRefunded: true });
    if (order.paymentStatus !== 'paid' || !order.stripePaymentIntentId) {
      return Response.json({ error: 'Endast betalda kortbetalningar kan återbetalas.' }, { status: 409 });
    }

    await stripeRequest('POST', '/refunds', { payment_intent: order.stripePaymentIntentId });
    await base44.asServiceRole.entities.Order.update(order.id, {
      paymentStatus: 'refunded',
      refundedAt: new Date().toISOString(),
      refundAmount: order.total,
    });
    return Response.json({ refunded: true, amount: order.total });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
