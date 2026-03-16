# Custodian Activation Matrix

Updated: March 16, 2026

This matrix is the working activation plan for the Custodian Ops Center. It tracks which pages are only themed, which are partially interactive, and which now carry real local workflow behavior.

## Status Key

- `Live`: page has meaningful behavior beyond static presentation
- `Partial`: some behavior is live, but major controls are still visual only
- `Queued`: intentionally deferred to a later slice

## Page Inventory

| Page | Current Role | Primary Controls | Activation Status | Notes |
| --- | --- | --- | --- | --- |
| `custodian-hub-operations-gallery` | Public Custodian hub | Login/apply CTAs, protocol management actions, gallery nodes | `Live` in first slice | Hub actions now route into login, publishing, health, and recruitment paths. |
| `security-incident-assessor-center` | Incident operations center | Mitigation actions, threat cards, local nav, live log surface | `Live` in first slice | Safety hold, DNS flush, key rotation, incident handoff, and local log updates are active. |
| `decentralized-governance-voting` | Governance operations | Proposal filters, vote controls, new proposal, recent actions | `Live` in first slice | Voting intent, filter state, and proposal drill-ins are now interactive. |
| `secure` | Secure gateway entry | Role buttons | `Partial` | Role preview is live already; routing into deeper Custodian surfaces is the next polish step. |
| `status` | Public status board | Static status cards | `Queued` | Useful future target for live metrics or periodic updates. |
| `site-custodians` | Custodian directory | Static content links | `Queued` | Copy was cleaned up; deeper behavior can come later. |
| `regional-drill-down-us-east-1` | Regional health view | Static operational data | `Queued` | Likely second-slice target with drilldown and alert behaviors. |
| `system-health-report-aegis-protocol` | Operations health | Static report blocks | `Queued` | Good candidate for synthetic monitor updates later. |
| `custodian-login-portal` | Access gateway | Login / support buttons | `Queued` | Can be activated after the main operations slice stabilizes. |
| `site-custodian-login-recruitment-hub` | Recruitment / intake | Apply flow controls | `Queued` | Natural follow-on after hub and secure gateway. |
| `submission-review-interface` | Intake review surface | Review queues, approve/reject controls | `Queued` | High-value second slice. |
| `create-new-page-custodian-tool` | Publishing workflow | Form actions and create flow | `Queued` | High-value second slice. |

## First Activation Slice

The first implementation batch focuses on turning Custodian from a static themed section into a working operational flow:

1. Hub and routing
   - `custodian-hub-operations-gallery`

2. Incident response
   - `security-incident-assessor-center`

3. Governance operations
   - `decentralized-governance-voting`

4. Secure entry surface
   - `secure` remains partially active and is preserved as the role gateway

## Shared Behaviors Introduced

- Shared Custodian iframe activation layer
- Local Custodian workflow state for incidents, governance filters, and recent actions
- Hub CTA routing into recruitment, publishing, and health pages
- Incident action simulation with queue mutation, live log updates, and incident drill-ins
- Governance vote staging, proposal filtering, and proposal drill-in behavior

## Next Custodian Slice

After this first slice is stable, the next most valuable Custodian work is:

1. Activate `custodian-login-portal` and `site-custodian-login-recruitment-hub`
2. Wire `submission-review-interface` and `create-new-page-custodian-tool`
3. Add synthetic live metrics to `status`, `regional-drill-down-us-east-1`, and `system-health-report-aegis-protocol`
