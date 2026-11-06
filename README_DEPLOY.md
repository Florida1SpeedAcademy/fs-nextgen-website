# Florida Speed Academy / FS NextGen Athletics — 2027 Site Revamp

This is a **fresh, responsive, multipage, GitHub Pages-ready static website** replacing the previous desktop homepage that was a flattened image with click hotspots. There is **no loading-screen countdown**. The homepage, menus, cards and calls to action are real HTML elements.

## Deploying on GitHub Pages
1. BACK UP the current live repository before making any changes. This ZIP is a clean replacement site, **not a verified snapshot of the deployed repository**.
2. Unzip the package. Upload the **files and folders at the root of this ZIP** to the repository's GitHub Pages publishing directory (usually root on the selected branch), retaining folder paths. Do not upload the ZIP itself as `index.html`.
3. Keep any existing live backend, checkout or external integration files that are not included here until you review and migrate them.
4. After deploying, check `index.html`, every navigation link, mobile menu, store inquiry, registration email and uniform email flow on phone and desktop. Check GitHub Pages settings if the domain still displays the previous homepage. Hard refresh when cache persists.
5. GitHub Pages uses `index.html` for the homepage. `7v7.html`, `meet-schedule.html`, and `watch-countdown.html` redirect to their appropriate new destinations for legacy links.

## Pages
- `index.html`: completely rebuilt homepage
- `track-and-field.html`: 2027 packages and practice programs
- `7v7-hub.html`: Underdog Mentality and tryout information
- `youth-services.html`: counseling, tutoring, mentoring
- `meets.html`: projected 2027 competition schedule
- `store.html`: athlete gear bundles and inquiry-only fan gear
- `uniform-selection.html`: separate top, bottom and warm-up sizing
- `registration.html`: registration interest form (email workflow)
- `athlete-profiles.html`: searchable athlete directory with 21 individual race/field-results profiles and source links
- `donate.html`, `about.html`: nonprofit mission and giving
- `styles.css`, `site.js`, `assets/`, `.nojekyll`

## Important: do not claim unverified payments/forms work
- **Registration** and **uniform-selection** forms currently create a prefilled email to `floridaspeedacademy@gmail.com`. A parent must press **Send** in an email app. The data is not stored by GitHub Pages or automatically recorded in Google Sheets.
- To create a direct registration/size-submission workflow connected to Sheets, deploy the separately provided `Code.gs` from the earlier website package to your own private Google Sheet, then integrate the live endpoint and test before telling parents their entries were submitted.
- The Track & Field athlete package buttons retain an **existing $150 Stripe link** found in earlier store files: `https://buy.stripe.com/14A14p8cm2619DV0bhcAo02`. Both boys and girls currently use that one link. **Confirm its destination, products, amount and fulfillment before going live.**
- The **donation** button retains this prior Stripe donation URL: `https://donate.stripe.com/bJedRbdwGaCxdUb0bhcAo06`. Check account status and receipt settings.
- The **$200 7v7 team registration** is informational in the rebuilt page; the earlier prepared site's Stripe link `https://buy.stripe.com/9B64gB50a4e93fx8HNcAo05` was **not deployed as a live payment button in this revamp**, because it has not been reconfirmed.
- Fan gear has an **email inquiry bag**, not a payment checkout. Do not advertise it as a functioning online store checkout until sales links and item prices are ready.
- Before publishing youth athlete profiles, confirm you have the necessary parent/guardian permissions for displaying names and performance history.
- The image assets are from the previously prepared Florida Speed Academy website archive and team store archive. No artificial athlete profiles or unapproved photos have been added.
- Price differences between the standalone track gear bundle ($150) and the full-season track program ($375) need confirmation; the latter is labeled as including a uniform package.

## Site maintenance
- Primary colors: royal blue `#005BFF`, gold `#FFE200`, graphite/navy, optional girls' pink `#FF459C`.
- Typography uses Google Fonts (Barlow Condensed and DM Sans) with local fallbacks. The team's licensed AB SPEED RACE font **is not distributed** in this ZIP; web-font hosting would need to be configured by the owner after confirming licensing.
- For athlete photos and profiles, use parent/guardian-approved materials only.
- Text is editable directly in individual HTML pages. Shared layout styles live in `styles.css` and shared interactions in `site.js`.

## 7v7 logo update (November 6, 2026)
The 7v7 homepage program card and 7v7 hero both display `assets/underdog-mentality-official-logo.png` instead of the previous football-player graphic. Keep this PNG with all site files when uploading. The artwork retains its original text and colors.


## Underdog Mentality 7v7 naming update
- All references to the former 7v7 team name have been replaced with "Underdog Mentality" in headings, registration choices, page titles, social previews, descriptions, and form prefill scripts.
- Two old 7v7 uniform concept images bearing the former name were removed from the public-facing page and package. Current uniform concepts are not yet confirmed.
- FS NextGen Athletics remains the separate track-and-field program identity. The collaboration image mentioning FS NextGen Athletics is retained intentionally.


## Empty-page protection (November 6, 2026)
- Only pages with substantive published content appear in navigation or footer links.
- Athlete Profiles was initially hidden but is now populated with verified public results and restored to the site navigation (see the Nov 6 update below).
- Legacy paths `7v7.html`, `meet-schedule.html`, and `watch-countdown.html` already redirect visitors to populated replacement pages rather than opening blank pages.
- All remaining linked internal HTML pages were checked for published content. The Athlete Profiles section is now populated; confirm guardian permissions before public launch.
- To keep previously deployed pages from displaying, overwrite existing HTML files when uploading to GitHub; merely removing a file from a ZIP does not remove the previously published copy from your repository.


## Athlete profiles (Nov 6, 2026 update)

- `athlete-profiles.html` is now published and linked in the site navigation and Track & Field section.
- 21 individual athlete profile pages are in `athletes/`. All have at least one verified published 2026 result.
- Race times / field marks and sources come from the prior compiled results workbook `FS_NextGen_2026_Roster_and_Verified_Results.xlsx`. Each entry links to its published source.
- Mackenzie Ruping is listed as awaiting verified results without a clickable profile.
- McCallister Jenkins is excluded.
- These are best performances in the sourced research set, not guaranteed all-time personal records.
- To amend records, update the source workbook and regenerate the athlete pages; they are static HTML, with no automated meet results sync.

## Natalia Diaz 1500m result correction (Nov 6, 2026)
- Added Blazing The City (Royal Palm Beach HS), May 9, 2026: Girls 13–14 1500m, **5:19.79**, **1st place**, listed as FS NextGen. Official published result: https://fl.milesplit.com/meets/759960-blazing-the-city-2026/results/1300613/raw
- State qualifier note supplied by the team; official results corroborate the mark and placement, not the subsequent championship-entry status.
- Athlete directory and individual profile updated (Natalia 9 verified records across 6 meets; site 129 performance records from 11 meets).


## 2027 Track & Field fees — latest revision (November 6, 2026)
- Indoor-only program: **$150 per athlete**.
- Outdoor-only program: **$275 per athlete**.
- Combined Indoor + Outdoor full-season: **$375 per athlete** (save **$50** versus buying the two separately for $425); athlete uniform package included.
- Updated the homepage under the Track & Field programs, Track & Field pricing comparison, and registration information. The registration dropdown already included these exact amounts and still does.
- These track registration fees are separate from the standalone team-store merchandise. Do not confuse the store's existing $150 athlete apparel bundle with the $150 indoor-season enrollment fee. Confirm package overlap with the staff before accepting duplicate payments.
- Program prices are advertised, but the static registration form still creates an email inquiry and does **not** process or collect payment.
