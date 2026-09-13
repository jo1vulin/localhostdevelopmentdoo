const THEMES = ['paper', 'hearth', 'cyber'];
const THEME_COLORS = { paper: '#EDE7DA', hearth: '#1D1917', cyber: '#0B0A12' };

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNav();
    initCopyButtons();
    initReveal();
    initPortraits();
    initStamp();
    initSignature();
    initCountUp();
    initLocalTime();
    initTerminal();
    initBattleCode();
    initConsoleBanner();
    initYear();
});

function inBattle() {
    return document.documentElement.classList.contains('battle');
}

function launchBattleCity() {
    const run = () => {
        if (!window.BattleCity) return false;
        const ok = window.BattleCity.start();
        if (!ok) console.log('Battle City needs a bigger screen. Try a desktop window.');
        return ok;
    };
    if (window.BattleCity) return run();
    const existing = document.querySelector('script[data-battle]');
    if (existing) return true;
    const script = document.createElement('script');
    const version = ((document.querySelector('meta[name="asset-version"]') || {}).content || '').trim();
    script.src = 'js/battle.js' + (version ? '?v=' + version : '');
    script.setAttribute('data-battle', '');
    script.addEventListener('load', run);
    document.body.appendChild(script);
    return true;
}

function fingerprint(text) {
    let hash = 5381;
    for (let i = 0; i < text.length; i++) hash = (Math.imul(hash, 33) ^ text.charCodeAt(i)) >>> 0;
    return hash;
}

function sealMarkup(prefix, withInk) {
    const ink = withInk ? `<filter id="${prefix}-ink" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="${Math.floor(Math.random() * 900)}" result="warp"/><feDisplacementMap in="SourceGraphic" in2="warp" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="rough"/><feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="${Math.floor(Math.random() * 900)}" result="grain"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 3.2 -0.42" result="grain-alpha"/><feComposite in="rough" in2="grain-alpha" operator="in"/></filter>` : '';
    return `<svg class="seal" viewBox="0 0 240 240" aria-hidden="true" focusable="false"><defs><path id="${prefix}-top" d="M 13,120 A 107,107 0 0 1 227,120"/><path id="${prefix}-bottom" d="M 5,120 A 115,115 0 0 0 235,120"/>${ink}</defs><g${withInk ? ` filter="url(#${prefix}-ink)"` : ''}><circle cx="120" cy="120" r="118" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="120" cy="120" r="104" fill="none" stroke="currentColor" stroke-width="1"/><text class="seal-text"><textPath href="#${prefix}-top" startOffset="50%" text-anchor="middle">Localhost Development</textPath></text><text class="seal-text"><textPath href="#${prefix}-bottom" startOffset="50%" text-anchor="middle">Sombor · Serbia</textPath></text><circle cx="9" cy="120" r="2.5" fill="currentColor"/><circle cx="231" cy="120" r="2.5" fill="currentColor"/><text class="seal-monogram" x="116" y="152" text-anchor="middle">lh<tspan class="seal-dot">.</tspan></text></g></svg>`;
}

