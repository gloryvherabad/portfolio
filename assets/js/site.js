/* Glory · site behaviour. No dependencies. */
(function () {
  var root = document.documentElement;
  function motionOn() { return !root.classList.contains('no-motion'); }

  /* ---------- year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- motion toggle (WCAG 2.2.2: pause moving content) ---------- */
  document.querySelectorAll('[data-motion-toggle]').forEach(function (btn) {
    function sync() {
      var on = motionOn();
      btn.setAttribute('aria-pressed', on ? 'false' : 'true');
      btn.setAttribute('aria-label', on ? 'Pause animations' : 'Play animations');
      btn.setAttribute('title', on ? 'Pause animations' : 'Play animations');
    }
    sync();
    btn.addEventListener('click', function () {
      var on = !motionOn();
      root.classList.toggle('no-motion', !on);
      if (on) {
        root.classList.add('js-motion');
        document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
      }
      try { localStorage.setItem('motion', on ? 'on' : 'off'); } catch (e) {}
      document.dispatchEvent(new CustomEvent('motionchange', { detail: { on: on } }));
      document.querySelectorAll('[data-motion-toggle]').forEach(function () {});
      sync();
    });
  });

  /* ---------- header: solid after scroll, hide on scroll down ---------- */
  var header = document.querySelector('.site-header');
  var lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    if (!header) return;
    header.classList.toggle('is-solid', y > 40);
    var menuOpen = document.querySelector('.nav-list.is-open');
    header.classList.toggle('is-hidden', !menuOpen && y > 400 && y > lastY && !header.contains(document.activeElement));
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var menu = document.getElementById('site-menu');
  if (menuBtn && menu) {
    function setMenu(open) {
      menu.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (open) header.classList.add('is-solid');
    }
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
    });
    window.matchMedia('(min-width: 761px)').addEventListener('change', function () { setMenu(false); });
  }

  /* ---------- hero intro ---------- */
  var hero = document.querySelector('.hero');
  if (hero) requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('is-in'); }); });

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && motionOn()) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- cursor bubble over work cards (decorative) ---------- */
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var cards = document.querySelectorAll('.work-card');
  if (fine && cards.length) {
    var bubble = document.createElement('div');
    bubble.className = 'cursor-bubble';
    bubble.setAttribute('aria-hidden', 'true');
    bubble.innerHTML = 'View<br>case study';
    document.body.appendChild(bubble);
    var bx = 0, by = 0, cx = 0, cy = 0, ticking = false;
    function follow() {
      cx += (bx - cx) * 0.2; cy += (by - cy) * 0.2;
      bubble.style.left = cx + 'px'; bubble.style.top = cy + 'px';
      if (Math.abs(bx - cx) > 0.5 || Math.abs(by - cy) > 0.5) requestAnimationFrame(follow); else ticking = false;
    }
    window.addEventListener('pointermove', function (e) {
      bx = e.clientX; by = e.clientY;
      if (!motionOn()) { cx = bx; cy = by; }
      if (!ticking) { ticking = true; requestAnimationFrame(follow); }
    }, { passive: true });
    cards.forEach(function (c) {
      var media = c.querySelector('.media');
      if (!media) return;
      media.addEventListener('pointerenter', function () { bubble.classList.add('is-on'); });
      media.addEventListener('pointerleave', function () { bubble.classList.remove('is-on'); });
    });
  }

  /* ---------- compare slider ---------- */
  document.querySelectorAll('.compare').forEach(function (cmp) {
    var input = cmp.querySelector('input[type="range"]');
    function set(v) {
      cmp.style.setProperty('--pos', v + '%');
      input.setAttribute('aria-valuetext', v < 35 ? 'Mostly the refined design' : v > 65 ? 'Mostly the AI first draft' : 'Half and half');
    }
    input.addEventListener('input', function () { set(input.value); });
    set(input.value);
  });

  /* ---------- draggable stickers (about) ---------- */
  var desk = document.querySelector('.desk');
  if (desk) {
    var stickers = Array.prototype.slice.call(desk.querySelectorAll('.sticker'));
    var z = 1;
    function place(el, x, y) {
      var maxX = desk.clientWidth - el.offsetWidth, maxY = desk.clientHeight - el.offsetHeight;
      x = Math.max(0, Math.min(maxX, x)); y = Math.max(0, Math.min(maxY, y));
      el.dataset.x = x; el.dataset.y = y;
      el.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + (el.dataset.r || 0) + 'deg)';
    }
    function scatter() {
      var w = desk.clientWidth, h = desk.clientHeight;
      stickers.forEach(function (el, i) {
        var fx = parseFloat(el.dataset.fx), fy = parseFloat(el.dataset.fy);
        el.dataset.r = el.dataset.rot || ((i % 2 ? 1 : -1) * (4 + i * 2));
        place(el, fx * (w - el.offsetWidth), fy * (h - el.offsetHeight));
      });
    }
    scatter();
    window.addEventListener('resize', scatter);
    document.querySelector('[data-desk-reset]') && document.querySelector('[data-desk-reset]').addEventListener('click', scatter);

    stickers.forEach(function (el) {
      var sx, sy, ox, oy, id = null;
      el.addEventListener('pointerdown', function (e) {
        id = e.pointerId; el.setPointerCapture(id);
        sx = e.clientX; sy = e.clientY; ox = +el.dataset.x; oy = +el.dataset.y;
        el.style.zIndex = ++z; el.classList.add('is-dragging');
      });
      el.addEventListener('pointermove', function (e) {
        if (e.pointerId !== id) return;
        place(el, ox + e.clientX - sx, oy + e.clientY - sy);
      });
      function end(e) { if (e.pointerId !== id) return; id = null; el.classList.remove('is-dragging'); }
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      // keyboard: arrows move, shift = bigger steps
      el.addEventListener('keydown', function (e) {
        var step = e.shiftKey ? 40 : 10, x = +el.dataset.x, y = +el.dataset.y;
        if (e.key === 'ArrowLeft') x -= step; else if (e.key === 'ArrowRight') x += step;
        else if (e.key === 'ArrowUp') y -= step; else if (e.key === 'ArrowDown') y += step;
        else return;
        e.preventDefault(); el.style.zIndex = ++z; place(el, x, y);
      });
    });
  }

  /* ---------- contact form: validate on blur, clear on fix ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    var status = document.getElementById('form-status');
    var fields = form.querySelectorAll('input[required], textarea[required], input[type="email"]');
    function check(f) {
      var err = document.getElementById(f.id + '-error');
      var msg = '';
      if (f.validity.valueMissing) msg = 'Add your ' + f.dataset.name + ' so I know how to reply.';
      else if (f.validity.typeMismatch) msg = 'This email looks incomplete. Try name@company.com.';
      f.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg;
      return !msg;
    }
    fields.forEach(function (f) {
      f.addEventListener('blur', function () { if (f.value) check(f); });
      f.addEventListener('input', function () { if (f.getAttribute('aria-invalid') === 'true') check(f); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (f) { if (!check(f) && !firstBad) firstBad = f; });
      if (firstBad) { firstBad.focus(); status.textContent = 'A couple of fields need a look before this can send.'; return; }

      var action = form.getAttribute('action') || '';
      var email = form.dataset.email;
      // no form endpoint configured yet: hand off to the visitor's mail app
      if (!action || action.indexOf('YOUR_FORM_ID') !== -1) {
        var body = form.message.value + '\n\n' + form.name.value + (form.company.value ? ', ' + form.company.value : '');
        window.location.href = 'mailto:' + email + '?subject=' + encodeURIComponent('Project inquiry from ' + form.name.value) + '&body=' + encodeURIComponent(body);
        status.textContent = 'Opening your email app with your message filled in.';
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true; status.textContent = 'Sending your message…';
      fetch(action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error();
          form.reset(); status.textContent = 'Thank you. Your message is in my inbox and I will reply within two business days.';
        })
        .catch(function () {
          status.innerHTML = 'That did not send on my end. Please try again, or email me at <a class="link" href="mailto:' + email + '">' + email + '</a>.';
        })
        .then(function () { btn.disabled = false; });
    });
  }
})();
