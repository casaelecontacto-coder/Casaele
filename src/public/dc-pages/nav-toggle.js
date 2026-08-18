// Mobile nav toggle for the static dc-pages (Home / Material / Products /
// DELE Course / Library). Opens/closes the off-canvas nav panel added on
// small screens; desktop layout is untouched by this script.
//
// This file is loaded from a <script src> that sits inside <x-dc>, and the
// page's own dc-runtime reconstructs that subtree's original markup
// (including script tags) once it finishes hydrating -- so this script
// runs a second time. Guard globally so only the first run ever binds;
// otherwise two independent listeners fire per click and the open/close
// toggle cancels itself out on every tap.
(function () {
  if (window.__casaNavToggleBound) return;
  window.__casaNavToggleBound = true;

  function closeAll() {
    document.querySelectorAll('header[data-nav-open]').forEach(function (h) {
      h.removeAttribute('data-nav-open');
      var btn = h.querySelector('[data-m~="hburger"]');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
    document.documentElement.style.overflow = '';
  }

  function bind() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-m~="hburger"]');
      if (btn) {
        var header = btn.closest('header');
        var isOpen = header.hasAttribute('data-nav-open');
        if (isOpen) {
          closeAll();
        } else {
          header.setAttribute('data-nav-open', '');
          btn.setAttribute('aria-expanded', 'true');
          document.documentElement.style.overflow = 'hidden';
        }
        return;
      }
      if (e.target.closest('[data-m~="navbackdrop"]')) {
        closeAll();
        return;
      }
      var link = e.target.closest('[data-m~="navwrap"] a');
      if (link) closeAll();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll();
    });
  }

  if (!document.querySelector('x-dc')) {
    bind();
  } else {
    // Observe <html>, not <body> -- the dc-runtime may replace <body>
    // wholesale rather than just mutating its children, which would
    // orphan an observer attached to the original <body> reference.
    var mo = new MutationObserver(function () {
      if (!document.querySelector('x-dc')) {
        mo.disconnect();
        bind();
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
