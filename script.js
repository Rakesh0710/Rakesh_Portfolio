/* ═══════════════════════════════════════════════════════════════
   Rakesh Reddy Yeduru — portfolio behaviour
   Vanilla JS, no dependencies. Everything degrades gracefully.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine   = window.matchMedia("(pointer:fine)").matches;

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp  = function (a, b, t) { return a + (b - a) * t; };
  var esc   = function (s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };

  /* ── one shared rAF loop for everything scroll-driven ─────────── */
  var frameJobs = [];
  var queued = false;
  function onFrame(fn) { frameJobs.push(fn); }
  function runFrame() {
    for (var i = 0; i < frameJobs.length; i++) frameJobs[i]();
    queued = false;
  }
  function requestFrame() {
    if (!queued) { queued = true; requestAnimationFrame(runFrame); }
  }
  window.addEventListener("scroll", requestFrame, { passive: true });
  window.addEventListener("resize", requestFrame, { passive: true });


  /* ═══════════════════════════════════════════════════════════════
     1 · HEADLINE — split into words, then characters
     Words stay inline-block so a character can never break mid-word;
     the plain space between them is the only wrap opportunity.
     ═══════════════════════════════════════════════════════════════ */
  var RAMP = [[124, 212, 255], [41, 151, 255]];   /* #7cd4ff -> #2997ff */

  document.querySelectorAll("[data-split]").forEach(function (el, lineIndex) {
    var words = el.textContent.trim().split(/\s+/);
    var letters = words.join("").length;
    var tint = el.classList.contains("hline--2");
    var n = lineIndex * 9, seen = 0;
    var html = "";

    words.forEach(function (word, w) {
      html += '<span class="wd">';
      for (var c = 0; c < word.length; c++) {
        var style = "--i:" + n;
        if (tint) {
          /* Paint the gradient per glyph. background-clip:text on the line
             would be invisible, because each animated glyph is its own layer. */
          var t = letters > 1 ? seen / (letters - 1) : 0;
          style += ";color:rgb(" + RAMP[0].map(function (a, k) {
            return Math.round(a + (RAMP[1][k] - a) * t);
          }).join(",") + ")";
        }
        html += '<span class="glyph" style="' + style + '">' + esc(word[c]) + "</span>";
        n++; seen++;
      }
      html += "</span>";
      if (w < words.length - 1) { html += " "; n++; }
    });

    el.innerHTML = html;
  });


  /* ═══════════════════════════════════════════════════════════════
     2 · SCROLL PROGRESS BAR
     ═══════════════════════════════════════════════════════════════ */
  (function () {
    var fill = document.querySelector("#progress i");
    if (!fill) return;
    onFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      fill.style.transform = "scaleX(" + clamp(p, 0, 1) + ")";
    });
  })();


  /* ═══════════════════════════════════════════════════════════════
     3 · NAV — solid on scroll, active-section spy, mobile sheet
     ═══════════════════════════════════════════════════════════════ */
  (function () {
    var nav = document.getElementById("nav");
    if (nav) {
      onFrame(function () { nav.classList.toggle("is-solid", window.scrollY > 40); });
    }

    var links = {};
    document.querySelectorAll("[data-nav]").forEach(function (a) {
      links[a.getAttribute("data-nav")] = a;
    });
    var ids = ["live", "work", "nfl", "project", "stack"];
    var ALIAS = { project: "nfl" };   /* the CNR showcase lights the Projects link too */
    var sections = ids.map(function (id) { return document.getElementById(id); }).filter(Boolean);

    if (sections.length) {
      onFrame(function () {
        var line = window.innerHeight * 0.4;
        var active = null;
        sections.forEach(function (s) {
          var r = s.getBoundingClientRect();
          if (r.top <= line && r.bottom > line) active = s.id;
        });
        var key = active ? (ALIAS[active] || active) : null;
        Object.keys(links).forEach(function (k) {
          links[k].classList.toggle("is-here", k === key);
        });
      });
    }

    var burger = document.getElementById("burger");
    var sheet  = document.getElementById("sheet");
    if (burger && sheet) {
      var setOpen = function (open) {
        burger.setAttribute("aria-expanded", String(open));
        burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        sheet.hidden = !open;
      };
      burger.addEventListener("click", function () {
        setOpen(burger.getAttribute("aria-expanded") !== "true");
      });
      sheet.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { setOpen(false); });
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !sheet.hidden) { setOpen(false); burger.focus(); }
      });
      window.addEventListener("resize", function () {
        if (window.innerWidth > 860 && !sheet.hidden) setOpen(false);
      });
    }
  })();


  /* ═══════════════════════════════════════════════════════════════
     4 · REVEALS — staggered, with count-ups
     ═══════════════════════════════════════════════════════════════ */
  (function () {
    [".nums__grid", ".pillar-grid", ".skgrid", ".live__grid"].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (group) {
        var i = 1;
        group.querySelectorAll(":scope > .rv").forEach(function (child) {
          child.setAttribute("data-d", String(i++));
        });
      });
    });

    function countUp(el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      var suffix = el.getAttribute("data-suffix") || "";
      if (reduce || !isFinite(target)) { el.textContent = target + suffix; return; }

      var dur = 1600, t0 = null;
      (function step(ts) {
        if (t0 === null) t0 = ts;
        var p = clamp((ts - t0) / dur, 0, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4))) + (p === 1 ? suffix : "");
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
    }

    var targets = document.querySelectorAll(".rv");

    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("in"); });
      document.querySelectorAll("[data-count]").forEach(countUp);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
        e.target.querySelectorAll("[data-count]").forEach(countUp);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    targets.forEach(function (el) { io.observe(el); });
  })();


  /* ═══════════════════════════════════════════════════════════════
     5 · SCRUB STATEMENT — words illuminate as the section passes
     ═══════════════════════════════════════════════════════════════ */
  (function () {
    var el = document.querySelector("[data-scrub]");
    if (!el) return;

    var KEYWORDS = ["build", "publish", "fast", "findable", "online"];
    var words = el.textContent.trim().split(/\s+/);

    el.innerHTML = words.map(function (w) {
      var bare = w.toLowerCase().replace(/[^a-z]/g, "");
      return '<span class="w' + (KEYWORDS.indexOf(bare) !== -1 ? " key" : "") + '">' + esc(w) + "</span>";
    }).join(" ");

    var spans = el.querySelectorAll(".w");

    if (reduce) {
      spans.forEach(function (s) { s.classList.add("lit"); });
      return;
    }

    var litCount = -1;
    onFrame(function () {
      var r  = el.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.55), 0, 1);

      var n = Math.round(p * spans.length);
      if (n === litCount) return;
      litCount = n;
      for (var i = 0; i < spans.length; i++) spans[i].classList.toggle("lit", i < n);
    });
  })();


  /* ═══════════════════════════════════════════════════════════════
     6 · SHOWCASE — sticky pin drives slides, phone screens, chrome
     ═══════════════════════════════════════════════════════════════ */
  (function () {
    var sec = document.querySelector("[data-show]");
    if (!sec) return;

    var slides  = sec.querySelectorAll(".slide");
    var screens = sec.querySelectorAll(".scr");
    var shots   = sec.querySelectorAll("[data-shot]");
    var shotBox = sec.querySelector("[data-shots]");
    var rails   = sec.querySelectorAll("[data-rail]");
    var phone   = sec.querySelector(".phone");
    var ctx     = sec.querySelector("[data-ctx]");
    var navItems = sec.querySelectorAll(".app__nav span");
    var count   = slides.length;
    if (!count) return;

    /* what the phone's header and tab bar show for each screen */
    var CHROME = [
      { label: "Home",          tab: 0 },
      { label: "Opportunities", tab: 1 },
      { label: "Documents",     tab: 3 },
      { label: "Data & backup", tab: 4 }
    ];

    /* Must mirror the 960px CSS breakpoint exactly: below it the stylesheet
       makes .slide static and visible; above it they are absolutely stacked
       and only JS decides which shows. A mismatch overlaps all four. */
    var canPin = function () { return window.innerWidth > 960; };
    var current = -1;

    function chrome(i) {
      var c = CHROME[i] || CHROME[0];
      if (ctx) ctx.textContent = c.label;
      navItems.forEach(function (n, k) { n.classList.toggle("is-on", k === c.tab); });
    }

    function unpin() {
      slides.forEach(function (s) { s.classList.add("is-on"); });
      screens.forEach(function (s, i) { s.classList.toggle("is-on", i === 0); });
      shots.forEach(function (s, i) { s.classList.toggle("is-on", i === 0); });
      if (phone) phone.style.transform = "";
      chrome(0);
      current = -1;
    }

    function show(i) {
      if (i === current) return;
      current = i;
      slides.forEach(function (s, n) { s.classList.toggle("is-on", n === i); });
      screens.forEach(function (s, n) { s.classList.toggle("is-on", n === i); });
      shots.forEach(function (s, n) { s.classList.toggle("is-on", n === i); });
      rails.forEach(function (s, n) { s.classList.toggle("is-on", n === i); });
      chrome(i);
    }

    onFrame(function () {
      if (reduce || !canPin()) {
        if (current !== -1) unpin();
        return;
      }

      var runway = sec.offsetHeight - window.innerHeight;
      if (runway <= 0) return;

      var p = clamp(-sec.getBoundingClientRect().top / runway, 0, 1);

      /* hold the first and last panel a beat at each end */
      var eased = clamp((p - 0.06) / 0.88, 0, 1);
      show(Math.min(count - 1, Math.floor(eased * count)));

      if (phone) {
        phone.style.transform =
          "rotateY(" + lerp(-9, 7, p).toFixed(2) + "deg) rotateX(" + lerp(4, -2, p).toFixed(2) + "deg)";
      }
    });

    /* Probe the first screenshot. Only if it loads do we swap the CSS
       recreation for the real images, so a missing file degrades to the
       mockup instead of an empty phone. */
    (function probeShots() {
      if (!shotBox || !shots.length) return;
      var first = shots[0], src = first.getAttribute("data-src");
      if (!src) return;
      var test = new Image();
      test.onload = function () {
        shots.forEach(function (img) { img.src = img.getAttribute("data-src"); });
        shotBox.hidden = false;
        var ph = sec.querySelector(".phone");
        if (ph) ph.classList.add("has-shots");
        shots.forEach(function (s, i) {
          s.classList.toggle("is-on", i === (current < 0 ? 0 : current));
        });
      };
      test.src = src;
    })();

    if (reduce || !canPin()) unpin(); else show(0);
  })();


  /* ═══════════════════════════════════════════════════════════════
     7 · CARD SPOTLIGHT + micro-tilt
     ═══════════════════════════════════════════════════════════════ */
  (function () {
    if (reduce || !fine) return;

    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      var raf = null, tx = 0, ty = 0;

      function apply() {
        raf = null;
        card.style.transform =
          "perspective(900px) rotateX(" + ty.toFixed(2) + "deg) rotateY(" + tx.toFixed(2) + "deg) translateY(-4px)";
      }

      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;

        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (py * 100).toFixed(1) + "%");

        tx = (px - 0.5) * 4.5;
        ty = (0.5 - py) * 3.5;
        if (!raf) raf = requestAnimationFrame(apply);
      });

      card.addEventListener("pointerleave", function () {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        card.style.transform = "";
      });
    });
  })();


  /* ═══════════════════════════════════════════════════════════════
     8 · CODE WINDOW — pointer tilt + scroll recline
     ═══════════════════════════════════════════════════════════════ */
  (function () {
    var ide  = document.getElementById("ide");
    var hero = document.getElementById("top");
    if (!ide || !hero || reduce) return;

    var targetX = 0, targetY = 0, curX = 0, curY = 0;
    var recline = 0, running = false;

    if (fine) {
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        targetX = ((e.clientX - r.left) / r.width - 0.5) * 7;
        targetY = ((e.clientY - r.top) / r.height - 0.5) * -4;
        start();
      });
      hero.addEventListener("pointerleave", function () {
        targetX = 0; targetY = 0; start();
      });
    }

    onFrame(function () {
      var r = hero.getBoundingClientRect();
      recline = clamp(-r.top / Math.max(r.height, 1), 0, 1) * 10;
      start();
    });

    function paint() {
      curX = lerp(curX, targetX, 0.09);
      curY = lerp(curY, targetY, 0.09);

      ide.style.transform =
        "rotateX(" + (6 + recline + curY).toFixed(2) + "deg) " +
        "rotateY(" + curX.toFixed(2) + "deg) " +
        "scale(" + (1 - recline * 0.004).toFixed(3) + ")";

      if (Math.abs(curX - targetX) > 0.01 || Math.abs(curY - targetY) > 0.01) {
        requestAnimationFrame(paint);
      } else {
        running = false;
      }
    }
    function start() { if (!running) { running = true; requestAnimationFrame(paint); } }

    start();
  })();


  /* ═══════════════════════════════════════════════════════════════
     8b · TOOLKIT — discipline filter
     Non-matching cards dim in place rather than unmounting, so the grid
     never reflows mid-filter and every tool stays readable/scannable.
     ═══════════════════════════════════════════════════════════════ */
  (function () {
    var wrap = document.querySelector(".skfilter");
    var cards = document.querySelectorAll(".skcard");
    if (!wrap || !cards.length) return;

    var buttons = wrap.querySelectorAll("[data-skf]");
    var status  = document.querySelector("[data-sk-status]");
    var countEl = document.querySelector("[data-sk-count]");

    /* real tool count, so the copy can never drift from the markup */
    if (countEl) countEl.textContent = document.querySelectorAll(".skchip").length;

    function apply(group, announce) {
      var shown = 0;
      cards.forEach(function (c) {
        var hit = group === "all" || c.getAttribute("data-skg") === group;
        c.classList.toggle("is-dim", !hit);
        if (hit) shown++;
      });
      buttons.forEach(function (b) {
        var on = b.getAttribute("data-skf") === group;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      });
      if (status) {
        var tools = 0;
        cards.forEach(function (c) {
          if (!c.classList.contains("is-dim")) tools += c.querySelectorAll(".skchip").length;
        });
        status.textContent = announce
          ? "Showing " + shown + (shown === 1 ? " area" : " areas") + ", " + tools + " tools."
          : "";
      }
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        apply(b.getAttribute("data-skf"), true);
      });
    });

    apply("all", false);
  })();


  /* ═══════════════════════════════════════════════════════════════
     9 · Kick everything once layout has settled
     ═══════════════════════════════════════════════════════════════ */
  window.addEventListener("load", requestFrame);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(requestFrame);
  requestFrame();
})();

