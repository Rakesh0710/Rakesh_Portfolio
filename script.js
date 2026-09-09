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
  document.querySelectorAll("[data-split]").forEach(function (el, lineIndex) {
    var words = el.textContent.trim().split(/\s+/);
    var n = lineIndex * 9;
    var html = "";

    words.forEach(function (word, w) {
      html += '<span class="wd">';
      for (var c = 0; c < word.length; c++) {
        html += '<span class="glyph" style="--i:' + n + '">' + esc(word[c]) + "</span>";
        n++;
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
    var ids = ["live", "work", "project", "stack"];
    var sections = ids.map(function (id) { return document.getElementById(id); }).filter(Boolean);

    if (sections.length) {
      onFrame(function () {
        var line = window.innerHeight * 0.4;
        var active = null;
        sections.forEach(function (s) {
          var r = s.getBoundingClientRect();
          if (r.top <= line && r.bottom > line) active = s.id;
        });
        ids.forEach(function (id) {
          if (links[id]) links[id].classList.toggle("is-here", id === active);
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
    [".nums__grid", ".pillar-grid", ".cards", ".live__grid"].forEach(function (sel) {
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
      if (phone) phone.style.transform = "";
      chrome(0);
      current = -1;
    }

    function show(i) {
      if (i === current) return;
      current = i;
      slides.forEach(function (s, n) { s.classList.toggle("is-on", n === i); });
      screens.forEach(function (s, n) { s.classList.toggle("is-on", n === i); });
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
     9 · Kick everything once layout has settled
     ═══════════════════════════════════════════════════════════════ */
  window.addEventListener("load", requestFrame);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(requestFrame);
  requestFrame();
})();
