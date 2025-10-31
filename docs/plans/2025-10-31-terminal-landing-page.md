# Terminal Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a retro terminal-themed single-page landing site for Localhost Development DOO optimized for lead generation and hosted on GitHub Pages.

**Architecture:** Single HTML file with separate CSS and JavaScript files. Pure vanilla JavaScript for typewriter animations and interactive contact section. Mobile-first responsive design with terminal aesthetic using monospace fonts and cyan-blue color scheme.

**Tech Stack:** HTML5, CSS3, Vanilla JavaScript, GitHub Pages

---

## Task 1: Project Structure Setup

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/main.js`
- Create: `CNAME`
- Create: `README.md`

**Step 1: Create directory structure**

Run: `mkdir -p css js`
Expected: Directories created

**Step 2: Create CNAME file for custom domain**

Create `CNAME` with content:
```
localhostdevelopmentdoo.com
```

**Step 3: Create README with project info**

Create `README.md`:
```markdown
# Localhost Development DOO - Landing Page

Company landing page for Localhost Development DOO Sombor.

## Deployment

Hosted on GitHub Pages at [localhostdevelopmentdoo.com](https://localhostdevelopmentdoo.com)

## Local Development

Open `index.html` in a browser or use a local server:
```bash
python -m http.server 8000
```

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
```

**Step 4: Commit initial structure**

```bash
git add CNAME README.md
git commit -m "chore: add project configuration files"
```

---

## Task 2: HTML Structure

**Files:**
- Create: `index.html`

**Step 1: Create base HTML structure with semantic markup**

Create `index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Localhost Development DOO - Software development company in Sombor, Serbia. Web development, mobile apps, consulting services.">
    <meta name="keywords" content="software development, web development, mobile apps, consulting, Sombor, Serbia">
    <title>Localhost Development DOO | Software Development in Sombor</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <main class="terminal">
        <!-- Hero Section -->
        <section id="hero" class="terminal-section">
            <div class="terminal-output">
                <p class="terminal-line" data-delay="0">localhost@development:~$ ./company.sh --info</p>
                <p class="terminal-line" data-delay="800">Initializing Localhost Development DOO...</p>
                <div class="progress-bar" data-delay="1600">
                    <div class="progress-fill"></div>
                </div>
                <p class="terminal-line" data-delay="3000">&nbsp;</p>
                <h1 class="terminal-line logo" data-delay="3200"><span class="prompt">&gt;_</span> LOCALHOST DEVELOPMENT DOO</h1>
                <p class="terminal-line tagline" data-delay="4000">Your Software Development Partner in Sombor, Serbia</p>
                <p class="terminal-line" data-delay="4800">&nbsp;</p>
                <p class="terminal-line" data-delay="5000">$ services --list</p>
            </div>
        </section>

        <!-- Services Section -->
        <section id="services" class="terminal-section">
            <div class="terminal-output">
                <p class="terminal-line">Available services:</p>
                <ul class="service-list">
                    <li class="service-item">
                        <span class="service-flag">--web-development</span>
                        <span class="service-desc">Modern web applications</span>
                    </li>
                    <li class="service-item">
                        <span class="service-flag">--mobile-apps</span>
                        <span class="service-desc">iOS &amp; Android solutions</span>
                    </li>
                    <li class="service-item">
                        <span class="service-flag">--consulting</span>
                        <span class="service-desc">Technical architecture &amp; guidance</span>
                    </li>
                    <li class="service-item">
                        <span class="service-flag">--maintenance</span>
                        <span class="service-desc">Ongoing support &amp; updates</span>
                    </li>
                </ul>
                <p class="terminal-line">&nbsp;</p>
                <p class="terminal-line">$ cat company-info.txt</p>
            </div>
        </section>

        <!-- Company Info Section -->
        <section id="company-info" class="terminal-section">
            <div class="terminal-output">
                <pre class="info-block">
COMPANY DETAILS
---------------
Name:          Localhost Development DOO Sombor
VAT:           111936819
ID:            21576930
Activity:      6201 - Software Development
Address:       Ratarska BB, 25000 Sombor, Serbia
                </pre>
                <p class="terminal-line">&nbsp;</p>
                <p class="terminal-line">$ contact --method</p>
            </div>
        </section>

        <!-- Contact Section -->
        <section id="contact" class="terminal-section">
            <div class="terminal-output">
                <p class="terminal-line">Available contact methods:</p>
                <div class="contact-options">
                    <button class="contact-btn" data-method="email">
                        <span class="contact-flag">--email</span>
                    </button>
                    <button class="contact-btn" data-method="phone">
                        <span class="contact-flag">--phone</span>
                    </button>
                </div>
                <div class="contact-details">
                    <div id="email-detail" class="contact-detail" style="display: none;">
                        <p class="terminal-line">
                            <span class="prompt">&gt;</span> Email:
                            <a href="mailto:jo1vulin@gmail.com" class="contact-link">jo1vulin@gmail.com</a>
                            <button class="copy-btn" data-copy="jo1vulin@gmail.com" aria-label="Copy email">
                                [copy]
                            </button>
                        </p>
                    </div>
                    <div id="phone-detail" class="contact-detail" style="display: none;">
                        <p class="terminal-line">
                            <span class="prompt">&gt;</span> Phone:
                            <a href="tel:+381664505099" class="contact-link">+381 66 450 599</a>
                            <button class="copy-btn" data-copy="+381664505099" aria-label="Copy phone">
                                [copy]
                            </button>
                        </p>
                    </div>
                </div>
                <p class="terminal-line cursor-line">
                    <span class="prompt">&gt;_</span><span class="cursor">█</span>
                </p>
            </div>
        </section>
    </main>

    <script src="js/main.js"></script>
</body>
</html>
```

**Step 2: Verify HTML structure**

Run: Open `index.html` in a browser
Expected: Page loads with unstyled content visible

**Step 3: Commit HTML structure**

```bash
git add index.html
git commit -m "feat: add HTML structure for landing page"
```

---

## Task 3: Core CSS Styling

**Files:**
- Create: `css/style.css`

**Step 1: Add CSS reset and custom properties**

Create `css/style.css`:
```css
/* CSS Reset and Custom Properties */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --bg-primary: #0a0e14;
    --text-primary: #00d9ff;
    --text-secondary: #8f9ba8;
    --accent-green: #00ff00;
    --accent-red: #ff6b6b;
    --font-mono: 'Fira Code', 'JetBrains Mono', 'IBM Plex Mono', 'Courier New', monospace;
    --transition-speed: 0.3s;
}

