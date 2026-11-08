// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

const CALENDAR_PROXY_PREFIX = '/api/google-calendar/';
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3/';
const PRODUCTION_REFERER = 'https://unityfusiondance.com/';

/**
 * Local Vite middleware for Google Calendar JSON API.
 * Browser requests keep a localhost Origin/Referer, which the API key's HTTP
 * referrer restrictions reject. This forwards to Google with the production
 * Referer so `astro dev` / `astro preview` can load events.
 *
 * Registered via Vite's configureServer *post* hook and prepended to the
 * Connect stack so it runs before Astro's HTML 404 handler.
 *
 * @returns {import('vite').Plugin}
 */
function googleCalendarDevProxy() {
  /** @type {import('vite').Connect.NextHandleFunction} */
  function handle(req, res, next) {
    const rawUrl = req.url || '';
    const pathOnly = rawUrl.split('?')[0] || '';
    if (!pathOnly.startsWith(CALENDAR_PROXY_PREFIX)) {
      next();
      return;
    }

    const target = CALENDAR_API_BASE + rawUrl.slice(CALENDAR_PROXY_PREFIX.length);
    fetch(target, { headers: { Referer: PRODUCTION_REFERER } })
      .then(async (upstream) => {
        const body = Buffer.from(await upstream.arrayBuffer());
        res.statusCode = upstream.status;
        const contentType = upstream.headers.get('content-type');
        if (contentType) res.setHeader('Content-Type', contentType);
        res.end(body);
      })
      .catch((err) => {
        res.statusCode = 502;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(err instanceof Error ? err.message : String(err));
      });
  }

  /** @param {import('vite').ViteDevServer | import('vite').PreviewServer} server */
  function prepend(server) {
    server.middlewares.stack.unshift({ route: '', handle });
  }

  return {
    name: 'google-calendar-dev-proxy',
    configureServer(server) {
      // Post hook: runs after Vite/Astro install their middlewares.
      return () => {
        prepend(server);
      };
    },
    configurePreviewServer(server) {
      return () => {
        prepend(server);
      };
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://unityfusiondance.com',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [tailwind()],
  vite: {
    plugins: [googleCalendarDevProxy()],
  },
});
