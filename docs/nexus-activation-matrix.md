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
| `aegis-protocol-features` | Product narrative | Hero CTA buttons, footer links, feature panels | `Live` in second slice | CTA routing, docs/demo/pricing handoffs, and feature-panel focus behavior are activated. |
| `aegis-protocol-documentation-portal` | Docs and starter handoff | Search, code copy, left-nav, helpfulness buttons, session CTA | `Live` in first slice | Search/filter, copy, feedback, and session CTA are activated via shared Nexus enhancement. |
| `aegis-protocol-dashboard` | Main demo surface | Search, quick actions, gateway list, filters, faux tabs | `Live` in first slice | Dashboard now behaves like an explorable live surface with local status/state. |
| `login-aegisalign` | Login gateway | Email, password, remember device, password visibility | `Live` in first slice | Validates, persists identity state, and routes through authenticated handoff. |
| `signup-aegisalign` | Onboarding | Name, email, company, password | `Live` in first slice | Validates and persists onboarding draft into Nexus state. |
| `multi-factor-authentication` | MFA checkpoint | 6-digit OTP, paste, SMS fallback, recovery fallback | `Live` in first slice | Auto-advance, paste handling, and verified route handoff are active. |
| `login-success-transition` | Session handoff | Auto progress surface | `Partial` | Already auto-transitions correctly; could gain richer progress simulation later. |
| `aegis-peer-profile` | Identity hub | Access links, subscriber handoffs, demo/settings routes | `Live` in second slice | Profile now acts like a real subscriber hub with docs, pricing, settings, and access-flow routing. |
| `aegisalign-pricing-plans` | Upgrade path | Plan selection CTA buttons, plan cards | `Live` in second slice | Upgrade intent and starter/demo/signup routing now persist into shared Nexus state. |
| `aegisalign-settings` | Account and preferences | Profile inputs, toggles, API keys, save/discard, search | `Live` in first slice | Now persists local preferences, notification choices, and generated API keys. |
| `aegis-governance-hub` | Canon / principles reference | Canon links, study actions, demo/docs/pricing handoffs | `Live` in second slice | Governance references now support focus/highlight study behavior and real handoff actions. |
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

## Second Activation Slice

The second implementation batch extends the Nexus into a fuller hub:

1. Identity and subscriber continuity
   - `aegis-peer-profile`
   - `aegisalign-pricing-plans`

2. Governance and product exploration
   - `aegis-governance-hub`
   - `aegis-protocol-features`

3. Shared behaviors introduced
   - profile handoffs into access, settings, docs, pricing, and demo surfaces
   - pricing upgrade-intent persistence and plan-card selection state
   - governance section focus and study-aid highlighting
   - richer feature-page CTA routing into docs, demo, signup, and pricing

## Next Nexus Slice

After this second slice is stable, the next most valuable Nexus work is:

1. Deepen `aegisalign-landing-page` widgets beyond routing and Drift travel
2. Add richer progress simulation to `login-success-transition`
3. Expand subscriber continuity between Nexus and future `Peer Profile / Subscriber Workspace`
