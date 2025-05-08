// app/api/webhook/stripe/route.js
import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';
import { syncStripeDataToKV } from '../../../../lib/syncStripeDataToKV';

// Disable Next.js body parsing so Stripe can read the raw bytes
export const config = {
  api: { bodyParser: false },
};

// The list of events we actually care about:
const allowedEvents = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'customer.subscription.pending_update_applied',
  'customer.subscription.pending_update_expired',
  'customer.subscription.trial_will_end',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.payment_action_required',
  'invoice.upcoming',
  'invoice.marked_uncollectible',
  'invoice.payment_succeeded',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.canceled',
];

/**
 * Main POST handler:
 *   1) Read raw body + signature
 *   2) Construct & verify event
 *   3) "processEvent(event)" to handle logic
 */
export async function POST(request) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  // Convert to buffer for Stripe verification
  const bodyBuffer = Buffer.from(await request.arrayBuffer());
  let event;

  // Attempt to verify the signature & parse event
  try {
    event = stripe.webhooks.constructEvent(
      bodyBuffer,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[STRIPE HOOK] Signature verification error:', err);
    return NextResponse.json({ error: 'Webhook Error: ' + err.message }, { status: 400 });
  }

  // Attempt to process the event
  try {
    await processEvent(event);
  } catch (err) {
    console.error('[STRIPE HOOK] Error processing event:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  // Acknowledge receipt
  return NextResponse.json({ received: true }, { status: 200 });
}

/**
 * processEvent(event):
 *   - Checks if event.type is allowed
 *   - Extracts "customer" from event data
 *   - Calls syncStripeDataToKV(customerId, event)
 */
async function processEvent(event) {
  if (!allowedEvents.includes(event.type)) {
    console.log(`[STRIPE HOOK] Ignoring event type: ${event.type}`);
    return; // skip
  }

  const { customer: customerId } = event.data?.object || {};
  if (typeof customerId !== 'string') {
    throw new Error(`[STRIPE HOOK] No valid customer ID found in event ${event.type}`);
  }

  // Pass the entire event so that we can detect one-time purchases
  await syncStripeDataToKV(customerId, event);
}
