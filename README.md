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
- Vanilla JavaScript (no libraries, no build step)
- Fonts from Google Fonts: Newsreader, Source Sans 3, JetBrains Mono

## Brand

Palette, typography, logo and tone are documented in `docs/plans/2026-09-11-brand-redesign.md`. The palette options that led to it are in `docs/localhost-development-palettes.html`.

## Themes

Press `t` on the page to cycle Paper (default), Hearth and Cyber, or open `?theme=cyber`. Paper is the brand; the other two are easter eggs and never the default.

## Easter eggs

Backtick opens a terminal (type `help`). Typing `battlecity` turns the page into a Battle City map for one round against 20 tanks; Esc brings the site back.

The scoreboard is shared worldwide through a small Cloudflare Worker; see `scoreboard/README.md` for how it is deployed and how to wipe it.

## Adding team photos

Drop one JPEG per person into `img/team/`, named exactly:

```
img/team/vladimir-orelj.jpg
img/team/mladen-mladjenovic.jpg
img/team/rade-spasojevic.jpg
img/team/milos-galuska.jpg
img/team/jovan-vulin.jpg
```

Nothing else to edit. A square headshot (LinkedIn export, 400px or larger) works: the card is square, so nothing is cropped, and it is rendered in monochrome so the five photos read as one set. While a file is missing, the card shows the person's initials instead.
