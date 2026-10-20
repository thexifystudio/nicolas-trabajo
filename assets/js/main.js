// Portafolio — interacciones mínimas: navegación, aparición al scroll y visor de imágenes.
(function () {
  // Navegación con fondo al hacer scroll
  var nav = document.getElementById('nav');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Aparición al hacer scroll
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // Visor de imágenes (cada proyecto es su propia galería)
  var lb = document.getElementById('lb');
  var lbImg = document.getElementById('lb-img');
  var lbCap = document.getElementById('lb-cap');
  var lbCount = document.getElementById('lb-count');
  var lbStage = lb.querySelector('.lb-stage');
  var group = [], index = 0, lastFocus = null;

  function captionFor(a) {
    var fig = a.closest('figure');
    var cap = fig && fig.querySelector('figcaption');
    return a.getAttribute('data-caption') || (cap ? cap.textContent.trim() : '') || (a.querySelector('img') || {}).alt || '';
  }

  function show(i) {
    index = (i + group.length) % group.length;
    var a = group[index];
    lb.classList.toggle('is-tall', a.hasAttribute('data-tall'));
    lbImg.src = a.getAttribute('href');
    lbImg.alt = (a.querySelector('img') || {}).alt || '';
    lbCap.textContent = captionFor(a);
    lbCount.textContent = (index + 1) + ' / ' + group.length;
    lbStage.scrollTop = 0;
    var multi = group.length > 1;
    lb.querySelectorAll('[data-lb-nav]').forEach(function (b) { b.hidden = !multi; });
  }

  function open(a) {
    var scope = a.closest('[data-gallery]') || document;
    group = Array.prototype.slice.call(scope.querySelectorAll('a.zoom'));
    lastFocus = a;
    lb.hidden = false;
    document.body.classList.add('lb-open');
    show(group.indexOf(a));
    lb.querySelector('[data-lb-close]').focus();
  }

  function close() {
    lb.hidden = true;
    lbImg.removeAttribute('src');
    document.body.classList.remove('lb-open');
    if (lastFocus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a.zoom');
    if (a) { e.preventDefault(); open(a); }
  });
  lb.querySelector('[data-lb-close]').addEventListener('click', close);
  lb.querySelector('[data-lb-prev]').addEventListener('click', function () { show(index - 1); });
  lb.querySelector('[data-lb-next]').addEventListener('click', function () { show(index + 1); });
  lbStage.addEventListener('click', function (e) { if (e.target === lbStage) close(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight' && group.length > 1) show(index + 1);
    else if (e.key === 'ArrowLeft' && group.length > 1) show(index - 1);
  });
})();
