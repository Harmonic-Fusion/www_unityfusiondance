# Unity Fusion Dance

Static site for [unityfusiondance.com](https://unityfusiondance.com), built with [Astro](https://astro.build) and deployed to **GitHub Pages** via GitHub Actions.

Migrated from Google Sites. Content and routes match the live community site; the presentation is a cleaned-up redesign using the Unity Fusion teal / watercolor brand.

## Local development

```bash
pnpm install
pnpm start
```

Stop the dev server (port 4321):

```bash
pnpm stop
```

Build and preview the static output:

```bash
pnpm build
pnpm preview
```

Requires Node.js 22+.

## Deploy (GitHub Pages)

1. Push this repo to GitHub (default branch `main`).
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. On each push to `main`, [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs `npm ci` → `npm run build` and publishes `dist/`.
4. Custom domain: `public/CNAME` is set to `unityfusiondance.com` and is copied into the build output.

### Domains

The apex `unityfusiondance.com` is the canonical hostname. `www.unityfusiondance.com` is
**not** served directly — GitHub Pages issues a 301 from www to the apex automatically, as
long as the `www` CNAME points at your `github.io` host and `public/CNAME` names the apex.

Because GitHub Pages allows only one custom domain per site, there is exactly one `CNAME`
file (`public/CNAME`) and it must stay `unityfusiondance.com`. Adding a second one, or
changing it to the www host, would flip the redirect direction and disagree with the `site`
URL in [`astro.config.mjs`](astro.config.mjs).

### DNS setup on Namecheap

Sign in at namecheap.com → **Domain List** → **Manage** next to `unityfusiondance.com` →
**Advanced DNS**. Delete the existing Google Sites records (typically four `A` records for
`@` plus a `CNAME` for `www` pointing at `ghs.googlehosted.com`), then add:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | `@` | `185.199.108.153` | Automatic |
| A | `@` | `185.199.109.153` | Automatic |
| A | `@` | `185.199.110.153` | Automatic |
| A | `@` | `185.199.111.153` | Automatic |
| AAAA | `@` | `2606:50c0:8000::153` | Automatic |
| AAAA | `@` | `2606:50c0:8001::153` | Automatic |
| AAAA | `@` | `2606:50c0:8002::153` | Automatic |
| AAAA | `@` | `2606:50c0:8003::153` | Automatic |
| CNAME | `www` | `<user-or-org>.github.io.` | Automatic |

Notes:

- The four `A` and four `AAAA` records on `@` are what serve the canonical apex.
- The `www` CNAME still points at `github.io`, not at the apex — that is what lets GitHub
  answer on www and redirect it to the apex. Do **not** use a Namecheap URL Redirect record
  for www; it would break HTTPS on that hostname.
- Replace `<user-or-org>` with the GitHub account that owns this repo. Namecheap wants the
  bare hostname; the trailing dot is optional.
- Namecheap's `CNAME` host field takes `www`, not `www.unityfusiondance.com`.
- Turn **off** Namecheap's "Parking Page" / URL Redirect records if present — a redirect
  record on `@` will shadow the A records.
- Leave `MX` and any `TXT` verification records alone if email is on this domain.

Then in the repo: **Settings → Pages → Custom domain** → enter `unityfusiondance.com`
and save, wait for the DNS check to pass, and tick **Enforce HTTPS** (certificate issuance
can take up to an hour after propagation). GitHub provisions the certificate for both the
apex and www, so the redirect works over HTTPS.

Verify:

```bash
dig +short unityfusiondance.com
dig +short www.unityfusiondance.com
curl -sI https://www.unityfusiondance.com | head -n 3   # expect 301 → https://unityfusiondance.com/
```

Keep Google Sites up until you verify the new site. DNS propagation is usually minutes on
Namecheap but can take up to 48 hours.

## Site map

| Path | Page |
|------|------|
| `/` | Home |
| `/home/` | Redirects to `/` |
| `/events/` | Calendar + past events |
| `/amazing/` | Amazing Weekender |
| `/faq/` | FAQ |
| `/get-involved/` | Volunteer / teach / DJ |
| `/subscribe/` | Mailing list CTA |
| `/contribute/` | Sliding-scale contributions |
| `/terms/` | Liability release |
| `/terms-amazing/` | Weekender waiver |

## External services

Still hosted outside this repo (embeds / links):

- Google Calendar (events + weekender)
- Google Forms (sign-in, volunteer, feedback)
- Google Docs (terms, policies)
- EmailOctopus mailing list
- Venmo / PayPal
- Facebook / Spotify
- Google Analytics (`G-N21Y8PKM2D`)

Images are rehosted under `public/assets/images/`.
