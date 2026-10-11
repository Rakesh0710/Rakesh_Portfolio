# Portfolio · Rakesh Reddy Yeduru

Frontend Engineer · Website Operations Manager
Live at **https://rakesh0710.github.io/Rakesh_Portfolio/**

Plain HTML, CSS and JavaScript. No framework, no build step, no npm. Open a file, edit it,
push it.

---

## 1. Run it

Double-click `index.html`. Everything works from the file system except the "Live app" tab in the
NFL demo, which embeds a remote site.

## 2. Files

```
index.html                 home page
work/
  nfl-season-hub.html      case study · personal product
  cnr-car-zone.html        case study · product (pinned phone walkthrough)
  unity.html               case study · enterprise, team build
  university-of-dayton.html case study · enterprise, team build
styles.css                 one stylesheet for every page
script.js                  one script for every page; each module no-ops if its markup is absent
assets/work/*.webp         real screenshots of the live pages, 1280px plus a 640px copy
og.png                     1200×630 link-preview card
sitemap.xml, robots.txt    search
404.html                   GitHub Pages serves this for any missing URL (absolute paths only)
```

## 3. Home page order

1. **Hero:** name, headline, both titles, the code window with the release pipeline, seasonal particles
2. **01 Experience:** timeline, with every role's full responsibilities behind "All responsibilities"
3. **02 Selected work:** NFL Season Hub (with the live replay demo), CNR Car Zone (phone with screen tabs), Unity and University of Dayton (real screenshots)
4. **03 Expertise:** the BUILD / EXPERIENCE / OPERATE explorer, then the full 80-tool stack in a disclosure
5. **04 Impact:** six figures, each with its source, plus what has been owned in production
6. **05 About**
7. **06 Contact**

Every case study follows the same eight sections: Overview, Responsibilities, Challenge, Process,
Engineering, Showcase, Outcome, Lessons. The two team builds (Unity, University of Dayton) leave
Lessons out on purpose; see §8.

## 4. Design system

All values are tokens at the top of `styles.css`.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#0c111b` | page |
| `--surface` / `--surface-2` | `#141d2b` / `#1b2638` | cards |
| `--text` | `#f5f7fa` | headings, body emphasis |
| `--text-2` | `#a3b4c9` | body copy |
| `--text-3` | `#8597ae` | labels, captions |
| `--accent` | `#77c8ff` | links, buttons, active states |
| `--paper` | `#e8e9e6` | the Impact section only |

Type: **Space Grotesk** for headings, **Inter** for text, **JetBrains Mono** for labels and code.

Motion uses only `transform` and `opacity`, never scroll-jacks, and is switched off under
`prefers-reduced-motion`. With JavaScript off, every section is still fully visible.

## 5. ⚠️ Rules that will break the page if you ignore them

### Never style a bare tag inside a component

`.cap span { … }` also matches `<span class="cap__i">`, and its `display:block` beat the icon box's
`display:grid`, so every icon slid into a corner. `.ecard p` did the same to the small project label.
Give the element its own class (`.cap__t span`, `.ecard__desc`) instead. This is the same family of
bug that once printed the hero name one letter per line.

To check, open the page, paste this into the console, and investigate anything it lists:

```js
[...document.styleSheets[0].cssRules].flatMap(r => r.selectorText ? r.selectorText.split(",") : [])
  .map(s => s.trim()).filter(s => /\s(span|b|i|div|a|p|li|em|img)$/.test(s))
  .map(s => [s, [...document.querySelectorAll(s)].filter(e => e.className).map(e => e.className)])
  .filter(([, c]) => c.length)
```

### Mobile grid columns are `minmax(0,1fr)`, never `1fr`

A bare `1fr` column cannot shrink below its widest child, so one code block or demo window widened
the whole page past the screen at 320–430px. Every layout grid uses `minmax(0,1fr)`.

### Text colour tokens sit at a measured contrast floor

`--text-3` is 5.0:1 on the lightest dark surface and `--ink-2` is 6.2:1 on `--paper`. Do not lighten
or darken them without re-measuring, and do not put small text on a translucent surface without
checking the colour it actually composites to.

### The 960px breakpoint must match in both files

On the CNR case study, `canPin()` in `script.js` and the `@media (max-width:960px)` block for
`.showcase` in `styles.css` decide together whether the phone walkthrough pins. Change one, change both.

### Don't round icon path coordinates

The brand icons in the inline sprite are full-precision Simple Icons paths. Rounding them to one
decimal destroyed seven logos.

### The code window must fit its column

The longest code line is about 45 characters. Under 1180px and under 360px the window tightens its
font and padding so nothing scrolls sideways. If you lengthen a line, check 1024px and 320px.

## 6. Common edits

**Text.** Search for it in `index.html` or the relevant `work/*.html` and change it.

**Navigation and footer on case studies.** They are repeated in each of the four `work/*.html`
files. Edit all four.

**Add a project to the Explorer.** Each pillar's panel has a "Where it shows up" list of two links
with a 640×400 thumbnail. Copy one.

**Preview a season or time of day.** Add `?season=oct`, `nov`, `dec` or `none`, and/or
`?tod=dawn`, `day`, `dusk` or `night` to the URL.

**Add the real CNR Car Zone screenshots.** Save four phone screenshots as
`cnr/1-dashboard.png`, `cnr/2-opportunity.png`, `cnr/3-documents.png` and `cnr/4-exports.png`, then
add `data-ready` to the `<div class="cnrshots" data-shots hidden>` element in `index.html` and in
`work/cnr-car-zone.html`. Blur or replace registration plates, seller names, phone numbers and bank
details first: this is a public page. Without `data-ready` the site never requests the files, so
there is no 404 in the console.

**Refresh the screenshots.** The images in `assets/work/` were captured from the live sites in
October 2026. Keep the same file names and 1280×800 / 640×400 sizes.

## 7. Put it online

Commit and push from GitHub Desktop. GitHub Pages rebuilds in about a minute, but browsers may keep
the old files for up to ten minutes (`cache-control: max-age=600`). Use **Cmd+Option+R** to see
changes immediately.

If the repository is ever renamed, update the absolute URLs in every page's `<head>` (canonical,
`og:url`, `og:image`, JSON-LD), in `sitemap.xml`, in `robots.txt`, and the `/Rakesh_Portfolio/`
paths in `404.html`.

## 8. What is deliberately not here

- **No invented numbers.** Every figure traces to the résumé, the NFL Season Hub README, or a
  measured build. Unity and University of Dayton traffic figures are not public, so they are not shown.
- **No Lessons section on the team builds.** Those would be guesses at Rakesh's own reflections,
  so Rakesh should write them.
- **No live link to CNR Car Zone.** The app sits behind a login and holds a real business's private
  data, so a link would only reach a sign-in page.
- **No résumé download, no photography.**