function whoosh(kind) {
    try {
        const ac = whoosh.ctx || (whoosh.ctx = new (window.AudioContext || window.webkitAudioContext)());
        if (ac.state === 'suspended') ac.resume();
        if (kind === 'prime') return;
        const now = ac.currentTime;
        const gain = ac.createGain();
        gain.connect(ac.destination);
        if (kind === 'thump') {
            const osc = ac.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.connect(gain);
            osc.start(now);
            osc.stop(now + 0.32);
            return;
        }
        const length = Math.floor(ac.sampleRate * 0.6);
        const buffer = ac.createBuffer(1, length, ac.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
        const src = ac.createBufferSource();
        src.buffer = buffer;
        const filter = ac.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 1.2;
        filter.frequency.setValueAtTime(kind === 'up' ? 300 : 2400, now);
        filter.frequency.exponentialRampToValueAtTime(kind === 'up' ? 2400 : 300, now + 0.55);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        src.connect(filter);
        filter.connect(gain);
        src.start(now);
        src.stop(now + 0.62);
    } catch (err) {
        return;
    }
}

function flipTheSheet() {
    if (inBattle() || document.querySelector('.flip-front')) return;
    const root = document.documentElement;
    const body = document.body;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrollY = window.scrollY;

    const front = document.createElement('div');
    front.className = 'flip-front';
    const inner = document.createElement('div');
    inner.className = 'flip-front-inner';
    inner.style.transform = `translateY(-${scrollY}px)`;
    while (body.firstChild) inner.appendChild(body.firstChild);
    front.appendChild(inner);
    body.appendChild(front);

    const back = document.createElement('div');
    back.className = 'flip-back';
    back.setAttribute('aria-hidden', 'true');
    back.innerHTML = `<div class="flip-inner"><div class="flip-stamp">${sealMarkup('flip', true)}</div><p class="flip-line">Hvala što ste zavirili.</p><p class="flip-sub">Thanks for looking under the hood.</p></div>`;
    body.appendChild(back);
    root.classList.add('flipping');

    const stamp = back.querySelector('.flip-stamp');
    const lines = back.querySelectorAll('.flip-line, .flip-sub');
    const flipMs = reduce ? 1 : 700;
    const timing = { duration: flipMs, fill: 'forwards' };
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

    const sequence = async () => {
        if (!reduce) whoosh('up');
        front.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(90deg)' }], { ...timing, easing: 'cubic-bezier(0.55, 0, 1, 0.45)' });
        await wait(flipMs);
        back.classList.add('is-front');
        back.animate([{ transform: 'rotateY(-90deg)' }, { transform: 'rotateY(0deg)' }], { ...timing, easing: 'cubic-bezier(0, 0.55, 0.45, 1)' });
        await wait(flipMs + (reduce ? 50 : 200));
        if (!reduce) whoosh('thump');
        stamp.classList.add('is-down');
        back.classList.add('is-shaken');
        await wait(reduce ? 50 : 500);
        lines.forEach(line => line.classList.add('is-visible'));
        await wait(reduce ? 1200 : 2200);
        if (!reduce) whoosh('down');
        back.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-90deg)' }], { ...timing, easing: 'cubic-bezier(0.55, 0, 1, 0.45)' });
        await wait(flipMs);
        back.classList.remove('is-front');
        front.animate([{ transform: 'rotateY(90deg)' }, { transform: 'rotateY(0deg)' }], { ...timing, easing: 'cubic-bezier(0, 0.55, 0.45, 1)' });
        await wait(flipMs);
    };

    sequence().catch(() => null).then(() => {
        back.remove();
        while (inner.firstChild) body.insertBefore(inner.firstChild, front);
        front.remove();
        root.classList.remove('flipping');
        window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });
    });
}

function initBattleCode() {
    const code = 'battlecity';
    let buffer = '';
    if (location.hash === '#battlecity') setTimeout(launchBattleCity, 600);
    document.addEventListener('keydown', event => {
        if (inBattle() || event.ctrlKey || event.metaKey || event.altKey) return;
        const target = event.target;
        if (target && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName))) return;
        if (event.key.length !== 1) return;
        const ch = event.key.toLowerCase();
        if (ch === ' ') return;
        buffer = (buffer + ch).slice(-code.length);
        if (buffer === code) {
            buffer = '';
            launchBattleCity();
        }
    });
}

function currentTheme() {
    const name = document.documentElement.getAttribute('data-theme');
    return THEMES.includes(name) ? name : 'paper';
}

function loadCyberFont() {
    if (document.querySelector('link[data-cyber-font]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&display=swap';
    link.setAttribute('data-cyber-font', '');
    document.head.appendChild(link);
}

function setTheme(name) {
    if (!THEMES.includes(name)) return false;
    const root = document.documentElement;
    const previous = currentTheme();
    if (name === 'cyber') loadCyberFont();
    if (name === 'paper') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', name);

    root.classList.add('theme-fade');
    setTimeout(() => root.classList.remove('theme-fade'), 500);
    if (name === 'cyber' && previous !== 'cyber') {
        root.classList.remove('theme-glitch');
        void root.offsetWidth;
        root.classList.add('theme-glitch');
        setTimeout(() => root.classList.remove('theme-glitch'), 600);
    }

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLORS[name]);
    document.querySelectorAll('[data-theme-pick]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.getAttribute('data-theme-pick') === name));
    });
    try {
        localStorage.setItem('lh-theme', name);
    } catch (err) {
        return true;
    }
    return true;
}

function cycleTheme() {
    const next = THEMES[(THEMES.indexOf(currentTheme()) + 1) % THEMES.length];
    setTheme(next);
    return next;
}

