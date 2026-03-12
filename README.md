# AegisAlign EcoVerse V1

Vite multipage integration for Stitch-exported AegisAlign UI pages.

## Commands

- `npm run sync:stitch`: regenerate routed pages and manifest from `Stitch-UIs-for-AegisAlign`.
- `npm run check:routes`: validate manifest uniqueness and generated wrapper/source files.
- `npm run export:sitemap`: export sitemap artifacts from the generated route manifest.
- `npm run dev`: sync and start local Vite dev server.
- `npm run build`: sync, validate, and produce static build in `dist/`.
- `npm run preview`: preview the production build.
- `npm run preview:cf`: preview `dist/` with Cloudflare Pages routing (`_redirects` + `_headers`) applied.

## Local 404 Note

If you use a generic static server or `vite preview`, paths like `/nexus` (without trailing slash) can 404 locally.
Use canonical paths with trailing slash (for example, `/nexus/`) or run `npm run preview:cf` after `npm run build`.

## Custodian Split

- Public status surface: `/custodian-ui/status/`
- Secure gateway: `/custodian-ui/secure/` (gate with Cloudflare Access in production for Custodian use)

## Generated Outputs

- `generated/index.html`: root landing page.
- `generated/<domain>/index.html`: domain landing pages.
- `generated/<domain>/<slug>/index.html`: shell-wrapped route pages.
- `generated/stitch/<domain>/<slug>/index.html`: preserved Stitch source pages.
- `generated/route-manifest.json`: route metadata.
- `generated/hubs-manifest.json`: staged hub manifest used by Nexus portal rendering.
- `public/route-manifest.json`: published manifest artifact.
- `public/hubs-manifest.json`: published hub staging manifest.
- `config/route-migrations.json`: canonical slug migrations with backward-compatible redirects.
- `public/sitemap-routes.csv`: CSV route inventory for deployment/SEO tooling.
- `public/sitemap.xml`: XML sitemap generated from route manifest.
- `public/_headers` and `public/_redirects`: Cloudflare Pages header and redirect rules.

## Cloudflare

- Pages config: [wrangler.jsonc](./wrangler.jsonc)
- Deployment steps: [docs/cloudflare-pages.md](./docs/cloudflare-pages.md)
