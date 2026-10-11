/* ═══════════════════════════════════════════════════════════════
   Rakesh Reddy Yeduru · portfolio behaviour
   Vanilla JS, no dependencies, shared by the home page and every
   case study. Each module looks for its own markup and quietly does
   nothing when it is not on the page.

   1 Headline split      6 CNR phone (switcher + pinned walkthrough)
   2 Progress bar        7 Code window tilt
   3 Nav                 8 Expertise explorer
   4 Reveals             9 Season + time of day
   5 Tool count          10 Case-study contents spy
   NFL Season Hub demo lives in its own closure at the end.
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
    queued = false;
    for (var i = 0; i < frameJobs.length; i++) frameJobs[i]();
  }
  function requestFrame() {
    if (!queued) { queued = true; requestAnimationFrame(runFrame); }
  }
  window.addEventListener("scroll", requestFrame, { passive: true });
  window.addEventListener("resize", requestFrame, { passive: true });


  /* ═══ 1 · HEADLINE ════════════════════════════════════════════
     Split into words, then characters. Words stay inline-block so a
     character can never break mid-word; the plain space between them
     is the only wrap opportunity. Screen readers get one hidden copy
     of the text, not forty separate letters. */
  document.querySelectorAll("[data-split]").forEach(function (el) {
    var text  = el.textContent.trim();
    var words = text.split(/\s+/);
    var n = 0, html = "";

    words.forEach(function (word, w) {
      html += '<span class="wd" aria-hidden="true">';
      for (var c = 0; c < word.length; c++) {
        html += '<span class="glyph" style="--i:' + n + '">' + esc(word[c]) + "</span>";
        n++;
      }
      html += "</span>";
      if (w < words.length - 1) { html += " "; n++; }
    });

    el.innerHTML = '<span class="vh">' + esc(text) + "</span>" + html;
  });


  /* ═══ 2 · SCROLL PROGRESS ═════════════════════════════════════ */
  (function () {
    var fill = document.querySelector("#progress i");
    if (!fill) return;
    onFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      fill.style.transform = "scaleX(" + clamp(max > 0 ? window.scrollY / max : 0, 0, 1) + ")";
    });
  })();


  /* ═══ 3 · NAV ═════════════════════════════════════════════════
     Solid on scroll, a pill that slides to the section you are in,
     and a mobile sheet that manages its own focus. */
  (function () {
    var nav = document.getElementById("nav");
    if (!nav) return;
    onFrame(function () { nav.classList.toggle("is-solid", window.scrollY > 24); });

    /* ── active section ── */
    var links = {};
    nav.querySelectorAll("[data-nav]").forEach(function (a) { links[a.getAttribute("data-nav")] = a; });
    var ink = nav.querySelector(".nav__ink");
    var ids = Object.keys(links);
    /* sections without a link of their own still need to clear the pill */
    var watch = ["top"].concat(ids, ["impact", "contact"]);
    var sections = watch.map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var current = null;

    function moveInk(a) {
      if (!ink) return;
      if (!a) { ink.classList.remove("is-on"); return; }
      ink.style.setProperty("--x", a.offsetLeft + "px");
      ink.style.setProperty("--w", a.offsetWidth + "px");
      ink.classList.add("is-on");
    }

    if (sections.length && ids.length) {
      onFrame(function () {
        var line = window.innerHeight * 0.35;
        var active = null;
        sections.forEach(function (s) {
          var r = s.getBoundingClientRect();
          if (r.top <= line && r.bottom > line) active = s.id;
        });
        if (!links[active]) active = null;
        if (active === current) return;
        current = active;
        ids.forEach(function (k) {
          if (k === active) links[k].setAttribute("aria-current", "true");
          else links[k].removeAttribute("aria-current");
        });
        moveInk(links[active]);
      });
      window.addEventListener("resize", function () { moveInk(links[current]); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveInk(links[current]); });
    }

    /* ── mobile sheet ── */
    var burger = document.getElementById("burger");
    var sheet  = document.getElementById("sheet");
    if (!burger || !sheet) return;

    function setOpen(open, returnFocus) {
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      sheet.hidden = !open;
      if (open) { var first = sheet.querySelector("a"); if (first) first.focus(); }
      else if (returnFocus) burger.focus();
    }
    burger.addEventListener("click", function () {
      setOpen(burger.getAttribute("aria-expanded") !== "true", true);
    });
    sheet.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false, false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !sheet.hidden) setOpen(false, true);
    });
    /* tabbing past the last link closes the sheet instead of leaving it open behind you */
    sheet.addEventListener("focusout", function (e) {
      if (!sheet.hidden && e.relatedTarget && !sheet.contains(e.relatedTarget) && e.relatedTarget !== burger) {
        setOpen(false, false);
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900 && !sheet.hidden) setOpen(false, false);
    });
  })();


  /* ═══ 4 · REVEALS ═════════════════════════════════════════════ */
  (function () {
    [".duo", ".lenses", ".tl", ".projects"].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (group) {
        var i = 1;
        group.querySelectorAll(":scope > .rv").forEach(function (child) {
          child.setAttribute("data-d", String(Math.min(i++, 6)));
        });
      });
    });

    var targets = document.querySelectorAll(".rv");
    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    targets.forEach(function (el) { io.observe(el); });

    /* A hash link straight to a section, or a find-in-page, should never
       land on content that is still waiting to fade in. */
    window.addEventListener("hashchange", function () {
      var t = document.querySelector(location.hash);
      if (t) t.querySelectorAll(".rv").forEach(function (el) { el.classList.add("in"); });
    });
  })();


  /* ═══ 5 · TOOL COUNT — the copy can never drift from the markup ═ */
  (function () {
    var el = document.querySelector("[data-tool-count]");
    if (el) el.textContent = document.querySelectorAll(".tool").length;
  })();


  /* ═══ 6 · CNR PHONE ═══════════════════════════════════════════
     One controller for the phone mockup, driven two ways: tabs on the
     home page, and a scroll-pinned walkthrough on the case study. */
  var CHROME = [
    { label: "Home",          tab: 0 },
    { label: "Opportunities", tab: 1 },
    { label: "Documents",     tab: 3 },
    { label: "Data & backup", tab: 4 }
  ];

  function phoneController(root) {
    var screens = root.querySelectorAll(".scr");
    var shots   = root.querySelectorAll("[data-shot]");
    var shotBox = root.querySelector("[data-shots]");
    var ctx     = root.querySelector("[data-ctx]");
    var navItems = root.querySelectorAll(".app__nav span");
    var current = 0;

    function show(i) {
      current = i;
      screens.forEach(function (s, n) {
        s.classList.toggle("is-on", n === i);
        s.classList.toggle("is-before", n < i);
      });
      shots.forEach(function (s, n) { s.classList.toggle("is-on", n === i); });
      var c = CHROME[i] || CHROME[0];
      if (ctx) ctx.textContent = c.label;
      navItems.forEach(function (n, k) { n.classList.toggle("is-on", k === c.tab); });
    }

    /* Real screenshots are opt-in: add data-ready to .cnrshots once the
       files exist in cnr/. Probing for files that are not there would log
       a 404 on every visit. Even then, gallery mode waits for the first
       image to load, so a bad path falls back to the mockup. */
    if (shotBox && shots.length && shotBox.hasAttribute("data-ready")) {
      var src = shots[0].getAttribute("data-src");
      if (src) {
        var test = new Image();
        test.onload = function () {
          shots.forEach(function (img) { img.src = img.getAttribute("data-src"); });
          shotBox.hidden = false;
          var ph = root.querySelector(".phone");
          if (ph) ph.classList.add("has-shots");
          show(current);
        };
        test.src = src;
      }
    }
    show(0);
    return { show: show };
  }

  /* home page: tabs */
  document.querySelectorAll("[data-cnr]").forEach(function (root) {
    var phone = phoneController(root);
    var tabs = [].slice.call(root.querySelectorAll("[data-cnr-tab]"));
    var panel = root.querySelector('[role="tabpanel"]');
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
      });
      var idx = Number(tab.getAttribute("data-cnr-tab"));
      phone.show(idx);
      if (panel) {
        panel.setAttribute("aria-labelledby", tab.id);
        panel.querySelectorAll("[data-cnr-desc]").forEach(function (p) {
          p.hidden = Number(p.getAttribute("data-cnr-desc")) !== idx;
        });
      }
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab, false); });
      tab.addEventListener("keydown", function (e) {
        var k = e.key, next = null;
        if (k === "ArrowDown" || k === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        else if (k === "ArrowUp" || k === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (k === "Home") next = tabs[0];
        else if (k === "End") next = tabs[tabs.length - 1];
        if (!next) return;
        e.preventDefault();
        select(next, true);
      });
    });
  });

  /* case study: sticky pin drives the slides and the phone */
  (function () {
    var sec = document.querySelector("[data-show]");
    if (!sec) return;
    var phone  = phoneController(sec);
    var slides = sec.querySelectorAll(".slide");
    var rails  = sec.querySelectorAll("[data-rail]");
    var device = sec.querySelector(".phone");
    var count  = slides.length;
    if (!count) return;

    /* Must mirror the 960px breakpoint in styles.css exactly: below it the
       slides are static and visible; above it they are stacked and only JS
       decides which shows. A mismatch overlaps all four. */
    var canPin = function () { return window.innerWidth > 960; };
    var current = -1;

    function unpin() {
      slides.forEach(function (s) { s.classList.add("is-on"); });
      phone.show(0);
      if (device) device.style.transform = "";
      current = -1;
    }
    function show(i) {
      if (i === current) return;
      current = i;
      slides.forEach(function (s, n) { s.classList.toggle("is-on", n === i); });
      rails.forEach(function (s, n) { s.classList.toggle("is-on", n === i); });
      phone.show(i);
    }

    onFrame(function () {
      if (reduce || !canPin()) { if (current !== -1) unpin(); return; }
      var runway = sec.offsetHeight - window.innerHeight;
      if (runway <= 0) return;
      var p = clamp(-sec.getBoundingClientRect().top / runway, 0, 1);
      var eased = clamp((p - 0.06) / 0.88, 0, 1);       /* hold each end a beat */
      show(Math.min(count - 1, Math.floor(eased * count)));
      if (device) {
        device.style.transform =
          "rotateY(" + lerp(-9, 7, p).toFixed(2) + "deg) rotateX(" + lerp(4, -2, p).toFixed(2) + "deg)";
      }
    });

    if (reduce || !canPin()) unpin(); else show(0);
  })();


  /* ═══ 7 · CODE WINDOW — a few degrees of pointer tilt ═════════ */
  (function () {
    var ide  = document.getElementById("ide");
    var hero = document.getElementById("top");
    if (!ide || !hero || reduce || !fine) return;

    var tx = 0, ty = 0, cx = 0, cy = 0, running = false;
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 8;
      ty = ((e.clientY - r.top) / r.height - 0.5) * -5;
      start();
    });
    hero.addEventListener("pointerleave", function () { tx = 0; ty = 0; start(); });

    function paint() {
      cx = lerp(cx, tx, 0.08);
      cy = lerp(cy, ty, 0.08);
      ide.style.transform = "rotateY(" + (-6 + cx).toFixed(2) + "deg) rotateX(" + (4 + cy).toFixed(2) + "deg)";
      if (Math.abs(cx - tx) > 0.01 || Math.abs(cy - ty) > 0.01) requestAnimationFrame(paint);
      else running = false;
    }
    function start() { if (!running) { running = true; requestAnimationFrame(paint); } }
  })();


  /* ═══ 7b · RELEASE PIPELINE ══════════════════════════════════
     Steps Plan → Build → QA → Release → Monitor and lights the line of
     ship() that matches, then holds on "checks passed" and starts over.
     Runs only while the hero is on screen and the tab is visible. */
  (function () {
    var root = document.querySelector("[data-pipeline]");
    if (!root) return;
    var stages = [].slice.call(root.querySelectorAll("[data-stage]"));
    var lines  = [].slice.call(root.querySelectorAll("[data-stage-line]"));
    var checks = root.querySelector("[data-checks]");
    var n = stages.length;

    function paint(k) {          /* k = active stage, n = all done */
      stages.forEach(function (li, i) {
        li.classList.toggle("is-done", i < k);
        li.classList.toggle("is-active", i === k);
      });
      lines.forEach(function (ln) {
        ln.classList.toggle("is-active", Number(ln.getAttribute("data-stage-line")) === k);
      });
      if (checks) {
        var done = k >= n;
        checks.textContent = done ? "\u2713 " + n + " checks passed" : "running " + stages[k].textContent.toLowerCase();
        checks.classList.toggle("is-ok", done);
      }
    }

    if (reduce) { paint(n); return; }

    var k = -1, timer = null, visible = true;
    function tick() {
      k = k >= n ? 0 : k + 1;
      paint(k);
      timer = setTimeout(tick, k >= n ? 2600 : 1250);
    }
    function start() { if (!timer && visible && !document.hidden) timer = setTimeout(tick, 400); }
    function stop()  { clearTimeout(timer); timer = null; }

    setTimeout(start, 1400);            /* after the code lines have drawn in */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        visible = e[0].isIntersecting; visible ? start() : stop();
      }).observe(root);
    }
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  })();


  /* ═══ 8 · EXPERTISE EXPLORER ══════════════════════════════════
     A real tablist: one tab stop, arrows/Home/End to move, and the
     panel re-plays its entrance each time so the change is felt. The
     ink pill is positioned from the selected tab's own box, so it is
     correct at any width and with any font. */
  (function () {
    var root = document.querySelector("[data-xpl]");
    if (!root) return;
    var tabs = [].slice.call(root.querySelectorAll('[role="tab"]'));
    var ink  = root.querySelector(".xpl__ink");

    function place(tab) {
      if (!ink) return;
      ink.style.setProperty("--x", tab.offsetLeft + "px");
      ink.style.setProperty("--w", tab.offsetWidth + "px");
    }

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (!panel) return;
        panel.hidden = !on;
        panel.classList.remove("is-enter");
        if (on && !reduce) {
          void panel.offsetWidth;          /* restart the entrance animation */
          panel.classList.add("is-enter");
        }
      });
      place(tab);
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab, false); });
      tab.addEventListener("keydown", function (e) {
        var k = e.key, next = null;
        if (k === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        else if (k === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (k === "Home") next = tabs[0];
        else if (k === "End") next = tabs[tabs.length - 1];
        if (!next) return;
        e.preventDefault();
        select(next, true);
      });
    });

    var initial = tabs.filter(function (t) { return t.getAttribute("aria-selected") === "true"; })[0] || tabs[0];
    /* no transition on first placement, so the pill does not slide in from zero */
    if (ink) ink.style.transition = "none";
    place(initial);
    requestAnimationFrame(function () { if (ink) ink.style.transition = ""; });

    function replace() {
      var on = tabs.filter(function (t) { return t.getAttribute("aria-selected") === "true"; })[0];
      if (on) place(on);
    }
    window.addEventListener("resize", replace);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(replace);
  })();


  /* ═══ 9 · SEASON + TIME OF DAY ════════════════════════════════
     Reads the visitor's own clock, so there is nothing to fetch.
     ?season= and ?tod= force a value, which is how you preview a
     month without waiting for it. */
  (function () {
    var root = document.documentElement;
    var q    = new URLSearchParams(location.search);
    var now  = new Date();

    var SEASONS = { 9: "oct", 10: "nov", 11: "dec" };      /* 0-indexed months */
    var season  = SEASONS[now.getMonth()] || "none";
    var forced  = (q.get("season") || "").toLowerCase();
    if (/^(oct|nov|dec|none)$/.test(forced)) season = forced;

    var h = now.getHours();
    var tod = h < 5 ? "night" : h < 7 ? "dawn" : h < 17 ? "day" : h < 21 ? "dusk" : "night";
    var ftod = (q.get("tod") || "").toLowerCase();
    if (/^(dawn|day|dusk|night)$/.test(ftod)) {
      tod = ftod;
      /* keep the greeting consistent with a forced preview */
      h = { dawn: 6, day: 14, dusk: 19, night: 23 }[tod];
    }
    root.setAttribute("data-season", season);
    root.setAttribute("data-tod", tod);

    /* greeting */
    var DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    var phrase = h < 5 ? "Working late" : h < 7 ? "Up early" : h < 12 ? "Good morning"
               : h < 17 ? "Good afternoon" : h < 22 ? "Good evening" : "Working late";
    var greet = document.querySelector("[data-greet]");
    if (greet) {
      greet.textContent = phrase + " · ";
      var day = document.createElement("b");
      day.textContent = DAYS[now.getDay()];
      greet.appendChild(day);
    }

    /* the seasonal line in the code window */
    var CODE = {
      none: ["'default'", ""],
      oct:  ["'halloween'", "  // spooky season"],
      nov:  ["'harvest'",   "  // thanksgiving"],
      dec:  ["'winter'",    "  // snow is falling"]
    };
    var cEl = document.querySelector("[data-season-code]");
    var nEl = document.querySelector("[data-season-note]");
    if (cEl) cEl.textContent = CODE[season][0];
    if (nEl) nEl.textContent = CODE[season][1];

    /* particles */
    var SPEC = {
      oct: { kind: "ember", n: 54, colors: ["#ff9d52", "#ff7433", "#ffd09a"] },
      nov: { kind: "leaf",  n: 30, colors: ["#e8a85c", "#c2703a", "#a85f33", "#e0a95d"] },
      dec: { kind: "snow",  n: 64, colors: ["#ffffff", "#e6f3ff", "#c9e6ff"] }
    };
    var spec = SPEC[season];
    var cv   = document.querySelector("[data-season-canvas]");
    var hero = cv && cv.parentElement;
    if (!spec || !cv || !hero || reduce || !cv.getContext) return;

    var ctx = cv.getContext("2d");
    var W = 0, H = 0, bits = [], raf = null, live = false, last = 0;

    function size() {
      var r = hero.getBoundingClientRect();
      W = r.width; H = r.height;
      if (!W || !H) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn(first) {
      var b = { c: spec.colors[(Math.random() * spec.colors.length) | 0], ph: Math.random() * 6.28, sw: 0.4 + Math.random() * 1.1 };
      b.x = Math.random() * W;
      if (spec.kind === "ember") {
        b.y = first ? Math.random() * H : H + 10;
        b.r = 1.1 + Math.random() * 2.0; b.vy = -(10 + Math.random() * 22); b.life = 0.45 + Math.random() * 0.55;
      } else if (spec.kind === "leaf") {
        b.y = first ? Math.random() * H : -20;
        b.r = 3.8 + Math.random() * 3.8; b.vy = 16 + Math.random() * 24;
        b.rot = Math.random() * 6.28; b.vr = (Math.random() - 0.5) * 1.6; b.life = 0.5 + Math.random() * 0.4;
      } else {
        b.y = first ? Math.random() * H : -10;
        b.r = 1.1 + Math.random() * 2.3; b.vy = 14 + Math.random() * 26; b.life = 0.45 + Math.random() * 0.45;
      }
      return b;
    }

    function build() {
      var n = Math.round(spec.n * (W * H) / (1280 * 800));   /* scale by area */
      bits = [];
      for (var i = 0; i < Math.min(150, Math.max(14, n)); i++) bits.push(spawn(true));
    }

    function frame(t) {
      raf = null;
      if (!live) return;
      var dt = Math.min(t - last, 100) / 1000;   /* cap a backgrounded tab */
      last = t;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < bits.length; i++) {
        var b = bits[i];
        b.ph += dt * b.sw;
        b.y += b.vy * dt;
        b.x += Math.sin(b.ph) * (spec.kind === "leaf" ? 26 : 12) * dt;
        var out = spec.kind === "ember" ? b.y < -12 : b.y > H + 20;
        if (out || b.x < -30 || b.x > W + 30) { bits[i] = spawn(false); continue; }

        if (spec.kind === "ember") {
          var up = 1 - b.y / H;
          var fade = up < 0.7 ? 1 : Math.max(0, 1 - (up - 0.7) / 0.3);
          ctx.globalAlpha = b.life * fade * (0.7 + 0.3 * Math.sin(b.ph * 3));
        } else {
          ctx.globalAlpha = b.life;
        }
        ctx.fillStyle = b.c;
        if (spec.kind === "ember") {
          ctx.globalAlpha *= 0.22;
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 2.6, 0, 6.283); ctx.fill();
          ctx.globalAlpha /= 0.22;
        }
        if (spec.kind === "leaf") {
          b.rot += b.vr * dt;
          ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot);
          ctx.beginPath(); ctx.ellipse(0, 0, b.r, b.r * 0.46, 0, 0, 6.283); ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    function start() { if (live || !W) return; live = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    function stop()  { live = false; if (raf) { cancelAnimationFrame(raf); raf = null; } }

    size(); build();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () { var w0 = W; size(); if (Math.abs(W - w0) > 40) build(); }).observe(hero);
    }
    /* only run while the hero is on screen and the tab is visible */
    var onScreen = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        onScreen = e[0].isIntersecting;
        onScreen && !document.hidden ? start() : stop();
      }).observe(hero);
    } else {
      start();
    }
    document.addEventListener("visibilitychange", function () {
      document.hidden || !onScreen ? stop() : start();
    });
  })();


  /* ═══ 10 · CASE-STUDY CONTENTS ════════════════════════════════ */
  (function () {
    var toc = document.querySelector("[data-toc]");
    if (!toc) return;
    var links = [].slice.call(toc.querySelectorAll('a[href^="#"]'));
    var pairs = links.map(function (a) {
      return { a: a, s: document.getElementById(a.getAttribute("href").slice(1)) };
    }).filter(function (p) { return p.s; });
    var current = null;
    onFrame(function () {
      var line = window.innerHeight * 0.3, active = null;
      pairs.forEach(function (p) { if (p.s.getBoundingClientRect().top <= line) active = p; });
      if (active === current) return;
      current = active;
      pairs.forEach(function (p) {
        if (p === active) p.a.setAttribute("aria-current", "true");
        else p.a.removeAttribute("aria-current");
      });
    });
  })();


  /* ═══ Kick everything once layout has settled ═════════════════ */
  window.addEventListener("load", requestFrame);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(requestFrame);
  requestFrame();
})();


