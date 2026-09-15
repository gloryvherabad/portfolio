var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- year ----
document.querySelectorAll('#yr').forEach(function (el) {
  el.textContent = new Date().getFullYear();
});

// ---- mobile menu ----
var burger = document.getElementById('burger');
var menu = document.getElementById('menu');
if (burger && menu) {
  burger.addEventListener('click', function () { menu.classList.toggle('open'); });
}

// ---- split the hero headline into animated words ----
function splitHeadline() {
  var h = document.querySelector('.hero h1');
  if (!h || h.dataset.split) return;
  h.dataset.split = '1';

  function walk(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        var frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
          var w = document.createElement('span');
          w.className = 'w';
          var i = document.createElement('i');
          i.textContent = part;
          w.appendChild(i);
          frag.appendChild(w);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1) {
        walk(child);
      }
    });
  }
  walk(h);

  h.querySelectorAll('.w i').forEach(function (i, idx) {
    i.style.transitionDelay = (0.05 + idx * 0.045) + 's';
  });
}

// ---- tag elements that animate ----
function tagAnimatables(root) {
  root = root || document;
  root.querySelectorAll('.card, .cell, .step, .sec-head, .form, .links, .story > div')
    .forEach(function (el) { el.classList.add('reveal'); });
  root.querySelectorAll('.statement p').forEach(function (el) { el.classList.add('line'); });
  root.querySelectorAll('.hero > .wrap > *').forEach(function (el) { el.classList.add('rise'); });
}

// ---- scroll reveals ----
var io = null;
function observeAll(root) {
  root = root || document;
  var targets = root.querySelectorAll('.reveal, .line, .step');
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  if (!io) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  }
  targets.forEach(function (el) { io.observe(el); });
}

// ---- progress bar + percent counter ----
var bar = document.getElementById('progress');
var counter = document.getElementById('counter');
var marqueeInner = document.querySelector('.marquee div');
var lastY = 0;

function onScroll() {
  var h = document.documentElement.scrollHeight - window.innerHeight;
  var pct = h > 0 ? window.scrollY / h : 0;

  if (bar) bar.style.width = (pct * 100) + '%';

  if (counter) {
    var n = Math.round(pct * 100);
    counter.textContent = (n < 10 ? '00' : n < 100 ? '0' : '') + n + '%';
    counter.classList.toggle('lit', n > 2);
  }

  if (marqueeInner && !reduced) {
    marqueeInner.style.animationDirection = window.scrollY > lastY ? 'normal' : 'reverse';
  }
  lastY = window.scrollY;
}

function boot() {
  splitHeadline();
  tagAnimatables();
  observeAll();
  requestAnimationFrame(function () { document.body.classList.add('loaded'); });
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

if (document.readyState !== 'loading') boot();
else document.addEventListener('DOMContentLoaded', boot);

// ---- contact form ----
var form = document.getElementById('contactForm');
if (form) {
  var status = document.getElementById('status');
  var btn = document.getElementById('submitBtn');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (form.action.indexOf('YOUR_FORM_ID') !== -1) {
      status.textContent = 'Form not connected yet. Add your Formspree ID to the form action.';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending...';
    status.textContent = '';

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    }).then(function (res) {
      if (res.ok) {
        form.reset();
        status.textContent = 'Message sent. I will get back to you soon.';
      } else {
        status.textContent = 'That did not send. Email me directly at hello@yourdomain.com.';
      }
    }).catch(function () {
      status.textContent = 'Network problem. Try again, or email me directly.';
    }).then(function () {
      btn.disabled = false;
      btn.textContent = 'Send message';
    });
  });
}
