# Florida Speed Academy / FS NextGen Athletics — COMPLETE 2027 WEBSITE

This is the complete, unchanged website assembled from the latest approved version.

## Website pages
- `index.html` — Homepage, lion countdown, all 20 athlete photos, program and registration highlights, and team store packages.
- `store.html` — Separate Boys and Girls five-piece apparel packages, original merchandise images and working $150 Stripe links.
- `registration.html` — 2027 AAU/athlete registration information, print/save sports consent form, and the separate $150 registration Stripe checkout.
- `assets/brand-theme.css` — unified Royal Blue #005BFF, Yellow #FFE200, Graphite #24272B site theme.
- `assets/fs-lion-hero.png` — owner's official lion on a transparent background.
- `photos/` — all 20 original athlete photos.
- `store/` — 11 original product design images.
- `checkout-config.js` — the two public apparel Stripe links (no secret keys).

## Fees and Stripe
- Boys apparel package: $150 once — https://buy.stripe.com/14A14p8cm2619DV0bhcAo02
- Girls apparel package: $150 once — https://buy.stripe.com/3cIbJ3fEOeSNcQ76zFcAo03
- 2027 athlete registration: $150 once — https://buy.stripe.com/8x24gBeAKh0VdUbgafcAo04
- $50 spot hold indicated for December 1, 2026, with $150 registration fee due by January 15, 2027. The $50 payment link is NOT activated; whether it credits the $150 amount has not been clarified.
- Registration is separate from the two apparel products. Stripe payments are live even though the updated website files have NOT been published yet.

## Privacy and consent form
The registration form is printable/saveable to PDF. Sensitive information (especially a minor's medical details) is NOT automatically submitted, emailed, saved to a server, or transmitted to Stripe by that on-site form. Families must deliver the completed form by a secure, team-approved method. The Stripe checkout collects its own payment details and a limited set of athlete information; it does not receive the completed consent form. Team staff must verify payment and registration before roster approval. Do not post athlete medical information in messages or checkout fields.

## Publish to existing GitHub Pages
1. Back up your current site/repository.
2. Extract this ZIP and upload **all the files and folders inside the ZIP** directly into your GitHub Pages publishing root. Do not upload the ZIP itself as a webpage.
3. Keep your existing `CNAME` and domain settings; **this package does not include `CNAME`**.
4. Commit the upload and open `https://floridaspeedacademy.com`, `/store.html`, and `/registration.html`.
5. Check the logo, all images, register/print controls and all three Stripe links. Those are live charge links: do not complete a real charge just to test.

No server, Firebase configuration, medical data handling, secret Stripe keys, or automatic enrollment backend is included. Your apparel/registration payment verification and fulfillment remain manual. Before adding automatic enrollment or notifications, implement signature-verified Stripe webhooks on a secure backend. Review any applicable sales tax on physical goods and shipping arrangements separately.


## One-click photo gallery update
- Added `gallery.html` with all 20 original athlete photos and the ability to click a photo for a larger view.
- The homepage `index.html` contains one Photo Gallery link in the hero and one dedicated Gallery button instead of displaying a long grid of photos.
- `registration.html`, `store.html`, `checkout-config.js`, logo, theme, all photos and all product images are unchanged.
- If you already uploaded the previous complete website, only `index.html` (replace) and `gallery.html` (new) are needed for this specific update; everything else already exists.
- Keep your existing CNAME file and any deployment workflow files.


## Three new team photos (2026-10-25)
- Added team practice at sunset, a long-jump action shot, and competition day photo as first three in `gallery.html`.
- Gallery now has 23 photos; image click-to-enlarge works as before. The homepage stays clear of a photo grid.
- To update an existing GitHub Pages site with the one-click gallery already installed, upload **only** `gallery.html` and the **three new JPEGs under `photos/`**. Preserve the existing `CNAME`.

## Community donations section (latest)
- Homepage now includes a **Support Our Athletes** section, supporting educational resources, tutoring, counseling and team-connected physical therapy support, as appropriate/available.
- The donation button goes to the existing verified ACTIVE LIVE Stripe Donations Payment Link. It is **not** a registration or apparel checkout.
- All original site pages (homepage, 23-photo gallery, registration/consent, two-package store), logo, colors and images preserved.
- Donations are never assumed tax-deductible for a particular donor; tax/receipt details belong in Stripe and organizational policy.
- To apply ONLY this change if existing 23-photo gallery already deployed, upload the new `index.html` alone. Keep your current `CNAME` and all other files.
