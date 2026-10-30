# Reading and orange palette revision

- Body: 20px desktop, 18px at widths up to 700px; 1.75 line height. Notes: 16px. Long prose: 65ch English, 36em Chinese, constrained by its container.
- Cream background #F9ECD2; body #3B3028; display headings #B84A16; interface orange and reversed backgrounds #B64A16. Inline prose links are underlined.
- Chinese body uses an installed Songti/SimSun/Noto Serif font fallback stack; English uses Georgia/Times New Roman. Actual serif face varies by device. Smiley Sans and Fraunces remain display fonts; controls and prices use upright interface fonts.
- Production build passed; 137 static checks passed.
- Existing browser suite: 153 passed, covering navigation, forms, motion, no-JavaScript behavior and responsive layout. After the final orange contrast adjustment, the 8 affected palette/navigation/intro checks also passed.
- Additional browser inspection: all 24 routes at 1440px, 390px and 320px (72 page/viewport combinations). No horizontal overflow or visible prose paragraphs below 16px (excluding eyebrow labels). Chinese story lead confirmed at 20px/18px, in the expected serif stack and dark body color.
- Desktop and mobile story screenshots inspected visually. Full-page home, story and partnership screenshots saved in `docs/screenshots/reading/`.
- QA used a temporary copy of the existing Playwright configuration/tests with port 4322, because an unrelated service occupied port 4321. No test assertions were removed. The only changes to tracked test expectations are the new heading and intro colors.
- Local build only; no deployment performed.