function initTheme() {
    const active = currentTheme();
    document.querySelectorAll('[data-theme-pick]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.getAttribute('data-theme-pick') === active));
        button.addEventListener('click', () => setTheme(button.getAttribute('data-theme-pick')));
    });
    if (active === 'cyber') loadCyberFont();

    document.addEventListener('keydown', event => {
        if (inBattle()) return;
        if (event.key !== 't' || event.ctrlKey || event.metaKey || event.altKey) return;
        const target = event.target;
        if (target && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName))) return;
        event.preventDefault();
        cycleTheme();
    });
}

function initSignature() {
    const stamp = document.getElementById('stamp');
    if (!stamp) return;
    if (document.documentElement.classList.contains('signing')) {
        const strokes = stamp.querySelectorAll('.seal-write');
        const last = strokes[strokes.length - 1];
        if (last) last.addEventListener('animationend', () => document.documentElement.classList.remove('signing'), { once: true });
    }
}

function replaySignature(stamp) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.documentElement.classList.remove('signing');
    stamp.classList.remove('is-signing');
    void stamp.offsetWidth;
    stamp.classList.add('is-signing');
}

function initConsoleBanner() {
    if (typeof console === 'undefined' || typeof console.log !== 'function') return;
    const art = ART_LINES.join('\n');
    const mono = 'font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;line-height:1.15';
    console.log('%c' + art + '%c.', mono, mono + ';color:#A96F2B;font-weight:700');
    console.log('%cSoftware from people you’ll know by name.%c  Sombor, Serbia', 'background:#6E2A28;color:#EDE7DA;padding:3px 8px;font-weight:600', 'color:inherit');
    console.log('Hand-written HTML, CSS and JavaScript. No framework, no build step, no tracking, no cookies.');
    console.log('The seal in the hero is an SVG filter (feTurbulence + feDisplacementMap). Press and hold it.');
    console.log('Press ` (backtick) for a terminal, or click the seal in the footer.');
    console.log('Type battlecity. Anywhere on the page. You have been warned.');
    console.log('Say hello: jovan.vulin@localhostdevelopmentdoo.com');
}

