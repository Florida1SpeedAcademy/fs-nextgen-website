// Secure Supabase Edge Function: fsa-roster-register.
// Deploy only after the private roster migration. Uses service role on the server,
// never in the public website. Does NOT collect DOB, addresses, or medical details.
import { createClient } from "npm:@supabase/supabase-js@2.84.0";

const allowedOrigins = new Set([
  "https://floridaspeedacademy.com",
  "https://www.floridaspeedacademy.com"
]);
const TRACK = "Track & Field — $225 registration";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const badControl = /[\u0000-\u001f\u007f]/;
const env = (name: string) => Deno.env.get(name) || "";

function json(body: unknown, status: number, origin: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Vary": "Origin",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type"
    }
  });
}
function field(input: Record<string, unknown>, key: string, max: number): string | null {
  const v = input[key];
  if (typeof v !== "string") return null;
  const text = v.trim();
  return text && text.length <= max && !badControl.test(text) ? text : null;
}
Deno.serve(async request => {
  const origin = request.headers.get("origin") || "";
  if (!allowedOrigins.has(origin)) return new Response("Forbidden", { status: 403 });
  if (request.method === "OPTIONS") return json({}, 200, origin);
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  if (Number(request.headers.get("content-length") || 0) > 8000) return json({ error: "Too large" }, 413, origin);
  let data: Record<string, unknown>;
  try {
    data = await request.json();
    if (!data || Array.isArray(data) || typeof data !== "object") throw Error();
  } catch {
    return json({ error: "Invalid JSON" }, 400, origin);
  }
  const submission = field(data, "submission_key", 36);
  const first = field(data, "first_name", 80);
  const last = field(data, "last_name", 80);
  const guardian = field(data, "guardian_name", 100);
  const email = field(data, "email", 150)?.toLowerCase();
  const phone = field(data, "phone", 40);
  if (data.consent !== true || data.program !== TRACK || !submission || !uuid.test(submission) ||
      !first || !last || !guardian || !phone || !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Invalid registration" }, 422, origin);
  }
  const url = env("SUPABASE_URL");
  const secret = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !secret) return json({ error: "Registration temporarily unavailable" }, 503, origin);
  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const row = {
    submission_key: submission, first_name: first, last_name: last,
    guardian_name: guardian, guardian_email: email, guardian_phone: phone,
    program: TRACK, season: 2027, total_due_cents: 27500
  };
  const result = await db.from("fsa_athlete_roster").insert(row).select("id").single();
  if (!result.error) return json({ registration_id: result.data.id }, 201, origin);
  // A retry with the same submission key must not create a second athlete.
  if (result.error.code === "23505") {
    const existing = await db.from("fsa_athlete_roster")
      .select("id,first_name,last_name,guardian_email").eq("submission_key", submission).maybeSingle();
    if (existing.error || !existing.data ||
        existing.data.guardian_email !== email ||
        existing.data.first_name !== first || existing.data.last_name !== last) {
      return json({ error: "Reference already used" }, 409, origin);
    }
    return json({ registration_id: existing.data.id }, 200, origin);
  }
  console.error("roster insert failed", result.error.code);
  return json({ error: "Could not save registration" }, 503, origin);
});