/* ═══════════════════════════════════════════════════════════════
   NFL SEASON HUB — interactive demo
   Real play-by-play, fetched once from the deployed app's public
   JSON and inlined at build time. Mirrors the real project's
   approach: a fractional cursor in a ref, advanced by elapsed
   time, repainting canvas directly; React-equivalent DOM updates
   happen only when the integer play changes.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var host = document.querySelector("[data-win]");
  var raw  = document.querySelector("[data-nfl-data]");
  if (!host || !raw) return;

  var D;
  try { D = JSON.parse(raw.textContent); } catch (e) { return; }
  if (!D || !D.wp || !D.wp.length) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp  = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var N      = D.wp.length;
  var LAST   = N - 1;

  /* ── lift a team colour until it is legible on the dark card ── */
  function lift(hex, bg, target) {
    function rgb(h) {
      h = h.replace("#", "");
      if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
    }
    function lum(c) {
      var a = c.map(function (v) {
        v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
      });
      return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2];
    }
    function ratio(a, b) {
      var l1 = lum(a), l2 = lum(b);
      return (Math.max(l1,l2) + 0.05) / (Math.min(l1,l2) + 0.05);
    }
    var c = rgb(hex), b = rgb(bg);
    /* HSL round-trip, raising lightness until the ratio clears */
    var r=c[0]/255, g=c[1]/255, bl=c[2]/255;
    var mx=Math.max(r,g,bl), mn=Math.min(r,g,bl), l=(mx+mn)/2, h=0, s=0;
    if (mx !== mn) {
      var d = mx-mn;
      s = l > 0.5 ? d/(2-mx-mn) : d/(mx+mn);
      h = mx===r ? (g-bl)/d + (g<bl?6:0) : mx===g ? (bl-r)/d+2 : (r-g)/d+4;
      h /= 6;
    }
    s = Math.min(1, s * 1.15);
    function toRGB(h,s,l) {
      if (!s) { var v=Math.round(l*255); return [v,v,v]; }
      var q = l<0.5 ? l*(1+s) : l+s-l*s, p = 2*l-q;
      function hue(t){ t=(t+1)%1; return t<1/6?p+(q-p)*6*t : t<1/2?q : t<2/3?p+(q-p)*(2/3-t)*6 : p; }
      return [Math.round(hue(h+1/3)*255), Math.round(hue(h)*255), Math.round(hue(h-1/3)*255)];
    }
    for (var L = l; L <= 0.96; L += 0.02) {
      var out = toRGB(h, s, L);
      if (ratio(out, b) >= target) return "rgb(" + out.join(",") + ")";
    }
    return "rgb(" + toRGB(h, s, 0.9).join(",") + ")";
  }

  var CARD = "#15151a";
  var HOME = lift(D.g.h.c, CARD, 4.2);   /* MIN */
  var AWAY = lift(D.g.a.c, CARD, 4.2);   /* IND */

  var $ = function (s) { return host.querySelector(s); };
  var elCanvas = $("[data-canvas]"), elSeek = $("[data-seek]"), elPlay = $("[data-play]");
  var elHS = $("[data-hs]"), elAS = $("[data-as]"), elWP = $("[data-wp]");
  var elClock = $("[data-clock]"), elN = $("[data-n]"), elDesc = $("[data-desc]"), elOT = $("[data-ot]");
  host.querySelector("[data-sw-home]").style.setProperty("--c", HOME);
  host.querySelector("[data-sw-away]").style.setProperty("--c", AWAY);
  host.querySelector("[data-ax-top]").style.color = HOME;
  host.querySelector("[data-ax-bot]").style.color = AWAY;

  /* fast lookup: nearest key play at or before index i */
  var keyAt = new Array(N), kp = null;
  (function () {
    var byIndex = {};
    D.key.forEach(function (k) { byIndex[k.i] = k.t; });
    for (var i = 0; i < N; i++) { if (byIndex[i] !== undefined) kp = byIndex[i]; keyAt[i] = kp; }
  })();
  var isKey = {}; D.key.forEach(function (k) { isKey[k.i] = 1; });

  /* ── canvas ── */
  var ctx = elCanvas.getContext("2d");
  var W = 0, H = 0, dpr = 1;

  function measure() {
    var r = elCanvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    elCanvas.width  = Math.round(W * dpr);
    elCanvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(cursor);
  }
  if ("ResizeObserver" in window) new ResizeObserver(measure).observe(elCanvas);
  else window.addEventListener("resize", measure);

  var PADX = 10, PADY = 12;
  var xAt = function (i) { return PADX + (i / LAST) * (W - PADX * 2); };
  var yAt = function (p) { return PADY + (1 - p / 1000) * (H - PADY * 2); };

  function draw(cur) {
    if (!W || !H) return;
    ctx.clearRect(0, 0, W, H);
    var upto = clamp(cur, 0, LAST);
    var whole = Math.floor(upto);

    /* gridlines */
    ctx.lineWidth = 1;
    [0, 250, 500, 750, 1000].forEach(function (p) {
      var y = Math.round(yAt(p)) + 0.5;
      ctx.strokeStyle = p === 500 ? "rgba(255,255,255,.20)" : "rgba(255,255,255,.07)";
      ctx.setLineDash(p === 500 ? [4, 4] : []);
      ctx.beginPath(); ctx.moveTo(PADX, y); ctx.lineTo(W - PADX, y); ctx.stroke();
    });
    ctx.setLineDash([]);

    /* quarter dividers */
    var lastQ = D.q[0];
    for (var i = 1; i < N; i++) {
      if (D.q[i] !== lastQ) {
        var x = Math.round(xAt(i)) + 0.5;
        ctx.strokeStyle = "rgba(255,255,255,.09)";
        ctx.beginPath(); ctx.moveTo(x, PADY); ctx.lineTo(x, H - PADY); ctx.stroke();
        lastQ = D.q[i];
      }
    }

    if (upto <= 0) return;

    /* interpolated head position */
    var frac = upto - whole;
    var headP = whole >= LAST ? D.wp[LAST] : D.wp[whole] + (D.wp[whole + 1] - D.wp[whole]) * frac;
    var headX = xAt(upto), headY = yAt(headP);

    /* area fill */
    var grad = ctx.createLinearGradient(0, PADY, 0, H - PADY);
    grad.addColorStop(0,   HOME.replace("rgb(", "rgba(").replace(")", ",.30)"));
    grad.addColorStop(0.5, "rgba(255,255,255,.05)");
    grad.addColorStop(1,   AWAY.replace("rgb(", "rgba(").replace(")", ",.30)"));
    ctx.beginPath();
    ctx.moveTo(xAt(0), yAt(500));
    for (var j = 0; j <= whole; j++) ctx.lineTo(xAt(j), yAt(D.wp[j]));
    ctx.lineTo(headX, headY);
    ctx.lineTo(headX, yAt(500));
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    /* the curve */
    var stroke = ctx.createLinearGradient(0, PADY, 0, H - PADY);
    stroke.addColorStop(0, HOME); stroke.addColorStop(1, AWAY);
    ctx.strokeStyle = stroke; ctx.lineWidth = 2.2;
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(xAt(0), yAt(D.wp[0]));
    for (var k = 1; k <= whole; k++) ctx.lineTo(xAt(k), yAt(D.wp[k]));
    ctx.lineTo(headX, headY);
    ctx.stroke();

    /* key-play beads, revealed as they are passed */
    for (var m = 0; m <= whole; m++) {
      if (!isKey[m]) continue;
      ctx.beginPath(); ctx.arc(xAt(m), yAt(D.wp[m]), 3.1, 0, 6.283);
      ctx.fillStyle = "#fff"; ctx.fill();
      ctx.beginPath(); ctx.arc(xAt(m), yAt(D.wp[m]), 5.6, 0, 6.283);
      ctx.strokeStyle = "rgba(255,255,255,.30)"; ctx.lineWidth = 1; ctx.stroke();
    }

    /* cursor */
    ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(headX, PADY); ctx.lineTo(headX, H - PADY); ctx.stroke();
    ctx.beginPath(); ctx.arc(headX, headY, 4.6, 0, 6.283);
    ctx.fillStyle = "#fff"; ctx.fill();
  }

  /* ── readout: only when the whole-play index changes ── */
  var shown = -1;
  function readout(cur) {
    var i = clamp(Math.floor(cur), 0, LAST);
    if (i === shown) return;
    shown = i;
    elHS.textContent = D.hs[i];
    elAS.textContent = D.as[i];
    elWP.textContent = (D.wp[i] / 10).toFixed(1) + "%";
    var q = D.q[i], s = D.c[i];
    var mm = Math.floor(s / 60), ss = ("0" + (s % 60)).slice(-2);
    elClock.textContent = (q >= 5 ? "OT " : "Q" + q + " ") + mm + ":" + ss;
    elOT.hidden = q < 5;
    elN.textContent = i + 1;
    elDesc.textContent = keyAt[i] || "Kickoff. Minnesota receive.";
    if (!dragging) elSeek.value = i;
  }

  /* ── transport ── */
  var cursor = 0, playing = false, rafId = null, prev = 0, dragging = false;
  var PPS = 13;                       /* plays per second */

  function frame(t) {
    rafId = null;
    if (!playing) return;
    var dt = Math.min(t - prev, 100) / 1000;   /* cap a backgrounded tab */
    prev = t;
    cursor += dt * PPS;
    if (cursor >= LAST) { cursor = LAST; stop(); }
    draw(cursor); readout(cursor);
    if (playing) rafId = requestAnimationFrame(frame);
  }
  function start() {
    if (playing) return;
    if (cursor >= LAST) cursor = 0;
    playing = true; prev = performance.now();
    elPlay.classList.add("is-playing");
    elPlay.setAttribute("aria-label", "Pause the replay");
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    playing = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    elPlay.classList.remove("is-playing");
    elPlay.setAttribute("aria-label", "Play the replay");
  }
  elPlay.addEventListener("click", function () { playing ? stop() : start(); });

  elSeek.addEventListener("pointerdown", function () { dragging = true; });
  window.addEventListener("pointerup",   function () { dragging = false; });
  elSeek.addEventListener("input", function () {
    cursor = Number(elSeek.value);     /* seeking while playing keeps playing */
    prev = performance.now();
    draw(cursor); readout(cursor);
  });

  /* ── tabs ── */
  var tabs = [].slice.call(host.querySelectorAll(".wtab"));
  function select(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (tab.dataset.tab === "replay") measure(); else stop();
    if (tab.dataset.tab === "league") league();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { select(tab); });
    tab.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var next = tabs[(i + d + tabs.length) % tabs.length];
      select(next); next.focus();
    });
  });

  /* ── league pane ── */
  var leagueDone = false;
  function league() {
    if (leagueDone) return;
    leagueDone = true;
    var wrap = host.querySelector("[data-league]");
    /* Scale against the visible range, not against zero: every team wins
       between 6 and 12, so a 0-based bar would make them all look identical. */
    var vals = D.teams.map(function (t) { return t.p; });
    var hi = Math.max.apply(null, vals), lo = Math.min.apply(null, vals) - 0.45;
    wrap.innerHTML = D.teams.map(function (t, i) {
      var c = lift(t.c, CARD, 3.2);
      return '<div class="lgr" style="--c:' + c + '">' +
        '<span class="lgr__r">' + (i + 1) + '</span>' +
        '<span class="lgr__n"><i></i><span>' + t.n + "</span></span>" +
        '<span class="lgr__bar"><i data-v="' + (0.14 + 0.86 * (t.p - lo) / (hi - lo)).toFixed(3) + '"></i></span>' +
        '<span class="lgr__v">' + t.p.toFixed(1) + " <em>" + t.w + "-" + t.l + "</em></span>" +
      "</div>";
    }).join("");
    requestAnimationFrame(function () {
      wrap.querySelectorAll(".lgr__bar i").forEach(function (b, i) {
        setTimeout(function () { b.style.setProperty("--v", b.dataset.v); }, reduce ? 0 : i * 55);
      });
    });
  }

  /* ── live app: facade until asked for ── */
  var loadBtn = host.querySelector("[data-loadapp]");
  if (loadBtn) loadBtn.addEventListener("click", function () {
    var fac = host.querySelector("[data-fac]");
    var f = document.createElement("iframe");
    f.className = "appframe";
    f.src = "https://nfl-season-hub.vercel.app";
    f.title = "NFL Season Hub, the live deployed application";
    f.loading = "lazy";
    f.referrerPolicy = "no-referrer-when-downgrade";
    fac.replaceWith(f);
  });

  /* ── autoplay once when scrolled into view; pause when it leaves ── */
  measure(); readout(0);
  if (reduce) { cursor = LAST; draw(cursor); readout(cursor); }
  else if ("IntersectionObserver" in window) {
    var kicked = false;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { if (!kicked) { kicked = true; start(); } }
        else if (playing) stop();
      });
    }, { threshold: 0.35 }).observe(elCanvas);
  }
})();