body {
    font-family: var(--font-mono);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
    font-size: 16px;
    overflow-x: hidden;
}

/* Terminal Container */
.terminal {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
    min-height: 100vh;
}

.terminal-section {
    margin-bottom: 3rem;
}

.terminal-output {
    padding: 1rem;
}

.terminal-line {
    margin: 0.5rem 0;
    color: var(--text-secondary);
    opacity: 0;
    animation: fadeIn 0.3s forwards;
}

@keyframes fadeIn {
    to {
        opacity: 1;
    }
}

/* Prompt and Logo */
.prompt {
    color: var(--text-primary);
    font-weight: bold;
}

.logo {
    font-size: 1.5rem;
    color: var(--text-primary);
    margin: 1rem 0;
    font-weight: bold;
}

.tagline {
    color: var(--text-secondary);
    font-size: 0.9rem;
}

/* Progress Bar */
.progress-bar {
    width: 100%;
    max-width: 400px;
    height: 20px;
    border: 1px solid var(--text-primary);
    margin: 1rem 0;
    position: relative;
    opacity: 0;
}

.progress-fill {
    height: 100%;
    width: 0;
    background-color: var(--text-primary);
    animation: fillProgress 1s ease-out forwards;
}

@keyframes fillProgress {
    to {
        width: 100%;
    }
}

/* Services List */
.service-list {
    list-style: none;
    margin: 1rem 0;
}

.service-item {
    margin: 0.75rem 0;
    padding: 0.5rem;
    transition: all var(--transition-speed);
    cursor: default;
}

.service-item:hover {
    background-color: rgba(0, 217, 255, 0.1);
    padding-left: 1rem;
}

.service-flag {
    color: var(--text-primary);
    font-weight: bold;
    margin-right: 1rem;
}

.service-desc {
    color: var(--text-secondary);
}

/* Company Info */
.info-block {
    background-color: rgba(0, 217, 255, 0.05);
    padding: 1.5rem;
    border-left: 3px solid var(--text-primary);
    color: var(--text-secondary);
    margin: 1rem 0;
    overflow-x: auto;
    font-family: var(--font-mono);
    font-size: 0.9rem;
}

/* Contact Section */
.contact-options {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin: 1rem 0;
}

