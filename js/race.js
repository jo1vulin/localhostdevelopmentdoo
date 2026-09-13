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
    const CENTRIFUGAL = 0.32;
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

    function drawCarSprite(ctx, x, y, w, shade, spin, isPlayer) {
        const h = w * 0.62;
        ctx.save();
        ctx.translate(x, y);
        if (spin) ctx.rotate(spin);
        ctx.fillStyle = PAL.shadow;
        ctx.fillRect(-w / 2 - w * 0.05, -h * 0.08, w * 1.1, h * 0.16);
        ctx.fillStyle = PAL.ink;
        ctx.fillRect(-w / 2, -h * 0.35, w * 0.16, h * 0.42);
        ctx.fillRect(w / 2 - w * 0.16, -h * 0.35, w * 0.16, h * 0.42);
        ctx.fillStyle = isPlayer ? PAL.car : PAL.traffic[shade];
        ctx.fillRect(-w * 0.44, -h, w * 0.88, h * 0.95);
        ctx.fillStyle = isPlayer ? PAL.carDark : PAL.ink;
        ctx.fillRect(-w * 0.44, -h * 0.28, w * 0.88, h * 0.1);
        ctx.fillStyle = PAL.glass;
        ctx.fillRect(-w * 0.34, -h * 0.92, w * 0.68, h * 0.22);
        if (isPlayer) {
            ctx.fillStyle = PAL.stripe;
            ctx.fillRect(-w * 0.1, -h, w * 0.06, h * 0.95);
            ctx.fillRect(w * 0.04, -h, w * 0.06, h * 0.95);
            ctx.fillStyle = PAL.text;
            ctx.fillRect(-w * 0.4, -h * 0.2, w * 0.1, h * 0.06);
            ctx.fillRect(w * 0.3, -h * 0.2, w * 0.1, h * 0.06);
        }
        ctx.restore();
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
        drawCarSprite(ctx, G.W / 2 + G.steerTilt * 6, G.H * 0.9 + bounce - lift, carW * (1 + G.air.y * 0.25), 0, G.spin, true);

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
        }
        for (const t of G.texts) {
            ctx.globalAlpha = Math.max(0, 1 - t.t / t.life);
            label(ctx, t.text, G.W / 2, G.H * 0.62 - t.t * 40, 'center', 22);
            ctx.globalAlpha = 1;
        }
        if (G.phase === 'over') {
            ctx.fillStyle = 'rgba(17, 17, 17, 0.78)';
            ctx.fillRect(0, G.H / 2 - 110, G.W, 220);
            label(ctx, "TIME'S UP", G.W / 2, G.H / 2 - 92, 'center', 34);
            label(ctx, `ELEANOR COVERED ${Math.floor(G.distance).toLocaleString('en-US')} M`, G.W / 2, G.H / 2 - 40, 'center', 18);
            label(ctx, `TOP SPEED ${Math.round(G.topSpeed * KMH_PER_UNIT)} KM/H   ${G.jumps} JUMP${G.jumps === 1 ? '' : 'S'}   ${G.nearMisses} CLOSE CALL${G.nearMisses === 1 ? '' : 'S'}   ${G.crashes} CRASH${G.crashes === 1 ? '' : 'ES'}`, G.W / 2, G.H / 2 - 8, 'center', 12, 'rgba(242, 242, 242, 0.85)');
            if (G.newBest) label(ctx, 'NEW PERSONAL BEST', G.W / 2, G.H / 2 + 22, 'center', 14);
            label(ctx, G.touch ? 'TAP TO DRIVE AGAIN' : 'R DRIVE AGAIN   ESC BACK TO THE SITE', G.W / 2, G.H / 2 + 62, 'center', 12, 'rgba(242, 242, 242, 0.8)');
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
        const dx = dt * 2 * speedPercent;
        const steer = clamp(G.steer, -1, 1);

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
            G.playerX += dx * steer * 0.35;
        } else {
            G.playerX += dx * steer;
            G.playerX -= dx * speedPercent * playerSegment.curve * CENTRIFUGAL;
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
                if (G.speed > car.speed && overlap(G.playerX, 0.34, car.offset, car.w, 0.8)) {
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
        if (!G) return;
        if (G.phase === 'over') {
            restart();
            return;
        }
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
        const delta = (event.clientX - G.pointer.startX) / Math.max(60, G.W * 0.12);
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
        G.steerTilt = 0;
        G.throttle = false;
        G.brake = false;
        G.keys = {};
        G.pointer = { active: false, id: null, startX: 0, steer: 0 };
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
        const canvas = document.createElement('canvas');
        const dpr = Math.min(1.5, window.devicePixelRatio || 1);
        canvas.width = Math.floor(W * dpr);
        canvas.height = Math.floor(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        wrap.appendChild(canvas);
        document.body.appendChild(wrap);
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        let best = 0;
        try {
            best = Number(localStorage.getItem('lh-eleanor-best') || 0);
        } catch (err) {
            best = 0;
        }
        G = { W, H, canvas, ctx, wrap, touch, best, mono: (getComputedStyle(document.documentElement).getPropertyValue('--font-mono') || 'monospace').trim(), cameraDepth: 1 / Math.tan((FOV / 2) * Math.PI / 180), playerZ: CAMERA_HEIGHT / (1 / Math.tan((FOV / 2) * Math.PI / 180)), last: performance.now(), raf: 0 };
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
