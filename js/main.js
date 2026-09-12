document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initCopyButtons();
    initReveal();
    initPortraits();
    initStamp();
    initCountUp();
    initLocalTime();
    initYear();
});

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
