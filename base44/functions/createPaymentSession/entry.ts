import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { createCheckoutSession, appOrigin } from '../../shared/stripe.ts';

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
    if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') {
      return Response.json({ error: 'Beställningen är redan betald' }, { status: 409 });
    }
    if (order.status === 'rejected' || order.status === 'cancelled') {
      return Response.json({ error: 'Beställningen är avbruten' }, { status: 409 });
    }

    const session = await createCheckoutSession(order, appOrigin(req));
    await base44.asServiceRole.entities.Order.update(order.id, { stripeSessionId: session.id, paymentStatus: 'pending' });
    return Response.json({ checkoutUrl: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
