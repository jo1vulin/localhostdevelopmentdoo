# Brand Redesign: Localhost Development

**Date:** 2026-09-11
**Scope:** Full visual and copy rework of the landing page, replacing the terminal theme.
**Source:** Miloš's brand brief + `localhost-development-palettes.html` (palette A chosen).

## Positioning

"Family firm" as proof of continuity and reliability, not as a gimmick. The three pillars:

1. **Continuity**: the five of us worked together for years before the company existed. Experience, not founding date.
2. **Relationship, not transaction**: clients get people they know, not "resources" or tickets.
3. **Serious, not sterile**: rigorous work, human communication, no marketing jargon.

Warmth must always be paired with proof of competence (concrete work, results, numbers), or the firm reads as "nice but small".

## Tone

- Written like a conversation over coffee, not a PR department.
- Direct and concrete. "We solved X for a client with problem Y" beats abstractions.
- Confident without bragging: "We've done this long enough to know when something won't work, and we say so early."
- No emoji, no startup-casual, no "synergy / next-gen / disruptive".

## Palette: A. Paper & Bordeaux

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#EDE7DA` | page background |
| `--paper-dark` | `#E1D8C6` | surfaces (pillars band, team section) |
| `--sand` | `#CDBB9C` | rules and borders |
| `--graphite` | `#211F1C` | text, footer background |
| `--muted` | `#6A645B` | secondary text (4.7:1 on paper) |
| `--bordeaux` | `#6E2A28` | primary: buttons, kickers, contact band |
| `--pine` | `#2E463A` | secondary: pillar headings |
| `--copper` | `#A96F2B` | spice: the dot in the logo/seal only |

Rules: no tech blue, no purple, no gradients. Copper is never used for text and appears at most once per screen (the brand mark counts as the one).

## Typography

- **Display and prose:** Newsreader (Google Fonts, variable: optical size, weight, italic). Serif chosen for the "tradition, heritage" connotation; the italic carries pull quotes and the monogram.
- **UI and descriptions:** Source Sans 3 (humanist, not geometric).
- **Kickers and registry data:** JetBrains Mono, a small nod to the name "localhost", used sparingly.

## Logo

- **Wordmark:** `localhost` in Newsreader with a copper full stop, the mark Miloš picked from the palette file.
- **Seal (secondary mark):** circular stamp with "Localhost Development" on the upper arc, "Sombor · Serbia" on the lower arc, and an italic `lh.` monogram inside. Inline SVG in the hero and footer; the favicon is a simplified version.

## Page structure

1. Header: wordmark, five anchors (Who we are · How we work · Work · Team · Contact).
2. Hero: headline, lede, two CTAs, seal.
3. Pillars band: Continuity / People, not resources / Serious, not sterile.
4. Who we are: the story of working together before the company, pull quote "Years of experience, not years since founding."
5. How we work: four numbered principles, then the four services.
6. Work: client strip (Continental, NTT DATA) and three case studies.
7. Team: five portraits with names, roles, LinkedIn.
8. Contact: bordeaux band; email, phone, address, copy buttons.
9. Footer: seal, legal name, VAT, company ID, activity code.

## Work section: what is published and what is not

Sources: the 2026/2027 offer document (team experience figures), the Continental repositories, and the CasingDB modernisation deck.

Published: client logos (official vector artwork, inlined as single-colour SVG in graphite; the colour versions are deliberately not used), what each system does in business terms, the kind of work we did (frontend platform, database migration, backend upgrades, test suites, containerised deployment), generic technology names that our own offer already lists (Angular, Java, Spring Boot, Kubernetes), "6 to 8 years each" (from our offer), "since 2022" for the frontend platform, and the fact that two junior engineers we mentor delivered the casing work.

Deliberately left out: internal system names (CESAR, CESX, CasingDB), internal URLs and hostnames, names of client staff, daily rates, ticket numbers, codebase metrics from the audit (line counts, module counts), vendor names for the database, cloud and CI (Oracle, PostgreSQL, Azure, Jenkins, SAP), the state of any upgrade, the existence of a legacy UI, "in progress" status, the client's previous deployment practice, and any dates from the client's internal roadmap.

