# Team Section Design - Localhost Development DOO

**Date:** 2025-11-02
**Project:** Team section addition to landing page
**Feature:** Display team members with LinkedIn profile links

## Overview

Add a team section to the existing terminal-themed landing page, displaying 5 team members with their roles and LinkedIn profile links. The design maintains consistency with the established terminal aesthetic and command-line interaction patterns.

## Design Goals

1. **Primary:** Showcase team expertise and enable professional networking via LinkedIn
2. **Secondary:** Maintain visual and interaction consistency with existing page design
3. **Tertiary:** Keep the addition lightweight and accessible

## Team Members

1. **Vladimir Orelj** - System Architect / Domain Expert
   - LinkedIn: https://www.linkedin.com/in/vladimir-orelj-a57bb810b/

2. **Mladen Mladjenovic** - Full-Stack Engineer
   - LinkedIn: https://www.linkedin.com/in/mladen-mladjenovic-1b3b5846/

3. **Rade Spasojević** - Full-Stack Engineer
   - LinkedIn: https://www.linkedin.com/in/rade-spasojevic-bb63b6125/

4. **Miloš Galuška** - Full-Stack Engineer
   - LinkedIn: https://www.linkedin.com/in/milo%C5%A1-galu%C5%A1ka-5ab928214/

5. **Jovan Vulin** - Full-Stack Engineer
   - LinkedIn: https://www.linkedin.com/in/jovan-vulin-0463bb7a/

## Section Structure

### Placement
Insert between Company Info section (ending at index.html:72) and Contact section (starting at index.html:75).

### Command Flow
```
$ cat company-info.txt
[company details displayed]

$ team --list              ← NEW SECTION
Team members:
  --vladimir-orelj       System Architect / Domain Expert    [LinkedIn]
  --mladen-mladjenovic   Full-Stack Engineer                 [LinkedIn]
  --rade-spasojevic      Full-Stack Engineer                 [LinkedIn]
  --milos-galuska        Full-Stack Engineer                 [LinkedIn]
  --jovan-vulin          Full-Stack Engineer                 [LinkedIn]

$ contact --method
[contact options]
```

### HTML Structure
```html
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
            <!-- Repeat for 4 more members -->
        </ul>
        <p class="terminal-line">&nbsp;</p>
        <p class="terminal-line">$ contact --method</p>
    </div>
</section>
```

## Visual Design

### Color Scheme (Reusing Existing Palette)
- **Team flag (name):** `var(--text-primary)` - `#00d9ff` (cyan, bold)
- **Team role:** `var(--text-secondary)` - `#8f9ba8` (gray)
- **LinkedIn link:** `var(--accent-green)` - `#00ff00` (terminal green)
- **Hover background:** `rgba(0, 217, 255, 0.1)` (subtle cyan glow)

### CSS Classes

**New Classes:**
```css
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

**Pattern Consistency:**
- Mirrors `.service-list` and `.service-item` structure
- Same hover effect (background glow + padding shift)
- Same spacing and transition timing

## Responsive Behavior

### Mobile (< 768px)
```css
@media (max-width: 768px) {
    .team-flag {
        display: block;
        margin-bottom: 0.25rem;
    }

    .team-role {
        display: block;
        margin-bottom: 0.25rem;
    }

    .team-link {
        display: inline-block;
    }
}
```

- Name, role, and link stack vertically on small screens
- Full-width hover area maintained
- Readable text without horizontal scrolling

## Accessibility

### Semantic HTML
- `<ul>` with `<li>` for list semantics
- Proper heading hierarchy maintained
- `<a>` elements for all links

### Link Attributes
- `target="_blank"` - Opens LinkedIn in new tab
- `rel="noopener noreferrer"` - Security best practice (prevents tab hijacking)
- `aria-label` - Descriptive labels for screen readers

### Keyboard Navigation
- All links focusable via Tab key
- Focus states inherit from existing `.team-link:focus` styles
- Visual focus indicators (underline + color change)

### Color Contrast
- Team flag (cyan #00d9ff on dark #0a0e14): WCAG AAA compliant
- Team role (gray #8f9ba8 on dark #0a0e14): WCAG AA compliant
- LinkedIn link (green #00ff00 on dark #0a0e14): WCAG AAA compliant

## Implementation Details

### Files Modified
1. **index.html** - Add team section between lines 72-75
2. **css/style.css** - Add team-specific styles (~40 lines)
3. **js/main.js** - No changes required (static content, no interactions)

### No JavaScript Required
- Static content display
- No typewriter animation needed for consistency with services section
- Links use native browser behavior

### Performance Impact
- **HTML:** +15 lines (~800 bytes)
- **CSS:** +40 lines (~900 bytes)
- **Total:** < 2KB additional page weight
- **Render impact:** Minimal (reuses existing styles)

## Testing Checklist

- [ ] Visual consistency with services section
- [ ] All 5 LinkedIn links open correctly in new tabs
- [ ] Hover effects work on desktop
- [ ] Mobile layout stacks properly on narrow screens
- [ ] Keyboard navigation works (Tab through links)
- [ ] Screen reader announces links with context
- [ ] Focus indicators visible
- [ ] Links work with JavaScript disabled
- [ ] No horizontal scrolling on mobile devices

## Future Enhancements (Optional)

- Add team member photos/avatars (circular terminal-style borders)
- Include short bio or expertise tags
- Add GitHub profile links alongside LinkedIn
- Interactive "$ team --member <name>" command to show detailed profiles
- Team size indicator (e.g., "5 members loaded")

## Browser Support

Inherits from existing page:
- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile Safari iOS 12+
- Chrome Android (latest)

## Notes

- Design approved: Terminal list layout matching services section style
- No animation needed - keeps section lightweight and immediately readable
- LinkedIn links provide professional credibility and networking opportunities
- Maintains "show, don't tell" philosophy - expertise shown through roles
- External links use security best practices (noopener, noreferrer)
