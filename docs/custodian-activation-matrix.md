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
| `status` | Public status board | Status cards, public ledger | `Live` in third slice | Public metrics now pulse from shared Custodian state and reflect recent actions. |
| `site-custodians` | Custodian directory | Charter/process CTAs, Peer Custodian cards, responsibility lanes | `Live` in final Custodian slice | Directory now routes into charter, recruitment, docs, governance, and stewardship handoffs. |
| `regional-drill-down-us-east-1` | Regional health view | Region nav, search, node cards, refresh, regional log | `Live` in third slice | Regional metrics, node focus, nav handoffs, and region log routing are active. |
| `system-health-report-aegis-protocol` | Operations health | Metric refresh, service cards, archive/docs links, search | `Live` in third slice | System telemetry refresh, service drill-ins, archive routing, and docs handoffs are active. |
| `custodian-login-portal` | Access gateway | Login / support buttons | `Live` in second slice | Credentials, secure gateway handoff, support routing, and local access state are active. |
| `site-custodian-login-recruitment-hub` | Recruitment / intake | Apply flow controls | `Live` in second slice | Recruitment lane selection, launch/login CTAs, and intake intent are active. |
| `submission-review-interface` | Intake review surface | Review queues, approve/reject controls | `Live` in second slice | Claiming, tab focus, ignore/copy actions, reviewer comments, and verdict routing are active. |
| `create-new-page-custodian-tool` | Publishing workflow | Form actions and create flow | `Live` in second slice | Draft persistence, preview mode, snippet insertion, tagging, and publish handoffs are active. |

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

## Second Activation Slice

The second implementation batch extends Custodian into credentialed intake and publishing:

1. Access and recruitment
   - `custodian-login-portal`
   - `site-custodian-login-recruitment-hub`

2. Review and publishing
   - `submission-review-interface`
   - `create-new-page-custodian-tool`

3. Shared state additions
   - local access profile persistence
   - recruitment intent tracking
   - submission claim / verdict state
   - publishing draft persistence and preview rendering

## Next Custodian Improvements

With the full Custodian section now live, the next most valuable refinements are:

1. Add richer review timelines and queue counters across the live Custodian pages
2. Extend public-to-secure handoffs so visitors can move from status surfaces into guided request-access flows
3. Tighten cross-page analytics so Governance, Incident, and Health surfaces share a deeper operational history
