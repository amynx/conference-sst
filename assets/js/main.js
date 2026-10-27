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
        titleEl.textContent = sel.closest('label').querySelector('strong').textContent;
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

/* ===== v3: Mi agenda, calendario y modo en vivo (sin registro: se guarda en este navegador) ===== */
(function () {
  'use strict';

  /* ===== CONFIGURACIÓN =====
     Enlaces de conexión de cada sala virtual. Mientras estén vacíos, el sitio muestra
     «El enlace se publicará antes del inicio» en lugar del botón «Entrar». */
  var SALAS = {
    '1': '',
    '2': ''
  };
  var CERTIFICADO = 25; // % de ponencias requerido para el certificado de asistencia

  var dataEl = document.getElementById('sesiones-data');
  if (!dataEl) return;
  var SES = [];
  try { SES = JSON.parse(dataEl.textContent); } catch (e) { return; }
  var byId = {};
  SES.forEach(function (s) { byId[s.id] = s; });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Tiempo: hora de Colombia (UTC−5, sin horario de verano) ---------- */
  var OFFSET = '-05:00';
  var toDate = function (local) { return new Date(local + ':00' + OFFSET); };
  var simulated = (function () {
    var m = /[?&]ahora=([0-9T:\-]+)/.exec(location.search);
    return m ? toDate(decodeURIComponent(m[1]).slice(0, 16)) : null;
  })();
  var simStart = Date.now();
  var now = function () { return simulated ? new Date(simulated.getTime() + (Date.now() - simStart)) : new Date(); };
  var START = toDate('2026-10-29T08:00'), END = toDate('2026-10-30T22:00');
  var DAYS = ['Jueves 29 de octubre', 'Viernes 30 de octubre'];
  var hour12 = function (hhmm) {
    var p = hhmm.split(':'), h = +p[0], m = p[1];
    if (h === 12 && m === '00') return '12:00 m.';
    return (h % 12 || 12) + ':' + m + (h < 12 ? ' a. m.' : ' p. m.');
  };
  var range = function (s) {
    var a = hour12(s.ini.slice(11)), b = hour12(s.fin.slice(11));
    var sa = a.slice(-5), sb = b.slice(-5);
    if (sa === sb && (sa === 'a. m.' || sa === 'p. m.')) a = a.slice(0, -6);
    return a + '–' + b;
  };
  var salaTxt = function (s) { return s.sala === 'ambas' ? 'Ambas salas' : 'Sala ' + s.sala; };
  var kindTxt = function (s) {
    return { ponencia: 'Ponencia oral', conferencia: 'Conferencia', cierre: 'Actividad de cierre', posteres: 'Jornada de pósteres' }[s.tipo] || '';
  };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---------- Mi agenda: almacenamiento local ---------- */
  var KEY = 'cnisst-mi-agenda';
  var load = function () { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  var saveSel = function (ids) { try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch (e) { /* modo privado */ } };
  var sel = load().filter(function (id) { return byId[id]; });
  var has = function (id) { return sel.indexOf(id) !== -1; };
  var toggle = function (id) {
    if (has(id)) sel = sel.filter(function (x) { return x !== id; }); else sel.push(id);
    saveSel(sel); sync();
  };
  var sorted = function () {
    return sel.map(function (id) { return byId[id]; }).sort(function (a, b) {
      return a.ini < b.ini ? -1 : a.ini > b.ini ? 1 : (a.sala + a.orden) < (b.sala + b.orden) ? -1 : 1;
    });
  };
  var totalPon = SES.filter(function (s) { return s.tipo === 'ponencia'; }).length;
  var needed = Math.ceil(totalPon * CERTIFICADO / 100);

  /* ---------- Calendario (.ics y Google Calendar) ---------- */
  var utc = function (local) { return toDate(local).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
  var icsText = function (t) { return String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); };
  var fold = function (line) { var out = []; while (line.length > 74) { out.push(line.slice(0, 74)); line = ' ' + line.slice(74); } out.push(line); return out.join('\r\n'); };
  var details = function (s) {
    var t = kindTxt(s) + (s.ponente ? ' · ' + s.ponente + (s.inst ? ' (' + s.inst + ')' : '') : '') + '\n' + salaTxt(s) + ' · I Congreso Nacional e Internacional en SST · UNIPAZ';
    if (s.tipo === 'ponencia') t += '\nPonencia de 20 min + 5 min de preguntas dentro de esta franja (' + (s.orden === 1 ? 'primera' : 'segunda') + ' de la sala).';
    var link = s.sala === 'ambas' ? (SALAS['1'] || SALAS['2']) : SALAS[s.sala];
    if (link) t += '\nEnlace: ' + link;
    return t + '\nhttps://cnisstunipaz.com/agenda';
  };
  var ics = function (list) {
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//UNIPAZ//Congreso SST 2026//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Mi agenda · Congreso SST 2026'];
    var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    list.forEach(function (s) {
      L.push('BEGIN:VEVENT', 'UID:' + s.id + '@cnisstunipaz.com', 'DTSTAMP:' + stamp, 'DTSTART:' + utc(s.ini), 'DTEND:' + utc(s.fin),
        fold('SUMMARY:' + icsText(s.titulo)), fold('DESCRIPTION:' + icsText(details(s))),
        fold('LOCATION:' + icsText(salaTxt(s) + ' (virtual)')), 'END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.join('\r\n') + '\r\n';
  };
  var download = function (list) {
    var blob = new Blob([ics(list)], { type: 'text/calendar;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = list.length === 1 ? 'congreso-sst-' + list[0].id + '.ics' : 'congreso-sst-mi-agenda.ics';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  var gcal = function (s) {
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(s.titulo) +
      '&dates=' + utc(s.ini) + '/' + utc(s.fin) + '&details=' + encodeURIComponent(details(s)) + '&location=' + encodeURIComponent(salaTxt(s) + ' (virtual)');
  };

  /* ---------- Botones «Agregar a mi agenda» ---------- */
  var favBtns = $$('[data-fav]');
  favBtns.forEach(function (b) { b.addEventListener('click', function () { toggle(b.getAttribute('data-fav')); }); });

  /* ---------- Panel «Mi agenda» ---------- */
  var panel = null, fab = null, lastFocus = null, host = document.querySelector('.site') || document.body;
  if (favBtns.length) {
    fab = document.createElement('button');
    fab.type = 'button'; fab.className = 'mia-fab'; fab.setAttribute('aria-haspopup', 'dialog');
    fab.innerHTML = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"></path></svg><span>Mi agenda</span><span class="mia-n" data-fav-count>0</span>';
    host.appendChild(fab);
    panel = document.createElement('div');
    panel.className = 'mia-wrap'; panel.hidden = true;
    panel.innerHTML = '<div class="mia" role="dialog" aria-modal="true" aria-labelledby="mia-h"><div class="mia-top"><div><p class="mia-k">Sin registro · se guarda en este navegador</p><h2 id="mia-h">Mi agenda</h2></div>' +
      '<button type="button" class="reg-x" data-mia-close aria-label="Cerrar"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"></path></svg></button></div>' +
      '<div class="mia-cert" data-mia-cert></div><div class="mia-list" data-mia-list></div>' +
      '<div class="mia-actions"><button type="button" class="btn btn-primary" data-mia-ics>Descargar a mi calendario (.ics)</button><button type="button" class="btn btn-line" data-mia-clear>Vaciar</button></div>' +
      '<p class="mia-foot">El archivo .ics se abre en Google Calendar, Outlook o el calendario del celular. Tu selección no se envía a ningún servidor y solo está en este dispositivo.</p></div>';
    host.appendChild(panel);
    var openPanel = function () { lastFocus = document.activeElement; render(); panel.hidden = false; document.body.classList.add('modal-open'); $('[data-mia-close]', panel).focus(); };
    var closePanel = function () { panel.hidden = true; document.body.classList.remove('modal-open'); if (lastFocus) lastFocus.focus(); };
    fab.addEventListener('click', openPanel);
    panel.addEventListener('click', function (e) { if (e.target === panel || e.target.closest('[data-mia-close]')) closePanel(); });
    document.addEventListener('keydown', function (e) { if (!panel.hidden && e.key === 'Escape') closePanel(); });
    $('[data-mia-ics]', panel).addEventListener('click', function () { if (sel.length) download(sorted()); });
    $('[data-mia-clear]', panel).addEventListener('click', function () { if (sel.length && confirm('¿Quitar todas las sesiones de tu agenda?')) { sel = []; saveSel(sel); sync(); render(); } });
    panel.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-mia-rm]'); if (rm) { toggle(rm.getAttribute('data-mia-rm')); render(); }
      var one = e.target.closest('[data-mia-one]'); if (one) download([byId[one.getAttribute('data-mia-one')]]);
    });
  }
  function render() {
    if (!panel) return;
    var list = sorted(), pon = list.filter(function (s) { return s.tipo === 'ponencia'; }).length;
    var pct = Math.min(100, Math.round(pon / needed * 100));
    $('[data-mia-cert]', panel).innerHTML =
      '<div class="mia-cert-t"><strong>' + pon + ' de ' + needed + '</strong> ponencias orales marcadas<span>Certificado: asistencia mínima del ' + CERTIFICADO + ' % de las ' + totalPon + ' ponencias</span></div>' +
      '<div class="mia-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + needed + '" aria-valuenow="' + Math.min(pon, needed) + '" aria-label="Ponencias marcadas frente a las requeridas"><i style="width:' + pct + '%"></i></div>' +
      '<p class="mia-note">Es una guía personal: la asistencia se registra en la sala virtual.</p>';
    var box = $('[data-mia-list]', panel);
    if (!list.length) { box.innerHTML = '<p class="mia-empty">Aún no has marcado sesiones. Usa <strong>Agregar a mi agenda</strong> en la programación.</p>'; return; }
    var html = '', day = -1;
    list.forEach(function (s) {
      if (s.dia !== day) { day = s.dia; html += '<h3 class="mia-day">' + DAYS[day] + '</h3>'; }
      var clash = list.filter(function (o) { return o !== s && o.ini === s.ini && o.sala !== s.sala && o.sala !== 'ambas' && s.sala !== 'ambas'; });
      html += '<article class="mia-item"><p class="mia-when">' + range(s) + ' · ' + salaTxt(s) + ' · ' + kindTxt(s) + '</p>' +
        '<p class="mia-t">' + esc(s.titulo) + '</p>' + (s.ponente ? '<p class="mia-a">' + esc(s.ponente) + (s.inst ? ' · ' + esc(s.inst) : '') + '</p>' : '') +
        (clash.length ? '<p class="mia-clash">Cruce: a la misma hora marcaste una ponencia en la ' + salaTxt(clash[0]) + '.</p>' : '') +
        '<p class="mia-links"><a href="' + gcal(s) + '" target="_blank" rel="noopener">Google Calendar</a><button type="button" data-mia-one="' + s.id + '">.ics</button><button type="button" data-mia-rm="' + s.id + '">Quitar</button></p></article>';
    });
    box.innerHTML = html;
  }

  /* ---------- Filtros de la agenda ---------- */
  var chips = $$('[data-filter]'), filter = 'todo';
  var applyFilter = function () {
    chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-filter') === filter)); });
    $$('.pon-cell[data-sala]').forEach(function (c) { c.classList.toggle('is-dim', (filter === '1' || filter === '2') && c.getAttribute('data-sala') !== filter); });
    $$('.pon[data-sid]').forEach(function (li) { li.classList.toggle('is-dim', filter === 'mia' && !has(li.getAttribute('data-sid'))); });
    $$('[role="cell"][data-sid], li > div[data-sid]').forEach(function (c) { var id = c.getAttribute('data-sid'); c.classList.toggle('is-dim', filter === 'mia' && !(id && has(id))); });
  };
  chips.forEach(function (c) { c.addEventListener('click', function () { filter = c.getAttribute('data-filter'); applyFilter(); }); });

  function sync() {
    favBtns.forEach(function (b) {
      var on = has(b.getAttribute('data-fav'));
      b.setAttribute('aria-pressed', String(on));
      var l = $('.fav-l', b); if (l) l.textContent = on ? 'En mi agenda' : 'Agregar a mi agenda';
    });
    $$('[data-fav-count]').forEach(function (n) { n.textContent = sel.length; });
    if (fab) fab.classList.toggle('has-items', sel.length > 0);
    applyFilter();
  }
  sync();

  /* ---------- Modo en vivo ---------- */
  var nowAt = function (t) { return SES.filter(function (s) { return toDate(s.ini) <= t && t < toDate(s.fin); }); };
  var nextAfter = function (t) {
    var fut = SES.filter(function (s) { return toDate(s.ini) > t; }).sort(function (a, b) { return a.ini < b.ini ? -1 : 1; });
    return fut.length ? fut.filter(function (s) { return s.ini === fut[0].ini; }) : [];
  };
  var describe = function (list) {
    if (!list.length) return '';
    if (list[0].sala !== 'ambas') return '<p class="live-t">Ponencias orales en paralelo</p>' + ['1', '2'].map(function (n) {
      var xs = list.filter(function (s) { return s.sala === n; });
      return xs.length ? '<p class="live-a"><strong>Sala ' + n + ':</strong> ' + xs.map(function (s) { return esc(s.ponente); }).join(' y ') + '</p>' : '';
    }).join('');
    if (list[0].sala === 'ambas') return '<p class="live-t">' + esc(list[0].titulo) + '</p><p class="live-a">' + esc(list[0].ponente) + ' · Ambas salas</p>';
    return ['1', '2'].map(function (n) {
      var xs = list.filter(function (s) { return s.sala === n; });
      return xs.length ? '<p class="live-a"><strong>Sala ' + n + ':</strong> ' + xs.map(function (s) { return esc(s.ponente); }).join(' y ') + '</p>' : '';
    }).join('');
  };
  var joinBtns = function () {
    if (!SALAS['1'] && !SALAS['2']) return '<span class="live-pend">Los enlaces de las salas se publicarán antes del inicio</span>';
    return ['1', '2'].map(function (n) {
      return SALAS[n] ? '<a class="btn btn-primary" href="' + esc(SALAS[n]) + '" target="_blank" rel="noopener">Entrar a la Sala ' + n + '</a>'
        : '<span class="live-pend">Sala ' + n + ': el enlace se publicará antes del inicio</span>';
    }).join('');
  };
  var isBreak = function (t) {
    var d = new Date(t.getTime() - 5 * 36e5), h = d.getUTCHours();
    return h === 12 || h === 17 || h === 18;
  };
  var countdown = function (t) {
    var ms = START - t; if (ms <= 0) return '';
    var mins = Math.ceil(ms / 6e4), d = Math.floor(mins / 1440), h = Math.floor(mins % 1440 / 60), m = mins % 60;
    var parts = [];
    if (d) parts.push(d + (d === 1 ? ' día' : ' días'));
    if (h || d) parts.push(h + (h === 1 ? ' hora' : ' horas'));
    if (!d) parts.push(m + (m === 1 ? ' minuto' : ' minutos'));
    return 'Faltan ' + parts.join(', ').replace(/, ([^,]*)$/, ' y $1');
  };
  var banner = document.createElement('section');
  banner.className = 'live dark'; banner.hidden = true; banner.setAttribute('aria-live', 'polite'); banner.setAttribute('aria-label', 'Congreso en vivo');
  var header = $('header');
  if (header && header.parentNode) header.parentNode.insertBefore(banner, header.nextSibling);
  var cd = $('[data-countdown]');
  var tick = function () {
    var t = now();
    if (cd) cd.textContent = countdown(t);
    var cur = nowAt(t), nxt = nextAfter(t);
    if (t >= START && t < END) {
      var body = cur.length ? '<p class="live-k"><span class="live-dot" aria-hidden="true"></span>En vivo ahora · ' + range(cur[0]) + '</p>' + describe(cur)
        : '<p class="live-k">' + (isBreak(t) ? 'Descanso' : 'En pausa') + '</p><p class="live-a">El Congreso continúa en breve.</p>';
      if (nxt.length) body += '<p class="live-next"><strong>A continuación · ' + range(nxt[0]) + '</strong> ' + (nxt[0].sala === 'ambas' ? esc(nxt[0].titulo) : 'Ponencias orales en ambas salas') + '</p>';
      banner.innerHTML = '<div class="wrap live-in"><div class="live-body">' + body + '</div><div class="live-cta">' + joinBtns() + '<a class="btn btn-quiet" href="/agenda">Ver agenda</a></div></div>';
      banner.hidden = false;
    } else if (t >= END) {
      banner.innerHTML = '<div class="wrap live-in"><div class="live-body"><p class="live-k">El Congreso ha concluido</p><p class="live-a">Gracias por acompañarnos el 29 y 30 de octubre de 2026.</p></div></div>';
      banner.hidden = false;
    } else banner.hidden = true;
    // fila actual en la agenda
    $$('[data-ini]').forEach(function (r) {
      var on = toDate(r.getAttribute('data-ini')) <= t && t < toDate(r.getAttribute('data-fin'));
      r.classList.toggle('is-now', on);
      var hdr = r.querySelector('[role="rowheader"]') || r.firstElementChild;
      var bd = hdr && hdr.querySelector('.now-badge');
      if (on && hdr && !bd) { bd = document.createElement('span'); bd.className = 'now-badge'; bd.textContent = 'Ahora'; hdr.appendChild(bd); }
      if (!on && bd) bd.remove();
    });
  };
  tick();
  setInterval(tick, 30000);
  // durante el evento, abrir la agenda en el día en curso
  var t0 = now(), tabs = $$('button[data-action="pick"]');
  if (tabs.length === 2 && t0 >= toDate('2026-10-30T00:00') && t0 < END && location.hash !== '#dia-1') tabs[1].click();
})();
