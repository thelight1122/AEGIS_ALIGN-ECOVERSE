# Developer Depot Activation Matrix

Updated: March 15, 2026

This matrix is the working activation plan for the Developer Depot section. It tracks which stitched pages already have meaningful behavior and which ones are still primarily visual.

## Status Key

- `Live`: page has meaningful in-page behavior and state
- `Partial`: route and some controls work, but the page is still mostly presentational
- `Queued`: intentionally deferred to a later slice

## Page Inventory

| Page | Current Role | Primary Controls | Activation Status | Notes |
| --- | --- | --- | --- | --- |
| `developer-hub-depot` | Section home and discovery layer | Search, section nav, plugin filters, plugin actions, profile/docs CTAs | `Live` in first slice | Acts as the section home and quick-launch surface. |
| `api-reference-aegis-protocol` | API and integration docs | Example language tabs, copy action, top nav, console CTA | `Live` in first slice | Behaves like a usable reference surface. |
| `submit-plugin-to-depot` | Submission studio | Draft/save, validation, upload stub, docs CTA, submit flow | `Live` in first slice | Creates and updates local submissions. |
| `my-submissions-dashboard` | Contributor inventory | Search, filter, sort, edit, publish, analytics, delete | `Live` in first slice | Main operational surface for local plugin state. |
| `plugin-developer-analytics` | Release and adoption insights | Range toggles, manage, push update, back/docs CTAs | `Live` in first slice | Tied to the shared Depot submission state. |
| `developer-console-aegis-protocol` | Tooling console | Logs, config, command actions | `Live` in second slice | Console actions, key controls, log filtering, and cross-page routing are active. |
| `web3-portal` | Web3 bridge surface | Wallet, gateway, DID, governance, and module actions | `Live` in final Depot slice | Gateway onboarding, identity focus, proposal delegation, and module handoffs are active. |
| `api-usage-report-aegis-protocol` | Usage reporting | Filters, charts, export actions | `Live` in second slice | Range switching, export behavior, and related routing are active. |
| `webhooks-configuration-aegis-protocol` | Integration setup | Endpoint forms, secret controls, delivery tests | `Live` in second slice | Draft state, endpoint creation, visibility, edit, delete, and delivery-log flow are active. |
| `node-management-aegis-protocol` | Node operations | Search, actions, status controls | `Live` in second slice | Search, filters, provisioning, alert handoff, restart, and recovery flows are active. |
| `protocol-configuration-aegis-protocol` | Protocol config | Form state, validation, save/apply actions | `Live` in second slice | Config controls persist local state and apply/reset behavior updates the shared Depot log. |
| `protocol-isolated-confirmation` | Update confirmation | Audit, standby, isolation summaries, secure handoffs | `Live` in final Depot slice | Audit and standby flows now update the local security posture and route into the wider Depot. |
| `colab-creation-page-1` | Collaboration builder | Search, project selection, draft builder, next-step CTA | `Live` in final Depot slice | Early-stage collaboration planning now persists and routes into the proposal workspace. |
| `colab-creation-page-2` | Collaboration continuation | Proposal form, launch actions, project/team handoffs | `Live` in final Depot slice | Proposal launch now creates a real local submission and returns into Depot operations. |
| `network-topology-visualizer` | Topology display | View mode, region filters, node focus, zoom, drilldown actions | `Live` in final Depot slice | Topology focus, region state, inspector syncing, and related routing are active. |

## First Activation Slice

The first implementation batch focuses on the primary contributor flow:

1. Discover useful tools
   - `developer-hub-depot`
   - `api-reference-aegis-protocol`

2. Submit and manage contributions
   - `submit-plugin-to-depot`
   - `my-submissions-dashboard`

3. Review adoption and release state
   - `plugin-developer-analytics`

## Shared Behaviors Introduced

- Shared Developer Depot iframe enhancement layer
- Local contributor state for submissions, draft packages, installed tools, and analytics focus
- Submission validation and draft/save flow
- Local submission inventory management for edit, publish, delete, replay, and analytics routing
- API docs language switching and copy helpers
- Hub search, depot sorting, and local plugin install actions
- Console range switching, key generation, and log filtering
- Usage report range changes, export actions, and console/ops routing
- Webhook draft, secret visibility, edit/delete flows, and local delivery state
- Node operations including provisioning, restart, recovery, and alert escalation handoff
- Protocol configuration persistence, preview refresh, and apply/reset actions

## Second Developer Depot Slice

The second implementation batch extends the module into API operations and protocol controls:

1. `developer-console-aegis-protocol`
2. `api-usage-report-aegis-protocol`
3. `webhooks-configuration-aegis-protocol`
4. `node-management-aegis-protocol`
5. `protocol-configuration-aegis-protocol`

## Next Developer Depot Improvements

With the full Developer Depot section now live, the next highest-value refinements are:

1. Deepen Web3 persistence so gateway state, wallet actions, and DID surfaces share richer long-lived history
2. Expand collaboration routing so Colab proposals can branch into dedicated team/workspace pages
3. Add more visual telemetry linking topology, node management, and usage reporting into one shared operational view
