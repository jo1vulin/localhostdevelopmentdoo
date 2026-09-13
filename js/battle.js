(function () {
    'use strict';

    const TILE = 16;
    const TANK = 32;
    const BULLET = 4;
    const EMPTY = 0;
    const BRICK = 1;
    const STEEL = 2;
    const BASE = 3;
    const TOTAL_ENEMIES = 20;
    const MAX_STAGE = 11;
    const BONUS_KINDS = ['helmet', 'star', 'shovel', 'timer', 'grenade', 'tank'];
    const BONUS_SCORE = 500;
    const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const ROT = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 };
    const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
    const TYPES = {
        player: { speed: 96, hp: 1, bullet: 340, score: 0 },
        basic: { speed: 48, hp: 1, bullet: 240, score: 100 },
        fast: { speed: 110, hp: 1, bullet: 240, score: 200 },
        power: { speed: 64, hp: 1, bullet: 420, score: 300 },
        armor: { speed: 56, hp: 4, bullet: 240, score: 400 },
    };

    let G = null;
    const audio = { ctx: null, muted: false, noise: null };
    const SCORE_API = ((document.querySelector('meta[name="score-api"]') || {}).content || '').trim();
    const MAX_NAME = 12;
    const MAX_SCORE = 120000;

    function sortScores(list) {
        return list.sort((a, b) => b.score - a.score || b.killed - a.killed || String(a.at).localeCompare(String(b.at)));
    }

    function loadLocalScores() {
        try {
            const list = JSON.parse(localStorage.getItem('lh-scores') || '[]');
            return Array.isArray(list) ? list : [];
        } catch (err) {
            return [];
        }
    }

    function saveLocalScores(list) {
        try {
            localStorage.setItem('lh-scores', JSON.stringify(list.slice(0, 50)));
        } catch (err) {
            return;
        }
    }

    async function fetchScores() {
        const local = sortScores(loadLocalScores()).slice(0, 10);
        if (!SCORE_API) return { scores: local, local: true };
        try {
            const res = await fetch(SCORE_API, { method: 'GET', mode: 'cors', cache: 'no-store' });
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
            const res = await fetch(SCORE_API, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(entry) });
            if (!res.ok) throw new Error(String(res.status));
            const data = await res.json();
            return { scores: (data.scores || []).slice(0, 10), rank: data.rank || null, local: false };
        } catch (err) {
            return Object.assign(localResult, { offline: true });
        }
    }

    function currentTheme() {
        const name = document.documentElement.getAttribute('data-theme');
        return name === 'hearth' || name === 'cyber' ? name : 'paper';
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

    function showNameForm() {
        const panel = G.panel;
        panel.replaceChildren();
        G.panelMode = 'name';
        panel.appendChild(el('h2', 'battle-title', G.won ? 'STAGE CLEAR' : 'GAME OVER'));
        panel.appendChild(el('p', 'battle-sub', `score ${G.score}   stage ${G.stage}   ${G.killedTotal} tank${G.killedTotal === 1 ? '' : 's'}`));
        const form = el('form', 'battle-form');
        const label = el('label', 'battle-label', 'ENTER YOUR NAME');
        label.htmlFor = 'battle-name';
        const input = el('input', 'battle-input');
        input.id = 'battle-name';
        input.type = 'text';
        input.maxLength = MAX_NAME;
        input.autocomplete = 'off';
        input.spellcheck = false;
        try {
            input.value = localStorage.getItem('lh-player') || '';
        } catch (err) {
            input.value = '';
        }
        const button = el('button', 'battle-button', 'SAVE');
        button.type = 'submit';
        const skip = el('button', 'battle-button battle-button-ghost', 'SKIP');
        skip.type = 'button';
        skip.addEventListener('click', () => skipName());
        form.append(label, input, button, skip);
        panel.appendChild(form);
        panel.appendChild(el('p', 'battle-hint', G.touch ? 'save your score or skip' : 'ENTER to save   ESC to skip'));
        panel.hidden = false;
        form.addEventListener('submit', event => {
            event.preventDefault();
            const name = input.value.replace(/[^\p{L}\p{N} _.'-]/gu, '').trim().slice(0, MAX_NAME) || 'anon';
            try {
                localStorage.setItem('lh-player', name);
            } catch (err) {}
            const entry = { name, score: G.score, killed: G.killedTotal, stage: G.stage, won: G.won, theme: currentTheme(), at: new Date().toISOString() };
            G.panelMode = 'busy';
            submitScore(entry).then(result => {
                if (!G) return;
                showBoard(result, entry);
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
        panel.appendChild(el('h2', 'battle-title', G.won ? 'STAGE CLEAR' : 'GAME OVER'));
        const scope = result.local ? (result.offline ? 'scoreboard offline, saved in this browser' : 'scoreboard for this browser') : 'top 10 worldwide';
        panel.appendChild(el('p', 'battle-sub', scope));
        const list = el('ol', 'battle-scores');
        if (!result.scores.length) list.appendChild(el('li', 'battle-empty', 'no scores yet. be the first.'));
        result.scores.forEach((row, index) => {
            const item = el('li', 'battle-row');
            const isMine = !!mine && ((result.rank && index === result.rank - 1) || (!result.rank && row.name === mine.name && row.score === mine.score));
            if (isMine) item.classList.add('is-mine');
            item.append(
                el('span', 'battle-rank', String(index + 1).padStart(2, '0')),
                el('span', 'battle-name', row.name),
                el('span', 'battle-score', String(row.score)),
                el('span', 'battle-kills', `st ${row.stage || 1} \u00B7 ${row.killed} tank${row.killed === 1 ? '' : 's'}${row.won ? ' \u2713' : ''}`)
            );
            list.appendChild(item);
        });
        panel.appendChild(list);
        if (mine && result.rank && result.rank > 10) panel.appendChild(el('p', 'battle-sub', `you are #${result.rank}`));
        const actions = el('div', 'battle-actions');
        const again = el('button', 'battle-button', 'PLAY AGAIN');
        again.type = 'button';
        again.addEventListener('click', () => restart());
        const leave = el('button', 'battle-button battle-button-ghost', 'BACK TO THE SITE');
        leave.type = 'button';
        leave.addEventListener('click', () => stop());
        actions.append(again, leave);
        panel.appendChild(actions);
        if (!G.touch) panel.appendChild(el('p', 'battle-hint', 'R play again   ESC back to the site'));
        panel.hidden = false;
    }

    function onRoundEnd() {
        if (G.score > 0) showNameForm();
        else fetchScores().then(result => {
            if (G) showBoard(result, null);
        });
    }

    function cssVar(name, fallback) {
        const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return value || fallback;
    }

    function palette() {
        return {
            bg: cssVar('--paper', '#EDE7DA'),
            bgDark: cssVar('--paper-dark', '#E1D8C6'),
            ink: cssVar('--graphite', '#211F1C'),
            brick: cssVar('--bordeaux', '#6E2A28'),
            mortar: cssVar('--sand', '#CDBB9C'),
            steel: cssVar('--muted', '#6A645B'),
            player: cssVar('--copper', '#A96F2B'),
            basic: cssVar('--muted', '#6A645B'),
            fast: cssVar('--pine', '#2E463A'),
            power: cssVar('--bordeaux', '#6E2A28'),
            armor: cssVar('--graphite', '#211F1C'),
            frame: cssVar('--footer-bg', '#211F1C'),
            display: cssVar('--font-display', 'Georgia, serif'),
            mono: cssVar('--font-mono', 'monospace'),
        };
    }

    function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }

    function scanMap(cols, rows, W, H) {
        const grid = new Uint8Array(cols * rows);
        const set = (c, r, v) => {
            if (c >= 0 && r >= 0 && c < cols && r < rows) grid[r * cols + c] = v;
        };
        const markRect = (rc, v) => {
            const c0 = Math.max(0, Math.floor(rc.left / TILE));
            const c1 = Math.min(cols - 1, Math.floor((rc.right - 1) / TILE));
            const r0 = Math.max(0, Math.floor(rc.top / TILE));
            const r1 = Math.min(rows - 1, Math.floor((rc.bottom - 1) / TILE));
            for (let r = r0; r <= r1; r++) {
                for (let c = c0; c <= c1; c++) {
                    const cx = c * TILE + TILE / 2;
                    const cy = r * TILE + TILE / 2;
                    if (cx >= rc.left && cx < rc.right && cy >= rc.top && cy < rc.bottom) set(c, r, v);
                }
            }
        };
        const visible = rc => rc.width > 2 && rc.height > 2 && rc.bottom > 0 && rc.top < H && rc.right > 0 && rc.left < W;
        const skip = el => !!el.closest('.terminal, .skip-link, .visually-hidden, script, style, svg, .theme-switch, .battle-city');

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: node => (node.nodeValue.trim() && node.parentElement && !skip(node.parentElement)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
        });
        const range = document.createRange();
        let node;
        while ((node = walker.nextNode())) {
            range.selectNodeContents(node);
            const rects = range.getClientRects();
            for (let i = 0; i < rects.length; i++) if (visible(rects[i])) markRect(rects[i], BRICK);
        }

        document.querySelectorAll('.portrait, .btn, .client-logo, .copy-btn').forEach(el => {
            const rc = el.getBoundingClientRect();
            if (visible(rc)) markRect(rc, STEEL);
        });

        document.querySelectorAll('.hero-mark .seal, .footer-seal').forEach(el => {
            const rc = el.getBoundingClientRect();
            if (!visible(rc)) return;
            const cx = rc.left + rc.width / 2;
            const cy = rc.top + rc.height / 2;
            const rad = rc.width / 2;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const d = Math.hypot(c * TILE + TILE / 2 - cx, r * TILE + TILE / 2 - cy);
                    if (d < rad && d >= rad - TILE * 1.5) set(c, r, STEEL);
                    else if (d < rad - TILE * 3 && d >= rad - TILE * 5) set(c, r, BRICK);
                }
            }
        });

        for (let r = 0; r < 4; r++) for (let c = 0; c < cols; c++) set(c, r, EMPTY);

        const bx = Math.floor(cols / 2) - 1;
        const by = rows - 2;
        for (let r = rows - 6; r < rows; r++) for (let c = bx - 9; c <= bx + 10; c++) set(c, r, EMPTY);
        for (let r = by - 1; r <= by + 1; r++) {
            set(bx - 1, r, BRICK);
            set(bx + 2, r, BRICK);
        }
        set(bx, by - 1, BRICK);
        set(bx + 1, by - 1, BRICK);
        set(bx, by, BASE);
        set(bx + 1, by, BASE);
        set(bx, by + 1, BASE);
        set(bx + 1, by + 1, BASE);

        ensurePath(grid, cols, rows, bx, by);

        return {
            grid,
            base: { x: bx * TILE, y: by * TILE },
            playerSpawn: { x: (bx - 6) * TILE, y: by * TILE },
            spawns: [{ x: 0, y: 0 }, { x: (Math.floor(cols / 2) - 1) * TILE, y: 0 }, { x: (cols - 2) * TILE, y: 0 }],
        };
    }

    function ensurePath(grid, cols, rows, bx, by) {
        const positions = cols * rows;
        const cost = new Int32Array(positions).fill(1 << 30);
        const parent = new Int32Array(positions).fill(-1);
        const at = (c, r) => grid[r * cols + c];
        const footprint = (c, r) => [[c, r], [c + 1, r], [c, r + 1], [c + 1, r + 1]];
        const valid = (c, r) => c >= 0 && r >= 0 && c + 1 < cols && r + 1 < rows && footprint(c, r).every(([tc, tr]) => at(tc, tr) !== BASE);
        const steelIn = (c, r) => footprint(c, r).some(([tc, tr]) => at(tc, tr) === STEEL) ? 1 : 0;
        const deque = [];
        let head = 0;
        for (let c = 0; c + 1 < cols; c++) {
            if (!valid(c, 0)) continue;
            cost[c] = steelIn(c, 0);
            deque.push(c);
        }
        while (head < deque.length) {
            const index = deque[head++];
            const c = index % cols;
            const r = Math.floor(index / cols);
            for (const [dc, dr] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
                const nc = c + dc;
                const nr = r + dr;
                if (!valid(nc, nr)) continue;
                const next = nr * cols + nc;
                const total = cost[index] + steelIn(nc, nr);
                if (total < cost[next]) {
                    cost[next] = total;
                    parent[next] = index;
                    if (steelIn(nc, nr)) deque.push(next);
                    else deque.splice(head, 0, next);
                }
            }
        }
        let best = -1;
        for (let c = Math.max(0, bx - 9); c <= Math.min(cols - 2, bx + 9); c++) {
            const index = (rows - 6) * cols + c;
            if (valid(c, rows - 6) && (best === -1 || cost[index] < cost[best])) best = index;
        }
        if (best === -1 || cost[best] === 0 || cost[best] >= (1 << 30)) return;
        for (let index = best; index !== -1; index = parent[index]) {
            const c = index % cols;
            const r = Math.floor(index / cols);
            for (const [tc, tr] of footprint(c, r)) if (at(tc, tr) === STEEL) grid[tr * cols + tc] = BRICK;
        }
    }

    function enemyQueue(stage) {
        const fast = Math.min(8, 3 + stage);
        const power = Math.min(7, 1 + Math.floor((stage - 1) * 0.7));
        const armor = Math.min(8, Math.floor((stage - 1) * 0.8));
        const basic = Math.max(0, TOTAL_ENEMIES - 2 - fast - power - armor);
        const pool = [];
        const add = (type, n) => { for (let i = 0; i < n; i++) pool.push(type); };
        add('basic', basic);
        add('fast', fast);
        add('power', power);
        add('armor', armor);
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        const queue = ['basic', 'basic'].concat(pool).slice(0, G.total).map(type => ({ type, bonus: false }));
        [3, 10, 17].forEach(i => { if (queue[i]) queue[i].bonus = true; });
        return queue;
    }

    function stageSpeed(stage) {
        return 1 + (stage - 1) * 0.04;
    }

    function playerStars() {
        return Math.min(3, G.stars + Math.floor((G.stage - 1) / 3));
    }

    function applyPlayerSpec(tank) {
        const stars = playerStars();
        tank.speed = TYPES.player.speed + (G.stage - 1) * 4;
        tank.bulletSpeed = TYPES.player.bullet * (stars >= 1 ? 1.5 : 1);
        tank.maxBullets = stars >= 2 ? 2 : 1;
        tank.power = stars >= 3;
    }

    function makeTank(type, x, y, dir, bonus) {
        const spec = TYPES[type];
        const tank = { type, x, y, dir, speed: spec.speed, hp: spec.hp, maxHp: spec.hp, bulletSpeed: spec.bullet, maxBullets: 1, power: false, alive: true, shots: 0, acc: 0, anim: 0, shield: type === 'player' ? 3 : 0, think: 0, fire: 1 + Math.random(), blocked: 0, flash: 0, bonus: !!bonus };
        if (type === 'player') applyPlayerSpec(tank);
        else {
            tank.speed = spec.speed * stageSpeed(G.stage);
            tank.bulletSpeed = spec.bullet * (1 + (G.stage - 1) * 0.03);
        }
        return tank;
    }

    function ensureAudio() {
        if (audio.ctx) return audio.ctx;
        try {
            audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
            const length = audio.ctx.sampleRate * 0.5;
            const buffer = audio.ctx.createBuffer(1, length, audio.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
            audio.noise = buffer;
        } catch (err) {
            audio.ctx = null;
        }
        return audio.ctx;
    }

    function sound(kind) {
        if (audio.muted) return;
        const ac = ensureAudio();
        if (!ac) return;
        if (ac.state === 'suspended') ac.resume();
        const now = ac.currentTime;
        const gain = ac.createGain();
        gain.connect(ac.destination);
        if (kind === 'bonus') {
            [660, 880, 1320].forEach((freq, i) => {
                const osc = ac.createOscillator();
                const g = ac.createGain();
                osc.type = 'square';
                osc.frequency.value = freq;
                g.gain.setValueAtTime(0.0001, now + i * 0.09);
                g.gain.exponentialRampToValueAtTime(0.06, now + i * 0.09 + 0.01);
                g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.12);
                osc.connect(g);
                g.connect(ac.destination);
                osc.start(now + i * 0.09);
                osc.stop(now + i * 0.09 + 0.13);
            });
            return;
        }
        if (kind === 'shoot') {
            const osc = ac.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(900, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
            osc.connect(gain);
            osc.start(now);
            osc.stop(now + 0.1);
            return;
        }
        const src = ac.createBufferSource();
        src.buffer = audio.noise;
        const filter = ac.createBiquadFilter();
        filter.type = 'lowpass';
        if (kind === 'brick') {
            filter.frequency.value = 1800;
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
            src.start(now);
            src.stop(now + 0.08);
        } else if (kind === 'steel') {
            filter.frequency.value = 5000;
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            src.start(now);
            src.stop(now + 0.06);
        } else {
            filter.frequency.setValueAtTime(900, now);
            filter.frequency.exponentialRampToValueAtTime(120, now + 0.4);
            gain.gain.setValueAtTime(kind === 'bigboom' ? 0.22 : 0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (kind === 'bigboom' ? 0.6 : 0.35));
            src.start(now);
            src.stop(now + 0.6);
        }
        src.connect(filter);
        filter.connect(gain);
    }

    function blockedAt(x, y, self) {
        if (x < 0 || y < 0 || x + TANK > G.W || y + TANK > G.H) return true;
        const c0 = Math.floor(x / TILE);
        const c1 = Math.floor((x + TANK - 1) / TILE);
        const r0 = Math.floor(y / TILE);
        const r1 = Math.floor((y + TANK - 1) / TILE);
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (G.grid[r * G.cols + c] !== EMPTY) return true;
        for (const other of G.tanks) {
            if (other !== self && other.alive && overlap(x, y, TANK, TANK, other.x, other.y, TANK, TANK)) return true;
        }
        return false;
    }

    function turn(tank, dir) {
        if (tank.dir === dir) return;
        const wasVertical = tank.dir === 'up' || tank.dir === 'down';
        const isVertical = dir === 'up' || dir === 'down';
        tank.dir = dir;
        if (wasVertical === isVertical) return;
        if (isVertical) {
            const sx = Math.round(tank.x / TILE) * TILE;
            if (!blockedAt(sx, tank.y, tank)) tank.x = sx;
        } else {
            const sy = Math.round(tank.y / TILE) * TILE;
            if (!blockedAt(tank.x, sy, tank)) tank.y = sy;
        }
    }

    function advance(tank, dt) {
        const [dx, dy] = DIRS[tank.dir];
        tank.acc += tank.speed * dt;
        let moved = false;
        while (tank.acc >= 1) {
            const nx = tank.x + dx;
            const ny = tank.y + dy;
            if (blockedAt(nx, ny, tank)) {
                tank.acc = 0;
                return moved;
            }
            tank.x = nx;
            tank.y = ny;
            tank.acc -= 1;
            moved = true;
        }
        if (moved) tank.anim += dt * 12;
        return moved;
    }

    function shoot(tank) {
        if (!tank.alive || tank.shots >= tank.maxBullets) return;
        const [dx, dy] = DIRS[tank.dir];
        const bullet = { x: tank.x + TANK / 2 + dx * 14, y: tank.y + TANK / 2 + dy * 14, dir: tank.dir, speed: tank.bulletSpeed, owner: tank, power: !!tank.power, alive: true, acc: 0 };
        tank.shots += 1;
        G.bullets.push(bullet);
        sound('shoot');
    }

    function dropBonus() {
        const kind = BONUS_KINDS[Math.floor(Math.random() * BONUS_KINDS.length)];
        for (let attempt = 0; attempt < 40; attempt++) {
            const c = 1 + Math.floor(Math.random() * (G.cols - 3));
            const r = 4 + Math.floor(Math.random() * (G.rows - 10));
            const x = c * TILE;
            const y = r * TILE;
            if (Math.abs(x - G.base.x) < TANK * 2 && Math.abs(y - G.base.y) < TANK * 2) continue;
            G.bonuses.push({ kind, x, y, t: 0, life: 15 });
            return;
        }
    }

    function baseRing() {
        const tiles = [];
        const bx = G.base.x / TILE;
        const by = G.base.y / TILE;
        for (let r = by - 1; r <= by + 1; r++) {
            tiles.push([bx - 1, r]);
            tiles.push([bx + 2, r]);
        }
        tiles.push([bx, by - 1]);
        tiles.push([bx + 1, by - 1]);
        return tiles.filter(([c, r]) => c >= 0 && r >= 0 && c < G.cols && r < G.rows);
    }

    function setRing(value) {
        for (const [c, r] of baseRing()) G.grid[r * G.cols + c] = value;
    }

    function applyBonus(kind) {
        const player = G.player;
        G.score += BONUS_SCORE;
        sound('bonus');
        if (kind === 'helmet' && player) player.shield = 10;
        else if (kind === 'star') {
            G.stars = Math.min(3, G.stars + 1);
            if (player) applyPlayerSpec(player);
        } else if (kind === 'shovel') {
            G.shovel = 20;
            setRing(STEEL);
        } else if (kind === 'timer') G.freeze = 8;
        else if (kind === 'grenade') {
            for (const tank of G.tanks) if (tank.alive && tank.type !== 'player') killTank(tank, true);
        } else if (kind === 'tank') G.lives += 1;
        G.effects.push({ kind: 'text', x: G.W / 2, y: G.H / 2, t: 0, life: 1.2, text: kind.toUpperCase() });
    }

    function explode(x, y, big) {
        G.effects.push({ kind: 'boom', x, y, t: 0, life: big ? 0.6 : 0.35, big });
        sound(big ? 'bigboom' : 'boom');
    }

    function killTank(tank, silent) {
        tank.alive = false;
        for (const b of G.bullets) if (b.owner === tank) b.owner = null;
        explode(tank.x + TANK / 2, tank.y + TANK / 2, true);
        if (tank.type === 'player') {
            G.lives -= 1;
            G.stars = 0;
            if (G.lives <= 0) endGame(false);
            else G.respawn = 1.5;
        } else {
            if (!silent) G.score += TYPES[tank.type].score;
            if (tank.bonus && !silent) dropBonus();
            G.killed += 1;
            G.killedTotal += 1;
            if (G.killed >= G.total) G.clearIn = 1.2;
        }
    }

    function destroyBase() {
        if (G.baseDead || G.invincible) return;
        G.baseDead = true;
        explode(G.base.x + TILE, G.base.y + TILE, true);
        endGame(false);
    }

    function endGame(won) {
        if (G.over) return;
        G.over = true;
        G.won = won;
        G.overAt = 0;
    }

    function stepBullet(b) {
        const [dx, dy] = DIRS[b.dir];
        b.x += dx;
        b.y += dy;
        if (b.x < 0 || b.y < 0 || b.x > G.W || b.y > G.H) {
            b.alive = false;
            sound('steel');
            return;
        }
        const vertical = dy !== 0;
        const edge = vertical ? b.y + dy * 2 : b.x + dx * 2;
        const tiles = [];
        if (vertical) {
            const r = Math.floor(edge / TILE);
            for (let c = Math.floor((b.x - TILE) / TILE); c <= Math.floor((b.x + TILE - 1) / TILE); c++) tiles.push([c, r]);
        } else {
            const c = Math.floor(edge / TILE);
            for (let r = Math.floor((b.y - TILE) / TILE); r <= Math.floor((b.y + TILE - 1) / TILE); r++) tiles.push([c, r]);
        }
        let hitBrick = false;
        let hitSteel = false;
        let hitBase = false;
        for (const [c, r] of tiles) {
            if (c < 0 || r < 0 || c >= G.cols || r >= G.rows) continue;
            const v = G.grid[r * G.cols + c];
            if (v === STEEL) hitSteel = true;
            else if (v === BASE) hitBase = true;
            else if (v === BRICK) hitBrick = true;
        }
        if (hitBase) {
            b.alive = false;
            destroyBase();
            return;
        }
        if (hitSteel && !b.power) {
            b.alive = false;
            sound('steel');
            G.effects.push({ kind: 'spark', x: b.x, y: b.y, t: 0, life: 0.15 });
            return;
        }
        if (hitBrick || hitSteel) {
            for (const [c, r] of tiles) {
                if (c < 0 || r < 0 || c >= G.cols || r >= G.rows) continue;
                const v = G.grid[r * G.cols + c];
                if (v === BRICK || (v === STEEL && b.power)) G.grid[r * G.cols + c] = EMPTY;
            }
            b.alive = false;
            sound('brick');
            G.effects.push({ kind: 'spark', x: b.x, y: b.y, t: 0, life: 0.2 });
            return;
        }
        for (const tank of G.tanks) {
            if (!tank.alive || tank === b.owner) continue;
            const isPlayer = tank.type === 'player';
            const fromPlayer = b.owner && b.owner.type === 'player';
            if (isPlayer === fromPlayer) continue;
            if (!overlap(b.x - BULLET / 2, b.y - BULLET / 2, BULLET, BULLET, tank.x, tank.y, TANK, TANK)) continue;
            b.alive = false;
            if (isPlayer) {
                if (tank.shield > 0 || G.invincible) {
                    sound('steel');
                    return;
                }
                killTank(tank);
                return;
            }
            tank.hp -= 1;
            tank.flash = 0.15;
            if (tank.hp <= 0) killTank(tank);
            else sound('steel');
            return;
        }
        for (const other of G.bullets) {
            if (other === b || !other.alive) continue;
            const ownerA = b.owner && b.owner.type === 'player';
            const ownerB = other.owner && other.owner.type === 'player';
            if (ownerA === ownerB) continue;
            if (overlap(b.x - 3, b.y - 3, 6, 6, other.x - 3, other.y - 3, 6, 6)) {
                b.alive = false;
                other.alive = false;
                return;
            }
        }
    }

    function updateBullets(dt) {
        for (const b of G.bullets) {
            if (!b.alive) continue;
            b.acc += b.speed * dt;
            while (b.acc >= 1 && b.alive) {
                stepBullet(b);
                b.acc -= 1;
            }
        }
        G.bullets = G.bullets.filter(b => {
            if (!b.alive && b.owner) b.owner.shots = Math.max(0, b.owner.shots - 1);
            return b.alive;
        });
    }

    function updateEnemy(tank, dt) {
        const player = G.player;
        if (G.freeze > 0) return;
        tank.think -= dt;
        if (tank.think <= 0) {
            tank.think = 0.5 + Math.random() * 1.3;
            const r = Math.random();
            if (r < 0.35) turn(tank, 'down');
            else if (r < 0.6) turn(tank, G.base.x > tank.x ? 'right' : 'left');
            else if (r < 0.78 && player && player.alive) {
                const ddx = player.x - tank.x;
                const ddy = player.y - tank.y;
                turn(tank, Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 'right' : 'left') : (ddy > 0 ? 'down' : 'up'));
            } else {
                const dirs = Object.keys(DIRS);
                turn(tank, dirs[Math.floor(Math.random() * dirs.length)]);
            }
        }
        const moved = advance(tank, dt);
        if (!moved) {
            tank.blocked += dt;
            if (tank.blocked > 0.25) {
                if (tank.shots === 0 && Math.random() < 0.5) shoot(tank);
                if (Math.random() < 0.08) {
                    const dirs = Object.keys(DIRS);
                    turn(tank, dirs[Math.floor(Math.random() * dirs.length)]);
                    tank.blocked = 0;
                }
            }
        } else {
            tank.blocked = 0;
        }
        tank.fire -= dt;
        if (tank.fire <= 0) {
            tank.fire = (0.9 + Math.random() * 1.8) / (1 + (G.stage - 1) * 0.06);
            let aligned = false;
            if (player && player.alive) {
                const [dx, dy] = DIRS[tank.dir];
                if (dx !== 0 && Math.abs(player.y - tank.y) < 12 && Math.sign(player.x - tank.x) === dx) aligned = true;
                if (dy !== 0 && Math.abs(player.x - tank.x) < 12 && Math.sign(player.y - tank.y) === dy) aligned = true;
            }
            if (aligned || Math.random() < 0.45) shoot(tank);
        }
    }

    function spawnEnemy() {
        if (G.queue.length === 0) return;
        const point = G.spawns[G.spawnIndex % G.spawns.length];
        G.spawnIndex += 1;
        const next = G.queue.shift();
        G.effects.push({ kind: 'star', x: point.x, y: point.y, t: 0, life: 1, type: next.type, bonus: next.bonus });
    }

    function tryPlaceEnemy(effect) {
        for (const tank of G.tanks) {
            if (tank.alive && overlap(effect.x, effect.y, TANK, TANK, tank.x, tank.y, TANK, TANK)) return false;
        }
        const tank = makeTank(effect.type, effect.x, effect.y, 'down', effect.bonus);
        G.tanks.push(tank);
        return true;
    }

    function update(dt) {
        G.time += dt;
        if (G.phase === 'intro') {
            if (G.time > 1.8) {
                G.phase = 'play';
                G.spawnTimer = 0;
                for (let i = 0; i < 3; i++) spawnEnemy();
            }
            return;
        }
        if (G.phase === 'cleared') {
            G.stageClear -= dt;
            if (G.stageClear <= 0) loadStage(G.stage + 1);
            return;
        }
        if (G.paused) return;
        if (G.freeze > 0) G.freeze -= dt;
        if (G.shovel > 0) {
            G.shovel -= dt;
            if (G.shovel <= 0) setRing(BRICK);
        }
        if (G.over) {
            G.overAt += dt;
            if (G.overAt > 1 && !G.ended) {
                G.ended = true;
                onRoundEnd();
            }
        }

        const player = G.player;
        if (player && player.alive && !G.over) {
            if (player.shield > 0) player.shield -= dt;
            const dir = G.held[G.held.length - 1];
            if (dir) {
                turn(player, dir);
                advance(player, dt);
            }
            if (G.firePressed || (G.fireHeld && player.shots < player.maxBullets)) {
                G.firePressed = false;
                shoot(player);
            }
            for (const bonus of G.bonuses) {
                if (!bonus.taken && overlap(player.x, player.y, TANK, TANK, bonus.x, bonus.y, TANK, TANK)) {
                    bonus.taken = true;
                    applyBonus(bonus.kind);
                }
            }
        } else if (G.respawn > 0 && !G.over) {
            G.respawn -= dt;
            if (G.respawn <= 0) {
                const p = makeTank('player', G.playerSpawn.x, G.playerSpawn.y, 'up');
                G.tanks = G.tanks.filter(t => t.type !== 'player');
                G.tanks.push(p);
                G.player = p;
            }
        }

        const onScreen = G.tanks.filter(t => t.alive && t.type !== 'player').length;
        const pending = G.effects.filter(e => e.kind === 'star').length;
        if (!G.over) {
            G.spawnTimer -= dt;
            if (G.spawnTimer <= 0 && onScreen + pending < G.maxOnScreen && G.queue.length) {
                spawnEnemy();
                G.spawnTimer = 2.4;
            }
        }

        for (const tank of G.tanks) {
            if (!tank.alive || tank.type === 'player') continue;
            if (tank.flash > 0) tank.flash -= dt;
            if (!G.over) updateEnemy(tank, dt);
        }

        updateBullets(dt);

        for (const e of G.effects) {
            e.t += dt;
            if (e.kind === 'star' && e.t >= e.life && !e.done) {
                if (tryPlaceEnemy(e)) e.done = true;
                else e.t = e.life - 0.05;
            }
        }
        G.effects = G.effects.filter(e => e.kind === 'star' ? !e.done : e.t < e.life);
        G.tanks = G.tanks.filter(t => t.alive || t.type === 'player');
        for (const bonus of G.bonuses) bonus.t += dt;
        G.bonuses = G.bonuses.filter(b => !b.taken && b.t < b.life);

        if (G.clearIn > 0 && !G.over) {
            G.clearIn -= dt;
            if (G.clearIn <= 0) {
                if (G.stage >= MAX_STAGE) endGame(true);
                else {
                    G.phase = 'cleared';
                    G.stageClear = 2.6;
                }
            }
        }
    }

    function drawTile(ctx, c, r, v, pal) {
        const x = c * TILE;
        const y = r * TILE;
        if (v === BRICK) {
            ctx.fillStyle = pal.brick;
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = pal.mortar;
            ctx.fillRect(x, y + 7, TILE, 2);
            const offset = r % 2 ? 4 : 11;
            ctx.fillRect(x + offset, y, 2, 7);
            ctx.fillRect(x + (offset + 8) % 16, y + 9, 2, 7);
        } else if (v === STEEL) {
            ctx.fillStyle = pal.steel;
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = pal.bgDark;
            ctx.fillRect(x + 2, y + 2, 12, 12);
            ctx.fillStyle = pal.steel;
            ctx.fillRect(x + 5, y + 5, 6, 6);
            ctx.fillStyle = pal.ink;
            ctx.fillRect(x + 14, y + 2, 2, 14);
            ctx.fillRect(x + 2, y + 14, 14, 2);
        }
    }

    function drawBase(ctx, pal) {
        const x = G.base.x;
        const y = G.base.y;
        ctx.fillStyle = pal.bgDark;
        ctx.fillRect(x, y, TILE * 2, TILE * 2);
        ctx.strokeStyle = G.baseDead ? pal.steel : pal.ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + TILE, y + TILE, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = G.baseDead ? pal.steel : pal.ink;
        ctx.font = `italic 18px ${pal.display}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('lh', x + TILE - 2, y + TILE + 1);
        ctx.fillStyle = pal.player;
        ctx.fillRect(x + TILE + 8, y + TILE + 4, 3, 3);
        if (G.baseDead) {
            ctx.strokeStyle = pal.brick;
            ctx.beginPath();
            ctx.moveTo(x + 6, y + 6);
            ctx.lineTo(x + 26, y + 26);
            ctx.moveTo(x + 26, y + 6);
            ctx.lineTo(x + 6, y + 26);
            ctx.stroke();
        }
    }

    function drawTank(ctx, t, pal) {
        ctx.save();
        ctx.translate(t.x + TANK / 2, t.y + TANK / 2);
        ctx.rotate(ROT[t.dir]);
        const body = t.flash > 0 ? pal.bg : (t.bonus && Math.floor(t.anim * 2 + G.time * 6) % 2 === 0 ? pal.player : pal[t.type]);
        ctx.fillStyle = pal.ink;
        ctx.fillRect(-15, -14, 6, 28);
        ctx.fillRect(9, -14, 6, 28);
        ctx.fillStyle = pal.bgDark;
        const phase = Math.floor(t.anim) % 2;
        for (let i = -12 + phase * 2; i < 14; i += 4) {
            ctx.fillRect(-15, i, 6, 2);
            ctx.fillRect(9, i, 6, 2);
        }
        ctx.fillStyle = body;
        ctx.fillRect(-9, -11, 18, 22);
        ctx.fillStyle = pal.ink;
        ctx.fillRect(-6, -6, 12, 13);
        ctx.fillStyle = body;
        ctx.fillRect(-4, -3, 8, 8);
        ctx.fillStyle = pal.ink;
        ctx.fillRect(-2, -16, 4, 12);
        if (t.type === 'armor') {
            ctx.fillStyle = pal.bgDark;
            for (let i = 0; i < t.hp - 1; i++) ctx.fillRect(-8 + i * 5, 6, 3, 3);
        }
        if (t.shield > 0 && Math.floor(t.shield * 12) % 2 === 0) {
            ctx.strokeStyle = pal.player;
            ctx.lineWidth = 2;
            ctx.strokeRect(-16, -16, 32, 32);
        }
        ctx.restore();
    }

    function drawEffects(ctx, pal) {
        for (const e of G.effects) {
            const k = Math.min(1, e.t / e.life);
            if (e.kind === 'boom') {
                const radius = (e.big ? 34 : 18) * (0.4 + 0.6 * k);
                ctx.globalAlpha = 1 - k;
                ctx.fillStyle = pal.player;
                ctx.beginPath();
                ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = pal.bg;
                ctx.beginPath();
                ctx.arc(e.x, e.y, radius * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            } else if (e.kind === 'spark') {
                ctx.fillStyle = pal.mortar;
                ctx.fillRect(e.x - 4, e.y - 4, 8, 8);
            } else if (e.kind === 'text') {
                ctx.globalAlpha = 1 - k;
                ctx.fillStyle = pal.player;
                ctx.font = `700 22px ${pal.mono}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(e.text, e.x, e.y - 30 - k * 30);
                ctx.globalAlpha = 1;
            } else if (e.kind === 'star') {
                const s = 6 + 10 * Math.abs(Math.sin(e.t * 12));
                ctx.strokeStyle = pal.player;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(e.x + 16 - s, e.y + 16);
                ctx.lineTo(e.x + 16 + s, e.y + 16);
                ctx.moveTo(e.x + 16, e.y + 16 - s);
                ctx.lineTo(e.x + 16, e.y + 16 + s);
                ctx.stroke();
            }
        }
    }

    function drawBonus(ctx, b, pal) {
        if (b.life - b.t < 3 && Math.floor(b.t * 8) % 2 === 0) return;
        const x = b.x;
        const y = b.y;
        ctx.fillStyle = pal.bgDark;
        ctx.fillRect(x, y, TANK, TANK);
        ctx.strokeStyle = pal.ink;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, TANK - 2, TANK - 2);
        ctx.fillStyle = pal.ink;
        ctx.strokeStyle = pal.ink;
        const cx = x + TANK / 2;
        const cy = y + TANK / 2;
        if (b.kind === 'star') {
            ctx.fillStyle = pal.player;
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
                const radius = i % 2 ? 4.5 : 11;
                const angle = -Math.PI / 2 + i * Math.PI / 5;
                ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
            }
            ctx.closePath();
            ctx.fill();
        } else if (b.kind === 'helmet') {
            ctx.beginPath();
            ctx.arc(cx, cy + 3, 10, Math.PI, 0);
            ctx.closePath();
            ctx.fill();
            ctx.fillRect(cx - 12, cy + 3, 24, 3);
        } else if (b.kind === 'shovel') {
            ctx.fillRect(cx - 2, cy - 12, 4, 14);
            ctx.fillRect(cx - 7, cy + 2, 14, 9);
            ctx.fillRect(cx - 5, cy - 13, 10, 3);
        } else if (b.kind === 'timer') {
            ctx.beginPath();
            ctx.arc(cx, cy, 11, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillRect(cx - 1, cy - 8, 2, 8);
            ctx.fillRect(cx, cy - 1, 6, 2);
        } else if (b.kind === 'grenade') {
            ctx.beginPath();
            ctx.arc(cx, cy + 2, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = pal.player;
            ctx.fillRect(cx - 2, cy - 12, 4, 6);
        } else if (b.kind === 'tank') {
            ctx.fillRect(cx - 9, cy - 6, 18, 14);
            ctx.fillRect(cx - 2, cy - 12, 4, 8);
            ctx.fillStyle = pal.bgDark;
            ctx.fillRect(cx - 4, cy - 2, 8, 6);
        }
    }

    function drawHud(ctx, pal) {
        const label = (text, x, y, align) => {
            ctx.font = `600 12px ${pal.mono}`;
            ctx.textBaseline = 'top';
            ctx.textAlign = align;
            const width = ctx.measureText(text).width + 12;
            ctx.fillStyle = pal.bg;
            ctx.globalAlpha = 0.85;
            ctx.fillRect(align === 'right' ? x - width : x - 6, y - 4, width, 20);
            ctx.globalAlpha = 1;
            ctx.fillStyle = pal.ink;
            ctx.fillText(text, x, y);
        };
        const stars = '\u2605'.repeat(playerStars());
        label(`STAGE ${G.stage}   SCORE ${String(G.score).padStart(6, '0')}   IP ${'\u25AE'.repeat(Math.max(0, G.lives))}${stars ? '   ' + stars : ''}`, 48, 10, 'left');
        const remaining = G.queue.length + G.effects.filter(e => e.kind === 'star').length + G.tanks.filter(t => t.alive && t.type !== 'player').length;
        label(`ENEMY ${remaining}`, G.W - 48, 10, 'right');
        ctx.fillStyle = pal.ink;
        for (let i = 0; i < remaining; i++) {
            const col = i % 10;
            const row = Math.floor(i / 10);
            ctx.fillRect(G.W - 48 - (col + 1) * 11 + 3, 30 + row * 10, 8, 7);
        }
        if (!G.touch) label('ARROWS / WASD MOVE   SPACE FIRE   P PAUSE   M SOUND   ESC QUIT', 12, G.H - 20, 'left');
    }

    function drawBanner(ctx, pal, title, sub) {
        ctx.fillStyle = pal.ink;
        ctx.globalAlpha = 0.72;
        ctx.fillRect(0, G.H / 2 - 56, G.W, 112);
        ctx.globalAlpha = 1;
        ctx.fillStyle = pal.bg;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `700 34px ${pal.mono}`;
        ctx.fillText(title, G.W / 2, G.H / 2 - 12);
        if (sub) {
            ctx.font = `500 13px ${pal.mono}`;
            ctx.fillText(sub, G.W / 2, G.H / 2 + 26);
        }
    }

    function render() {
        const ctx = G.ctx;
        const pal = G.pal;
        const fade = Math.min(1, G.time / 0.7);
        ctx.clearRect(0, 0, G.W, G.H);
        ctx.globalAlpha = fade;
        ctx.fillStyle = pal.bg;
        ctx.fillRect(0, 0, G.W, G.H);
        for (let r = 0; r < G.rows; r++) {
            for (let c = 0; c < G.cols; c++) {
                const v = G.grid[r * G.cols + c];
                if (v === BRICK || v === STEEL) drawTile(ctx, c, r, v, pal);
            }
        }
        drawBase(ctx, pal);
        ctx.globalAlpha = 1;
        if (G.phase === 'intro') {
            const best = G.stage === 1 ? (G.best ? `high score ${G.best.name} ${G.best.score}` : 'the page is the map. defend the stamp.') : `score ${G.score}   lives ${G.lives}${playerStars() ? '   ' + '\u2605'.repeat(playerStars()) : ''}`;
            if (G.time > 0.7) drawBanner(ctx, pal, `STAGE ${G.stage}`, best);
            return;
        }
        for (const bonus of G.bonuses) drawBonus(ctx, bonus, pal);
        for (const tank of G.tanks) if (tank.alive) drawTank(ctx, tank, pal);
        ctx.fillStyle = pal.ink;
        for (const b of G.bullets) ctx.fillRect(b.x - BULLET / 2, b.y - BULLET / 2, BULLET, BULLET);
        drawEffects(ctx, pal);
        drawHud(ctx, pal);
        if (G.phase === 'cleared') drawBanner(ctx, pal, 'STAGE CLEAR', `score ${G.score}   next: stage ${G.stage + 1} of ${MAX_STAGE}`);
        if (G.paused) drawBanner(ctx, pal, 'PAUSE', 'P to continue');
        if (G.over && G.overAt > 0.8 && !G.panelMode) drawBanner(ctx, pal, G.won ? 'STAGE CLEAR' : 'GAME OVER', `score ${G.score}`);
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
        if (KEYMAP[key]) {
            event.preventDefault();
            if (!G.held.includes(KEYMAP[key])) G.held.push(KEYMAP[key]);
            return;
        }
        if (key === ' ') {
            event.preventDefault();
            if (!event.repeat) G.firePressed = true;
            return;
        }
        if (key === 'p' || key === 'P') {
            G.paused = !G.paused;
            return;
        }
        if (key === 'm' || key === 'M') {
            audio.muted = !audio.muted;
            return;
        }
        if ((key === 'r' || key === 'R') && G.over) {
            restart();
        }
    }

    function onKeyUp(event) {
        if (!G) return;
        const dir = KEYMAP[event.key];
        if (dir) G.held = G.held.filter(d => d !== dir);
    }

    function onBlur() {
        if (G) {
            G.held = [];
            G.fireHeld = false;
        }
    }

    function onVisibility() {
        if (G && document.hidden && G.phase === 'play' && !G.over) G.paused = true;
    }

    function buildTouchControls(wrap) {
        const controls = el('div', 'battle-controls');
        const pad = el('div', 'battle-pad');
        for (const dir of ['up', 'left', 'right', 'down']) {
            const button = el('button', 'battle-pad-' + dir, { up: '\u25B2', left: '\u25C0', right: '\u25B6', down: '\u25BC' }[dir]);
            button.type = 'button';
            button.setAttribute('data-dir', dir);
            button.setAttribute('aria-label', dir);
            pad.appendChild(button);
        }
        const setDir = target => {
            const button = target && target.closest ? target.closest('[data-dir]') : null;
            const dir = button ? button.getAttribute('data-dir') : null;
            if (!G) return;
            G.held = dir ? [dir] : [];
            pad.querySelectorAll('[data-dir]').forEach(b => b.classList.toggle('is-active', b === button));
        };
        pad.addEventListener('pointerdown', event => {
            event.preventDefault();
            pad.setPointerCapture(event.pointerId);
            setDir(document.elementFromPoint(event.clientX, event.clientY));
        });
        pad.addEventListener('pointermove', event => {
            if (!pad.hasPointerCapture(event.pointerId)) return;
            setDir(document.elementFromPoint(event.clientX, event.clientY));
        });
        const release = event => {
            if (pad.hasPointerCapture(event.pointerId)) pad.releasePointerCapture(event.pointerId);
            setDir(null);
        };
        pad.addEventListener('pointerup', release);
        pad.addEventListener('pointercancel', release);

        const sys = el('div', 'battle-sys');
        const pause = el('button', 'battle-sys-button', 'II');
        pause.type = 'button';
        pause.setAttribute('aria-label', 'Pause');
        pause.addEventListener('click', () => { if (G) G.paused = !G.paused; });
        const quit = el('button', 'battle-quit', 'QUIT');
        quit.type = 'button';
        quit.setAttribute('aria-label', 'Quit');
        let armed = 0;
        quit.addEventListener('click', () => {
            if (quit.classList.contains('is-armed')) {
                stop();
                return;
            }
            quit.classList.add('is-armed');
            quit.textContent = 'SURE?';
            clearTimeout(armed);
            armed = setTimeout(() => {
                quit.classList.remove('is-armed');
                quit.textContent = 'QUIT';
            }, 2500);
        });
        sys.append(quit, pause);

        const fire = el('button', 'battle-fire', 'FIRE');
        fire.type = 'button';
        const fireOn = event => {
            event.preventDefault();
            if (!G) return;
            G.fireHeld = true;
            G.firePressed = true;
        };
        const fireOff = () => { if (G) G.fireHeld = false; };
        fire.addEventListener('pointerdown', fireOn);
        fire.addEventListener('pointerup', fireOff);
        fire.addEventListener('pointercancel', fireOff);
        fire.addEventListener('pointerleave', fireOff);

        controls.append(pad, sys, fire);
        controls.addEventListener('contextmenu', event => event.preventDefault());
        wrap.appendChild(controls);
    }

    function stageScroll(stage) {
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        if (maxScroll === 0) return 0;
        return Math.round((G.scrollY0 + (stage - 1) * maxScroll / (MAX_STAGE - 1)) % (maxScroll + 1));
    }

    function setupStage(map) {
        G.grid = new Uint8Array(map.grid);
        G.base = map.base;
        G.playerSpawn = map.playerSpawn;
        G.spawns = map.spawns;
        G.queue = enemyQueue(G.stage);
        G.tanks = [];
        G.bullets = [];
        G.effects = [];
        G.bonuses = [];
        G.held = [];
        G.firePressed = false;
        G.fireHeld = false;
        G.killed = 0;
        G.time = 0;
        G.phase = 'intro';
        G.paused = false;
        G.respawn = 0;
        G.clearIn = 0;
        G.stageClear = 0;
        G.freeze = 0;
        G.shovel = 0;
        G.baseDead = false;
        G.spawnIndex = 0;
        G.spawnTimer = 0;
        G.maxOnScreen = Math.min(G.cols * G.rows > 3000 ? 8 : 6, 4 + Math.floor((G.stage - 1) / 2));
        const player = makeTank('player', map.playerSpawn.x, map.playerSpawn.y, 'up');
        G.tanks.push(player);
        G.player = player;
    }

    function loadStage(stage) {
        G.stage = stage;
        window.scrollTo({ top: stageScroll(stage), left: 0, behavior: 'instant' });
        const map = scanMap(G.cols, G.rows, G.W, G.H);
        G.map = map;
        setupStage(map);
    }

    function newGame() {
        G.stage = 1;
        G.stars = 0;
        G.lives = 3;
        G.score = 0;
        G.killedTotal = 0;
        G.over = false;
        G.won = false;
        G.overAt = 0;
        G.ended = false;
        clearPanel();
        loadStage(1);
    }

    function restart() {
        newGame();
        G.time = 0.7;
    }

    function start(options) {
        if (G) return true;
        const perStage = options && Number.isInteger(options.enemiesPerStage) ? Math.max(1, Math.min(TOTAL_ENEMIES, options.enemiesPerStage)) : TOTAL_ENEMIES;
        const touch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
        const strip = touch ? (window.innerHeight > 600 ? 176 : 120) : 0;
        const W = Math.floor(window.innerWidth / TILE) * TILE;
        const H = Math.floor((window.innerHeight - strip) / TILE) * TILE;
        const cols = W / TILE;
        const rows = H / TILE;
        if (cols < 18 || rows < 16) return false;

        const wrap = document.createElement('div');
        wrap.className = 'battle-city' + (touch ? ' is-touch' : '');
        wrap.style.setProperty('--strip', strip + 'px');
        const panel = el('div', 'battle-panel');
        panel.hidden = true;
        const canvas = document.createElement('canvas');
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        wrap.appendChild(canvas);
        wrap.appendChild(panel);
        document.body.appendChild(wrap);
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = false;

        G = { W, H, cols, rows, canvas, ctx, wrap, panel, panelMode: null, map: null, touch, pal: palette(), maxOnScreen: 4, last: performance.now(), raf: 0, best: null, fireHeld: false, scrollY0: window.scrollY, stage: 1, stars: 0, total: perStage, invincible: !!(options && options.invincible) };
        if (touch) buildTouchControls(wrap);
        newGame();
        fetchScores().then(result => {
            if (G && result.scores.length) G.best = result.scores[0];
        });
        G.prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.documentElement.classList.add('battle');
        wrap.style.background = G.pal.frame;
        requestAnimationFrame(() => wrap.classList.add('is-on'));
        window.addEventListener('keydown', onKeyDown, true);
        window.addEventListener('keyup', onKeyUp, true);
        window.addEventListener('blur', onBlur);
        document.addEventListener('visibilitychange', onVisibility);
        ensureAudio();
        G.raf = requestAnimationFrame(frame);
        return true;
    }

    function stop() {
        if (!G) return;
        cancelAnimationFrame(G.raf);
        window.removeEventListener('keydown', onKeyDown, true);
        window.removeEventListener('keyup', onKeyUp, true);
        window.removeEventListener('blur', onBlur);
        document.removeEventListener('visibilitychange', onVisibility);
        G.wrap.remove();
        document.body.style.overflow = G.prevOverflow;
        window.scrollTo({ top: G.scrollY0, left: 0, behavior: 'instant' });
        document.documentElement.classList.remove('battle');
        G = null;
    }

    function state() {
        if (!G) return null;
        return {
            phase: G.phase,
            over: G.over,
            won: G.won,
            stage: G.stage,
            stars: playerStars(),
            bonuses: G.bonuses.length,
            lives: G.lives,
            score: G.score,
            killed: G.killed,
            queued: G.queue.length,
            onScreen: G.tanks.filter(t => t.alive && t.type !== 'player').length,
            bricks: Array.from(G.grid).filter(v => v === BRICK).length,
            steel: Array.from(G.grid).filter(v => v === STEEL).length,
            cols: G.cols,
            rows: G.rows,
        };
    }

    function tick(dt) {
        if (!G) return;
        update(dt);
        render();
    }

    window.BattleCity = { start, stop, state, tick, grid: () => (G ? { cols: G.cols, rows: G.rows, cells: Array.from(G.grid), base: G.base } : null) };
})();
