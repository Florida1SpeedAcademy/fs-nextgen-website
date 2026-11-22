# FS NextGen — Private Paid Athlete Roster (staged, NOT activated)

## Purpose
Give authorized Florida Speed Academy staff a private 2027 track roster with:
- Athlete name, guardian name/email, season, and program
- $50 track deposit and $225 track balance payments from **the two VERIFIED existing Stripe payment links**
- Counts, paid/partial/unpaid filters, outstanding balances, CSV export, unmatched Stripe sessions
- Stripe webhook signature verification, payment-link allowlist, refund adjustment
- Supabase Auth email links + database Row Level Security (RLS)

No athlete, guardian, or payment data is embedded into any static HTML, JavaScript, or GitHub commit. The public website's other pages, media, Stripe payment links, and site branding are not changed.

## Deployment gate — do not merge until ALL are complete
1. Connect the owner-controlled Supabase project that currently serves
   https://rxhkfyfjdzmurqgzbxad.supabase.co. Confirm its existing tables and
   the existing fs-register function BEFORE modifying it.
2. Review/apply supabase/migrations/20261122_private_paid_roster.sql.
3. In Supabase Auth, create/invite the approved staff user, then INSERT their
   exact auth.users.id into fsa_roster_admins using SQL editor (see migration).
   Do not automatically grant access to every signed-in account.
4. Put the Supabase PUBLIC publishable or anon key in admin-roster-config.js.
   Never add a secret/service_role key or Stripe secret to GitHub.
5. Configure server-side Supabase function secrets STRIPE_SECRET_KEY,
   STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
6. Deploy BOTH Supabase Edge Functions. Set verify_jwt=false for those endpoints;
   the Stripe function verifies the STRIPE-SIGNATURE, the registration function
   validates required consent and input and restricts browser CORS origins.
   Add rate-limiting / bot protection before heavy public traffic.
7. In the STRIPE LIVE account "Florida Speed Academy, NonProfit", create a webhook
   endpoint https://rxhkfyfjdzmurqgzbxad.supabase.co/functions/v1/fsa-stripe-webhook
   for checkout.session.completed, checkout.session.async_payment_succeeded,
   charge.refunded. Copy the resulting webhook signing secret ONLY into Supabase.
8. Existing current payment link IDs:
   $50 hold: plink_1UcQoFRtTXb4mzw1dhLgmqG2
   $225 track registration balance: plink_1UcQlJRtTXb4mzw17ObxPkXc
   Do not include donations, Florida Grand Prix parking, or uniform payment
   links in roster paid totals. Other historical links require manual review.
9. Reconcile historical athlete registrations from the PRE-EXISTING fs-register
   storage into the new roster table. Reprocess legitimate historical paid
   Stripe sessions (e.g. by Stripe webhook event resend) AFTER those roster
   references are available. Otherwise older valid payments appear unmatched.
   Never join Stripe charges to minors by name or email without verification.
10. Test a staff login, nonstaff denied access, unauthenticated denied access,
    paid and unpaid registrations, expired checkout, duplicate sessions,
    refunds, and a real-mode webhook signature TEST (not a real charge).
    Only then merge this branch and deploy the static site.
11. Ensure the signing-in admin email has the domain's Supabase Auth redirect URL
    https://floridaspeedacademy.com/admin-roster.html permitted in Auth config.

## What is staged in this branch
- admin-roster.html, admin-roster.js, admin-roster-config.js
- supabase migration + Edge Functions + config.toml
- roster-connection.js changed ONLY on this branch to POST to fsa-roster-register
- NO live database changes; NO Stripe webhook registered; NO live website deploy.

## Important constraints
- A static GitHub Pages page cannot securely store private rosters or Stripe keys.
  All records must remain in Supabase with RLS; webhook secrets stay server-side.
- Auth email link login does not grant admin status. The fsa_roster_admins table
  controls access. No admin self-registration.
- The site currently represents 2027 track as a $275 total: a $50 creditable hold
  followed by $225. Validate commercial terms before changing these numbers.
- The private roster is NOT a signed parental consent form or enrollment approval.
- The roster uses 1,000-record safety limits; add secure pagination if exceeded.
- Avoid public linking of the admin page for privacy; however secrecy of URL is
  NOT used as an access control.
