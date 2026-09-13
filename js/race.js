(function () {
    'use strict';

    const SEG = 200;
    const RUMBLE = 3;
    const ROAD_WIDTH = 2000;
    const LANES = 3;
    const CAMERA_HEIGHT = 1000;
    const FOV = 100;
    const DRAW = 220;
    const FOG = 3.2;
    const MAX_SPEED = 7400;
    const ACCEL = MAX_SPEED / 4.2;
    const BRAKE = -MAX_SPEED / 2.2;
    const COAST = -MAX_SPEED / 5;
    const OFFROAD = -MAX_SPEED / 1.6;
    const OFFROAD_LIMIT = MAX_SPEED / 4;
    const CENTRIFUGAL = 0.22;
    const TRAFFIC = 42;
    const ROUND_SECONDS = 60;
    const GRAVITY = 3.4;
    const KMH_PER_UNIT = 262 / MAX_SPEED;

    const PAL = {
        skyTop: '#dcdcdc', skyBottom: '#b9b9b9', far: '#a9a9a9', mid: '#8d8d8d', near: '#707070',
        window: '#e6e6e6', road: '#464646', roadAlt: '#4d4d4d', rumble: '#e2e2e2', rumbleAlt: '#3a3a3a',
        lane: '#c9c9c9', ground: '#666666', groundAlt: '#606060', ramp: '#e9e9e9', rampAlt: '#2b2b2b',
        wall: '#2a2a2a', wallAlt: '#232323', ceiling: '#1c1c1c', light: '#ececec', text: '#f2f2f2', ink: '#111111',
        car: '#a8a8a8', carDark: '#7a7a7a', stripe: '#141414', glass: '#d6d6d6', traffic: ['#3b3b3b', '#565656', '#8a8a8a', '#2e2e2e'],
        shadow: 'rgba(0, 0, 0, 0.35)', dust: 'rgba(230, 230, 230, 0.7)',
    };

    let G = null;
    const SCORE_API = ((document.querySelector('meta[name="score-api"]') || {}).content || '').trim();
    const MAX_NAME = 12;

    function sortScores(list) {
        return list.sort((a, b) => b.score - a.score || (b.speed || 0) - (a.speed || 0) || String(a.at).localeCompare(String(b.at)));
    }

    function loadLocalScores() {
        try {
            const list = JSON.parse(localStorage.getItem('lh-eleanor-scores') || '[]');
            return Array.isArray(list) ? list : [];
        } catch (err) {
            return [];
        }
    }

    function saveLocalScores(list) {
        try {
            localStorage.setItem('lh-eleanor-scores', JSON.stringify(list.slice(0, 50)));
        } catch (err) {}
    }

    function apiUrl() {
        return SCORE_API + (SCORE_API.includes('?') ? '&' : '?') + 'game=eleanor';
    }

    async function fetchScores() {
        const local = sortScores(loadLocalScores()).slice(0, 10);
        if (!SCORE_API) return { scores: local, local: true };
        try {
            const res = await fetch(apiUrl(), { method: 'GET', mode: 'cors', cache: 'no-store' });
            if (!res.ok) throw new Error(String(res.status));
            const data = await res.json();
            return { scores: (data.scores || []).slice(0, 10), local: false };
        } catch (err) {
            return { scores: local, local: true, offline: true };
        }
    }

    async function submitScore(entry) {
        const local = loadLocalScores();
        local.push(entry);
        sortScores(local);
        saveLocalScores(local);
        const localResult = { scores: local.slice(0, 10), rank: local.indexOf(entry) + 1, local: true };
        if (!SCORE_API) return localResult;
        try {
            const res = await fetch(SCORE_API, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ game: 'eleanor' }, entry)) });
            if (!res.ok) throw new Error(String(res.status));
            const data = await res.json();
            return { scores: (data.scores || []).slice(0, 10), rank: data.rank || null, local: false };
        } catch (err) {
            return Object.assign(localResult, { offline: true });
        }
    }

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function clearPanel() {
        if (!G || !G.panel) return;
        G.panel.replaceChildren();
        G.panel.hidden = true;
        G.panelMode = null;
    }

    function themeName() {
        const name = document.documentElement.getAttribute('data-theme');
        return name === 'hearth' || name === 'cyber' ? name : 'paper';
    }

    function showNameForm() {
        const panel = G.panel;
        panel.replaceChildren();
        G.panelMode = 'name';
        panel.appendChild(el('h2', 'battle-title', "TIME'S UP"));
        panel.appendChild(el('p', 'battle-sub', `${Math.floor(G.distance).toLocaleString('en-US')} m   ${Math.round(G.topSpeed * KMH_PER_UNIT)} km/h   ${G.jumps} jump${G.jumps === 1 ? '' : 's'}`));
        const form = el('form', 'battle-form');
        const labelEl = el('label', 'battle-label', 'ENTER YOUR NAME');
        labelEl.htmlFor = 'eleanor-name';
        const input = el('input', 'battle-input');
        input.id = 'eleanor-name';
        input.type = 'text';
        input.maxLength = MAX_NAME;
        input.autocomplete = 'off';
        input.spellcheck = false;
        try {
            input.value = localStorage.getItem('lh-player') || '';
        } catch (err) {
            input.value = '';
        }
        const save = el('button', 'battle-button', 'SAVE');
        save.type = 'submit';
        const skip = el('button', 'battle-button battle-button-ghost', 'SKIP');
        skip.type = 'button';
        skip.addEventListener('click', () => skipName());
        form.append(labelEl, input, save, skip);
        panel.appendChild(form);
        panel.appendChild(el('p', 'battle-hint', G.touch ? 'save your run or skip' : 'ENTER to save   ESC to skip'));
        panel.hidden = false;
        form.addEventListener('submit', event => {
            event.preventDefault();
            const name = input.value.replace(/[^\p{L}\p{N} _.'-]/gu, '').trim().slice(0, MAX_NAME) || 'anon';
            try {
                localStorage.setItem('lh-player', name);
            } catch (err) {}
            const entry = { name, score: Math.floor(G.distance), speed: Math.round(G.topSpeed * KMH_PER_UNIT), jumps: G.jumps, misses: G.nearMisses, crashes: G.crashes, theme: themeName(), at: new Date().toISOString() };
            G.panelMode = 'busy';
            submitScore(entry).then(result => {
                if (G) showBoard(result, entry);
            });
        });
        setTimeout(() => input.focus(), 50);
    }

    function skipName() {
        if (!G || G.panelMode !== 'name') return;
        G.panelMode = 'busy';
        fetchScores().then(result => {
            if (G) showBoard(result, null);
        });
    }

    function showBoard(result, mine) {
        const panel = G.panel;
        panel.replaceChildren();
        G.panelMode = 'board';
        panel.appendChild(el('h2', 'battle-title', 'ELEANOR'));
        const scope = result.local ? (result.offline ? 'scoreboard offline, saved in this browser' : 'scoreboard for this browser') : 'top 10 worldwide, sixty seconds each';
        panel.appendChild(el('p', 'battle-sub', scope));
        const list = el('ol', 'battle-scores');
        if (!result.scores.length) list.appendChild(el('li', 'battle-empty', 'no runs yet. be the first.'));
        result.scores.forEach((row, index) => {
            const item = el('li', 'battle-row');
            const isMine = !!mine && ((result.rank && index === result.rank - 1) || (!result.rank && row.name === mine.name && row.score === mine.score));
            if (isMine) item.classList.add('is-mine');
            item.append(
                el('span', 'battle-rank', String(index + 1).padStart(2, '0')),
                el('span', 'battle-name', row.name),
                el('span', 'battle-score', `${Number(row.score).toLocaleString('en-US')} m`),
                el('span', 'battle-kills', `${row.speed || 0} km/h \u00B7 ${row.jumps || 0} jump${row.jumps === 1 ? '' : 's'}`)
            );
            list.appendChild(item);
        });
        panel.appendChild(list);
        if (mine && result.rank && result.rank > 10) panel.appendChild(el('p', 'battle-sub', `you are #${result.rank}`));
        const actions = el('div', 'battle-actions');
        const again = el('button', 'battle-button', 'DRIVE AGAIN');
        again.type = 'button';
        again.addEventListener('click', () => restart());
        const leave = el('button', 'battle-button battle-button-ghost', 'BACK TO THE SITE');
        leave.type = 'button';
        leave.addEventListener('click', () => stop());
        actions.append(again, leave);
        panel.appendChild(actions);
        if (!G.touch) panel.appendChild(el('p', 'battle-hint', 'R drive again   ESC back to the site'));
        panel.hidden = false;
    }

    const audio = { ctx: null, master: null, filter: null, muted: false, timer: 0, nextNote: 0, step: 0, engine: null, engineGain: null };

    function rand(seed) {
        let s = seed >>> 0 || 1;
        return () => {
            s = (s * 1664525 + 1013904223) >>> 0;
            return s / 4294967296;
        };
    }

    function ease(a, b, p) {
        return a + (b - a) * ((-Math.cos(p * Math.PI) / 2) + 0.5);
    }

    function clamp(v, lo, hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    function overlap(x1, w1, x2, w2, percent) {
        const half = (percent || 1) / 2;
        const min1 = x1 - w1 * half;
        const max1 = x1 + w1 * half;
        const min2 = x2 - w2 * half;
        const max2 = x2 + w2 * half;
        return !(max1 < min2 || min1 > max2);
    }

    function buildTrack(seed) {
        const r = rand(seed);
        const segments = [];
        const lastY = () => (segments.length ? segments[segments.length - 1].p2.world.y : 0);
        const add = (curve, y, attrs) => {
            const n = segments.length;
            segments.push({
                index: n,
                p1: { world: { y: lastY(), z: n * SEG }, camera: {}, screen: {} },
                p2: { world: { y, z: (n + 1) * SEG }, camera: {}, screen: {} },
                curve,
                tunnel: !!(attrs && attrs.tunnel),
                ramp: !!(attrs && attrs.ramp),
                warn: !!(attrs && attrs.warn),
                light: !!(attrs && attrs.light),
                buildings: [],
                cars: [],
                clip: 0,
                fog: 1,
            });
        };
        const road = (enter, hold, leave, curve, y, attrs) => {
            const start = lastY();
            const end = start + y * SEG;
            const total = enter + hold + leave;
            for (let i = 0; i < enter; i++) add(ease(0, curve, i / enter), ease(start, end, i / total), attrs);
            for (let i = 0; i < hold; i++) add(curve, ease(start, end, (enter + i) / total), attrs);
            for (let i = 0; i < leave; i++) add(ease(curve, 0, i / leave), ease(start, end, (enter + hold + i) / total), attrs);
        };
        const tunnel = length => {
            const curve = (r() - 0.5) * 3;
            for (let i = 0; i < length; i++) add(i < 12 ? ease(0, curve, i / 12) : (i > length - 12 ? ease(curve, 0, (i - (length - 12)) / 12) : curve), lastY(), { tunnel: true, light: i % 6 === 0 });
        };
        const ramp = () => {
            for (let i = 0; i < 6; i++) add(0, lastY(), { warn: true });
            add(0, lastY(), { ramp: true });
            for (let i = 0; i < 24; i++) add(0, lastY());
        };
        road(20, 80, 20, 0, 0);
        while (segments.length < 2600) {
            const roll = r();
            if (roll < 0.22) road(20 + Math.floor(r() * 30), 20 + Math.floor(r() * 60), 20 + Math.floor(r() * 30), (r() < 0.5 ? -1 : 1) * (2 + r() * 4), 0);
            else if (roll < 0.40) road(30, 30 + Math.floor(r() * 40), 30, (r() - 0.5) * 3, (r() < 0.5 ? -1 : 1) * (10 + r() * 30));
            else if (roll < 0.55) road(10, 20 + Math.floor(r() * 40), 10, 0, 0);
            else if (roll < 0.72) tunnel(60 + Math.floor(r() * 90));
            else if (roll < 0.90) ramp();
            else road(20, 20, 20, (r() - 0.5) * 6, (r() - 0.5) * 60);
        }
        const length = segments.length;
        for (let n = 0; n < length; n++) {
            const seg = segments[n];
            if (seg.tunnel) continue;
            if (n % 3 === 0 && r() < 0.85) seg.buildings.push({ side: -1, w: 0.4 + r() * 0.9, h: 0.6 + r() * 2.4, gap: 1.05 + r() * 0.6, shade: Math.floor(r() * 3) });
            if (n % 3 === 1 && r() < 0.85) seg.buildings.push({ side: 1, w: 0.4 + r() * 0.9, h: 0.6 + r() * 2.4, gap: 1.05 + r() * 0.6, shade: Math.floor(r() * 3) });
        }
        return segments;
    }

    function buildSkyline(seed, layers) {
        const r = rand(seed);
        return layers.map((layer, li) => {
            const buildings = [];
            let x = 0;
            while (x < 4000) {
                const w = 40 + r() * (90 + li * 60);
                const h = 40 + r() * (80 + li * 90);
                buildings.push({ x, w, h, windows: r() < 0.8, wx: 6 + Math.floor(r() * 5), wy: 8 + Math.floor(r() * 6), roof: r() < 0.25 });
                x += w + 4 + r() * 30;
            }
            return { ...layer, width: x, buildings };
        });
    }

    function findSegment(z) {
        const length = G.segments.length;
        return G.segments[((Math.floor(z / SEG) % length) + length) % length];
    }

    function resetCars() {
        const r = rand(G.seed + 99);
        G.cars = [];
        const lanes = [-0.66, -0.22, 0.22, 0.66];
        for (let i = 0; i < TRAFFIC; i++) {
            const z = 2000 + Math.floor(r() * (G.trackLength - 4000) / SEG) * SEG;
            const seg = findSegment(z);
            if (seg.tunnel && r() < 0.5) continue;
            const car = { z, offset: lanes[Math.floor(r() * lanes.length)], speed: MAX_SPEED * (0.18 + r() * 0.42), shade: Math.floor(r() * PAL.traffic.length), w: 0.34, passed: false };
            G.cars.push(car);
            seg.cars.push(car);
        }
    }

    function project(p, cameraX, cameraY, cameraZ) {
        p.camera.x = -cameraX;
        p.camera.y = (p.world.y || 0) - cameraY;
        p.camera.z = (p.world.z || 0) - cameraZ;
        p.screen.scale = G.cameraDepth / Math.max(1, p.camera.z);
        p.screen.x = Math.round(G.W / 2 + p.screen.scale * p.camera.x * G.W / 2);
        p.screen.y = Math.round(G.H / 2 - p.screen.scale * p.camera.y * G.H / 2);
        p.screen.w = Math.round(p.screen.scale * ROAD_WIDTH * G.W / 2);
    }

    function poly(ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x4, y4);
        ctx.closePath();
        ctx.fill();
    }

    function fogColor(color, fog) {
        if (fog >= 1) return color;
        const target = G.inTunnelDepth > 0 ? [26, 26, 26] : [190, 190, 190];
        const c = parseInt(color.slice(1), 16);
        const rgb = [(c >> 16) & 255, (c >> 8) & 255, c & 255].map((v, i) => Math.round(v * fog + target[i] * (1 - fog)));
        return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }

    function drawSegment(ctx, seg, x1, y1, w1, x2, y2, w2, alt) {
        const fog = seg.fog;
        const r1 = w1 / Math.max(6, 2 * RUMBLE);
        const r2 = w2 / Math.max(6, 2 * RUMBLE);
        const l1 = w1 / Math.max(32, 8 * LANES);
        const l2 = w2 / Math.max(32, 8 * LANES);
        poly(ctx, 0, y2, G.W, y2, G.W, y1, 0, y1, fogColor(alt ? PAL.ground : PAL.groundAlt, fog));
        poly(ctx, x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, fogColor(alt ? PAL.rumble : PAL.rumbleAlt, fog));
        poly(ctx, x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, fogColor(alt ? PAL.rumble : PAL.rumbleAlt, fog));
        let roadColor = alt ? PAL.road : PAL.roadAlt;
        if (seg.ramp) roadColor = PAL.ramp;
        else if (seg.warn) roadColor = seg.index % 2 ? PAL.ramp : PAL.rampAlt;
        poly(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, fogColor(roadColor, fog));
        if (alt && !seg.ramp && !seg.warn) {
            const lw1 = w1 * 2 / LANES;
            const lw2 = w2 * 2 / LANES;
            let lx1 = x1 - w1 + lw1;
            let lx2 = x2 - w2 + lw2;
            for (let lane = 1; lane < LANES; lane++) {
                poly(ctx, lx1 - l1 / 2, y1, lx1 + l1 / 2, y1, lx2 + l2 / 2, y2, lx2 - l2 / 2, y2, fogColor(PAL.lane, fog));
                lx1 += lw1;
                lx2 += lw2;
            }
        }
        if (seg.tunnel) {
            const h1 = w1 * 1.35;
            const h2 = w2 * 1.35;
            const wallColor = fogColor(seg.index % 2 ? PAL.wall : PAL.wallAlt, fog);
            poly(ctx, x1 - w1 - r1 * 2, y1, x1 - w1 - r1 * 2, y1 - h1, x2 - w2 - r2 * 2, y2 - h2, x2 - w2 - r2 * 2, y2, wallColor);
            poly(ctx, x1 + w1 + r1 * 2, y1, x1 + w1 + r1 * 2, y1 - h1, x2 + w2 + r2 * 2, y2 - h2, x2 + w2 + r2 * 2, y2, wallColor);
            poly(ctx, x1 - w1 - r1 * 2, y1 - h1, x1 + w1 + r1 * 2, y1 - h1, x2 + w2 + r2 * 2, y2 - h2, x2 - w2 - r2 * 2, y2 - h2, fogColor(PAL.ceiling, fog));
            if (seg.light) poly(ctx, x1 - w1 * 0.25, y1 - h1 + 1, x1 + w1 * 0.25, y1 - h1 + 1, x2 + w2 * 0.25, y2 - h2 + 1, x2 - w2 * 0.25, y2 - h2 + 1, fogColor(PAL.light, fog));
        }
    }

    function drawBuilding(ctx, b, seg, scale, x, y, clip) {
        const size = scale * G.W / 2;
        const w = b.w * ROAD_WIDTH * size * 0.35;
        const h = b.h * ROAD_WIDTH * size * 0.32;
        const edge = ROAD_WIDTH * size * (1.12 + (b.gap - 1.05) * 0.6);
        const left = b.side < 0 ? x - w - edge : x + edge;
        const top = y - h;
        const bottom = Math.min(y, clip);
        if (bottom <= top) return;
        ctx.fillStyle = fogColor([PAL.near, PAL.mid, PAL.far][b.shade], seg.fog);
        ctx.fillRect(left, top, w, bottom - top);
        if (w > 10 && h > 14) {
            ctx.fillStyle = fogColor(PAL.window, seg.fog);
            const cols = Math.max(1, Math.floor(w / 9));
            const rows = Math.max(1, Math.floor(h / 12));
            const cw = w / cols;
            const rh = h / rows;
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    if (((seg.index * 7 + i * 13 + j * 5) % 11) < 6) continue;
                    const wx = left + i * cw + cw * 0.3;
                    const wy = top + j * rh + rh * 0.25;
                    if (wy + rh * 0.4 > bottom) continue;
                    ctx.fillRect(wx, wy, Math.max(1, cw * 0.4), Math.max(1, rh * 0.4));
                }
            }
        }
    }

    function roundRect(ctx, x, y, w, h, r) {
        const radius = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }

    function drawCarSprite(ctx, x, y, w, shade, spin, isPlayer) {
        const h = w * 0.82;
        const body = isPlayer ? PAL.car : PAL.traffic[shade];
        const dark = isPlayer ? PAL.carDark : '#1f1f1f';
        ctx.save();
        ctx.translate(x, y);
        if (spin) ctx.rotate(spin);
        ctx.fillStyle = PAL.shadow;
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.56, w * 0.085, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PAL.ink;
        roundRect(ctx, -w * 0.5, -h * 0.4, w * 0.17, h * 0.4, w * 0.035);
        roundRect(ctx, w * 0.33, -h * 0.4, w * 0.17, h * 0.4, w * 0.035);
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(-w * 0.46, -h * 0.34, w * 0.09, h * 0.28);
        ctx.fillRect(w * 0.37, -h * 0.34, w * 0.09, h * 0.28);
        ctx.fillStyle = body;
        roundRect(ctx, -w * 0.46, -h * 0.56, w * 0.92, h * 0.47, w * 0.05);
        ctx.fillStyle = dark;
        ctx.fillRect(-w * 0.43, -h * 0.34, w * 0.86, h * 0.15);
        ctx.fillStyle = '#f4f4f4';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-w * 0.41 + i * w * 0.06, -h * 0.31, w * 0.045, h * 0.09);
            ctx.fillRect(w * 0.41 - i * w * 0.06 - w * 0.045, -h * 0.31, w * 0.045, h * 0.09);
        }
        ctx.fillStyle = PAL.ink;
        ctx.fillRect(-w * 0.46, -h * 0.15, w * 0.92, h * 0.04);
        ctx.beginPath();
        ctx.arc(-w * 0.2, -h * 0.085, w * 0.03, 0, Math.PI * 2);
        ctx.arc(w * 0.2, -h * 0.085, w * 0.03, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = dark;
        ctx.fillRect(-w * 0.44, -h * 0.6, w * 0.88, h * 0.05);
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.moveTo(-w * 0.37, -h * 0.56);
        ctx.lineTo(-w * 0.28, -h);
        ctx.lineTo(w * 0.28, -h);
        ctx.lineTo(w * 0.37, -h * 0.56);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = PAL.glass;
        ctx.beginPath();
        ctx.moveTo(-w * 0.31, -h * 0.6);
        ctx.lineTo(-w * 0.24, -h * 0.93);
        ctx.lineTo(w * 0.24, -h * 0.93);
        ctx.lineTo(w * 0.31, -h * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = body;
        ctx.fillRect(-w * 0.28, -h, w * 0.56, h * 0.06);
        if (isPlayer) {
            ctx.fillStyle = PAL.stripe;
            ctx.fillRect(-w * 0.085, -h, w * 0.055, h * 0.95);
            ctx.fillRect(w * 0.03, -h, w * 0.055, h * 0.95);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.fillRect(-w * 0.28, -h * 0.98, w * 0.56, h * 0.02);
        }
        ctx.restore();
    }

    const CAR_MESH = (() => {
        const faces = [];
        const lower = [[-2.3, 0.32], [-2.3, 0.78], [-1.95, 0.9], [0.95, 0.9], [2.05, 0.82], [2.3, 0.68], [2.3, 0.32]];
        const upper = [[-1.9, 0.9], [-1.55, 0.98], [-0.85, 1.28], [0.15, 1.32], [0.95, 1.02], [1.05, 0.9]];
        const upperTags = ['glass', 'glass', 'body', 'glass', 'body'];
        const push = (points, tag, center) => {
            const [a, b, c] = points;
            const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
            const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
            const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
            const cx = points.reduce((sum, q) => sum + q[0], 0) / points.length - center[0];
            const cy = points.reduce((sum, q) => sum + q[1], 0) / points.length - center[1];
            const cz = points.reduce((sum, q) => sum + q[2], 0) / points.length - center[2];
            const outward = n[0] * cx + n[1] * cy + n[2] * cz;
            faces.push({ points: outward < 0 ? points.slice().reverse() : points, tag });
        };
        const loft = (profile, halfWidth, tags, center, sideTag) => {
            const left = profile.map(([z, y]) => [-halfWidth, y, z]);
            const right = profile.map(([z, y]) => [halfWidth, y, z]);
            push(left, sideTag, center);
            push(right, sideTag, center);
            for (let i = 0; i < profile.length - 1; i++) {
                push([left[i], left[i + 1], right[i + 1], right[i]], tags ? tags[i] : 'body', center);
            }
            push([left[0], right[0], right[profile.length - 1], left[profile.length - 1]], 'bottom', center);
        };
        loft(lower, 0.95, null, [0, 0.6, 0], 'body');
        loft(upper, 0.72, upperTags, [0, 1.0, -0.4], 'glass');
        const wheel = (x, z) => {
            const r = 0.34;
            const half = 0.14;
            const y0 = 0.34;
            const sides = 8;
            const outer = [];
            const inner = [];
            for (let i = 0; i < sides; i++) {
                const a = (i / sides) * Math.PI * 2;
                outer.push([x + Math.sign(x) * half, y0 + Math.sin(a) * r, z + Math.cos(a) * r]);
                inner.push([x - Math.sign(x) * half, y0 + Math.sin(a) * r, z + Math.cos(a) * r]);
            }
            const center = [x, y0, z];
            push(outer, 'tyre', center);
            push(inner, 'tyre', center);
            for (let i = 0; i < sides; i++) push([outer[i], outer[(i + 1) % sides], inner[(i + 1) % sides], inner[i]], 'tread', center);
        };
        wheel(-0.86, -1.45);
        wheel(0.86, -1.45);
        wheel(-0.86, 1.45);
        wheel(0.86, 1.45);
        const top = [[-2.3, 0.78], [-1.95, 0.9], [-1.9, 0.9], [-1.55, 0.98], [-0.85, 1.28], [0.15, 1.32], [0.95, 1.02], [1.05, 0.9], [2.05, 0.82], [2.3, 0.68]];
        const decals = [];
        const glassSpans = new Set([2, 3, 5]);
        for (let i = 0; i < top.length - 1; i++) {
            if (glassSpans.has(i)) continue;
            const [z1, y1] = top[i];
            const [z2, y2] = top[i + 1];
            for (const sign of [-1, 1]) {
                decals.push({ points: [[sign * 0.1, y1 + 0.012, z1], [sign * 0.24, y1 + 0.012, z1], [sign * 0.24, y2 + 0.012, z2], [sign * 0.1, y2 + 0.012, z2]], tag: 'stripe' });
            }
        }
        for (const sign of [-1, 1]) {
            for (let i = 0; i < 3; i++) {
                const x0 = sign * (0.42 + i * 0.13);
                decals.push({ points: [[x0, 0.62, -2.31], [x0 + sign * 0.09, 0.62, -2.31], [x0 + sign * 0.09, 0.5, -2.31], [x0, 0.5, -2.31]], tag: 'light' });
            }
            decals.push({ points: [[sign * 0.32, 0.4, -2.31], [sign * 0.42, 0.4, -2.31], [sign * 0.42, 0.34, -2.31], [sign * 0.32, 0.34, -2.31]], tag: 'exhaust' });
        }
        return { faces, decals };
    })();

    const CAR_COLORS = { body: [168, 168, 168], glass: [70, 70, 70], bottom: [30, 30, 30], tyre: [24, 24, 24], tread: [40, 40, 40], stripe: [20, 20, 20], light: [244, 244, 244], exhaust: [90, 90, 90] };

    function drawCar3D(ctx, cx, cy, w, roll, yaw, pitch) {
        const cam = [0, 1.55, -6.6];
        const target = [0, 0.72, 0.5];
        const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
        const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
        const forward = norm([target[0] - cam[0], target[1] - cam[1], target[2] - cam[2]]);
        const right = norm(cross([0, 1, 0], forward));
        const up = cross(forward, right);
        const focal = w * 4.4 / 1.9;
        const sr = Math.sin(roll), cr = Math.cos(roll);
        const sy = Math.sin(yaw), cyw = Math.cos(yaw);
        const sp = Math.sin(pitch), cp = Math.cos(pitch);
        const light = norm([-0.35, 1, -0.6]);
        const transform = p => {
            let [x, y, z] = p;
            let x1 = x * cr - y * sr;
            let y1 = x * sr + y * cr;
            let y2 = y1 * cp - z * sp;
            let z2 = y1 * sp + z * cp;
            let x3 = x1 * cyw + z2 * sy;
            let z3 = -x1 * sy + z2 * cyw;
            const d = [x3 - cam[0], y2 - cam[1], z3 - cam[2]];
            return [d[0] * right[0] + d[1] * right[1] + d[2] * right[2], d[0] * up[0] + d[1] * up[1] + d[2] * up[2], d[0] * forward[0] + d[1] * forward[1] + d[2] * forward[2]];
        };
        const anchor = transform([0, 0.3, -2.3]);
        const ax = focal * anchor[0] / anchor[2];
        const ay = -focal * anchor[1] / anchor[2];
        const project = v => [cx + focal * v[0] / v[2] - ax, cy - focal * v[1] / v[2] - ay];
        const drawFace = (face, cull) => {
            const pts = face.points.map(transform);
            const a = pts[0], b = pts[1], c = pts[2];
            const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
            const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
            const n = norm(cross(u, v));
            const centroid = pts.reduce((acc, q) => [acc[0] + q[0] / pts.length, acc[1] + q[1] / pts.length, acc[2] + q[2] / pts.length], [0, 0, 0]);
            if (cull && (n[0] * centroid[0] + n[1] * centroid[1] + n[2] * centroid[2]) > 0) return null;
            const lightCam = [light[0] * right[0] + light[1] * right[1] + light[2] * right[2], light[0] * up[0] + light[1] * up[1] + light[2] * up[2], light[0] * forward[0] + light[1] * forward[1] + light[2] * forward[2]];
            const shade = 0.55 + 0.45 * Math.max(0, -(n[0] * lightCam[0] + n[1] * lightCam[1] + n[2] * lightCam[2]));
            return { depth: centroid[2], screen: pts.map(project), shade, tag: face.tag };
        };
        const drawn = CAR_MESH.faces.map(f => drawFace(f, true)).filter(Boolean).sort((p, q) => q.depth - p.depth);
        const paint = item => {
            const base = CAR_COLORS[item.tag] || CAR_COLORS.body;
            const s = item.tag === 'light' || item.tag === 'stripe' ? 1 : item.shade;
            ctx.fillStyle = `rgb(${Math.round(base[0] * s)}, ${Math.round(base[1] * s)}, ${Math.round(base[2] * s)})`;
            ctx.beginPath();
            item.screen.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            ctx.closePath();
            ctx.fill();
            if (item.tag === 'glass') {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        };
        drawn.forEach(paint);
        CAR_MESH.decals.map(f => drawFace(f, false)).filter(Boolean).forEach(paint);
    }

    function drawSky(ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, G.H * 0.7);
        grad.addColorStop(0, PAL.skyTop);
        grad.addColorStop(1, PAL.skyBottom);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, G.W, G.H);
        const horizon = G.H * 0.5 + G.hillOffset;
        for (const layer of G.skyline) {
            const shift = (G.skyOffset * layer.speed) % layer.width;
            ctx.fillStyle = layer.color;
            for (let pass = -1; pass <= 1; pass++) {
                for (const b of layer.buildings) {
                    const bx = b.x - shift + pass * layer.width;
                    if (bx + b.w < 0 || bx > G.W) continue;
                    const top = horizon - b.h * layer.scale;
                    ctx.fillStyle = layer.color;
                    ctx.fillRect(bx, top, b.w, b.h * layer.scale + 4);
                    if (b.roof) ctx.fillRect(bx + b.w * 0.4, top - 8 * layer.scale, b.w * 0.2, 8 * layer.scale);
                    if (b.windows && layer.scale > 0.6) {
                        ctx.fillStyle = layer.window;
                        for (let i = 3; i < b.w - 4; i += b.wx) {
                            for (let j = 4; j < b.h * layer.scale - 4; j += b.wy) {
                                if (((i * 31 + j * 17 + b.x) % 7) < 3) ctx.fillRect(bx + i, top + j, 2, 3);
                            }
                        }
                    }
                }
            }
        }
    }

    function render() {
        const ctx = G.ctx;
        const base = findSegment(G.position);
        const basePercent = (G.position % SEG) / SEG;
        const playerSegment = findSegment(G.position + G.playerZ);
        const playerPercent = ((G.position + G.playerZ) % SEG) / SEG;
        const playerY = ease(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
        G.hillOffset = clamp(-playerY / 60, -60, 60);
        let maxy = G.H;
        let x = 0;
        let dx = -(base.curve * basePercent);

        ctx.save();
        if (G.shake > 0) ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
        drawSky(ctx);

        for (let n = 0; n < DRAW; n++) {
            const seg = G.segments[(base.index + n) % G.segments.length];
            seg.looped = seg.index < base.index;
            seg.fog = 1 / Math.pow(Math.E, (n / DRAW) * (n / DRAW) * FOG);
            seg.clip = maxy;
            project(seg.p1, (G.playerX * ROAD_WIDTH) - x, playerY + CAMERA_HEIGHT, G.position - (seg.looped ? G.trackLength : 0));
            project(seg.p2, (G.playerX * ROAD_WIDTH) - x - dx, playerY + CAMERA_HEIGHT, G.position - (seg.looped ? G.trackLength : 0));
            x += dx;
            dx += seg.curve;
            if (seg.p1.camera.z <= G.cameraDepth || seg.p2.screen.y >= seg.p1.screen.y || seg.p2.screen.y >= maxy) continue;
            drawSegment(ctx, seg, seg.p1.screen.x, seg.p1.screen.y, seg.p1.screen.w, seg.p2.screen.x, seg.p2.screen.y, seg.p2.screen.w, Math.floor(seg.index / RUMBLE) % 2 === 0);
            maxy = seg.p1.screen.y;
        }

        for (let n = DRAW - 1; n > 0; n--) {
            const seg = G.segments[(base.index + n) % G.segments.length];
            if (seg.p1.camera.z <= G.cameraDepth) continue;
            for (const b of seg.buildings) drawBuilding(ctx, b, seg, seg.p1.screen.scale, seg.p1.screen.x, seg.p1.screen.y, seg.clip);
            for (const car of seg.cars) {
                const percent = (car.z % SEG) / SEG;
                const scale = ease(seg.p1.screen.scale, seg.p2.screen.scale, percent);
                const cx = ease(seg.p1.screen.x, seg.p2.screen.x, percent) + scale * car.offset * ROAD_WIDTH * G.W / 2;
                const cy = ease(seg.p1.screen.y, seg.p2.screen.y, percent);
                if (cy > seg.clip) continue;
                const w = scale * car.w * ROAD_WIDTH * G.W / 2 * 0.9;
                if (w < 2) continue;
                ctx.save();
                ctx.beginPath();
                ctx.rect(0, 0, G.W, seg.clip);
                ctx.clip();
                ctx.globalAlpha = seg.fog < 0.2 ? seg.fog * 5 : 1;
                drawCarSprite(ctx, cx, cy, w, car.shade, 0, false);
                ctx.restore();
            }
        }

        const carW = G.W * 0.16 * Math.min(1.3, Math.max(0.7, G.W / 900));
        const bounce = (Math.random() - 0.5) * 2 * (G.speed / MAX_SPEED) * 2;
        const lift = G.air.y * G.H * 0.2;
        if (G.air.y > 0) {
            ctx.fillStyle = PAL.shadow;
            ctx.beginPath();
            ctx.ellipse(G.W / 2, G.H * 0.9, carW * 0.45 * (1 - G.air.y * 0.2), carW * 0.08, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        const roll = -G.steerSmooth * 0.09 + G.spin * 0.15;
        const yaw = G.steerSmooth * 0.14 + G.spin * 1.4;
        const pitch = G.air.y > 0 ? clamp(-G.air.vy * 0.22, -0.3, 0.3) : (G.throttle ? -0.02 : 0);
        drawCar3D(ctx, G.W / 2 + G.steerTilt * 6, G.H * 0.93 + bounce - lift, carW * (1 + G.air.y * 0.25), roll, yaw, pitch);

        for (const p of G.particles) {
            ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.globalAlpha = 1;
        if (G.speed > MAX_SPEED * 0.75) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 10; i++) {
                const sx = Math.random() * G.W;
                const sy = Math.random() * G.H * 0.8;
                const len = 20 + Math.random() * 60 * (G.speed / MAX_SPEED);
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(sx + (sx - G.W / 2) * 0.08, sy + len);
                ctx.stroke();
            }
        }
        ctx.restore();
        drawHud(ctx);
    }

    function label(ctx, text, x, y, align, size, color) {
        ctx.font = `700 ${size}px ${G.mono}`;
        ctx.textAlign = align;
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillText(text, x + 2, y + 2);
        ctx.fillStyle = color || PAL.text;
        ctx.fillText(text, x, y);
    }

    function drawHud(ctx) {
        const m = Math.floor(G.distance);
        label(ctx, `${m.toLocaleString('en-US')} m`, 16, 14, 'left', 18);
        label(ctx, `${Math.round(G.speed * KMH_PER_UNIT)} km/h`, G.W - 16, 14, 'right', 18);
        const secs = Math.max(0, G.clock);
        label(ctx, secs.toFixed(1), G.W / 2, 10, 'center', 34, secs < 10 ? '#ffffff' : PAL.text);
        if (G.best > 0) label(ctx, `BEST ${Math.floor(G.best).toLocaleString('en-US')} m`, 16, 40, 'left', 12, 'rgba(242, 242, 242, 0.7)');
        if (G.phase === 'countdown') {
            const n = Math.ceil(G.countdown);
            label(ctx, n > 0 ? String(n) : 'GO', G.W / 2, G.H * 0.36, 'center', 72);
            label(ctx, 'ELEANOR', G.W / 2, G.H * 0.36 + 84, 'center', 14, 'rgba(242, 242, 242, 0.8)');
            label(ctx, G.touch ? 'HOLD TO DRIVE. SLIDE TO STEER.' : 'HOLD SPACE OR UP TO DRIVE. LEFT AND RIGHT TO STEER.', G.W / 2, G.H * 0.36 + 106, 'center', 12, 'rgba(242, 242, 242, 0.8)');
            if (G.worldBest) label(ctx, `WORLD BEST ${G.worldBest.name} ${Number(G.worldBest.score).toLocaleString('en-US')} M`, G.W / 2, G.H * 0.36 + 130, 'center', 12, 'rgba(242, 242, 242, 0.7)');
        }
        for (const t of G.texts) {
            ctx.globalAlpha = Math.max(0, 1 - t.t / t.life);
            label(ctx, t.text, G.W / 2, G.H * 0.62 - t.t * 40, 'center', 22);
            ctx.globalAlpha = 1;
        }
        if (G.phase === 'over' && !G.panelMode) {
            ctx.fillStyle = 'rgba(17, 17, 17, 0.78)';
            ctx.fillRect(0, G.H / 2 - 110, G.W, 220);
            label(ctx, "TIME'S UP", G.W / 2, G.H / 2 - 92, 'center', 34);
            label(ctx, `ELEANOR COVERED ${Math.floor(G.distance).toLocaleString('en-US')} M`, G.W / 2, G.H / 2 - 40, 'center', 18);
            label(ctx, `TOP SPEED ${Math.round(G.topSpeed * KMH_PER_UNIT)} KM/H   ${G.jumps} JUMP${G.jumps === 1 ? '' : 'S'}   ${G.nearMisses} CLOSE CALL${G.nearMisses === 1 ? '' : 'S'}   ${G.crashes} CRASH${G.crashes === 1 ? '' : 'ES'}`, G.W / 2, G.H / 2 - 8, 'center', 12, 'rgba(242, 242, 242, 0.85)');
            if (G.newBest) label(ctx, 'NEW PERSONAL BEST', G.W / 2, G.H / 2 + 22, 'center', 14);
            label(ctx, 'RESULTS COMING UP', G.W / 2, G.H / 2 + 62, 'center', 12, 'rgba(242, 242, 242, 0.8)');
        }
        if (G.paused) {
            ctx.fillStyle = 'rgba(17, 17, 17, 0.6)';
            ctx.fillRect(0, G.H / 2 - 40, G.W, 80);
            label(ctx, 'PAUSE', G.W / 2, G.H / 2 - 18, 'center', 30);
        }
    }

    function text(msg) {
        G.texts.push({ text: msg, t: 0, life: 1.1 });
    }

    function dust(n, color, spread) {
        for (let i = 0; i < n; i++) {
            G.particles.push({ x: G.W / 2 + (Math.random() - 0.5) * spread, y: G.H * 0.9 + Math.random() * 10, vx: (Math.random() - 0.5) * 120, vy: -40 - Math.random() * 120, size: 2 + Math.random() * 3, t: 0, life: 0.5 + Math.random() * 0.5, color: color || PAL.dust });
        }
    }

    function update(dt) {
        if (G.phase === 'countdown') {
            G.countdown -= dt;
            if (G.countdown <= -0.6) G.phase = 'play';
        }
        if (G.paused) return;
        if (G.phase === 'over') {
            G.overAt += dt;
            if (G.overAt > 1.2 && !G.ended) {
                G.ended = true;
                if (G.distance >= 1) showNameForm();
                else fetchScores().then(result => {
                    if (G) showBoard(result, null);
                });
            }
        }
        const playing = G.phase === 'play';
        if (playing) {
            G.clock -= dt;
            if (G.clock <= 0) {
                G.clock = 0;
                finish();
            }
        }

        const playerSegment = findSegment(G.position + G.playerZ);
        const speedPercent = G.speed / MAX_SPEED;
        G.steerSmooth += (clamp(G.steer, -1, 1) - G.steerSmooth) * Math.min(1, dt * 9);
        const steer = G.steerSmooth;
        const dx = dt * (1.1 + 1.3 * speedPercent);

        if (G.air.y > 0 || G.air.vy > 0) {
            G.air.vy -= GRAVITY * dt;
            G.air.y += G.air.vy * dt;
            if (G.air.y <= 0) {
                G.air.y = 0;
                G.air.vy = 0;
                G.shake = 14;
                dust(24, PAL.dust, 90);
                sound('land');
            }
            G.playerX += dx * steer * 0.45;
        } else {
            G.playerX += dx * steer;
            G.playerX -= dt * 2 * speedPercent * speedPercent * playerSegment.curve * CENTRIFUGAL;
        }
        G.steerTilt += ((steer * 3) - G.steerTilt) * Math.min(1, dt * 10);

        const throttle = playing && G.throttle && G.spin === 0;
        if (throttle) G.speed += ACCEL * dt;
        else if (playing && G.brake) G.speed += BRAKE * dt;
        else G.speed += COAST * dt;

        if ((G.playerX < -1 || G.playerX > 1) && G.speed > OFFROAD_LIMIT && G.air.y === 0) {
            G.speed += OFFROAD * dt;
            G.shake = Math.max(G.shake, 4);
            if (Math.random() < 0.5) dust(2, 'rgba(120, 120, 120, 0.8)', 60);
        }
        G.playerX = clamp(G.playerX, -2, 2);
        G.speed = clamp(G.speed, 0, MAX_SPEED);
        G.topSpeed = Math.max(G.topSpeed, G.speed);

        if (G.spinTime > 0) {
            G.spinTime -= dt;
            G.spin = Math.sin((0.8 - G.spinTime) * 8) * 0.9 * Math.max(0, G.spinTime / 0.8);
            if (G.spinTime <= 0) G.spin = 0;
        }
        if (G.invulnerable > 0) G.invulnerable -= dt;

        const moved = G.speed * dt;
        G.position += moved;
        while (G.position >= G.trackLength) G.position -= G.trackLength;
        G.distance += moved * KMH_PER_UNIT / 3.6;
        G.skyOffset += playerSegment.curve * speedPercent * 1.6 * dt * 60;
        G.inTunnelDepth = playerSegment.tunnel ? Math.min(1, G.inTunnelDepth + dt * 2) : Math.max(0, G.inTunnelDepth - dt * 2);
        setTunnelFilter(G.inTunnelDepth);

        if (playerSegment.ramp && G.air.y === 0 && G.air.vy === 0 && G.speed > MAX_SPEED * 0.28) {
            G.air.vy = 0.55 + speedPercent * 1.15;
            G.air.y = 0.001;
            G.jumps += 1;
            G.shake = 6;
            text(speedPercent > 0.8 ? 'BIG AIR' : 'JUMP');
            sound('jump');
        }

        for (const car of G.cars) {
            const oldSeg = findSegment(car.z);
            car.z += car.speed * dt;
            while (car.z >= G.trackLength) car.z -= G.trackLength;
            const newSeg = findSegment(car.z);
            if (oldSeg !== newSeg) {
                const i = oldSeg.cars.indexOf(car);
                if (i >= 0) oldSeg.cars.splice(i, 1);
                newSeg.cars.push(car);
            }
        }

        if (playing && G.air.y === 0 && G.invulnerable <= 0) {
            for (const car of playerSegment.cars) {
                if (G.speed > car.speed && overlap(G.playerX, 0.3, car.offset, car.w, 0.75)) {
                    G.speed = Math.max(car.speed * 0.6, MAX_SPEED * 0.12);
                    G.spinTime = 0.8;
                    G.invulnerable = 1.6;
                    G.shake = 22;
                    G.crashes += 1;
                    dust(30, 'rgba(60, 60, 60, 0.8)', 120);
                    text('CRASH');
                    sound('crash');
                    break;
                }
            }
        }
        for (const car of playerSegment.cars) {
            if (!car.passed && G.speed > car.speed && Math.abs(G.playerX - car.offset) < 0.5 && Math.abs(G.playerX - car.offset) >= 0.34 * 0.8) {
                car.passed = true;
                G.nearMisses += 1;
                text('CLOSE');
                sound('whoosh');
            }
        }
        const behind = findSegment(G.position + G.playerZ - SEG * 2);
        for (const car of behind.cars) car.passed = false;

        if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 40);
        for (const p of G.particles) {
            p.t += dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 300 * dt;
        }
        G.particles = G.particles.filter(p => p.t < p.life);
        for (const t of G.texts) t.t += dt;
        G.texts = G.texts.filter(t => t.t < t.life);
        setEngine(speedPercent, throttle);
    }

    function finish() {
        G.phase = 'over';
        G.overAt = 0;
        G.throttle = false;
        G.newBest = G.distance > G.best;
        if (G.newBest) {
            G.best = G.distance;
            try {
                localStorage.setItem('lh-eleanor-best', String(Math.floor(G.best)));
            } catch (err) {}
        }
        stopMusic();
        sound('finish');
    }

    function ensureAudio() {
        if (audio.ctx) return audio.ctx;
        try {
            audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
            audio.master = audio.ctx.createGain();
            audio.master.gain.value = audio.muted ? 0 : 0.6;
            audio.filter = audio.ctx.createBiquadFilter();
            audio.filter.type = 'lowpass';
            audio.filter.frequency.value = 18000;
            audio.filter.connect(audio.master);
            audio.master.connect(audio.ctx.destination);
        } catch (err) {
            audio.ctx = null;
        }
        return audio.ctx;
    }

    function setTunnelFilter(depth) {
        if (!audio.filter) return;
        const target = 18000 - depth * 17000;
        audio.filter.frequency.setTargetAtTime(target, audio.ctx.currentTime, 0.15);
    }

    function setEngine(speedPercent, throttle) {
        const ac = ensureAudio();
        if (!ac) return;
        if (!audio.engine) {
            audio.engine = ac.createOscillator();
            audio.engine.type = 'sawtooth';
            audio.engineGain = ac.createGain();
            audio.engineGain.gain.value = 0;
            const lp = ac.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.value = 600;
            audio.engine.connect(lp);
            lp.connect(audio.engineGain);
            audio.engineGain.connect(audio.filter);
            audio.engine.start();
        }
        const now = ac.currentTime;
        audio.engine.frequency.setTargetAtTime(38 + speedPercent * 150 + (throttle ? 12 : 0), now, 0.08);
        audio.engineGain.gain.setTargetAtTime(G && G.phase !== 'over' ? 0.03 + speedPercent * 0.05 : 0, now, 0.1);
    }

    const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    function hz(name, octave) {
        return 440 * Math.pow(2, (NOTE[name[0]] + (name[1] === '#' ? 1 : name[1] === 'b' ? -1 : 0) + (octave - 4) * 12 - 9) / 12);
    }
    const CHORDS = [['D', 'F', 'A'], ['Bb', 'D', 'F'], ['F', 'A', 'C'], ['C', 'E', 'G'], ['D', 'F', 'A'], ['G', 'Bb', 'D'], ['Bb', 'D', 'F'], ['A', 'C#', 'E']];
    const BASS = ['D', 'Bb', 'F', 'C', 'D', 'G', 'Bb', 'A'];
    const BPM = 152;

    function playStep(time, step) {
        const ac = audio.ctx;
        const bar = Math.floor(step / 16) % CHORDS.length;
        const sixteenth = step % 16;
        const chord = CHORDS[bar];
        const out = audio.filter;
        const tone = (type, freq, start, dur, gain, dest) => {
            const osc = ac.createOscillator();
            const g = ac.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            g.gain.setValueAtTime(0.0001, start);
            g.gain.exponentialRampToValueAtTime(gain, start + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
            osc.connect(g);
            g.connect(dest || out);
            osc.start(start);
            osc.stop(start + dur + 0.02);
        };
        const arpNote = chord[(sixteenth % 3)];
        const arpOct = sixteenth % 6 < 3 ? 4 : 5;
        tone('square', hz(arpNote, arpOct), time, 0.11, 0.05);
        if (sixteenth % 2 === 0) tone('sawtooth', hz(BASS[bar], 2), time, 0.16, 0.09);
        if (sixteenth % 4 === 0) {
            const osc = ac.createOscillator();
            const g = ac.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);
            g.gain.setValueAtTime(0.5, time);
            g.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
            osc.connect(g);
            g.connect(out);
            osc.start(time);
            osc.stop(time + 0.2);
        }
        if (sixteenth % 8 === 4) noise(time, 0.12, 0.22, 1800, 'bandpass');
        if (sixteenth % 2 === 1) noise(time, 0.03, 0.06, 8000, 'highpass');
    }

    function noise(start, dur, gain, freq, type) {
        const ac = audio.ctx;
        if (!audio.noiseBuffer) {
            const length = ac.sampleRate;
            audio.noiseBuffer = ac.createBuffer(1, length, ac.sampleRate);
            const data = audio.noiseBuffer.getChannelData(0);
            for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
        }
        const src = ac.createBufferSource();
        src.buffer = audio.noiseBuffer;
        const f = ac.createBiquadFilter();
        f.type = type || 'bandpass';
        f.frequency.value = freq;
        const g = ac.createGain();
        g.gain.setValueAtTime(gain, start);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        src.connect(f);
        f.connect(g);
        g.connect(audio.filter);
        src.start(start);
        src.stop(start + dur + 0.02);
    }

    function startMusic() {
        const ac = ensureAudio();
        if (!ac || audio.timer) return;
        if (ac.state === 'suspended') ac.resume();
        audio.step = 0;
        audio.nextNote = ac.currentTime + 0.1;
        const stepLen = 60 / BPM / 4;
        audio.timer = setInterval(() => {
            while (audio.nextNote < ac.currentTime + 0.2) {
                playStep(audio.nextNote, audio.step);
                audio.nextNote += stepLen;
                audio.step += 1;
            }
        }, 40);
    }

    function stopMusic() {
        if (audio.timer) clearInterval(audio.timer);
        audio.timer = 0;
    }

    function sound(kind) {
        const ac = ensureAudio();
        if (!ac || audio.muted) return;
        const now = ac.currentTime;
        if (kind === 'jump') noise(now, 0.35, 0.25, 600, 'bandpass');
        else if (kind === 'land') noise(now, 0.18, 0.4, 250, 'lowpass');
        else if (kind === 'crash') {
            noise(now, 0.5, 0.6, 400, 'lowpass');
            noise(now, 0.25, 0.3, 3000, 'bandpass');
        } else if (kind === 'whoosh') noise(now, 0.25, 0.18, 2500, 'bandpass');
        else if (kind === 'finish') {
            [440, 554, 659, 880].forEach((f, i) => {
                const osc = ac.createOscillator();
                const g = ac.createGain();
                osc.type = 'square';
                osc.frequency.value = f;
                g.gain.setValueAtTime(0.0001, now + i * 0.12);
                g.gain.exponentialRampToValueAtTime(0.12, now + i * 0.12 + 0.02);
                g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.3);
                osc.connect(g);
                g.connect(audio.filter);
                osc.start(now + i * 0.12);
                osc.stop(now + i * 0.12 + 0.32);
            });
        }
    }

    function frame() {
        if (!G) return;
        const now = performance.now();
        const dt = Math.min(0.05, (now - G.last) / 1000);
        G.last = now;
        update(dt);
        render();
        G.raf = requestAnimationFrame(frame);
    }

    const KEYS = { ArrowLeft: 'left', ArrowRight: 'right', a: 'left', d: 'right', A: 'left', D: 'right', ArrowUp: 'gas', w: 'gas', W: 'gas', ' ': 'gas', ArrowDown: 'brake', s: 'brake', S: 'brake' };

    function applyKeys() {
        const k = G.keys;
        G.steer = (k.left ? -1 : 0) + (k.right ? 1 : 0);
        if (G.pointer.active) G.steer = G.pointer.steer;
        G.throttle = !!k.gas || G.pointer.active;
        G.brake = !!k.brake;
    }

    function onKeyDown(event) {
        if (!G) return;
        const key = event.key;
        if (G.panelMode === 'name' || G.panelMode === 'busy') {
            if (key === 'Escape') {
                event.preventDefault();
                skipName();
            }
            return;
        }
        if (G.panelMode === 'board') {
            if (key === 'Escape') {
                event.preventDefault();
                stop();
            } else if (key === 'r' || key === 'R') {
                event.preventDefault();
                restart();
            }
            return;
        }
        if (key === 'Escape') {
            event.preventDefault();
            stop();
            return;
        }
        if (KEYS[key]) {
            event.preventDefault();
            G.keys[KEYS[key]] = true;
            applyKeys();
            return;
        }
        if (key === 'p' || key === 'P') {
            if (G.phase === 'play') G.paused = !G.paused;
            return;
        }
        if (key === 'm' || key === 'M') {
            audio.muted = !audio.muted;
            if (audio.master) audio.master.gain.value = audio.muted ? 0 : 0.6;
            return;
        }
        if ((key === 'r' || key === 'R') && G.phase === 'over') restart();
    }

    function onKeyUp(event) {
        if (!G || !KEYS[event.key]) return;
        G.keys[KEYS[event.key]] = false;
        applyKeys();
    }

    function onPointerDown(event) {
        if (!G || G.panelMode) return;
        if (G.phase === 'over') return;
        event.preventDefault();
        G.pointer.active = true;
        G.pointer.id = event.pointerId;
        G.pointer.startX = event.clientX;
        G.pointer.steer = 0;
        applyKeys();
    }

    function onPointerMove(event) {
        if (!G || !G.pointer.active || event.pointerId !== G.pointer.id) return;
        event.preventDefault();
        const raw = event.clientX - G.pointer.startX;
        const dead = 8;
        const travel = Math.max(90, G.W * 0.18);
        const delta = Math.abs(raw) < dead ? 0 : (raw - Math.sign(raw) * dead) / travel;
        G.pointer.steer = clamp(delta, -1, 1);
        applyKeys();
    }

    function onPointerUp(event) {
        if (!G || event.pointerId !== G.pointer.id) return;
        G.pointer.active = false;
        G.pointer.steer = 0;
        applyKeys();
    }

    function onBlur() {
        if (!G) return;
        G.keys = {};
        G.pointer.active = false;
        applyKeys();
    }

    function onVisibility() {
        if (G && document.hidden && G.phase === 'play') G.paused = true;
    }

    function newRound() {
        G.seed = Math.floor(Math.random() * 1e9);
        G.segments = buildTrack(G.seed);
        G.trackLength = G.segments.length * SEG;
        G.skyline = buildSkyline(G.seed + 7, [
            { color: PAL.far, window: '#bdbdbd', speed: 0.05, scale: 0.55 },
            { color: PAL.mid, window: '#d4d4d4', speed: 0.12, scale: 0.8 },
            { color: PAL.near, window: PAL.window, speed: 0.25, scale: 1.05 },
        ]);
        resetCars();
        G.position = 0;
        G.playerX = 0;
        G.speed = 0;
        G.distance = 0;
        G.topSpeed = 0;
        G.jumps = 0;
        G.nearMisses = 0;
        G.crashes = 0;
        G.clock = ROUND_SECONDS;
        G.countdown = 3;
        G.phase = 'countdown';
        G.paused = false;
        G.air = { y: 0, vy: 0 };
        G.spin = 0;
        G.spinTime = 0;
        G.invulnerable = 0;
        G.shake = 0;
        G.skyOffset = 0;
        G.hillOffset = 0;
        G.inTunnelDepth = 0;
        G.particles = [];
        G.texts = [];
        G.newBest = false;
        G.steer = 0;
        G.steerSmooth = 0;
        G.steerTilt = 0;
        G.throttle = false;
        G.brake = false;
        G.keys = {};
        G.pointer = { active: false, id: null, startX: 0, steer: 0 };
        G.overAt = 0;
        G.ended = false;
        clearPanel();
        startMusic();
    }

    function restart() {
        if (!G) return;
        newRound();
    }

    function start() {
        if (G) return true;
        const touch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
        const W = window.innerWidth;
        const H = window.innerHeight;
        if (W < 280 || H < 300) return false;
        const wrap = document.createElement('div');
        wrap.className = 'eleanor';
        const panel = el('div', 'battle-panel');
        panel.hidden = true;
        const canvas = document.createElement('canvas');
        const dpr = Math.min(1.5, window.devicePixelRatio || 1);
        canvas.width = Math.floor(W * dpr);
        canvas.height = Math.floor(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        wrap.appendChild(canvas);
        wrap.appendChild(panel);
        document.body.appendChild(wrap);
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        let best = 0;
        try {
            best = Number(localStorage.getItem('lh-eleanor-best') || 0);
        } catch (err) {
            best = 0;
        }
        G = { W, H, canvas, ctx, wrap, panel, panelMode: null, worldBest: null, touch, best, mono: (getComputedStyle(document.documentElement).getPropertyValue('--font-mono') || 'monospace').trim(), cameraDepth: 1 / Math.tan((FOV / 2) * Math.PI / 180), playerZ: CAMERA_HEIGHT / (1 / Math.tan((FOV / 2) * Math.PI / 180)), last: performance.now(), raf: 0 };
        G.prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.documentElement.classList.add('race');
        requestAnimationFrame(() => wrap.classList.add('is-on'));
        window.addEventListener('keydown', onKeyDown, true);
        window.addEventListener('keyup', onKeyUp, true);
        window.addEventListener('blur', onBlur);
        document.addEventListener('visibilitychange', onVisibility);
        canvas.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
        if (touch) {
            const bar = document.createElement('div');
            bar.className = 'eleanor-bar';
            const mute = document.createElement('button');
            mute.type = 'button';
            mute.className = 'eleanor-button';
            mute.textContent = '\u266A';
            mute.setAttribute('aria-label', 'Sound');
            mute.addEventListener('click', () => {
                audio.muted = !audio.muted;
                if (audio.master) audio.master.gain.value = audio.muted ? 0 : 0.6;
                mute.classList.toggle('is-off', audio.muted);
            });
            const quit = document.createElement('button');
            quit.type = 'button';
            quit.className = 'eleanor-button';
            quit.textContent = '\u2715';
            quit.setAttribute('aria-label', 'Quit');
            let armed = 0;
            quit.addEventListener('click', () => {
                if (quit.classList.contains('is-armed')) {
                    stop();
                    return;
                }
                quit.classList.add('is-armed');
                quit.textContent = 'QUIT?';
                clearTimeout(armed);
                armed = setTimeout(() => {
                    quit.classList.remove('is-armed');
                    quit.textContent = '\u2715';
                }, 2500);
            });
            bar.append(mute, quit);
            wrap.appendChild(bar);
        }
        ensureAudio();
        newRound();
        fetchScores().then(result => {
            if (G && result.scores.length && !result.local) G.worldBest = result.scores[0];
        });
        G.raf = requestAnimationFrame(frame);
        return true;
    }

    function stop() {
        if (!G) return;
        cancelAnimationFrame(G.raf);
        stopMusic();
        if (audio.engineGain) audio.engineGain.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.05);
        setTunnelFilter(0);
        window.removeEventListener('keydown', onKeyDown, true);
        window.removeEventListener('keyup', onKeyUp, true);
        window.removeEventListener('blur', onBlur);
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
        G.wrap.remove();
        document.body.style.overflow = G.prevOverflow;
        document.documentElement.classList.remove('race');
        G = null;
    }

    function state() {
        if (!G) return null;
        return { phase: G.phase, clock: Math.round(G.clock * 10) / 10, distance: Math.floor(G.distance), speed: Math.round(G.speed), jumps: G.jumps, crashes: G.crashes, nearMisses: G.nearMisses, air: G.air.y > 0, tunnel: G.inTunnelDepth > 0.5, playerX: Math.round(G.playerX * 100) / 100, best: Math.floor(G.best) };
    }

    function tick(dt, draw) {
        if (!G) return;
        update(dt);
        if (draw !== false) render();
    }

    window.Eleanor = { start, stop, state, tick };
})();
