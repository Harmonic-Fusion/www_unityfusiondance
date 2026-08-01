# Unity Fusion Dance

Static site for [www.unityfusiondance.com](https://www.unityfusiondance.com), built with [Astro](https://astro.build) and deployed to **GitHub Pages** via GitHub Actions.

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
4. Custom domain: `public/CNAME` is set to `www.unityfusiondance.com` and is copied into the build output.

### DNS cutover (when ready)

Point the domain away from Google Sites to GitHub Pages:

- **www**: CNAME to `<user-or-org>.github.io` (or your Pages hostname), **or**
- Apex + www per [GitHub Pages custom domain docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)

In Pages settings, confirm the custom domain and enable HTTPS once DNS propagates. Keep Google Sites up until you verify the new site.

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