.contact-btn {
    background: transparent;
    border: 2px solid var(--text-primary);
    color: var(--text-primary);
    padding: 0.75rem 1.5rem;
    font-family: var(--font-mono);
    font-size: 1rem;
    cursor: pointer;
    transition: all var(--transition-speed);
}

.contact-btn:hover,
.contact-btn:focus {
    background-color: var(--text-primary);
    color: var(--bg-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 217, 255, 0.3);
}

.contact-btn:active {
    transform: translateY(0);
}

.contact-flag {
    font-weight: bold;
}

.contact-details {
    margin: 1.5rem 0;
}

.contact-detail {
    margin: 1rem 0;
}

.contact-link {
    color: var(--accent-green);
    text-decoration: none;
    transition: color var(--transition-speed);
}

.contact-link:hover {
    color: var(--text-primary);
    text-decoration: underline;
}

.copy-btn {
    background: transparent;
    border: 1px solid var(--text-secondary);
    color: var(--text-secondary);
    padding: 0.25rem 0.5rem;
    margin-left: 0.5rem;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all var(--transition-speed);
}

.copy-btn:hover {
    border-color: var(--accent-green);
    color: var(--accent-green);
}

.copy-btn.copied {
    border-color: var(--accent-green);
    color: var(--accent-green);
}

/* Cursor Animation */
.cursor-line {
    margin-top: 2rem;
}

.cursor {
    display: inline-block;
    background-color: var(--text-primary);
    animation: blink 1s step-end infinite;
}

@keyframes blink {
    0%, 50% {
        opacity: 1;
    }
    51%, 100% {
        opacity: 0;
    }
}

/* Responsive Design */
@media (max-width: 768px) {
    .terminal {
        padding: 1rem 0.5rem;
    }

    .logo {
        font-size: 1.2rem;
    }

    .service-flag {
        display: block;
        margin-bottom: 0.25rem;
    }

    .info-block {
        font-size: 0.75rem;
        padding: 1rem;
    }

    .contact-btn {
        width: 100%;
    }
}

@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

**Step 2: Test responsive styling**

Run: Open `index.html` and resize browser window
Expected: Layout adapts smoothly, readable on mobile viewport

**Step 3: Commit CSS styling**

```bash
git add css/style.css
git commit -m "feat: add terminal-themed CSS styling"
```

---

## Task 4: JavaScript Interactions

**Files:**
- Create: `js/main.js`

**Step 1: Add typewriter effect and contact interactions**

Create `js/main.js`:
```javascript
// Typewriter effect for terminal lines
document.addEventListener('DOMContentLoaded', () => {
    initTypewriter();
    initContactButtons();
    initCopyButtons();
});

// Typewriter animation
function initTypewriter() {
    const lines = document.querySelectorAll('.terminal-line, .progress-bar');

    lines.forEach((line, index) => {
        const delay = parseInt(line.getAttribute('data-delay')) || index * 300;

        setTimeout(() => {
            if (line.classList.contains('progress-bar')) {
                line.style.opacity = '1';
            } else {
                line.style.opacity = '1';
            }
        }, delay);
    });
}

// Contact button interactions
function initContactButtons() {
    const contactButtons = document.querySelectorAll('.contact-btn');

    contactButtons.forEach(button => {
        button.addEventListener('click', () => {
            const method = button.getAttribute('data-method');
            toggleContactDetail(method);
        });
    });
}

function toggleContactDetail(method) {
    const detailId = `${method}-detail`;
    const detail = document.getElementById(detailId);

    if (!detail) return;

    // Hide all other details
    document.querySelectorAll('.contact-detail').forEach(d => {
        if (d.id !== detailId) {
            d.style.display = 'none';
        }
    });

    // Toggle current detail
    if (detail.style.display === 'none') {
        detail.style.display = 'block';
        detail.style.animation = 'fadeIn 0.3s forwards';
    } else {
        detail.style.display = 'none';
    }
}

// Copy to clipboard functionality
function initCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-btn');

    copyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const textToCopy = button.getAttribute('data-copy');
            copyToClipboard(textToCopy, button);
        });
    });
}

async function copyToClipboard(text, button) {
    try {
        await navigator.clipboard.writeText(text);
        showCopyFeedback(button);
    } catch (err) {
        // Fallback for older browsers
        fallbackCopyToClipboard(text, button);
    }
}

function fallbackCopyToClipboard(text, button) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        showCopyFeedback(button);
    } catch (err) {
        console.error('Failed to copy:', err);
    }

    document.body.removeChild(textArea);
}

function showCopyFeedback(button) {
    const originalText = button.textContent;
    button.textContent = '[copied!]';
    button.classList.add('copied');

    setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('copied');
    }, 2000);
}
```

