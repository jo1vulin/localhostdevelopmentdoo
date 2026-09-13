const ALLOWED_ORIGINS = ['https://localhostdevelopmentdoo.com', 'https://www.localhostdevelopmentdoo.com', 'http://127.0.0.1:8123', 'http://localhost:8123'];
const MAX_NAME = 12;
const MAX_SCORE = 120000;
const MAX_KILLS = 220;
const MAX_STAGE = 11;
const BONUS_ALLOWANCE = 6000;
const KEEP = 100;
const RATE_LIMIT = 12;
const RATE_WINDOW = 600;

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

function sortScores(list) {
    return list.sort((a, b) => b.score - a.score || b.killed - a.killed || String(a.at).localeCompare(String(b.at)));
}

async function readTop(env) {
    const raw = await env.SCORES.get('top');
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

        if (request.method === 'GET') {
            const top = await readTop(env);
            return json({ scores: top.slice(0, 10) }, headers);
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

        const name = String(body.name || '').replace(/[^\p{L}\p{N} _.'-]/gu, '').trim().slice(0, MAX_NAME) || 'anon';
        const score = Number(body.score);
        const killed = Number(body.killed);
        const valid = Number.isInteger(score) && score >= 0 && score <= MAX_SCORE && score % 100 === 0
            && Number.isInteger(killed) && killed >= 0 && killed <= MAX_KILLS && score <= killed * 400 + BONUS_ALLOWANCE;
        const stage = Number.isInteger(Number(body.stage)) ? Math.min(MAX_STAGE, Math.max(1, Number(body.stage))) : 1;
        if (!valid) return json({ error: 'nice try' }, headers, 400);

        const entry = {
            name,
            score,
            killed,
            stage,
            won: body.won === true && stage === MAX_STAGE,
            theme: ['paper', 'hearth', 'cyber'].includes(body.theme) ? body.theme : 'paper',
            at: new Date().toISOString(),
        };

        const top = await readTop(env);
        top.push(entry);
        sortScores(top);
        const kept = top.slice(0, KEEP);
        await env.SCORES.put('top', JSON.stringify(kept));
        const rank = kept.indexOf(entry) + 1;
        return json({ ok: true, rank: rank || null, scores: kept.slice(0, 10) }, headers);
    },
};
