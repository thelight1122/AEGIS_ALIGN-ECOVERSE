# Nexus Activation Matrix

Updated: March 15, 2026

This matrix is the working activation plan for the Nexus section. It separates pages that are already navigable from pages that still need real in-page behavior beyond CTA routing.

## Status Key

- `Live`: page has meaningful behavior beyond static presentation
- `Partial`: some behavior is live, but major controls are still visual only
- `Queued`: intentionally deferred to a later slice

## Page Inventory

| Page | Current Role | Primary Controls | Activation Status | Notes |
| --- | --- | --- | --- | --- |
| `aegisalign-landing-page` | Public Nexus hub | CTA buttons, immersive Ether entry | `Partial` | CTA routing is live; immersive portal travel is live; deeper content widgets can come later. |
| `aegis-protocol-features` | Product narrative | Hero CTA buttons, footer links | `Partial` | Route-level CTA behavior exists; richer feature-panel interaction is still optional. |
| `aegis-protocol-documentation-portal` | Docs and starter handoff | Search, code copy, left-nav, helpfulness buttons, session CTA | `Live` in first slice | Search/filter, copy, feedback, and session CTA are activated via shared Nexus enhancement. |
| `aegis-protocol-dashboard` | Main demo surface | Search, quick actions, gateway list, filters, faux tabs | `Live` in first slice | Dashboard now behaves like an explorable live surface with local status/state. |
| `login-aegisalign` | Login gateway | Email, password, remember device, password visibility | `Live` in first slice | Validates, persists identity state, and routes through authenticated handoff. |
| `signup-aegisalign` | Onboarding | Name, email, company, password | `Live` in first slice | Validates and persists onboarding draft into Nexus state. |
| `multi-factor-authentication` | MFA checkpoint | 6-digit OTP, paste, SMS fallback, recovery fallback | `Live` in first slice | Auto-advance, paste handling, and verified route handoff are active. |
| `login-success-transition` | Session handoff | Auto progress surface | `Partial` | Already auto-transitions correctly; could gain richer progress simulation later. |
| `aegis-peer-profile` | Identity hub | Shell-level account summary | `Queued` | Profile will be expanded into a fuller subscriber hub in a later slice. |
| `aegisalign-pricing-plans` | Upgrade path | Plan selection CTA buttons | `Partial` | CTA routing is live; billing/checkout behavior remains future work. |
| `aegisalign-settings` | Account and preferences | Profile inputs, toggles, API keys, save/discard, search | `Live` in first slice | Now persists local preferences, notification choices, and generated API keys. |
| `aegis-governance-hub` | Canon / principles reference | Read-only reference actions | `Partial` | Content is complete; interactive study aids are optional future work. |
| `orientation` | Legacy Nexus orientation | Static route bridge | `Queued` | Kept for continuity, not a first-slice activation target. |

## First Activation Slice

The first implementation batch focuses on turning the Nexus from stitched navigation into a minimally working product flow:

1. Access and identity
   - `login-aegisalign`
   - `signup-aegisalign`
   - `multi-factor-authentication`
   - `login-success-transition`

2. Demo and documentation
   - `aegis-protocol-dashboard`
   - `aegis-protocol-documentation-portal`

3. Account settings
   - `aegisalign-settings`

## Shared Behaviors Introduced

- Shared Nexus iframe enhancement layer
- Local persistence for onboarding, identity, settings, and generated API keys
- Form validation and stateful handoff routing
- Docs search/filter and code-copy helpers
- Dashboard local interaction model for quick actions and gateway filtering
- Settings navigation, persistence, and discard/save flows

## Next Nexus Slice

After this first slice is stable, the next most valuable Nexus work is:

1. Expand `aegis-peer-profile` into a real subscriber identity hub
2. Deepen `aegisalign-pricing-plans` with plan comparison state and upgrade intent capture
3. Add richer in-world handoffs from Drift portals into specific Nexus surfaces
