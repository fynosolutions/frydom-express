# 内容问题与处理

## MENU-DUPLICATE

Original Recipe Fried Chicken is repeated under boneless in English and incorrectly classified as boneless in Chinese.

处理：Merge the English duplicate by stable product ID; place the original bone-in chicken in Fried Chicken in both languages.

## PRICE-en-crispy-chicken-burger-combo

Crispy Chicken Burger Combo: home highlights and menu list disagree, or home product identity is ambiguous.

处理：Preserve all source text in the migration ledger. Display a current-pricing enquiry instead of selecting a price; omit Offer JSON-LD.

## PRICE-zh-crispy-chicken-burger-combo

香脆鸡腿堡套餐: home highlights and menu list disagree, or home product identity is ambiguous.

处理：Preserve all source text in the migration ledger. Display a current-pricing enquiry instead of selecting a price; omit Offer JSON-LD.

## PRICE-zh-angus-beef-cheeseburger-combo

安格斯芝士牛肉堡套餐: home highlights and menu list disagree, or home product identity is ambiguous.

处理：Preserve all source text in the migration ledger. Display a current-pricing enquiry instead of selecting a price; omit Offer JSON-LD.

## PRICE-zh-beef-cheeseburger-combo

芝士牛肉堡套餐: home highlights and menu list disagree, or home product identity is ambiguous.

处理：Preserve all source text in the migration ledger. Display a current-pricing enquiry instead of selecting a price; omit Offer JSON-LD.

## PRICE-zh-pineapple-beef-burger-combo

菠萝牛肉汉堡套餐: home highlights and menu list disagree, or home product identity is ambiguous.

处理：Preserve all source text in the migration ledger. Display a current-pricing enquiry instead of selecting a price; omit Offer JSON-LD.

## PRICE-zh-wings-combo

鸡翅套餐: home highlights and menu list disagree, or home product identity is ambiguous.

处理：Preserve all source text in the migration ledger. Display a current-pricing enquiry instead of selecting a price; omit Offer JSON-LD.

## PRICE-zh-onion-cheese-bacon-burger-combo

洋葱芝士培根汉堡套餐: home highlights and menu list disagree, or home product identity is ambiguous.

处理：Preserve all source text in the migration ledger. Display a current-pricing enquiry instead of selecting a price; omit Offer JSON-LD.

## PRICE-en-angus-beef-cheeseburger-combo

Angus Beef Cheeseburger Combo: shared item has conflicting or ambiguous home/menu records in the other language; separate market/channel scope has not been verified.

处理：Retain original values in sourcePrices; share conflict status across translations and request current restaurant pricing.

## PRICE-en-wings-combo

Wings Combo: shared item has conflicting or ambiguous home/menu records in the other language; separate market/channel scope has not been verified.

处理：Retain original values in sourcePrices; share conflict status across translations and request current restaurant pricing.

## PRICE-en-onion-cheese-bacon-burger-combo

Onion Cheese Bacon Burger Combo: shared item has conflicting or ambiguous home/menu records in the other language; separate market/channel scope has not been verified.

处理：Retain original values in sourcePrices; share conflict status across translations and request current restaurant pricing.

## PRICE-en-beef-cheeseburger-combo

Beef Cheeseburger Combo: shared item has conflicting or ambiguous home/menu records in the other language; separate market/channel scope has not been verified.

处理：Retain original values in sourcePrices; share conflict status across translations and request current restaurant pricing.

## PRICE-en-pineapple-beef-burger-combo

Pineapple Beef Burger Combo: shared item has conflicting or ambiguous home/menu records in the other language; separate market/channel scope has not been verified.

处理：Retain original values in sourcePrices; share conflict status across translations and request current restaurant pricing.

## HOURS-DAYS

Both location pages list 11 AM – 9 PM without weekdays.

处理：Keep the original hours text with days unspecified; do not generate OpeningHoursSpecification or live open status.

## ZH-LABELS

Chinese home Cod Fish combo says Only Wrap, onion bacon combo says Only Wings, and Snow Cheese Wings description says boneless.

处理：Do not publish ambiguous standalone variants; use the corresponding menu description. Preserve source records for business confirmation.

## PHOTO-STATUS

Original Crunch/Onion/Drinks cards say Photo update coming soon; Classic/Honey Mustard wings share an image.

处理：Keep an explicit image note; do not infer item identity from filenames.

## ZH-POLICY-EN

Existing Chinese-route privacy document is English; Chinese-route Terms of Service is Chinese.

处理：Keep both original texts and dates; mark the privacy article en and the Chinese terms article zh-Hans, with a Chinese navigation shell.

## TRACKING

Original malformed noscript pixel tag pollutes extracted text; old source matching classifies Gemini as Google.

处理：Production-only valid pixel loading, no preview tracking; match Gemini before Google and support chatgpt.com.
