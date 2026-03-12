# Cloudflare Pages Deployment Guide

## Build and deploy

```bash
npm ci
npm run build
npx wrangler pages deploy ./dist --project-name=aegis-align-ecoverse
```

## Auth check

```bash
npx wrangler whoami
```

If unauthenticated:

```bash
npx wrangler login
```

## Secure Custodian route access (recommended)

Gate `/custodian-ui/secure/*` via Cloudflare Zero Trust Access policy:

1. Create Access Application for `https://aegisalign.com/custodian-ui/secure/*`
2. Allow policy: trusted identity groups only
3. Deny all others by default
4. Keep `/custodian-ui/status/*` public

## Notes

- `_headers` and `_redirects` are included in `public/` and emitted to `dist/` during build.
- `wrangler.jsonc` is configured for Pages with `dist` build output.
- Update project name in deploy command if your Cloudflare Pages project differs.
