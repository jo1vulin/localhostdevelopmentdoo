# Scoreboard backend

The site keeps scores in the visitor's browser until `<meta name="score-api">` in `index.html` points at an endpoint. The contract:

- `GET  <url>?game=battle|eleanor` returns `{ "game", "scores": [ ... ] }` (top 10; `battle` is the default)
- `POST <url>start` with `{ game }` opens a session and returns `{ token }`. The game calls it when a round starts.
- `POST <url>` with a JSON body `{ game, token, sig, name, score, ... }` returns `{ ok, game, rank, scores }`. Battle City entries carry `killed`, `stage`, `won`; Eleanor entries carry `speed`, `jumps`, `misses`, `crashes`.

The body is sent as `text/plain` so the browser does not preflight.

## What stops a hand-made POST

A score is accepted only when all of these hold:

- `token` is a session the worker issued, for the same game, not used before, and less than an hour old
- enough real time passed since the session opened: 58 s for Eleanor, and for Battle City 4 s plus 40 s per stage cleared (a stage cannot be cleared faster: twenty tanks spawn 2.4 s apart)
- `sig` is `HMAC-SHA256(SIGNING_KEY, "<game>|<token>|<score>|<speed or killed>")` in hex; the key is the `SIGNING_KEY` secret on the worker and is embedded, lightly obfuscated, in `js/battle.js` and `js/race.js` (`SEAL`)
- the usual plausibility limits: name at most 12 characters; Battle City score a multiple of 100 up to 120000 and at most 400 per tank plus 6000 for bonuses, at most 220 tanks, stage 1 to 11; Eleanor at most 4500 m, 262 km/h, 40 jumps, 200 near misses, 100 crashes
- at most 40 requests per IP per 10 minutes

Honest limits: the site is static, so anyone who reads the JavaScript can find the key and play a scripted round. This blocks "send a POST from a shell", not a determined cheater. Moderation is what handles the rest.

## Moderation

`moderate.sh` talks to the worker with the admin key in `.admin-key` (not in git; it was set on the worker with `npx wrangler secret put ADMIN_KEY`):

```bash
./moderate.sh eleanor list
./moderate.sh eleanor remove 2026-09-16T13:13:04.958Z
./moderate.sh battle remove-name Mladen
```

`list` prints the full stored board (up to 100 rows) with each row's timestamp; `remove` deletes the row with that exact timestamp, `remove-name` every row with that name.

## Current setup

Deployed as the Cloudflare Worker `localhost-scores` on the account behind jo1vulin@gmail.com, KV namespace `SCORES`, URL `https://localhost-scores.jo1vulin.workers.dev/`, referenced from `<meta name="score-api">` in `index.html`. To redeploy after editing `worker.js`: `npx wrangler deploy` in this folder (Node 22 via nvm, `npx wrangler login` once per machine). Secrets: `SIGNING_KEY` (same value as `.signing-key`, which must match the `SEAL` array in the two game scripts) and `ADMIN_KEY` (same as `.admin-key`); set either with `npx wrangler secret put <NAME>`. For `wrangler dev`, put both in `.dev.vars`. To wipe a board: `npx wrangler kv key delete --binding SCORES --remote top` (Battle City) or `'top:eleanor'`.

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

Scores appear as rows in the sheet, so moderating is deleting a row. There is no rate limiting, no session token and no signature check in this variant; it is kept only as the zero-infrastructure fallback.
