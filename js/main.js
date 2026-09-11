document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initCopyButtons();
    initReveal();
    initPortraits();
    initYear();
});

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
