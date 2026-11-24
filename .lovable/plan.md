# CAREVIA brand and healthcare marketplace transformation

## Goal

Transform the existing QuickMeds site into CAREVIA without replacing its working foundation. Apply the exact new brand identity, preserve useful care and shopping workflows, and separate configured services from demonstrations.

## Work

1. Replace all visible and metadata references to QuickMeds with CAREVIA; apply “Healthcare, Connected. Care, Delivered.” to the home and shared brand surfaces. Create the requested healthcare-connected logo and matching favicon, and retheme the existing design tokens to deep teal, soft mint, warm off-white and charcoal.
2. Revise the home, navigation, footer and business pages around the connected patient–doctor–pharmacy marketplace. Remove the AI assistant and symptom-based AI recommendation paths; provide an explicitly unconnected Doctor Chat experience instead.
3. Preserve and enhance existing medicine, prescription, order, appointment and nearby-care journeys. Add pharmacy-radius search and expanded search, honest delivery estimates, first-aid products, family care, medication schedules/refills, doctor discovery and consultation history.
4. Add role-aware patient, doctor, pharmacy and admin areas using Lovable Cloud authentication and user-scoped records. Keep roles separate from profile data, enforce access in backend policies, and show partner verification, payments, notifications, inventory and communications as unavailable until their real providers/configuration exist.
5. Add focused tests for safety and business rules, check every content page’s brand metadata, verify the key shopping/care paths and mobile layout, and update the project roadmap.

## Technical details

- Extend the existing TanStack Start/React app and current UI system; do not create a second project or duplicate existing flows.
- Use Lovable Cloud for account authentication and persistent records requested by the new brief; apply role separation and row-level access policies. Do not persist personal or medical data in browser storage.
- Do not claim any unconfigured payment, pharmacy inventory, 30-minute delivery, professional verification, doctor chat, or live notification is operational. Keep emergency and medical-safety protections intact.
- External payment, professional verification, licensed pharmacy fulfillment, and production communication services require their providers and credentials; expose no false confirmations while those remain unavailable.
