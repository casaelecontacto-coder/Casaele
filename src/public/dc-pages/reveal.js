(function () {
  var EASE = 'cubic-bezier(.16,.84,.28,1)';
  var DUR = 1.05;              // seconds
  var STEP = 130;              // stagger between items in a batch
  var LEAD = 120;              // small delay before anything starts moving
  var prepped = new WeakSet();
  var flushing = null;

  var STYLES = [
    { sel: 'h1,h2', from: 'translateY(38px)', dur: 1.15 },
    { sel: 'h3', from: 'translateY(24px)', dur: .95 },
    { sel: 'article,[data-reveal-card]', from: 'translateY(34px) scale(.965)', dur: 1.05 },
    { sel: 'img[data-reveal-img]', from: 'scale(1.06)', dur: 1.3 },
    { sel: '[data-reveal-left]', from: 'translateX(-34px)', dur: 1 },
    { sel: '[data-reveal-right]', from: 'translateX(34px)', dur: 1 },
    { sel: '[data-reveal]', from: 'translateY(28px)', dur: 1 }
  ];
  var SEL = STYLES.map(function (s) { return s.sel; }).join(',');

  function fromFor(el) {
    for (var i = 0; i < STYLES.length; i++) {
      if (el.matches(STYLES[i].sel)) return STYLES[i];
    }
    return { from: 'translateY(26px)', dur: DUR };
  }

  function done(el) {
    el.style.removeProperty('opacity');
    el.style.removeProperty('transform');
    el.style.removeProperty('transition');
    el.style.removeProperty('filter');
    el.removeAttribute('data-revealing');
  }

  function show(el, delay) {
    setTimeout(function () {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.filter = 'none';
      setTimeout(function () { done(el); }, 1500);
    }, delay);
  }

  var io = new IntersectionObserver(function (entries) {
    var batch = entries.filter(function (e) { return e.isIntersecting; });
    batch.forEach(function (e, i) {
      io.unobserve(e.target);
      show(e.target, LEAD + Math.min(i * STEP, 620));
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

  function prep(el) {
    if (prepped.has(el) || el.closest('header') || el.hasAttribute('data-no-reveal')) return;
    prepped.add(el);
    var cfg = fromFor(el);
    el.setAttribute('data-revealing', '');
    el.style.opacity = '0';
    el.style.transform = cfg.from;
    el.style.filter = 'blur(5px)';
    el.style.transition =
      'opacity ' + cfg.dur + 's ' + EASE +
      ', transform ' + cfg.dur + 's ' + EASE +
      ', filter ' + cfg.dur + 's ' + EASE;
    io.observe(el);
  }

  function scan() {
    if (flushing) return;
    flushing = requestAnimationFrame(function () {
      flushing = null;
      document.querySelectorAll(SEL).forEach(prep);
    });
  }

  function bar() {
    var el = document.querySelector('[data-progress-bar]');
    if (!el) return;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    el.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
  }

  function start() {
    scan();
    bar();
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', bar, { passive: true });
    window.addEventListener('resize', bar);
    setTimeout(function () {
      document.querySelectorAll('[data-revealing]').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 1.2) show(el, 0);
      });
    }, 3200);
  }

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
