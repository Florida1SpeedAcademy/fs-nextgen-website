# Florida Speed Academy — Private Paid Athlete Roster

## Status (November 22, 2026)
The Supabase project `rxhkfyfjdzmurqgzbxad` is connected and the existing
`roster_registrations` and `roster_payments` tables are used directly.

The existing public registration function (`fs-register`) and live signature-
verified Stripe webhook (`fs-stripe-webhook`) remain in place and are not
replaced. Existing records remain untouched.

The following Supabase migrations were applied:
- `allow_staff_paid_roster_existing_tables_and_season_dues`
- `expose_authenticated_roster_staff_check`

They added: staff email allowlist restricted to
`floridaspeedacademy@gmail.com`; read-only RLS policies on the existing
roster, payment, and review tables; private staff-check function; season-package
assignments; and a plan change audit log.

Anonymous roster reads are denied. A signed-in but unapproved session sees
zero registrations. Administrative email confirmation and an allowlist match are
required to access records.

## Frontend files
- `admin-roster.html` — mobile-responsive secure staff dashboard
- `admin-roster.js` — staff Auth check, roster and payments from existing tables,
  searchable list, package assignments, balances, CSV export, review queue
- `admin-roster-config.js` — **public** Supabase project URL and publishable key

No Stripe keys, service-role secrets, passwords, or minor data are stored in
GitHub Pages. Public URL obscurity is never used as access control.

## Initial staff login (user action)
There are not yet any Supabase Auth users. Once the site page is published,
staff should enter the approved email address to request a one-time login link.
The code uses `shouldCreateUser: true` to allow first-time activation.
Newly created accounts NOT on the private staff allowlist remain unable to read
the roster. No automatic staff status is conferred by signing up.

In the Supabase dashboard, visit:
https://supabase.com/dashboard/project/rxhkfyfjdzmurqgzbxad/auth/url-configuration

Add `https://floridaspeedacademy.com/admin-roster.html` as an authorized
redirect URL (and verify the Site URL is set appropriately). If the email
service reports a sending limitation, configure SMTP in Auth settings.

## Price model and calculations
- Indoor package: $150
- Outdoor package: $275
- Combined indoor + outdoor: $300

Do not infer an athlete package from the old generic $225 registration
description. Staff explicitly selects a package on each athlete row.
Until then, the athlete has no calculated outstanding balance.

The paid amount is the sum of existing signature-verified payment rows.
When a Stripe refund or dispute has been flagged, that payment is withheld
from credited totals and shown in the review queue. Payments and enrollment
approval are separate; `staff_clearance` remains unchanged.

Staff may export the visible filtered rows to CSV; the spreadsheet contains
guardian contacts and must be handled as private information. Plan changes
are logged by user in `roster_due_audit`.

## Test before routine use
1. Publish `admin-roster.html`, `admin-roster.js`, and
   `admin-roster-config.js` to GitHub Pages.
2. Set the allowed Auth redirect in Supabase.
3. Log in using the approved email, then confirm all existing registrations
   and the one existing $50 matched Stripe hold are visible.
4. Try an unapproved account: it must NOT see athletes or guardian contacts.
5. Assign a plan to an athlete and verify the balances update. Only assign
   the plan actually chosen by the parent; do not use a random athlete as
   a test. Check the audit log.
6. Check mobile layout, CSV export privacy, sign-out, and refresh.

## Existing data verified during setup
- 6 2027 registration requests
- 1 matched verified $50 hold payment
- 0 program plans assigned
- 0 currently unresolved webhook issues or payment flags

The admin dashboard does not alter old payment records, payment links,
Stripe secrets, registration form, other programs, or site branding.