**Step 2: Test JavaScript functionality**

Run: Open `index.html` in browser
Expected:
- Lines fade in with delays
- Progress bar animates
- Contact buttons toggle details
- Copy buttons copy text and show feedback

**Step 3: Commit JavaScript**

```bash
git add js/main.js
git commit -m "feat: add typewriter and contact interactions"
```

---

## Task 5: Testing and Validation

**Files:**
- Modify: All files for final polish

**Step 1: Test on multiple browsers**

Run: Open in Chrome, Firefox, Safari (if available)
Expected: Consistent appearance and functionality across browsers

**Step 2: Test mobile responsiveness**

Run: Open DevTools, test various mobile viewports (320px, 375px, 768px)
Expected:
- Readable text at all sizes
- Touch-friendly buttons
- No horizontal scroll
- Layout adapts properly

**Step 3: Test accessibility**

Run: Check with keyboard navigation (Tab, Enter, Escape)
Expected:
- All interactive elements reachable
- Visual focus indicators
- Copy buttons work with keyboard

**Step 4: Validate HTML and CSS**

Run: Use W3C validators or built-in browser tools
Expected: No critical errors

**Step 5: Test clipboard functionality**

Run: Click copy buttons and paste elsewhere
Expected: Correct text copied to clipboard

---

## Task 6: GitHub Pages Deployment

**Files:**
- Verify: All project files ready

**Step 1: Verify CNAME file exists**

Run: `cat CNAME`
Expected: Contains `localhostdevelopmentdoo.com`

**Step 2: Create GitHub repository**

Run:
```bash
git branch -M main
# Then create repo on GitHub and add remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

**Step 3: Push to GitHub**

```bash
git push -u origin main
```

**Step 4: Enable GitHub Pages**

Actions:
1. Go to repository Settings
2. Navigate to Pages section
3. Set source to "Deploy from branch: main, root"
4. Add custom domain: `localhostdevelopmentdoo.com`
5. Enable "Enforce HTTPS"

**Step 5: Configure DNS**

At your domain registrar, add these DNS records:
- A record: `185.199.108.153`
- A record: `185.199.109.153`
- A record: `185.199.110.153`
- A record: `185.199.111.153`

Or alternatively:
- CNAME record: `YOUR_USERNAME.github.io`

**Step 6: Verify deployment**

Run: Wait 5-10 minutes, then visit `https://localhostdevelopmentdoo.com`
Expected: Landing page loads successfully with HTTPS

**Step 7: Final commit**

```bash
git add .
git commit -m "chore: prepare for production deployment"
git push
```

---

## Testing Checklist

- [ ] Page loads without errors in console
- [ ] Typewriter animation plays smoothly
- [ ] Progress bar fills completely
- [ ] Service items highlight on hover
- [ ] Contact buttons toggle details correctly
- [ ] Copy buttons copy correct text
- [ ] Copy feedback shows and disappears
- [ ] Links open correctly (email, phone)
- [ ] Cursor blinks continuously
- [ ] Responsive on mobile (320px - 768px)
- [ ] Responsive on tablet (768px - 1024px)
- [ ] Responsive on desktop (1024px+)
- [ ] Keyboard navigation works
- [ ] Reduced motion respected
- [ ] HTML validates without errors
- [ ] CSS validates without errors
- [ ] HTTPS enabled on custom domain
- [ ] Page loads under 2 seconds

---

## Post-Deployment Tasks

**Optional enhancements:**
- Add favicon (16x16 and 32x32 terminal icon)
- Add Open Graph meta tags for social sharing
- Add Google Analytics or privacy-friendly alternative
- Add robots.txt and sitemap.xml for SEO
- Implement contact form with backend (Formspree, etc.)

---

## Notes

- Keep animations subtle to avoid overwhelming visitors
- Test on actual mobile devices, not just DevTools
- Monitor GitHub Pages build status after each push
- DNS propagation can take 24-48 hours
- Consider adding prefers-color-scheme for light mode option
- All JavaScript uses progressive enhancement - page works without JS
