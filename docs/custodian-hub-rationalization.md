# Custodian Hub Rationalization

Updated: March 16, 2026

## Purpose

The `Custodian Ops Center` should be the stewardship, operations, review, and publishing layer of the EcoVerse.

It is not a generic security dashboard and it is not a second Nexus. Its job is to give `Peer Custodians` a governed place to:

- review incidents
- monitor protocol health
- manage access and intake
- review proposals and submissions
- publish or update governed protocol surfaces
- steward regional and operational integrity

## Custodian Hub Definition

The `Custodian Hub` should function as the home and orientation surface for Custodian work. It should answer:

- what needs attention right now
- what governance actions are pending
- what intake or publishing work is waiting
- what the current operational posture is
- where a Custodian should go next

## Core Feature Set

These are the features that belong in the Custodian section.

### 1. Operations Oversight

- command overview
- public and secure status
- regional drill-down
- system health
- cockpit / operational quick actions

### 2. Incident Review

- incident queue
- security logs
- ticket detail
- incident detail
- safety hold / containment procedures

### 3. Governance Stewardship

- governance voting
- proposal review
- governance discussion detail
- links to canon, standards, and protocol references

### 4. Access and Intake

- custodian login
- secure gateway
- recruitment / application path
- submission review

### 5. Support and Ticket Casework

- support ticket detail
- log archive
- incident case pages
- routed support actions from operations surfaces

### 6. Publishing and Site Stewardship

- create new page
- update site or governed surfaces
- controlled content publishing handoffs

### 7. Peer Custodian Identity

- site custodians directory
- roles and stewardship lanes
- charter and selection process

## Section Design Rule

If a page does not directly support one of those six functions, it probably does not belong in `Custodian Ops Center`.

## Current Page Audit

### Keep As Core Pages

These fit the Custodian mission well and should remain first-class pages.

- `custodian-hub-operations-gallery`
- `custodian-login-portal`
- `secure`
- `site-custodians`
- `security-incident-assessor-center`
- `security-logs-aegis-protocol`
- `incident-report-aeg-2023-08`
- `ticket-details-aeg-4092`
- `safety-hold-protocol-sequence`
- `decentralized-governance-voting`
- `proposal-discussion-details`
- `submission-review-interface`
- `create-new-page-custodian-tool`
- `regional-drill-down-us-east-1`
- `system-health-report-aegis-protocol`
- `status`

### Keep, But Reframe

These pages can stay, but they should be reframed so they read like Custodian functions instead of generic protocol or duplicated product pages.

- `custodian-cockpit-hud-1`
  - Keep as a `Custodian Operations Cockpit`
  - It should become the secure, high-focus command surface for active stewards

- `site-custodian-login-recruitment-hub`
  - Keep as a `Custodian Intake & Recruitment` surface
  - The copy should focus on stewardship, qualification, and role fit

- `site-custodian-hub-gallery-update`
  - Keep only if it becomes the governed `Site Update Review / Publishing` page
  - If it remains just a near-duplicate of the hub, it should be removed

### Remove From Custodian Navigation

These are either cross-section leaks, duplicates, or better treated as linked destinations outside the Custodian section.

- `aegis-protocol-dashboard`
  - This belongs to `Nexus`, not Custodian
  - Custodian can link to it, but it should not live inside the Custodian nav tree

- `api-reference-aegis-protocol`
  - This belongs to `Developer Depot` or `Nexus docs`
  - Custodians may need it, but it is not itself a Custodian page

### Remove Entirely Or Archive

These should not survive unless they are materially rewritten into a real Custodian function.

- `custodian-cockpit-hud-2`
  - This is a duplicate of cockpit 1 and adds noise
  - Archive or delete

## Final Disposition

- `custodian-cockpit-hud-2`
  - retire from active generation entirely
  - no unique Custodian value

- `aegis-protocol-dashboard`
  - remove from Custodian generation and ownership
  - keep the Nexus-owned version only

- `safety-hold-protocol-sequence`
  - keep and rewrite as a governed `Safety Hold Protocol`
  - remove theatrical breach language and replace it with truth-first containment review

## Recommended Final Custodian Information Architecture

### Home

- `custodian-hub-operations-gallery`

### Operations

- `custodian-cockpit-hud-1`
- `status`
- `regional-drill-down-us-east-1`
- `system-health-report-aegis-protocol`

### Security & Review

- `security-incident-assessor-center`
- `security-logs-aegis-protocol`
- `incident-report-aeg-2023-08`
- `ticket-details-aeg-4092`
- `safety-hold-protocol-sequence`

### Governance

- `decentralized-governance-voting`
- `proposal-discussion-details`

### Access & Intake

- `custodian-login-portal`
- `secure`
- `site-custodian-login-recruitment-hub`
- `submission-review-interface`

### Publishing

- `create-new-page-custodian-tool`
- `site-custodian-hub-gallery-update`
  - only if rewritten as a publishing/review surface

### Peer Custodians

- `site-custodians`

## Recommended Immediate Changes

### High Confidence

- remove `custodian-cockpit-hud-2` from the source and navigation
- remove `aegis-protocol-dashboard` from the Custodian section navigation
- remove `api-reference-aegis-protocol` from the Custodian section navigation
- rename the `Governance & Publishing` group to `Governance`
- create a distinct `Publishing` group for the page authoring tools

### Medium Confidence

- keep `site-custodian-hub-gallery-update` only if we rewrite it into a true publishing or page-update workflow
- rename `custodian-hub-operations-gallery` internally as the public `Custodian Hub`
- make `custodian-cockpit-hud-1` the secure operations cockpit

## What The Custodian Is Not

To keep the section coherent, Custodian should not become:

- a duplicate docs center
- a duplicate developer portal
- a duplicate Nexus dashboard
- a generic cybersecurity bundle
- a random gallery of protocol-adjacent pages

## Recommended Next Implementation Pass

1. Clean the navigation tree to match the recommended architecture
2. Remove or archive duplicate and cross-section pages
3. Rewrite `site-custodian-hub-gallery-update` into a real publishing surface or drop it
4. Tighten labels and copy so every page reads as a Custodian function
5. Keep cross-section handoffs as links, not embedded duplicate pages
