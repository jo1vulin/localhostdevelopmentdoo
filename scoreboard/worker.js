const ALLOWED_ORIGINS = ['https://localhostdevelopmentdoo.com', 'https://www.localhostdevelopmentdoo.com', 'http://127.0.0.1:8123', 'http://localhost:8123'];
const MAX_NAME = 12;
const MAX_SCORE = 120000;
const MAX_KILLS = 220;
const MAX_STAGE = 11;
const BONUS_ALLOWANCE = 6000;
const KEEP = 100;
const GAMES = {
    battle: { key: 'top', sort: (a, b) => b.score - a.score || b.killed - a.killed || String(a.at).localeCompare(String(b.at)) },
    eleanor: { key: 'top:eleanor', sort: (a, b) => b.score - a.score || b.speed - a.speed || String(a.at).localeCompare(String(b.at)) },
};
const RATE_LIMIT = 40;
const RATE_WINDOW = 600;
const TOKEN_TTL = 3600;
const MIN_ELAPSED = { battle: stage => 4 + Math.max(0, stage - 1) * 40, eleanor: () => 58 };

function corsHeaders(request) {
    const origin = request.headers.get('Origin') || '';
    return {
        'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
    };
}

function json(body, headers, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

function gameOf(name) {
    return GAMES[name] ? name : 'battle';
}

async function hmac(key, message) {
    const cryptoKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
    return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function randomToken() {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function isAdmin(request, env) {
    const header = request.headers.get('Authorization') || '';
    return !!env.ADMIN_KEY && header === `Bearer ${env.ADMIN_KEY}`;
}

function sortScores(list, game) {
    return list.sort(GAMES[game].sort);
}

async function readTop(env, game) {
    const raw = await env.SCORES.get(GAMES[game].key);
    if (!raw) return [];
    try {
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list : [];
    } catch (err) {
        return [];
    }
}

export default {
    async fetch(request, env) {
        const headers = corsHeaders(request);
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

        const url = new URL(request.url);

        if (request.method === 'GET') {
            const game = gameOf(url.searchParams.get('game'));
            const top = await readTop(env, game);
            if (url.searchParams.get('all') === '1' && isAdmin(request, env)) return json({ game, scores: top }, headers);
            return json({ game, scores: top.slice(0, 10) }, headers);
        }

        if (request.method === 'DELETE') {
            if (!isAdmin(request, env)) return json({ error: 'forbidden' }, headers, 403);
            const game = gameOf(url.searchParams.get('game'));
            const at = url.searchParams.get('at') || '';
            const name = url.searchParams.get('name') || '';
            const top = await readTop(env, game);
            const kept = top.filter(row => !((at && row.at === at) || (!at && name && row.name === name)));
            await env.SCORES.put(GAMES[game].key, JSON.stringify(kept));
            return json({ ok: true, game, removed: top.length - kept.length, scores: kept }, headers);
        }

        if (request.method !== 'POST') return json({ error: 'method not allowed' }, headers, 405);

        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const rateKey = `rate:${ip}`;
        const count = Number((await env.SCORES.get(rateKey)) || 0);
        if (count >= RATE_LIMIT) return json({ error: 'slow down' }, headers, 429);
        await env.SCORES.put(rateKey, String(count + 1), { expirationTtl: RATE_WINDOW });

        let body;
        try {
            body = JSON.parse(await request.text());
        } catch (err) {
            return json({ error: 'bad json' }, headers, 400);
        }

        if (url.pathname === '/start') {
            const game = gameOf(body.game);
            const token = randomToken();
            await env.SCORES.put(`tok:${token}`, JSON.stringify({ game, started: Date.now() }), { expirationTtl: TOKEN_TTL });
            return json({ token }, headers);
        }

        const game = gameOf(body.game);
        const token = String(body.token || '');
        if (!/^[0-9a-f]{48}$/.test(token)) return json({ error: 'no token' }, headers, 401);
        const session = JSON.parse((await env.SCORES.get(`tok:${token}`)) || 'null');
        if (!session || session.game !== game) return json({ error: 'bad token' }, headers, 401);
        if (env.SIGNING_KEY) {
            const detail = game === 'eleanor' ? Number(body.speed) : Number(body.killed);
            const expected = await hmac(env.SIGNING_KEY, `${game}|${token}|${Number(body.score)}|${detail}`);
            if (String(body.sig || '') !== expected) return json({ error: 'bad signature' }, headers, 401);
        }
        const elapsed = (Date.now() - session.started) / 1000;
        const stageReached = Number.isInteger(Number(body.stage)) ? Number(body.stage) : 1;
        if (elapsed < MIN_ELAPSED[game](stageReached)) return json({ error: 'too fast' }, headers, 400);
        if (elapsed > TOKEN_TTL) return json({ error: 'expired' }, headers, 400);
        await env.SCORES.delete(`tok:${token}`);
        const name = String(body.name || '').replace(/[^\p{L}\p{N} _.'-]/gu, '').trim().slice(0, MAX_NAME) || 'anon';
        const score = Number(body.score);
        const theme = ['paper', 'hearth', 'cyber'].includes(body.theme) ? body.theme : 'paper';
        let entry;
        if (game === 'eleanor') {
            const speed = Number(body.speed);
            const jumps = Number(body.jumps);
            const misses = Number(body.misses);
            const crashes = Number(body.crashes);
            const valid = Number.isInteger(score) && score >= 0 && score <= 4500
                && Number.isInteger(speed) && speed >= 0 && speed <= 262
                && Number.isInteger(jumps) && jumps >= 0 && jumps <= 40
                && Number.isInteger(misses) && misses >= 0 && misses <= 200
                && Number.isInteger(crashes) && crashes >= 0 && crashes <= 100;
            if (!valid) return json({ error: 'nice try' }, headers, 400);
            entry = { name, score, speed, jumps, misses, crashes, theme, at: new Date().toISOString() };
        } else {
            const killed = Number(body.killed);
            const valid = Number.isInteger(score) && score >= 0 && score <= MAX_SCORE && score % 100 === 0
                && Number.isInteger(killed) && killed >= 0 && killed <= MAX_KILLS && score <= killed * 400 + BONUS_ALLOWANCE;
            const stage = Number.isInteger(Number(body.stage)) ? Math.min(MAX_STAGE, Math.max(1, Number(body.stage))) : 1;
            if (!valid) return json({ error: 'nice try' }, headers, 400);
            entry = { name, score, killed, stage, won: body.won === true && stage === MAX_STAGE, theme, at: new Date().toISOString() };
        }

        const top = await readTop(env, game);
        top.push(entry);
        sortScores(top, game);
        const kept = top.slice(0, KEEP);
        await env.SCORES.put(GAMES[game].key, JSON.stringify(kept));
        const rank = kept.indexOf(entry) + 1;
        return json({ ok: true, game, rank: rank || null, scores: kept.slice(0, 10) }, headers);
    },
};
