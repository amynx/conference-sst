/* I Congreso Nacional e Internacional en SST — interacciones del sitio */
(function () {
  'use strict';

  /* ===== CONFIGURACIÓN =====
     Enlace del formulario de inscripción para cada modalidad.
     Si un enlace queda vacío, el botón «Continuar a la inscripción» no navega. */
  var FORMULARIO = 'https://script.google.com/macros/s/AKfycbzFbuIHIGAt6Qzu0JEtdtC7xSiuY-aFxTGHKP4vpxh0lcrqjanJ0_molqV-YIMtSb0hdQ/exec';
  var CONFIG = {
    inscripcion: {
      asistente: FORMULARIO,
      oral: FORMULARIO,
      poster: FORMULARIO
    }
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Aparición suave al desplazarse ---------- */
  var revealEls = $$('[data-reveal]');
  if (revealEls.length && 'IntersectionObserver' in window && !reduceMotion) {
    document.documentElement.classList.add('reveal-ready');
    revealEls.forEach(function (el) {
      var sibs = $$(':scope > [data-reveal]', el.parentElement);
      var i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty('--reveal-delay', ((i % 3) * 0.08) + 's');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.classList.add('is-visible');
        io.unobserve(el);
        var done = function () { el.classList.add('revealed'); el.removeEventListener('transitionend', done); };
        el.addEventListener('transitionend', done);
        setTimeout(done, 1200);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Sombra en la barra fija al desplazarse ---------- */
  var header = $('header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Menú móvil ---------- */
  var menu = $('#menu-movil');
  var toggle = $('[data-action="toggleMenu"]');
  function setMenu(open) {
    if (!menu || !toggle) return;
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }
  if (toggle) toggle.addEventListener('click', function () { setMenu(menu.hidden); });
  $$('[data-action="closeMenu"]').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  if (window.matchMedia) {
    var desktop = window.matchMedia('(min-width: 821px)');
    var onMq = function (e) { if (e.matches) setMenu(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onMq); else desktop.addListener(onMq);
  }

  /* ---------- Inscripción: selección de modalidad ---------- */
  var modal = $('[data-if="showReg"]');
  if (modal) {
    var overlay = modal.firstElementChild;
    var dialog = $('[role="dialog"]', modal);
    var radios = $$('input[name="modalidad"]', modal);
    var noSel = $('[data-if="noSel"]', modal);
    var hasSel = $('[data-if="hasSel"]', modal);
    var link = $('a', hasSel);
    var titleEl = $('[data-sel-title]', modal);
    var lastFocus = null;

    var update = function () {
      var sel = radios.filter(function (r) { return r.checked; })[0];
      radios.forEach(function (r) {
        var label = r.closest('label');
        label.style.borderColor = r.checked ? '#087E8B' : '#D5DEE6';
        label.style.background = r.checked ? '#EEF6F7' : '#FFFFFF';
      });
      noSel.hidden = !!sel;
      hasSel.hidden = !sel;
      if (sel) {
        titleEl.textContent = sel.closest('label').querySelector('strong').textContent.toLowerCase();
        var url = CONFIG.inscripcion[sel.value];
        link.setAttribute('href', url || '#');
        if (url) link.removeAttribute('aria-disabled'); else link.setAttribute('aria-disabled', 'true');
      }
    };

    var open = function (index) {
      lastFocus = document.activeElement;
      radios.forEach(function (r, i) { r.checked = (i === index); });
      update();
      setMenu(false);
      modal.hidden = false;
      document.body.classList.add('modal-open');
      (radios[typeof index === 'number' ? index : 0] || dialog).focus();
    };

    var close = function () {
      modal.hidden = true;
      document.body.classList.remove('modal-open');
      if (location.hash === '#inscripcion') history.replaceState(null, '', location.pathname);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    $$('[data-action="openReg"]').forEach(function (b) { b.addEventListener('click', function () { open(null); }); });
    ['open0', 'open1', 'open2'].forEach(function (name, i) {
      $$('[data-action="' + name + '"]').forEach(function (b) { b.addEventListener('click', function () { open(i); }); });
    });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    $$('button[data-action="closeReg"]', modal).forEach(function (b) { b.addEventListener('click', close); });
    radios.forEach(function (r) { r.addEventListener('change', update); });
    link.addEventListener('click', function (e) { if (link.getAttribute('href') === '#') e.preventDefault(); });

    document.addEventListener('keydown', function (e) {
      if (modal.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      var f = $$('button:not([disabled]), a[href], input:checked, input[name="modalidad"]', dialog)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    if (location.hash === '#inscripcion') open(null);
  }

  /* ---------- Agenda: pestañas de jornada ---------- */
  var panels = $$('[data-day-panel]');
  if (panels.length) {
    var tabs = $$('button[data-action="pick"]');
    var other = $('[data-action="otherDay"]');
    var current = 0;
    var showDay = function (i, scroll) {
      current = i;
      panels.forEach(function (p) {
        var show = p.getAttribute('data-day-panel') === String(i);
        p.hidden = !show;
        if (show && !reduceMotion) { p.classList.remove('day-enter'); void p.offsetWidth; p.classList.add('day-enter'); }
      });
      tabs.forEach(function (t, j) {
        var on = j === i;
        t.setAttribute('aria-pressed', String(on));
        t.style.background = on ? '#102A43' : '#FFFFFF';
        t.style.color = on ? '#FFFFFF' : '#102A43';
      });
      if (other) other.textContent = other.getAttribute('data-label-' + i);
      history.replaceState(null, '', i ? '#dia-2' : '#dia-1');
      if (scroll && tabs[0]) tabs[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    tabs.forEach(function (t, j) { t.addEventListener('click', function () { showDay(j, false); }); });
    if (other) other.addEventListener('click', function () { showDay(current ? 0 : 1, true); });
    if (location.hash === '#dia-2') showDay(1, false);
  }
})();