Before this goes live:

- Continental must agree to being named, to the two case descriptions, and to the use of its logo (trademark use; brand teams usually require sign-off). The same applies to the NTT DATA logo. Check the contract for a reference or publicity clause. If they decline, the fallback is "a German automotive supplier" with the same copy and no logo strip.
- NTT DATA: confirm what may be said. The current line is deliberately generic.
- The offer PDF and any other PDF in the repository root are ignored by `.gitignore` so they cannot be published by accident. Keep it that way.

## Motion

Scroll-triggered reveal via `IntersectionObserver` (native, no library): elements fade and rise 16px as they enter the viewport; siblings stagger by 90 ms. Disabled under `prefers-reduced-motion`. Without JavaScript everything is visible.

## Details for developers

- **Rubber stamp.** The hero seal runs through an SVG filter (fractal noise shaped into alpha for ink dropout, a displacement map for edge wobble). Press and hold it; on release it re-inks with a new seed and a new angle.
- **Signature.** On the first load of a session the seal draws itself: the rings sketch in, then the monogram is written in print order (l, h stem, h arch and leg, dot). The letters are the real serif glyphs, revealed through an SVG mask whose four strokes follow the letterforms (`pathLength` plus `stroke-dashoffset`, one path per stroke because Chrome restarts dashes at every subpath). The last frame is the monogram itself, so nothing shifts at the end. The decision to play it is made in the `<head>` script (before first paint) so the finished seal never flashes first. Pressing the seal replays it. Skipped under `prefers-reduced-motion` and on later loads in the same session.
- **Console banner.** Opening DevTools prints the wordmark in ASCII and a short note about how the site is built.
- **Themes.** Press `t` (or use the switch in the footer, or `theme <name>` in the terminal) to cycle Paper, Hearth and Cyber. Paper is the brand and the default; the other two are easter eggs. Hearth is palette F from the palette file (espresso, parchment, amber, wine contact band). Cyber is the deliberate rule-breaker: neon magenta and cyan, Chakra Petch loaded only when activated, scanlines, a perspective grid, clipped buttons, corner brackets, a glitch transition on entry. Every colour in the stylesheet is a token, so a theme is one block of variable overrides plus a few extras. The choice is remembered in `localStorage`, applied in the `<head>` script before first paint, and `?theme=cyber` in the URL selects one.
- **Battle City.** Type `battlecity` anywhere on the page (or run it in the terminal, or open `/#battlecity`). `js/battle.js` loads on demand and turns the current viewport into a Battle City map: every visible line of text becomes a row of bricks where it sits (text nodes measured with `Range.getClientRects`), buttons, portraits and logos become steel, the seal becomes a steel ring with bricks inside, and the base is a small stamp in a brick shelter at the bottom. Twenty enemies in four types, spawn stars, one shot on screen, bricks break two tiles wide, steel stops shots, three lives with a spawn shield, WebAudio sounds. Arrows or WASD, Space, P, M, R, Esc. Drawn in the active theme's colours. The `t` and backtick shortcuts are suspended while a round is on.
- **Hidden terminal.** The backtick key (or clicking the footer seal) slides a terminal up from the bottom: `help`, `team`, `services`, `contact`, `time`, `history`, `cd <section>`, `stamp`, `cat company-info.txt`, `ls`, `sudo`, `clear`, `exit`. Command history with the arrow keys, tab completion, Escape to close. A nod to the site's first version.

## Open items

- **Photos.** Portraits show initials until the five square headshots are dropped into `img/team/` with the names listed in the README; nothing else to edit. A team photo in "Who we are" would be the strongest addition after that.
- **Client sign-off.** See the Work section notes above: Continental and NTT DATA should agree to the naming, the descriptions, and the logos.
- **Serbian version.** Slogans must sound natural in both languages; a `/sr/` page or language toggle is the next step if Serbian clients are a target.
- **Social preview image.** No `og:image` yet; a 1200×630 PNG of the seal on paper is enough.