function initTerminal() {
    const panel = document.getElementById('terminal');
    const output = document.getElementById('terminal-output');
    const form = document.getElementById('terminal-form');
    const input = document.getElementById('terminal-input');
    if (!panel || !output || !form || !input) return;

    const history = [];
    let historyIndex = 0;
    let booted = false;
    let opened = false;
    let closing;

    const text = node => (node ? node.textContent.trim() : '');

    const print = (content, cls) => {
        const line = document.createElement('div');
        line.className = 'line' + (cls ? ' ' + cls : '');
        if (content instanceof Node) line.appendChild(content);
        else line.textContent = content;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    };

    const printLines = (lines, cls) => lines.forEach(line => print(line, cls));

    const link = (label, href) => {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = label;
        if (/^https?:/.test(href)) {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
        }
        return a;
    };

    const row = (label, node) => {
        const fragment = document.createDocumentFragment();
        fragment.appendChild(document.createTextNode(label));
        fragment.appendChild(node);
        return fragment;
    };

    const scrollTo = id => {
        const target = document.getElementById(id);
        if (!target) return false;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
    };

    const commands = {
        help: () => printLines([
            'Available commands:',
            '  help              this list',
            '  about             who we are, in three lines',
            '  team              the five of us',
            '  services          what we do',
            '  work              who we did it for',
            '  contact           how to reach us',
            '  time              what time it is in Sombor',
            '  history           how this site got here',
            '  cd <section>      scroll to about, approach, work, team or contact',
            '  stamp             press the seal',
            '  theme <name>      paper, hearth or cyber (or just press t)',
            '  battlecity        the page becomes the map. 20 enemy tanks. good luck.',
            '  scores            the Battle City scoreboard',
            '  ls, cat, pwd      the usual',
            '  clear, exit       tidy up, close',
        ]),
        about: () => printLines([
            'Five engineers in Sombor, Serbia.',
            'We worked together for years before there was a company to put on the invoice.',
            'We build the systems businesses run on, and we stay to run them.',
        ]),
        whoami: () => print('guest. We are Vladimir, Mladen, Rade, Miloš and Jovan.'),
        team: () => {
            const members = document.querySelectorAll('.member');
            if (!members.length) return print('No team found. That would be a problem.');
            print('Team members:');
            members.forEach(member => {
                const name = text(member.querySelector('.member-name'));
                const role = text(member.querySelector('.member-role'));
                const href = member.querySelector('.member-link');
                const label = ('  ' + name).padEnd(22) + role.padEnd(34);
                print(href ? row(label, link('[LinkedIn]', href.href)) : label);
            });
        },
        services: () => {
            print('Available services:');
            document.querySelectorAll('.service').forEach(service => {
                print(('  --' + text(service.querySelector('h4')).toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-')).padEnd(32) + text(service.querySelector('p')));
            });
        },
        work: () => printLines([
            'Clients: Continental, NTT DATA.',
            'Most of it is long-term, and most of it is still in production.',
            'Details are on the page: cd work',
        ]),
        clients: () => commands.work(),
        contact: () => {
            print('Available contact methods:');
            print(row('  email    ', link('jovan.vulin@localhostdevelopmentdoo.com', 'mailto:jovan.vulin@localhostdevelopmentdoo.com')));
            print(row('  phone    ', link('+381 66 450 599', 'tel:+38166450599')));
            print('  address  Ratarska BB, 25000 Sombor, Serbia');
        },
        time: () => {
            const local = document.getElementById('sombor-time');
            const zone = document.getElementById('sombor-zone');
            print(local && local.textContent ? `It is ${local.textContent} in Sombor${zone ? zone.textContent : ''}.` : 'Your browser will not tell me the time in Sombor.');
        },
        date: () => commands.time(),
        history: () => printLines([
            '2025-10  A terminal-themed landing page. Cyan on black, blinking cursor.',
            '2025-11  Team section: five names, five LinkedIn links.',
            '2026-09  Redesign: paper, bordeaux, a serif, a seal. The terminal moved down here.',
        ]),
        stamp: () => {
            const stamp = document.getElementById('stamp');
            if (!stamp) return print('No seal to press.');
            scrollTo('top');
            setTimeout(() => {
                stamp.dispatchEvent(new PointerEvent('pointerdown', { button: 0 }));
                setTimeout(() => stamp.dispatchEvent(new PointerEvent('pointerup', { button: 0 })), 160);
            }, 450);
            print('Pressed.');
        },
        cd: args => {
            const target = (args[0] || '').replace(/^#/, '').replace(/\/$/, '');
            if (!target || target === '~' || target === '/') return scrollTo('top') && print('/');
            if (scrollTo(target)) print(`/${target}`);
            else print(`cd: no such section: ${target}`);
        },
        ls: () => printLines([
            'CNAME  README.md  css/  docs/  favicon.svg  img/  index.html  js/',
            'That is the whole site. No framework, no build step.',
        ], 'dim'),
        pwd: () => print('/srv/www/localhostdevelopmentdoo.com'),
        cat: args => {
            const file = args[0] || '';
            if (file === 'company-info.txt') {
                return printLines([
                    'COMPANY DETAILS',
                    'Name:      Localhost Development DOO Sombor',
                    'VAT:       111936819',
                    'ID:        21576930',
                    'Activity:  6201 (Software development)',
                    'Address:   Ratarska BB, 25000 Sombor, Serbia',
                ]);
            }
            if (file === 'README.md') return print('Open index.html in a browser. That is it.');
            if (!file) return print('cat: what?');
            print(`cat: ${file}: No such file or directory`);
        },
        theme: args => {
            const want = (args[0] || '').toLowerCase();
            if (!want) return printLines([`Current theme: ${currentTheme()}.`, `Available: ${THEMES.join(', ')}. Usage: theme <name> or theme next`]);
            if (want === 'next') return print(`Theme: ${cycleTheme()}.`);
            if (setTheme(want)) return print(`Theme: ${want}.`);
            print(`theme: unknown theme: ${want}. Try ${THEMES.join(', ')}.`);
        },
        scores: async () => {
            const api = ((document.querySelector('meta[name="score-api"]') || {}).content || '').trim();
            let scores = [];
            let scope = 'this browser';
            try {
                scores = JSON.parse(localStorage.getItem('lh-scores') || '[]');
            } catch (err) {
                scores = [];
            }
            if (api) {
                try {
                    const res = await fetch(api, { cache: 'no-store' });
                    const data = await res.json();
                    scores = data.scores || [];
                    scope = 'worldwide';
                } catch (err) {
                    scope = 'this browser (scoreboard offline)';
                }
            }
            scores = scores.slice().sort((a, b) => b.score - a.score || b.killed - a.killed).slice(0, 10);
            if (!scores.length) return print('No scores yet. Type battlecity and change that.');
            print(`Battle City top ${scores.length}, ${scope}:`);
            scores.forEach((row, i) => print(`  ${String(i + 1).padStart(2, '0')}  ${String(row.name).padEnd(13)} ${String(row.score).padStart(5)}  ${row.killed} tanks${row.won ? ' (cleared)' : ''}`));
        },
        battlecity: () => {
            print('Loading. Arrows or WASD to move, space to fire, Esc to come back.');
            close();
            setTimeout(launchBattleCity, 380);
        },
        echo: args => print(args.join(' ')),
        sudo: () => print('Nice try. Jovan has the root password; his email is under contact.'),
        clear: () => { output.replaceChildren(); },
        exit: () => close(),
        close: () => close(),
        quit: () => close(),
        q: () => close(),
    };

    const run = raw => {
        const line = raw.trim();
        if (!line) return;
        print('$ ' + line, 'cmd');
        history.push(line);
        historyIndex = history.length;
        if (fingerprint(line) === 1001122324) {
            whoosh('prime');
            close();
            setTimeout(flipTheSheet, 380);
            return;
        }
        const [name, ...args] = line.split(/\s+/);
        const key = name.toLowerCase();
        const command = commands[key];
        if (command) return command(args.filter(a => !a.startsWith('--')));
        if (key === 'rm' && args.join(' ').includes('-rf')) return print('No. Not on a family site.');
        print(`command not found: ${name}. Type help.`);
    };

    const boot = () => {
        if (booted) return;
        booted = true;
        printLines([
            'localhost@development:~$ ./company.sh --info',
            'Localhost Development DOO Sombor. Five people, one platform, years of it.',
            'Type help to see what this thing can do. Type exit to close it.',
        ]);
    };

    const open = () => {
        clearTimeout(closing);
        opened = true;
        panel.hidden = false;
        void panel.offsetHeight;
        panel.classList.add('is-open');
        boot();
        input.focus();
    };

    const close = () => {
        opened = false;
        panel.classList.remove('is-open');
        input.blur();
        closing = setTimeout(() => { panel.hidden = true; }, 350);
    };

    const isOpen = () => opened;

    const isEditing = target => target && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName)) && target !== input;

    document.addEventListener('keydown', event => {
        if (inBattle()) return;
        if (event.key === '`' && !event.ctrlKey && !event.metaKey && !event.altKey) {
            if (isEditing(event.target)) return;
            if (event.target === input && input.value) return;
            event.preventDefault();
            isOpen() ? close() : open();
            return;
        }
        if (event.key === 'Escape' && isOpen()) {
            event.preventDefault();
            close();
        }
    });

    input.addEventListener('keydown', event => {
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (!history.length) return;
            historyIndex = Math.max(0, historyIndex - 1);
            input.value = history[historyIndex];
            return;
        }
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            historyIndex = Math.min(history.length, historyIndex + 1);
            input.value = history[historyIndex] || '';
            return;
        }
        if (event.key === 'Tab') {
            const partial = input.value.trim().toLowerCase();
            if (!partial) return;
            const match = Object.keys(commands).find(name => name.startsWith(partial));
            if (match) {
                event.preventDefault();
                input.value = match + ' ';
            }
        }
    });

    form.addEventListener('submit', event => {
        event.preventDefault();
        run(input.value);
        input.value = '';
    });

    panel.addEventListener('click', event => {
        if (event.target.closest('a')) return;
        input.focus();
    });

    const closeButton = document.getElementById('terminal-close');
    if (closeButton) closeButton.addEventListener('click', close);

    const footerSeal = document.querySelector('.footer-seal');
    if (footerSeal) footerSeal.addEventListener('click', () => (isOpen() ? close() : open()));
}

