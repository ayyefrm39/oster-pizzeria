import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

/**
 * Public order lookup for the customer's own confirmation page.
 * Access is granted only by the long random tracking token created with the order.
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

    return Response.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        status: order.status,
        items: order.items || [],
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        estimatedReadyTime: order.estimatedReadyTime,
        scheduledFor: order.scheduledFor || '',
        customerNotes: order.customerNotes || '',
        customerName: (order.customer && order.customer.name) || '',
        customerPhone: (order.customer && order.customer.phone) || '',
        deliveryAddress: order.deliveryAddress || {},
        created_date: order.created_date,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