/* ═══════════════════════════════════════════════════════════════
   NFL SEASON HUB · interactive demo
   Real play-by-play, fetched once from the deployed app's public
   JSON and inlined. Mirrors the real project: a fractional cursor
   advanced by elapsed time repaints the canvas directly, and DOM
   readouts change only when the whole-play index changes.
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

  /* lift a team colour until it is legible on the dark card */
  function lift(hex, bg, target) {
    function rgb(h) {
      h = h.replace("#", "");
      if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
    }
    function lum(c) {
      var a = c.map(function (v) { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
      return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2];
    }
    function ratio(a, b) { var l1 = lum(a), l2 = lum(b); return (Math.max(l1,l2) + 0.05) / (Math.min(l1,l2) + 0.05); }
    var c = rgb(hex), b = rgb(bg);
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

  var CARD = "#0e1522";                     /* must match .win in styles.css */
  var HOME = lift(D.g.h.c, CARD, 4.5);      /* MIN; also used as axis text */
  var AWAY = lift(D.g.a.c, CARD, 4.5);      /* IND */

  var $ = function (s) { return host.querySelector(s); };
  var elCanvas = $("[data-canvas]"), elSeek = $("[data-seek]"), elPlay = $("[data-play]");
  var elHS = $("[data-hs]"), elAS = $("[data-as]"), elWP = $("[data-wp]");
  var elClock = $("[data-clock]"), elN = $("[data-n]"), elDesc = $("[data-desc]"), elOT = $("[data-ot]");
  $("[data-sw-home]").style.setProperty("--c", HOME);
  $("[data-sw-away]").style.setProperty("--c", AWAY);
  $("[data-ax-top]").style.color = HOME;
  $("[data-ax-bot]").style.color = AWAY;

  var keyAt = new Array(N);
  (function () {
    var byIndex = {}, kp = null;
    D.key.forEach(function (k) { byIndex[k.i] = k.t; });
    for (var i = 0; i < N; i++) { if (byIndex[i] !== undefined) kp = byIndex[i]; keyAt[i] = kp; }
  })();
  var isKey = {}; D.key.forEach(function (k) { isKey[k.i] = 1; });

  var ctx = elCanvas.getContext("2d");
  var W = 0, H = 0;

  function measure() {
    var r = elCanvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
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

    ctx.lineWidth = 1;
    [0, 250, 500, 750, 1000].forEach(function (p) {
      var y = Math.round(yAt(p)) + 0.5;
      ctx.strokeStyle = p === 500 ? "rgba(163,180,201,.24)" : "rgba(163,180,201,.08)";
      ctx.setLineDash(p === 500 ? [4, 4] : []);
      ctx.beginPath(); ctx.moveTo(PADX, y); ctx.lineTo(W - PADX, y); ctx.stroke();
    });
    ctx.setLineDash([]);

    var lastQ = D.q[0];
    for (var i = 1; i < N; i++) {
      if (D.q[i] !== lastQ) {
        var x = Math.round(xAt(i)) + 0.5;
        ctx.strokeStyle = "rgba(163,180,201,.10)";
        ctx.beginPath(); ctx.moveTo(x, PADY); ctx.lineTo(x, H - PADY); ctx.stroke();
        lastQ = D.q[i];
      }
    }
    if (upto <= 0) return;

    var frac = upto - whole;
    var headP = whole >= LAST ? D.wp[LAST] : D.wp[whole] + (D.wp[whole + 1] - D.wp[whole]) * frac;
    var headX = xAt(upto), headY = yAt(headP);

    var grad = ctx.createLinearGradient(0, PADY, 0, H - PADY);
    grad.addColorStop(0,   HOME.replace("rgb(", "rgba(").replace(")", ",.30)"));
    grad.addColorStop(0.5, "rgba(255,255,255,.04)");
    grad.addColorStop(1,   AWAY.replace("rgb(", "rgba(").replace(")", ",.30)"));
    ctx.beginPath();
    ctx.moveTo(xAt(0), yAt(500));
    for (var j = 0; j <= whole; j++) ctx.lineTo(xAt(j), yAt(D.wp[j]));
    ctx.lineTo(headX, headY);
    ctx.lineTo(headX, yAt(500));
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    var stroke = ctx.createLinearGradient(0, PADY, 0, H - PADY);
    stroke.addColorStop(0, HOME); stroke.addColorStop(1, AWAY);
    ctx.strokeStyle = stroke; ctx.lineWidth = 2.2;
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(xAt(0), yAt(D.wp[0]));
    for (var k = 1; k <= whole; k++) ctx.lineTo(xAt(k), yAt(D.wp[k]));
    ctx.lineTo(headX, headY);
    ctx.stroke();

    for (var m = 0; m <= whole; m++) {
      if (!isKey[m]) continue;
      ctx.beginPath(); ctx.arc(xAt(m), yAt(D.wp[m]), 3.1, 0, 6.283);
      ctx.fillStyle = "#fff"; ctx.fill();
      ctx.beginPath(); ctx.arc(xAt(m), yAt(D.wp[m]), 5.6, 0, 6.283);
      ctx.strokeStyle = "rgba(255,255,255,.30)"; ctx.lineWidth = 1; ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(headX, PADY); ctx.lineTo(headX, H - PADY); ctx.stroke();
    ctx.beginPath(); ctx.arc(headX, headY, 4.6, 0, 6.283);
    ctx.fillStyle = "#fff"; ctx.fill();
  }

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
    /* a range input announces its raw value ("150"); give the game state instead */
    elSeek.setAttribute("aria-valuetext",
      "Play " + (i + 1) + " of " + (LAST + 1) + ", " + elClock.textContent + ", IND " + D.as[i] +
      ", MIN " + D.hs[i] + ", Minnesota " + Math.round(D.wp[i] / 10) + " percent to win");
  }

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

  var leagueDone = false;
  function league() {
    if (leagueDone) return;
    leagueDone = true;
    var wrap = host.querySelector("[data-league]");
    /* scale against the visible range: every team wins between 6 and 12,
       so a zero-based bar would make them all look identical */
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

  var loadBtn = host.querySelector("[data-loadapp]");
  if (loadBtn) loadBtn.addEventListener("click", function () {
    var fac = host.querySelector("[data-fac]");
    var f = document.createElement("iframe");
    f.className = "appframe";
    f.src = "https://nfl-season-hub.vercel.app";
    f.title = "NFL Season Hub, the live deployed application";
    var wrap = document.createElement("div");
    wrap.className = "appwrap is-loading";
    wrap.setAttribute("aria-busy", "true");
    wrap.innerHTML = '<span class="appwrap__msg" role="status">Loading the live app…</span>';
    f.addEventListener("load", function () {
      wrap.classList.remove("is-loading");
      wrap.removeAttribute("aria-busy");
    });
    wrap.appendChild(f);
    fac.replaceWith(wrap);
    f.focus();
  });

  /* autoplay once when scrolled into view; pause when it leaves */
  measure(); readout(0);
  if (reduce) { cursor = LAST; draw(cursor); readout(cursor); }
  else if ("IntersectionObserver" in window) {
    var kicked = false;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { if (!kicked) { kicked = true; start(); } }
        else if (playing) stop();
      });
    }, { threshold: 0.4 }).observe(elCanvas);
  }
})();
