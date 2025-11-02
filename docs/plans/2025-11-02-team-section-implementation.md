# Team Section Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a team section to the landing page displaying 5 team members with roles and LinkedIn profile links.

**Architecture:** Insert a new terminal-themed section between Company Info and Contact sections. Reuse existing CSS patterns from services list for consistency. No JavaScript required (static content).

**Tech Stack:** HTML5, CSS3 (vanilla, no frameworks)

---

## Task 1: Add Team Section HTML

**Files:**
- Modify: `index.html:72-75` (insert between Company Info and Contact sections)

**Step 1: Read current index.html to verify insertion point**

Run: Open `index.html` and locate line 72 (end of Company Info) and line 75 (start of Contact)

Expected: Find the transition between these sections

**Step 2: Insert team section HTML**

Insert the following HTML between line 72 and line 75:

```html
        <!-- Team Section -->
        <section id="team" class="terminal-section">
            <div class="terminal-output">
                <p class="terminal-line">$ team --list</p>
                <p class="terminal-line">Team members:</p>
                <ul class="team-list">
                    <li class="team-item">
                        <span class="team-flag">--vladimir-orelj</span>
                        <span class="team-role">System Architect / Domain Expert</span>
                        <a href="https://www.linkedin.com/in/vladimir-orelj-a57bb810b/"
                           class="team-link"
                           target="_blank"
                           rel="noopener noreferrer"
                           aria-label="Vladimir Orelj's LinkedIn profile">[LinkedIn]</a>
                    </li>
                    <li class="team-item">
                        <span class="team-flag">--mladen-mladjenovic</span>
                        <span class="team-role">Full-Stack Engineer</span>
                        <a href="https://www.linkedin.com/in/mladen-mladjenovic-1b3b5846/"
                           class="team-link"
                           target="_blank"
                           rel="noopener noreferrer"
                           aria-label="Mladen Mladjenovic's LinkedIn profile">[LinkedIn]</a>
                    </li>
                    <li class="team-item">
                        <span class="team-flag">--rade-spasojevic</span>
                        <span class="team-role">Full-Stack Engineer</span>
                        <a href="https://www.linkedin.com/in/rade-spasojevic-bb63b6125/"
                           class="team-link"
                           target="_blank"
                           rel="noopener noreferrer"
                           aria-label="Rade Spasojević's LinkedIn profile">[LinkedIn]</a>
                    </li>
                    <li class="team-item">
                        <span class="team-flag">--milos-galuska</span>
                        <span class="team-role">Full-Stack Engineer</span>
                        <a href="https://www.linkedin.com/in/milo%C5%A1-galu%C5%A1ka-5ab928214/"
                           class="team-link"
                           target="_blank"
                           rel="noopener noreferrer"
                           aria-label="Miloš Galuška's LinkedIn profile">[LinkedIn]</a>
                    </li>
                    <li class="team-item">
                        <span class="team-flag">--jovan-vulin</span>
                        <span class="team-role">Full-Stack Engineer</span>
                        <a href="https://www.linkedin.com/in/jovan-vulin-0463bb7a/"
                           class="team-link"
                           target="_blank"
                           rel="noopener noreferrer"
                           aria-label="Jovan Vulin's LinkedIn profile">[LinkedIn]</a>
                    </li>
                </ul>
                <p class="terminal-line">&nbsp;</p>
                <p class="terminal-line">$ contact --method</p>
            </div>
        </section>

```

**Step 3: Verify HTML structure**

Run: Open `index.html` in browser or use HTML validator

Expected: No syntax errors, page renders correctly

**Step 4: Commit HTML changes**

Run:
```bash
git add index.html
git commit -m "feat: add team section HTML structure

Add team section between company info and contact with:
- 5 team members with roles
- LinkedIn profile links
- Terminal list styling structure
- Accessibility attributes (aria-label, rel=noopener)"
```

Expected: Commit succeeds

---

## Task 2: Add Team Section CSS Styles

**Files:**
- Modify: `css/style.css:137` (insert after Company Info styles, before Contact Section)

**Step 1: Read current style.css to verify insertion point**

Run: Open `css/style.css` and locate line 137 (after `.info-block` styles)

Expected: Find the comment `/* Contact Section */` around line 138

**Step 2: Insert team section CSS**

Insert the following CSS after the Company Info section (after line 136) and before the Contact Section comment:

```css
/* Team Section */
.team-list {
    list-style: none;
    margin: 1rem 0;
}

.team-item {
    margin: 0.75rem 0;
    padding: 0.5rem;
    transition: all var(--transition-speed);
    cursor: default;
}

.team-item:hover {
    background-color: rgba(0, 217, 255, 0.1);
    padding-left: 1rem;
}

.team-flag {
    color: var(--text-primary);
    font-weight: bold;
    margin-right: 1rem;
}

.team-role {
    color: var(--text-secondary);
    margin-right: 1rem;
}

.team-link {
    color: var(--accent-green);
    text-decoration: none;
    transition: color var(--transition-speed);
    font-size: 0.9rem;
}

.team-link:hover,
.team-link:focus {
    color: var(--text-primary);
    text-decoration: underline;
}

```

