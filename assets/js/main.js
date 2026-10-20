// Portafolio: el escalímetro que mide la página, las tiras de láminas y el visor.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Números de graduación ----------
  function numbers(el, count, step) {
    var html = '';
    for (var i = 0; i <= count; i++) html += '<span style="left:' + (i * step) + 'px">' + i + '</span>';
    el.innerHTML = html;
  }
  document.querySelectorAll('[data-nums]').forEach(function (el) {
    numbers(el, Math.ceil(window.innerWidth / 60) + 2, 60);
  });

  // ---------- Barra: la regla avanza con el scroll ----------
  var track = document.querySelector('#bar .bar-track');
  var K = 0.25; // la regla avanza 1px por cada 4px de scroll
  if (track) {
    var maxShift = Math.ceil((document.documentElement.scrollHeight * K + window.innerWidth) / 60) + 4;
    track.style.width = (maxShift * 60) + 'px';
    numbers(track.querySelector('.grad-nums'), maxShift, 60);
  }
  var bands = Array.prototype.map.call(document.querySelectorAll('section[data-sem] .band-fill'), function (fill) {
    return { fill: fill, sec: fill.closest('section') };
  });

  // Regla de portada: marca cada semestre donde realmente cae en el portafolio
  var marks = document.querySelector('[data-marks]');
  function placeMarks() {
    if (!marks) return;
    var total = document.documentElement.scrollHeight;
    var html = '';
    document.querySelectorAll('#bar .chip').forEach(function (chip) {
      var sec = document.querySelector(chip.getAttribute('href'));
      if (!sec) return;
      var pct = (sec.offsetTop / total * 100).toFixed(2);
      html += '<a href="' + chip.getAttribute('href') + '" style="left:' + pct + '%;--c:' + chip.style.getPropertyValue('--c') + '" aria-label="' + chip.getAttribute('aria-label') + '">' + chip.textContent + '</a>';
    });
    marks.innerHTML = html;
  }
  placeMarks();
  window.addEventListener('load', placeMarks);
  window.addEventListener('resize', placeMarks);

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      if (track) track.style.transform = 'translateX(' + (-window.scrollY * K) + 'px)';
      // cada banda de semestre mide cuánto llevas recorrido de ese semestre
      var mid = window.scrollY + window.innerHeight / 2;
      bands.forEach(function (b) {
        var p = (mid - b.sec.offsetTop) / b.sec.offsetHeight;
        b.fill.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(3));
      });
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Semestre activo: solo su arista se enciende ----------
  var chips = document.querySelectorAll('#bar .chip');
  var sections = document.querySelectorAll('[data-sem]');
  var read = document.querySelector('#bar .read');
  var readCode = read.querySelector('.rc');
  var readEsc = read.querySelector('.re');
  var COLORS = { iii: '#8a5c0c', v: 'var(--s5)', vi: 'var(--s6)', vii: 'var(--s7)' };

  function setReading(code, esc, sem) {
    if (readCode.textContent === code) return;
    read.classList.add('roll');
    requestAnimationFrame(function () {
      readCode.textContent = code;
      readCode.setAttribute('href', '#' + (/^[IVX]+-/.test(code) ? code : ({ 'Portada': 'portada', 'Índice': 'indice', 'Perfil': 'sobre' }[code] || 'portada')));
      readEsc.textContent = esc;
      read.style.setProperty('--rc', COLORS[sem] || 'var(--ink)');
      requestAnimationFrame(function () { read.classList.remove('roll'); });
    });
  }

  if ('IntersectionObserver' in window) {
    var secIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var sem = e.target.getAttribute('data-sem');
        chips.forEach(function (c) { c.setAttribute('aria-current', c.getAttribute('data-chip') === sem ? 'true' : 'false'); });
        if (!sem) setReading(e.target.id === 'portada' ? 'Portada' : e.target.id === 'indice' ? 'Índice' : 'Perfil', 'Esc. —', '');
      });
    }, { rootMargin: '-45% 0px -54% 0px' });
    sections.forEach(function (s) { secIO.observe(s); });

    // La lectura: código y escala de la lámina que estás mirando
    var figIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var f = e.target;
        var sec = f.closest('[data-sem]');
        var esc = f.getAttribute('data-escala');
        setReading(f.getAttribute('data-code'), esc === 'Lámina' ? 'Completa' : 'Esc. ' + esc, sec ? sec.getAttribute('data-sem') : '');
      });
    }, { rootMargin: '-30% 0px -30% 0px', threshold: 0.5 });
    document.querySelectorAll('figure[data-code]').forEach(function (f) { figIO.observe(f); });
  }

  // ---------- Tiras de láminas ----------
  document.querySelectorAll('[data-strip]').forEach(function (strip) {
    var tr = strip.querySelector('.strip-track');
    var sheets = Array.prototype.slice.call(tr.querySelectorAll('.sheet'));
    var count = strip.querySelector('[data-count]');
    var prev = strip.querySelector('[data-prev]');
    var next = strip.querySelector('[data-next]');
    var rule = strip.querySelector('.strip-rule');
    var total = String(sheets.length).padStart(2, '0');

    function current() {
      var x = tr.scrollLeft + 8, idx = 0;
      sheets.forEach(function (s, i) { if (s.offsetLeft - sheets[0].offsetLeft <= x) idx = i; });
      if (tr.scrollLeft + tr.clientWidth >= tr.scrollWidth - 4) idx = sheets.length - 1;
      return idx;
    }
    function update() {
      var i = current();
      count.textContent = String(i + 1).padStart(2, '0') + ' / ' + total;
      prev.disabled = tr.scrollLeft <= 2;
      next.disabled = tr.scrollLeft + tr.clientWidth >= tr.scrollWidth - 2;
      rule.style.setProperty('--gx', (-tr.scrollLeft) + 'px');
    }
    function go(d) {
      var i = Math.max(0, Math.min(sheets.length - 1, current() + d));
      tr.scrollTo({ left: sheets[i].offsetLeft - sheets[0].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
    }
    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    tr.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    tr.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });

    // Arrastrar con el mouse, como deslizar una regla
    var down = false, moved = false, sx = 0, sl = 0;
    tr.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; sx = e.clientX; sl = tr.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 5) { moved = true; tr.classList.add('dragging'); }
      if (moved) tr.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      setTimeout(function () { tr.classList.remove('dragging'); }, 0);
    });
    update();
    window.addEventListener('resize', update);
  });

  // ---------- Visor ----------
  var lb = document.getElementById('lb');
  var lbImg = document.getElementById('lb-img');
  var lbCode = document.getElementById('lb-code');
  var lbCap = document.getElementById('lb-cap');
  var lbMeta = document.getElementById('lb-meta');
  var stage = lb.querySelector('.lb-stage');
  var group = [], index = 0, lastFocus = null;

  function info(a) {
    var fig = a.closest('figure');
    var t = fig && fig.querySelector('.cap .t');
    return {
      code: (fig && fig.getAttribute('data-code')) || '',
      esc: (fig && fig.getAttribute('data-escala')) || '',
      cap: a.getAttribute('data-caption') || (t ? t.textContent : '') || ((a.querySelector('img') || {}).alt || '')
    };
  }
  function show(i) {
    index = (i + group.length) % group.length;
    var a = group[index], d = info(a);
    var sec = a.closest('[data-sem]');
    lb.classList.toggle('is-tall', a.hasAttribute('data-tall'));
    lb.style.setProperty('--lbc', sec ? getComputedStyle(sec).getPropertyValue('--c') : '');
    lbImg.src = a.getAttribute('href');
    lbImg.alt = (a.querySelector('img') || {}).alt || d.cap;
    lbCode.textContent = d.code;
    lbCap.textContent = d.cap;
    lbMeta.textContent = (d.esc && d.esc !== 'Lámina' ? 'Esc. ' + d.esc + '   ·   ' : '') + (index + 1) + ' / ' + group.length;
    stage.scrollTop = 0;
    if (d.code && history.replaceState) history.replaceState(null, '', '#' + d.code);
    lb.querySelectorAll('[data-lb-nav]').forEach(function (b) { b.hidden = group.length < 2; });
  }
  function open(a) {
    var scope = a.closest('[data-gallery]') || document;
    group = Array.prototype.slice.call(scope.querySelectorAll('a.zoom')).filter(function (x) {
      return !x.classList.contains('btn');
    });
    var start = group.indexOf(a);
    if (start < 0) { // el botón "Abrir lámina" abre la miniatura de la lámina
      start = group.findIndex(function (x) { return x.getAttribute('href') === a.getAttribute('href'); });
    }
    lastFocus = a;
    lb.hidden = false;
    document.body.classList.add('lb-open');
    show(Math.max(0, start));
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
    if (!a) return;
    e.preventDefault();
    open(a);
  });
  lb.querySelector('[data-lb-close]').addEventListener('click', close);
  lb.querySelector('[data-lb-prev]').addEventListener('click', function () { show(index - 1); });
  lb.querySelector('[data-lb-next]').addEventListener('click', function () { show(index + 1); });
  stage.addEventListener('click', function (e) { if (e.target === stage) close(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight' && group.length > 1) show(index + 1);
    else if (e.key === 'ArrowLeft' && group.length > 1) show(index - 1);
    else if (e.key === 'Tab') { // mantener el foco dentro del visor
      var f = Array.prototype.slice.call(lb.querySelectorAll('button:not([hidden])'));
      var i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
})();
