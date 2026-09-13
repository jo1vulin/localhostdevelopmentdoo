# Battle City scoreboard backend

The site keeps scores in the visitor's browser until `<meta name="score-api">` in `index.html` points at an endpoint. The endpoint contract is tiny:

- `GET  <url>` returns `{ "scores": [ { name, score, killed, won, theme, at }, ... ] }` (top 10)
- `POST <url>` with a JSON body `{ name, score, killed, won, theme, at }` returns `{ ok, rank, scores }`

The body is sent as `text/plain` so the browser does not preflight. Both implementations below validate: name at most 12 characters, score a multiple of 100 up to 120000 and never more than 400 per tank plus a 6000 allowance for bonuses, at most 220 tanks (11 stages), stage 1 to 11.

## Current setup

Deployed as the Cloudflare Worker `localhost-scores` on the account behind jo1vulin@gmail.com, KV namespace `SCORES`, URL `https://localhost-scores.jo1vulin.workers.dev/`, referenced from `<meta name="score-api">` in `index.html`. To redeploy after editing `worker.js`: `npx wrangler deploy` in this folder (Node 22 via nvm, `npx wrangler login` once per machine). To wipe the board: `npx wrangler kv key delete --binding SCORES --remote top`.

## Option A: Cloudflare Worker with KV (recommended)

Free, fast, rate-limited per IP. One-time setup, about five minutes:

```bash
cd scoreboard
npx wrangler login
npx wrangler kv namespace create SCORES
```

Paste the printed `id` into `wrangler.toml`, then:

```bash
npx wrangler deploy
```

Wrangler prints the URL, for example `https://localhost-scores.<account>.workers.dev`. Put it in `index.html`:

```html
<meta name="score-api" content="https://localhost-scores.<account>.workers.dev/">
```

The worker only answers browsers on `localhostdevelopmentdoo.com` (and localhost for testing); edit `ALLOWED_ORIGINS` in `worker.js` to change that. To wipe the board: `npx wrangler kv key delete --binding SCORES top`.

## Option B: Google Sheet with Apps Script (no infrastructure)

1. Create a Google Sheet. Extensions, Apps Script. Replace the code with `apps-script.gs`. Save.
2. Deploy, New deployment, type Web app, execute as Me, access Anyone. Authorize. Copy the web app URL.
3. Put that URL in `<meta name="score-api">`.

Scores appear as rows in the sheet, so moderating is deleting a row. There is no rate limiting in this variant.
