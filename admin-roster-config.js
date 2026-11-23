/* Supabase publishable key is safe for browser use. Staff access is enforced by
   email verification + Supabase Row Level Security on each private roster table.
   NEVER place a Stripe secret, Supabase service_role or database password here.
*/
window.FSA_ROSTER_CONFIG = Object.freeze({
  supabaseUrl: "https://rxhkfyfjdzmurqgzbxad.supabase.co",
  supabasePublishableKey: "sb_publishable_zwEyh4TIDaop8M3r0QPWHA_0aHkLCWQ"
});