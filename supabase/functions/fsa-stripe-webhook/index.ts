// Supabase Edge Function: fsa-stripe-webhook
// Configure with verify_jwt = false. Stripe signature verification is mandatory.
// Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET as Supabase FUNCTION SECRETS.
// This function never trusts browser payment claims or counts unrelated sales.
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.84.0";

const EXPECTED = new Map([
  ["plink_1UcQoFRtTXb4mzw1dhLgmqG2", 5000],  // 2027 track hold
  ["plink_1UcQlJRtTXb4mzw17ObxPkXc", 22500]  // 2027 track balance
]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const secret = Deno.env.get("STRIPE_SECRET_KEY") || "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const dbUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const stripe = new Stripe(secret, { httpClient: Stripe.createFetchHttpClient() });
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const admin = createClient(dbUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const reply = (status: number, message: string) =>
  new Response(message, { status, headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" } });

function id(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "string") return value.id;
  return null;
}
async function syncSession(session: Stripe.Checkout.Session, eventId: string) {
  const linkId = id(session.payment_link);
  if (!linkId || !EXPECTED.has(linkId)) return;
  if (session.mode !== "payment" || session.payment_status !== "paid" ||
      session.currency?.toLowerCase() !== "usd" || session.amount_total !== EXPECTED.get(linkId)) return;
  const key = session.client_reference_id || "";
  let rosterId: string | null = null;
  if (uuid.test(key)) {
    const found = await admin.from("fsa_athlete_roster").select("id").eq("id", key).maybeSingle();
    if (found.error) throw found.error;
    if (found.data) rosterId = found.data.id;
  }
  const paymentIntentId = id(session.payment_intent);
  let refunded = 0;
  if (paymentIntentId) {
    // Handles a refund that happened before we processed the checkout event.
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge"] });
    const charge = pi.latest_charge;
    if (charge && typeof charge !== "string") refunded = Math.max(0, charge.amount_refunded || 0);
  }
  const status = refunded >= (session.amount_total || 0) ? "refunded"
    : refunded > 0 ? "partially_refunded" : "paid";
  const item = {
    checkout_session_id: session.id,
    registration_id: rosterId,
    stripe_payment_intent_id: paymentIntentId,
    stripe_payment_link_id: linkId,
    amount_cents: session.amount_total,
    amount_refunded_cents: refunded,
    payment_status: status,
    currency: "usd",
    created_at: new Date((session.created || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
    last_verified_at: new Date().toISOString(),
    stripe_event_id: eventId
  };
  const inserted = await admin.from("fsa_roster_payments").upsert(item, { onConflict: "checkout_session_id" });
  if (inserted.error) throw inserted.error;
}
async function syncRefund(charge: Stripe.Charge, eventId: string) {
  const intentId = id(charge.payment_intent);
  if (!intentId) return;
  const found = await admin.from("fsa_roster_payments")
    .select("checkout_session_id,amount_cents,amount_refunded_cents")
    .eq("stripe_payment_intent_id", intentId);
  if (found.error) throw found.error;
  for (const r of found.data || []) {
    const refunded = Math.max(r.amount_refunded_cents || 0, charge.amount_refunded || 0);
    const status = refunded >= r.amount_cents ? "refunded" : refunded > 0 ? "partially_refunded" : "paid";
    const saved = await admin.from("fsa_roster_payments")
      .update({ amount_refunded_cents: refunded, payment_status: status,
        last_verified_at: new Date().toISOString(), stripe_event_id: eventId })
      .eq("checkout_session_id", r.checkout_session_id);
    if (saved.error) throw saved.error;
  }
}
Deno.serve(async request => {
  if (request.method !== "POST") return reply(405, "Method not allowed");
  if (!secret || !webhookSecret || !dbUrl || !serviceKey) return reply(503, "Not configured");
  const signature = request.headers.get("stripe-signature");
  if (!signature) return reply(400, "Missing signature");
  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = await stripe.webhooks.constructEventAsync(rawBody, signature,
      webhookSecret, undefined, cryptoProvider);
  } catch {
    return reply(400, "Invalid signature");
  }
  try {
    if (event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded") {
      await syncSession(event.data.object as Stripe.Checkout.Session, event.id);
    } else if (event.type === "charge.refunded") {
      await syncRefund(event.data.object as Stripe.Charge, event.id);
    }
    return reply(200, "OK");
  } catch (error) {
    console.error("Webhook processing failed", event.id, String(error));
    return reply(500, "Retry later");
  }
});