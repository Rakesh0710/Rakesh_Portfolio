# Portfolio — Rakesh Reddy Yeduru

A single-page portfolio, designed in the spirit of apple.com. No build step, no npm, no framework.
Three files, open and edit.

Positioned as a **frontend engineer** first, with website operations as the second track.
Each role in the Experience section leads with a frontend title, with the résumé title beneath.

---

## 1. Run it

Put `index.html`, `styles.css` and `script.js` in one folder, flat — no subfolders.

**Quick:** double-click `index.html`.

**Better:** in VS Code install **Live Server** (Ritwick Dey), right-click `index.html` → **Open with
Live Server**. Every Cmd+S refreshes the browser.

> Fonts load from Google Fonts, so the first load needs internet. Without it the page still works,
> falling back to your Mac's San Francisco.

---

## 2. What each file does

| File | What's in it |
|---|---|
| `index.html` | All content — headline, live work, experience bullets, project, skills, contact. |
| `styles.css` | The look — design tokens, layout, every CSS animation. |
| `script.js` | The behaviour — scroll scrubbing, the pinned showcase, reveals, counters, tilt. |

---

## 3. Page order

1. **Hero** — name kicker, the "I build web platforms / and keep them running" headline, dual role line, live-work chips, code window
2. **Statement** — words light up one at a time as you scroll
3. **Metrics** — 5+ / 175+ / 100+ / 7, counting up
4. **Live work** — the four public URLs you shipped ← *the most valuable section on the page*
5. **Build / Operate** — the two halves of the job
6. **Experience** — three roles, both job titles each
7. **NFL Season Hub** — interactive demo window (replay / league / live app)
8. **CNR Car Zone** — pinned phone walkthrough
9. **Stack** — twelve skill cards with a discipline filter
10. **Education**, **Contact**

### The NFL Season Hub demo

Three tabs inside one browser-chrome window:

- **Game replay** — a canvas animation of the real win-probability curve for the 2022 week 15
  Vikings/Colts game, with play/pause, a scrubber and key-play beads. Mirrors the real project's
  technique: a fractional cursor advanced by elapsed time, repainting the canvas directly, with
  DOM text updated only when the whole play index changes.
- **League** — the top ten teams by projected wins, in their own colours.
- **Live app** — a facade that only injects the `<iframe>` when the visitor clicks, so the
  deployed React app never loads on a first visit.

**The data is real.** It was fetched once from the deployed app's own public JSON
(`/data/game/2022_15_IND_MIN.json` and `/data/teams-index.json`), trimmed, and inlined into
`index.html` as a `<script type="application/json">` block (7 KB raw, 2.3 KB gzipped). To refresh
or swap the game, re-fetch and regenerate that block; nothing else changes.

Team colours are lifted toward WCAG contrast against the dark card at runtime, the same idea the
real project uses, so Minnesota's `#4F2683` stays purple but becomes legible.

---

## 4. The design system

Everything comes from the token block at the top of `styles.css` — these are Apple's real values:

```css
:root{
  --black:#000000;    /* dark sections */
  --paper:#fbfbfd;    /* light section */
  --gray:#f5f5f7;     /* alternating light section */
  --ink:#1d1d1f;      /* primary text */
  --ink-2:#6e6e73;    /* secondary text */
  --blue:#0071e3;     /* accent on light */
  --blue-dark:#2997ff;/* accent on dark */

  --cnr:#1e3a63;      /* CNR Car Zone navy, matched to the live app */
  --cnr-green:#2f8558;
}
```

Type is `Inter` with an `-apple-system` fallback, so on a Mac it renders in real SF Pro. Code and
metadata use `JetBrains Mono`.

---

## 5. ⚠️ Two rules that will break the page if you ignore them

### Never reuse a class name

An earlier version named the hero's per-letter spans `.ch` **and** the contact links `.ch`. The
second rule won, every letter of the name became `display:block` with padding, and the name rendered
**one letter per line, vertically**. It looked like a layout bug; it was a name collision.

Before adding a class, Cmd+F for it in `styles.css` first. To check the whole file at once:

```bash
python3 - <<'PY'
import re,collections
c=re.sub(r'/\*.*?\*/','',open('styles.css').read(),flags=re.S)
top=re.sub(r'@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}','',c,flags=re.S)
p=collections.defaultdict(lambda: collections.defaultdict(set))
for m in re.finditer(r'(^|[},])\s*([^{}@]+?)\{([^{}]*)\}',top,flags=re.S):
    for s in m.group(2).split(','):
        s=s.strip()
        if re.fullmatch(r'\.[\w-]+',s):
            for prop in ('display','position','background','padding'):
                v=re.search(rf'(?:^|;)\s*{prop}\s*:\s*([^;]+)',m.group(3))
                if v: p[s][prop].add(v.group(1).strip())
bad=[(k,{a:b for a,b in v.items() if len(b)>1}) for k,v in p.items() if any(len(b)>1 for b in v.values())]
print(bad or "no collisions")
PY
```

### Gradient text and animated letters cannot be combined

`.hline--2` (the second headline line) used `background-clip:text` with a CSS gradient. It rendered
**completely invisible**: each per-letter span animates, which puts it in its own compositing
layer, and the parent's text clip cannot reach into it. The line took up space and painted nothing.
Verified by rendering with each property disabled in turn: opacity, transform and filter all
trigger it individually.

