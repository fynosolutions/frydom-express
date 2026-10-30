# Navigation, partner content and reading revision

- Removed the location-page staff/group offer callout, including its description, terms link and phone.
- Moved all five support services, descriptions and images into the partnership page before the inquiry form. Added a chapter anchor and updated footer, mobile and partner-banner links.
- Removed Our Story from rendered pages and navigation; preserved the home page's general brand introduction.
- Online Order offers the approved Brooklyn Uber Eats and Grubhub URLs in new tabs; both links also appear in mobile navigation.
- Body text: 22px desktop / 20px mobile, weight 700, in the existing Chinese and English serif stacks. Notes: 18px, weight 600. Poster artwork remains unchanged.
- Legacy story URLs redirect to the matching language home page; legacy support URLs redirect to the matching partnership page's `#partner-support` anchor. HTTP 301 is configured in local preview, Vercel and `_redirects`, with static HTML fallback pages.
- Production build and 123 static checks passed. All 134 browser regression checks passed, including redirect status/destinations and full support content before the form.
- Additional checks covered 20 current routes across five widths (320, 390, 768, 1024, 1440): no horizontal overflow; sampled body/footer sizes and weights match the specification. All five support images load in both languages. Screenshots reviewed in `docs/screenshots/navigation/`.
- Local preview: port 4323. No deployment performed.