**Step 3: Add responsive styles for mobile**

Locate the mobile media query section (around line 237) and add team-specific mobile styles inside the `@media (max-width: 768px)` block:

```css
    .team-flag {
        display: block;
        margin-bottom: 0.25rem;
    }

    .team-role {
        display: block;
        margin-bottom: 0.25rem;
    }
```

**Step 4: Verify styles in browser**

Run: Open `index.html` in browser and check:
- Team section appears between company info and contact
- Hover effects work on team items (cyan glow, padding shift)
- LinkedIn links are green and turn cyan on hover
- Mobile view (resize to < 768px) stacks flag, role, and link

Expected: All visual styles match design specification

**Step 5: Commit CSS changes**

Run:
```bash
git add css/style.css
git commit -m "feat: add team section CSS styles

Add styles for team section including:
- List layout matching services section
- Hover effects (background glow, padding shift)
- Link colors (green with cyan hover)
- Responsive mobile layout (stacked elements)"
```

Expected: Commit succeeds

---

## Task 3: Visual Testing & Verification

**Files:**
- View: `index.html` (in browser)

**Step 1: Test desktop layout**

Run: Open `index.html` in browser at full width (> 768px)

Verify:
- [ ] Team section appears between Company Info and Contact
- [ ] All 5 team members are displayed
- [ ] Names (flags) are cyan and bold
- [ ] Roles are gray
- [ ] LinkedIn links are green
- [ ] Hover on team item shows cyan background glow and padding shift
- [ ] Hover on LinkedIn link changes to cyan and underlines
- [ ] Terminal command `$ team --list` appears above team members
- [ ] Spacing matches services section

Expected: All items checked

**Step 2: Test mobile layout**

Run: Resize browser to < 768px or use browser dev tools mobile view

Verify:
- [ ] Team flags stack above roles
- [ ] Roles stack above LinkedIn links
- [ ] No horizontal scrolling
- [ ] All text is readable
- [ ] Hover/tap effects still work
- [ ] Full-width tap target for each team item

Expected: All items checked

**Step 3: Test accessibility**

Run: Use keyboard navigation (Tab key)

Verify:
- [ ] Can tab through all 5 LinkedIn links
- [ ] Focus indicators are visible (underline + color change)
- [ ] Links can be activated with Enter key
- [ ] Links open in new tab
- [ ] Screen reader announces links with context (test with browser reader if available)

Expected: All items checked

**Step 4: Test all LinkedIn links**

Run: Click each LinkedIn link

Verify:
- [ ] Vladimir Orelj's link opens correct profile
- [ ] Mladen Mladjenovic's link opens correct profile
- [ ] Rade Spasojević's link opens correct profile
- [ ] Miloš Galuška's link opens correct profile
- [ ] Jovan Vulin's link opens correct profile
- [ ] All links open in new tab
- [ ] Original page remains open

Expected: All 5 profiles open correctly

**Step 5: Cross-browser testing (if available)**

Test in: Chrome, Firefox, Safari, or Edge

Verify:
- [ ] Layout renders consistently
- [ ] Hover effects work
- [ ] Links function properly
- [ ] No console errors

Expected: Consistent behavior across browsers

---

## Task 4: Final Review & Documentation

**Files:**
- Review: All modified files

**Step 1: Review code quality**

Check:
- [ ] HTML is semantic and accessible
- [ ] CSS follows existing naming conventions
- [ ] No hardcoded colors (uses CSS variables)
- [ ] Consistent spacing and indentation
- [ ] All links have proper security attributes (rel="noopener noreferrer")
- [ ] YAGNI: No unnecessary code added
- [ ] DRY: Reuses existing patterns where possible

Expected: All quality checks pass

**Step 2: Verify git status**

Run:
```bash
git status
```

Expected: Working tree clean (all changes committed)

**Step 3: Review commit history**

Run:
```bash
git log --oneline -5
```

Expected: See commits for HTML and CSS changes with clear messages

**Step 4: Create summary of changes**

Document:
- Files modified: `index.html`, `css/style.css`
- Lines added: ~60 HTML, ~50 CSS
- Features added: Team section with 5 members and LinkedIn links
- Visual testing: Completed on desktop and mobile
- Accessibility: Keyboard navigation and screen reader support verified

**Step 5: Ready for merge**

Status: Feature complete and tested
Next steps: Use @superpowers:finishing-a-development-branch to decide on merge strategy

---

## Additional Notes

**Design Decisions:**
- No JavaScript required (static content, no interactions)
- Reuses existing CSS patterns for consistency
- Terminal list layout matches services section
- LinkedIn links provide professional credibility

**Security:**
- All external links use `rel="noopener noreferrer"` to prevent tab hijacking
- Links open in new tabs to keep original page accessible

**Performance Impact:**
- HTML: +60 lines (~1KB gzipped)
- CSS: +50 lines (~800 bytes gzipped)
- Total page weight increase: < 2KB
- No render-blocking resources added
- No JavaScript added

**Future Enhancements (Not Implemented - YAGNI):**
- Team member photos/avatars
- Detailed bio sections
- GitHub profile links
- Interactive member profiles