const ART_LINES = [" _                      _  _                  _   ", "| |  ___    ___   __ _ | || |__    ___   ___ | |_ ", "| | / _ \\  / __| / _` || || '_ \\  / _ \\ / __|| __|", "| || (_) || (__ | (_| || || | | || (_) |\\__ \\| |_ ", "|_| \\___/  \\___| \\__,_||_||_| |_| \\___/ |___/ \\__|"];

function initStamp() {
    const stamp = document.getElementById('stamp');
    if (!stamp) return;

    const turbulence = stamp.querySelectorAll('feTurbulence');
    let freshTimer;

    const reink = () => {
        const seed = String(Math.floor(Math.random() * 1000));
        turbulence.forEach(node => node.setAttribute('seed', seed));
    };

    const press = event => {
        if (event.button !== undefined && event.button !== 0) return;
        stamp.classList.add('is-pressed');
    };

    const release = () => {
        if (!stamp.classList.contains('is-pressed')) return;
        stamp.classList.remove('is-pressed');
        stamp.classList.add('is-fresh');
        stamp.style.setProperty('--stamp-rot', `${(-9 + Math.random() * 4).toFixed(1)}deg`);
        reink();
        replaySignature(stamp);
        clearTimeout(freshTimer);
        freshTimer = setTimeout(() => stamp.classList.remove('is-fresh'), 1200);
    };

    stamp.addEventListener('pointerdown', press);
    stamp.addEventListener('pointerup', release);
    stamp.addEventListener('pointercancel', release);
    stamp.addEventListener('pointerleave', release);
}

