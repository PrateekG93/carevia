# QuickMeds upgrade

## Goal

Upgrade the existing QuickMeds experience from the supplied brief while preserving its current branding, colors, fonts, navigation style, and working shopping and care flows.

## Work

- Improve medicine discovery with brand/generic search, categories, filters, sample pharmacy comparisons, and a list/map presentation that clearly identifies illustrative inventory.
- Enhance prescription upload with image/PDF preview, an editable sample extraction review, and an explicit unverified status; do not claim OCR or pharmacist verification is connected.
- Add family profiles, medicine schedules, refill estimates, and a pharmacy-partner demo portal using the existing shared in-memory prototype state.
- Add the QuickCare AI floating navigation assistant, extend nearby results to pharmacy/doctor/hospital tabs, improve sample doctor cards, and make order tracking easier to scan.
- Organize access to the new pages without overcrowding the existing navigation; retain the existing QuickMeds components and design tokens.
- Add focused tests for any new safety or calculation rules, verify major flows and responsive layouts, and update the project roadmap.

## Boundaries

- This remains a clearly labelled frontend demonstration; no real OCR, provider confirmation, pharmacy inventory, delivery, AI medical advice, or payment is implied.
- Do not persist personal or medical information. Family, schedule, appointment, and pharmacy demo records remain in shared in-memory state; only the existing cart IDs and quantities persist.
- Medical assistance stays general and does not diagnose or prescribe. Keep emergency guidance immediately accessible.

## Technical details

- Extend the existing TanStack Start routes and shared React store; add separate route files for family healthcare, medicine schedule, and pharmacy partner demo.
- Reuse existing design-system controls, product/booking/map utilities, and lazy Leaflet loading. Keep safety and refill calculations in testable library helpers.
