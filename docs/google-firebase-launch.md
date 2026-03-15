# Google Launch Plan

EcoVerse is ready for a staged Google-hosted launch.

The current site is a static Vite build with generated multipage routes in `dist/`, which makes Firebase Hosting the cleanest first production target. Dynamic services can be added later through Cloud Run without changing the public architecture.

## Recommended Architecture

### App Layer

- Primary runtime host: Firebase Hosting
- Source of truth for deployable web build: `dist/`
- Build command: `npm run build`
- Launch goal: fast public exposure, stable routing, custom domain, SSL, preview channels

### Dynamic Layer

Reserve Cloud Run for the first real service-backed features:

- Peer session and profile state
- subscriber gating
- live demos
- download entitlement flows
- contact and signup intake

That keeps the current release simple while preserving a clean upgrade path.

### Storage Layer

Use `.digitalSelf` as the branded storage and provenance layer rather than the main app host.

Suggested roles:

- `vault.digitalself`: subscriber downloads, starter kits, release bundles
- `canon.digitalself`: canonical records, governance artifacts, signed standards snapshots
- `storage.digitalself`: general Web3 storage gateway or pinned public artifacts

This lets EcoVerse stay fast on Google-hosted web infrastructure while `.digitalSelf` carries the decentralized identity and permanence layer.

## Recommended Launch Sequence

### Phase 1: Staging Now

Deploy the current build to a Firebase Hosting preview channel or staging site.

Use this phase to validate:

- route behavior
- topbar/sidebar behavior
- section landing pages
- mobile layout
- contact and CTA paths
- domain plan

### Phase 2: Public Launch Soon After

Promote to production once these are stable:

- Nexus messaging is final enough for public traffic
- section home pages all open correctly
- first conversion path is present
- footer/topbar links are intentional
- domain DNS is ready

### Phase 3: Post-Launch Services

Introduce Cloud Run services only when needed for:

- login
- Profile
- gated downloads
- subscriber workspaces
- Developer Connect integration

## Domain Model

Recommended split:

- Main app: your primary EcoVerse domain on Firebase Hosting
- Web3 storage and provenance: `.digitalSelf`

Example pattern:

- `nexus.<primary-domain>`
- `profile.<primary-domain>`
- `storage.digitalself`
- `vault.digitalself`
- `canon.digitalself`

If you want a single public root, keep the main site on one primary domain and use `.digitalSelf` only for the storage-facing subsystems.

## Firebase Hosting Setup

This repo now includes:

- `firebase.json`
- `.firebaserc.example`

These are set up for static hosting from `dist/`.

### Current Studio Project

The current Firebase project wired to this repo is:

- `studio-7318266550-8ad26`

The local `.firebaserc` already points to that project.

### One-time setup

1. Create or choose a Google Cloud project.
2. Enable Firebase for that project.
3. Install the Firebase CLI:

```powershell
npm install -g firebase-tools
```

4. Log in:

```powershell
firebase login
```

5. Copy `.firebaserc.example` to `.firebaserc` and replace the project id.

### Build and deploy

```powershell
npm run build
firebase deploy --only hosting
```

### Preview deploy

```powershell
npm run build
firebase hosting:channel:deploy staging
```

## Firebase Studio Repo Import

Firebase Hosting deploys do not require Firebase Studio to mirror the repo, but if you want the code visible inside Studio you need to import it separately.

Use this path in Firebase Studio:

1. Open the Studio workspace tied to the Firebase project.
2. Choose `Import repository` or `Clone from Git`.
3. Select the actual EcoVerse repository.
4. Point the import at the repo root.
5. Do not scaffold a new React app or template on top of it.

Important:

- Studio repo import is optional for Hosting.
- Local CLI deploys from `I:\AEGIS_ALIGN-ECOVERSE` are already valid.
- If Studio asks whether to initialize Hosting again, keep the existing repo config and do not overwrite `firebase.json`.

## What Not To Do Yet

Avoid making Web3 storage the primary runtime layer for the main web app right now.

For the current launch, it is better used for:

- public artifacts
- downloadable starter systems
- canonical documents
- signed releases

Live UI state and app routing should stay on the Google-hosted web layer until the decentralized stack is ready to take on more responsibility.

## Recommended Immediate Next Step

Deploy a staging build to Firebase Hosting first, then connect the production domain only after one final visual and copy pass.