function initCountUp() {
    const values = document.querySelectorAll('.facts dd');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!values.length || reduceMotion || !('IntersectionObserver' in window)) return;

    const run = dd => {
        const finalText = dd.textContent;
        const parts = finalText.split(/(\d+)/);
        const start = performance.now();
        const duration = 900;
        const frame = now => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            dd.textContent = parts.map(part => /^\d+$/.test(part) ? String(Math.round(Number(part) * eased)) : part).join('');
            if (t < 1) requestAnimationFrame(frame);
            else dd.textContent = finalText;
        };
        requestAnimationFrame(frame);
    };

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            run(entry.target);
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.6 });

    values.forEach(dd => observer.observe(dd));
}

function initLocalTime() {
    const time = document.getElementById('sombor-time');
    const zone = document.getElementById('sombor-zone');
    if (!time || !zone || typeof Intl === 'undefined') return;

    let clock;
    let zoneName;
    try {
        clock = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Belgrade', hour: '2-digit', minute: '2-digit' });
        zoneName = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Belgrade', timeZoneName: 'short' });
    } catch (err) {
        return;
    }

    const tick = () => {
        const now = new Date();
        time.textContent = clock.format(now);
        const part = zoneName.formatToParts(now).find(p => p.type === 'timeZoneName');
        zone.textContent = part ? ` (${part.value})` : '';
    };

    tick();
    time.closest('.local-time').hidden = false;
    setInterval(tick, 30000);
}

function initPortraits() {
    document.querySelectorAll('.portrait img').forEach(img => {
        const loaded = () => img.parentElement.classList.add('has-photo');
        const missing = () => img.classList.add('is-missing');
        img.addEventListener('load', loaded);
        img.addEventListener('error', missing);
        if (img.complete) (img.naturalWidth > 0 ? loaded : missing)();
    });
}

function initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.textContent = open ? 'Close' : 'Menu';
    });

    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.textContent = 'Menu';
        });
    });
}

function initCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const text = button.getAttribute('data-copy');
            try {
                await navigator.clipboard.writeText(text);
                showCopied(button);
            } catch (err) {
                fallbackCopy(text, button);
            }
        });
    });
}

function fallbackCopy(text, button) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    try {
        document.execCommand('copy');
        showCopied(button);
    } catch (err) {
        console.error('Copy failed:', err);
    }
    document.body.removeChild(area);
}

function showCopied(button) {
    const original = button.textContent;
    button.textContent = 'Copied';
    button.classList.add('copied');
    setTimeout(() => {
        button.textContent = original;
        button.classList.remove('copied');
    }, 1800);
}

function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) {
        items.forEach(item => item.classList.add('is-visible'));
        return;
    }

    const groups = new Map();
    items.forEach(item => {
        const parent = item.parentElement;
        const index = groups.get(parent) || 0;
        item.style.setProperty('--reveal-delay', `${Math.min(index, 5) * 90}ms`);
        groups.set(parent, index + 1);
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    items.forEach(item => observer.observe(item));
}

function initYear() {
    const year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());
}
