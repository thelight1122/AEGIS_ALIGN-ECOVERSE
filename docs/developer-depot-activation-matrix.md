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
| `web3-portal` | Web3 bridge surface | Wallet and gateway actions | `Queued` | Needs a dedicated Web3 activation model. |
| `api-usage-report-aegis-protocol` | Usage reporting | Filters, charts, export actions | `Live` in second slice | Range switching, export behavior, and related routing are active. |
| `webhooks-configuration-aegis-protocol` | Integration setup | Endpoint forms, secret controls, delivery tests | `Live` in second slice | Draft state, endpoint creation, visibility, edit, delete, and delivery-log flow are active. |
| `node-management-aegis-protocol` | Node operations | Search, actions, status controls | `Live` in second slice | Search, filters, provisioning, alert handoff, restart, and recovery flows are active. |
| `protocol-configuration-aegis-protocol` | Protocol config | Form state, validation, save/apply actions | `Live` in second slice | Config controls persist local state and apply/reset behavior updates the shared Depot log. |
| `protocol-isolated-confirmation` | Update confirmation | Deploy/confirm actions | `Partial` | Route exists; richer confirmation logic can come later. |
| `colab-creation-page-1` | Collaboration builder | Builder controls, next-step CTA | `Queued` | Better after Depot core flows are live. |
| `colab-creation-page-2` | Collaboration continuation | Continuation controls | `Queued` | Paired with `colab-creation-page-1`. |
| `network-topology-visualizer` | Topology display | Filters, node focus, drilldown actions | `Queued` | Better handled with a dedicated topology model. |

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

## Next Developer Depot Slice

After the core Depot and API-control slices are stable, the next highest-value Depot work is:

1. `protocol-isolated-confirmation`
2. `network-topology-visualizer`
3. `colab-creation-page-1`
4. `colab-creation-page-2`
5. `web3-portal`