`script.js` now tints each glyph along the same colour ramp, so no clipping is involved. **If you
reintroduce a CSS gradient on any element whose children animate, it will disappear again.**

### The 960px breakpoint must match in both files

`script.js` checks `window.innerWidth > 960`; `styles.css` switches at `max-width:960px`. Below it
the CSS unstacks the project slides into a normal list; above it they're stacked and JS shows one.
**If those two numbers drift apart, all four panels render on top of each other.**

---

## 6. Common edits

**Change any text** — open `index.html`, Cmd+F, type over it.

**Add or change a live-work card** — copy an `<a class="lw rv">` block in the `#live` section. The
preview graphic is pure CSS: pick a `prev--unity` / `prev--made` / `prev--ud` / `prev--ud2` variant,
or add your own colour pair in `styles.css`:

```css
.prev--yours{ --prev-bg:#101820; --prev-fg:#00d1b2; }
```

**Swap in real screenshots instead** — replace the `<span class="prev …">` block with
`<img src="unity.png" alt="" class="prev">` and drop the PNG in the folder. Keep them under ~300KB
each or the page gets slow.

**Change the highlighted words in the scrolling statement** — `script.js` §5:
```js
var KEYWORDS = ["build", "publish", "fast", "findable", "online"];
```
Lowercase, no punctuation. They render in blue as they light up.

**Change the hero code window** — `index.html`, search `ide__code`. Each line is one
`<span class="ln" style="--l:N">`; keep `--l` sequential — it drives the line number *and* the typing
stagger. Colour classes: `c-key` `c-typ` `c-var` `c-str` `c-fn` `c-com`.

### The toolkit filter

Twelve `.skcard` blocks, each tagged `data-skg="build|operate|platform"`. The filter buttons carry
a matching `data-skf`. Non-matching cards get `.is-dim` rather than being hidden, so the grid never
reflows mid-filter and every tool stays readable.

- **Adding a card:** copy an `<article class="skcard rv">`, give it a `data-skg`, and renumber the
  `.skcard__n`. The tool count in the intro and the "Showing N areas" line are both counted from the
  DOM at runtime, so they can never drift from the markup.
- **Marking a core tool:** add `is-core` to a `.skchip`. That draws the filled dot and darkens the
  label. These are an editorial judgement about what you lead with — change them freely.
- **Group colour:** set in `styles.css` via `.skcard[data-skg="..."]{ --sk: ... }`. All three clear
  4.5:1 on the card background; check any replacement before using it.

**Change the metrics** — search `data-count`. `data-count` is the target, `data-suffix` is appended
when it finishes.

### Adding the CNR Car Zone screenshots

The app sits behind a login, so there is no live link. The phone in the CNR section shows a CSS
recreation by default; drop real screenshots in and it upgrades itself automatically.

Create a `cnr/` folder beside `index.html` and save exactly these four names:

```
cnr/1-dashboard.png     -> the home dashboard with the stat tiles
cnr/2-opportunity.png   -> an opportunity / vehicle record
cnr/3-documents.png     -> the document checklist
cnr/4-exports.png       -> Data & backup, the CSV export list
```

`script.js` probes `cnr/1-dashboard.png`. If it loads, all four are swapped in and the app's own
header and tab bar are hidden (the screenshot already contains them). If it is missing, the CSS
mockup stays and nothing looks broken, so a half-finished set never ships a blank phone.

**Scrub the data first.** These go on a public page. Registration numbers, seller names, phone
numbers and payment figures are a real person's information. Either seed the staging environment
with fake records and screenshot that, or blur those fields before saving. Portrait phone
screenshots around 1200x2600 work best; keep each under ~300 KB.

**Add a project phase** — add a matching `.slide`, `.scr` and rail `<i>`, then add an entry to the
`CHROME` array in `script.js` §6 (it sets the phone's header label and which tab bar item lights up).
JS counts the slides automatically. Past four panels, raise `height:420vh` on `.showcase` or each one
gets too short a turn.

---

## 7. Put it online

**Fastest:** drag the folder onto [app.netlify.com/drop](https://app.netlify.com/drop). Live in
20 seconds. Rename under **Site settings → Change site name**.

**Better:** publish as a GitHub repo, then Netlify → **Add new site → Import an existing project**.
Leave the build command blank, publish directory `.`. Every push auto-deploys.

A custom domain like `rakeshyeduru.com` reads better on a résumé than `.netlify.app`.

---

## 8. Before you send it to recruiters

- [ ] Click all four live-work links — they're the strongest thing on the page
- [ ] **Re-read the four "Worked on…" descriptions.** They're deliberately scoped, but you know
      exactly what you did on each — make them precise. A recruiter can open these pages.
- [ ] Check the paired job titles match what your LinkedIn says
- [ ] Read it on your phone, not just your laptop
- [ ] Check the Unity end date (Jul 2026) is how you want to present it
- [ ] Add the URL to your LinkedIn header and the top of your résumé PDF

---

## 9. If something breaks

Right-click → **Inspect** → **Console**. Errors show in red with a file and line number.

Unstyled page = `styles.css` isn't beside `index.html`. Nothing animates = same for `script.js`.
Something laid out strangely = run the collision check in §5 first.
