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

Published: client names as text (no logos), what each system does in business terms, the kind of work we did (frontend platform, database migration, backend upgrades, test suites, containerised deployment), generic technology names that our own offer already lists (Angular, Java, Spring Boot, Kubernetes), "6 to 8 years each" (from our offer), "since 2022" for the frontend platform, and the fact that two junior engineers we mentor delivered the casing work.

Deliberately left out: internal system names (CESAR, CESX, CasingDB), internal URLs and hostnames, names of client staff, daily rates, ticket numbers, codebase metrics from the audit (line counts, module counts), vendor names for the database, cloud and CI (Oracle, PostgreSQL, Azure, Jenkins, SAP), the state of any upgrade, the existence of a legacy UI, "in progress" status, the client's previous deployment practice, and any dates from the client's internal roadmap.

Before this goes live:

- Continental must agree to being named, and to the two case descriptions. Check the contract for a reference or publicity clause. If they decline, the fallback is "a German automotive supplier" with the same copy and no logo strip.
- NTT DATA: confirm what may be said. The current line is deliberately generic.
- The offer PDF and any other PDF in the repository root are ignored by `.gitignore` so they cannot be published by accident. Keep it that way.

## Motion

Scroll-triggered reveal via `IntersectionObserver` (native, no library): elements fade and rise 16px as they enter the viewport; siblings stagger by 90 ms. Disabled under `prefers-reduced-motion`. Without JavaScript everything is visible.

## Open items

- **Photos.** The brief calls for real photographs of the team and office instead of stock or illustration. Portraits are currently monogram placeholders: replace the `<span>` inside each `.portrait` with an `<img>` (4:5 ratio, `object-fit: cover` is already set). A team photo in "Who we are" is the strongest addition.
- **Proof of competence.** A "Work" section with two or three concrete case studies (problem, what we did, result) is missing and is what balances the warmth. Needs real material.
- **Numbers.** "Years working together" is deliberately unquantified in the copy; add the real figure once agreed.
- **Serbian version.** Slogans must sound natural in both languages; a `/sr/` page or language toggle is the next step if Serbian clients are a target.
- **Social preview image.** No `og:image` yet; a 1200×630 PNG of the seal on paper is enough.
- **Phone number.** The visible number (`+381 66 450 599`) and the `tel:` link (`+381664505099`) differ by one digit; carried over from the previous site, needs confirming.
