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

  /* ===== CONFIGURACIÓN (SALAS ya no se usa: cada actividad trae su enlace de Meet en sesiones-data) =====
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
    if (s.tipo === 'ponencia') t += '\nPonencia oral de 20 min + 5 min de preguntas' + (s.exacta ? '.' : ' (' + (s.orden === 1 ? 'primera' : 'segunda') + ' ponencia de la sala en esta franja).');
    if (s.link) t += '\nIngreso (asistencia y conexión): ' + s.link;
    return t + '\nhttps://cnisstunipaz.com/agenda';
  };
  var ics = function (list) {
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//UNIPAZ//Congreso SST 2026//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Mi agenda · Congreso SST 2026'];
    var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    list.forEach(function (s) {
      L.push('BEGIN:VEVENT', 'UID:' + s.id + '@cnisstunipaz.com', 'DTSTAMP:' + stamp, 'DTSTART:' + utc(s.ini), 'DTEND:' + utc(s.fin),
        fold('SUMMARY:' + icsText(s.titulo)), fold('DESCRIPTION:' + icsText(details(s))),
        fold('LOCATION:' + icsText(s.link || salaTxt(s) + ' (virtual)')), s.link ? fold('URL:' + s.link) : '', 'END:VEVENT');
    });
    L = L.filter(function (x) { return x !== ''; });
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
      '&dates=' + utc(s.ini) + '/' + utc(s.fin) + '&details=' + encodeURIComponent(details(s)) + '&location=' + encodeURIComponent(s.link || salaTxt(s) + ' (virtual)');
  };

  /* ---------- Botones «Agregar a mi agenda» ---------- */
  var favBtns = $$('[data-fav]');
  favBtns.forEach(function (b) { b.addEventListener('click', function () { toggle(b.getAttribute('data-fav')); }); });

  /* ---------- Enlaces de calendario por sesión y «Copiar enlace» (páginas de conferencista) ---------- */
  $$('[data-gcal]').forEach(function (a) { var x = byId[a.getAttribute('data-gcal')]; if (x) a.href = gcal(x); });
  $$('[data-ics]').forEach(function (b) { b.addEventListener('click', function () { var x = byId[b.getAttribute('data-ics')]; if (x) download([x]); }); });
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var url = b.getAttribute('data-copy'), label = b.textContent;
      var done = function () { b.textContent = 'Enlace copiado'; setTimeout(function () { b.textContent = label; }, 2200); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { prompt('Copia este enlace:', url); });
      else prompt('Copia este enlace:', url);
    });
  });

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
        '<p class="mia-links">' + (s.link ? '<a href="' + esc(s.link) + '" target="_blank" rel="noopener">Ingresar a la sesión</a>' : '') + '<a href="' + gcal(s) + '" target="_blank" rel="noopener">Google Calendar</a><button type="button" data-mia-one="' + s.id + '">.ics</button><button type="button" data-mia-rm="' + s.id + '">Quitar</button></p></article>';
    });
    box.innerHTML = html;
  }

  /* ---------- Filtros de la agenda ---------- */
  var chips = $$('[data-filter]'), filter = 'todo';
  var lsel = $('[data-linea-filter]'), linea = '';
  var lm = /[?&]linea=(\d+)/.exec(location.search);
  if (lsel && lm && lsel.querySelector('option[value="' + lm[1] + '"]')) { linea = lm[1]; lsel.value = linea; }
  var applyFilter = function () {
    chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-filter') === filter)); });
    if (lsel) lsel.classList.toggle('on', !!linea);
    var lineOff = function (el) { return !!linea && el.getAttribute('data-linea') !== linea; };
    $$('.pon-cell[data-sala]').forEach(function (c) { c.classList.toggle('is-dim', (filter === '1' || filter === '2') && c.getAttribute('data-sala') !== filter); });
    $$('.pon[data-sid]').forEach(function (li) { li.classList.toggle('is-dim', (filter === 'mia' && !has(li.getAttribute('data-sid'))) || lineOff(li)); });
    $$('[role="cell"][data-sid], li > div[data-sid]').forEach(function (c) {
      var id = c.getAttribute('data-sid');
      c.classList.toggle('is-dim', (filter === 'mia' && !(id && has(id))) || lineOff(c));
    });
  };
  chips.forEach(function (c) { c.addEventListener('click', function () { filter = c.getAttribute('data-filter'); applyFilter(); }); });
  if (lsel) lsel.addEventListener('change', function () {
    linea = lsel.value; applyFilter();
    try { history.replaceState(null, '', location.pathname + (linea ? '?linea=' + linea : '') + location.hash); } catch (e) { /* sin historial */ }
  });

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
  var join = function (x, label) {
    return x.link ? ' <a class="live-join" href="' + esc(x.link) + '" target="_blank" rel="noopener">' + (label || 'Ingresar') + '<span class="sr-only">: ' + esc(x.titulo) + '</span></a>' : '';
  };
  var describe = function (list) {
    if (!list.length) return '';
    if (list[0].sala === 'ambas') return '<p class="live-t">' + esc(list[0].titulo) + '</p><p class="live-a">' + esc(list[0].ponente) + ' · Ambas salas</p>';
    return '<p class="live-t">Ponencias orales en paralelo</p>' + ['1', '2'].map(function (n) {
      var xs = list.filter(function (s) { return s.sala === n; });
      return xs.length ? '<p class="live-a"><strong>Sala ' + n + ':</strong> ' + xs.map(function (s) { return esc(s.ponente) + join(s); }).join(' · ') + '</p>' : '';
    }).join('');
  };
  var joinBtns = function (list) {
    var x = list.length && list[0].sala === 'ambas' ? list[0] : null;
    return x && x.link ? '<a class="btn btn-primary" href="' + esc(x.link) + '" target="_blank" rel="noopener">Ingresar a la sesión</a>' : '';
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
      banner.innerHTML = '<div class="wrap live-in"><div class="live-body">' + body + '</div><div class="live-cta">' + joinBtns(cur) + '<a class="btn btn-quiet" href="/agenda">Ver agenda</a></div></div>';
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

/* ===== Cuenta regresiva antes del pie (todas las páginas) ===== */
(function () {
  'use strict';
  var sec = document.querySelector('[data-countdown-section]');
  if (!sec) return;
  var toDate = function (l) { return new Date(l + ':00-05:00'); };
  var START = toDate('2026-10-29T08:00'), END = toDate('2026-10-30T22:00');
  var sim = /[?&]ahora=([0-9T:\-]+)/.exec(location.search), t0 = Date.now();
  var simAt = sim ? toDate(decodeURIComponent(sim[1]).slice(0, 16)) : null;
  var now = function () { return simAt ? new Date(simAt.getTime() + (Date.now() - t0)) : new Date(); };
  var SES = [];
  try { SES = JSON.parse((document.getElementById('sesiones-data') || {}).textContent || '[]'); } catch (e) { SES = []; }
  var el = function (k) { return sec.querySelector('[data-cd="' + k + '"]'); };
  var D = el('d'), Hh = el('h'), M = el('m'), S = el('s');
  var title = sec.querySelector('[data-cd-title]'), sub = sec.querySelector('[data-cd-sub]'), live = sec.querySelector('[data-cd-live]');
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var state = '';
  var render = function () {
    var t = now();
    if (t < START) {
      var s = Math.max(0, Math.floor((START - t) / 1000));
      D.textContent = pad(Math.floor(s / 86400)); Hh.textContent = pad(Math.floor(s % 86400 / 3600));
      M.textContent = pad(Math.floor(s % 3600 / 60)); S.textContent = pad(s % 60);
      if (state !== 'pre') { state = 'pre'; sec.classList.remove('is-live', 'is-over'); }
      return;
    }
    if (t < END) {
      var cur = SES.filter(function (x) { return toDate(x.ini) <= t && t < toDate(x.fin); });
      var html = '<p class="live-k"><span class="live-dot" aria-hidden="true"></span>En vivo ahora</p>';
      if (cur.length && cur[0].sala === 'ambas') html += '<p class="cd-live-t">' + esc(cur[0].titulo) + '</p>';
      else if (cur.length) html += '<p class="cd-live-t">Ponencias orales en las dos salas</p>';
      else html += '<p class="cd-live-t">El Congreso continúa en breve</p>';
      if (live.innerHTML !== html) live.innerHTML = html;
      if (state !== 'live') {
        state = 'live'; sec.classList.add('is-live'); sec.classList.remove('is-over');
        title.textContent = 'El Congreso está en curso';
        sub.textContent = 'Consulta la agenda para ver qué ocurre en cada sala. Aún puedes inscribirte gratis.';
      }
      return;
    }
    if (state !== 'over') {
      state = 'over'; sec.classList.add('is-over'); sec.classList.remove('is-live');
      title.textContent = 'Gracias por acompañarnos';
      sub.textContent = 'El I Congreso Nacional e Internacional en SST se realizó el 29 y 30 de octubre de 2026.';
      live.innerHTML = '<p class="cd-live-t">Pronto compartiremos las memorias del Congreso.</p>';
      Array.prototype.forEach.call(sec.querySelectorAll('.cd-cta .btn-primary, [data-ics-event]'), function (b) { b.hidden = true; });
    }
  };
  render();
  setInterval(render, 1000);

  /* Calendario: las dos jornadas completas */
  var btn = sec.querySelector('[data-ics-event]');
  if (btn) btn.addEventListener('click', function () {
    var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    var u = function (l) { return toDate(l).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
    var ev = function (id, a, b, n) {
      return ['BEGIN:VEVENT', 'UID:' + id + '@cnisstunipaz.com', 'DTSTAMP:' + stamp, 'DTSTART:' + u(a), 'DTEND:' + u(b),
        'SUMMARY:I Congreso Nacional e Internacional en SST · Día ' + n,
        'DESCRIPTION:Congreso virtual de UNIPAZ\\, inscripción gratuita. Agenda: https://cnisstunipaz.com/agenda',
        'LOCATION:Virtual · cnisstunipaz.com', 'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:El Congreso comienza en 30 minutos', 'END:VALARM', 'END:VEVENT'].join('\r\n');
    };
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//UNIPAZ//Congreso SST 2026//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      ev('congreso-dia-1', '2026-10-29T08:00', '2026-10-29T22:00', 1), ev('congreso-dia-2', '2026-10-30T08:00', '2026-10-30T22:00', 2), 'END:VCALENDAR'].join('\r\n') + '\r\n';
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    a.download = 'congreso-sst-2026.ics'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });
})();

/* ===== Google Analytics 4 — medición del Congreso =====
   Sin cookies propias ni inicio de sesión. Solo se activa en cnisstunipaz.com (o con ?ga=1 para pruebas).
   Eventos propios (nombres en español, parámetros registrables como dimensiones personalizadas):
   ingreso_sesion · inscripcion_abrir · inscripcion_modalidad · inscripcion_continuar · agenda_agregar · agenda_quitar
   calendario_exportar · share · filtro_agenda · red_social */
(function () {
  var GA_ID = ''; // ID de medición de GA4 (G-XXXXXXXXXX)
  var host = location.hostname.replace(/^www\./, '');
  var debug = /[?&]ga=1\b/.test(location.search);
  if (!GA_ID || (host !== 'cnisstunipaz.com' && !debug)) { window.cnisstTrack = function () {}; return; }

  var s = document.createElement('script');
  s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', GA_ID, { tipo_pagina: document.body.getAttribute('data-page') || '', debug_mode: debug || undefined });

  var page = document.body.getAttribute('data-page') || '';
  var track = window.cnisstTrack = function (name, params) {
    params = params || {}; params.pagina = page;
    gtag('event', name, params);
  };

  // Sesiones por enlace: el enlace de cada actividad es único, así se sabe a qué sesión entra la persona
  var byLink = {}, byId = {};
  try {
    var el = document.getElementById('sesiones-data');
    (el ? JSON.parse(el.textContent) : []).forEach(function (x) { if (x.link) byLink[x.link] = x; byId[x.id] = x; });
  } catch (e) {}
  var sesParams = function (x) {
    return x ? { sesion_id: x.id, sesion_titulo: (x.titulo || '').slice(0, 100), sesion_tipo: x.tipo, sala: x.sala,
      dia: x.dia === 0 ? 'jueves_29' : 'viernes_30', linea: x.linea ? String(x.linea) : '' } : {};
  };
  var origen = function (t) {
    if (t.closest('.live')) return 'en_vivo';
    if (t.closest('.mia')) return 'mi_agenda';
    if (t.closest('[data-countdown-section]')) return 'cuenta_regresiva';
    return page;
  };
  var modalidad = function () {
    var r = document.querySelector('input[name="modalidad"]:checked');
    return r ? r.value : '';
  };
  var RED = [[/linkedin\.com\/sharing/, 'linkedin'], [/twitter\.com\/intent|x\.com\/intent/, 'x'], [/facebook\.com\/sharer/, 'facebook'], [/wa\.me\//, 'whatsapp']];
  var slug = (location.pathname.match(/\/conferencistas\/([\w-]+)/) || [])[1] || '';

  // Fase de captura: se registra antes de que otros manejadores cambien el estado
  document.addEventListener('click', function (e) {
    var t = e.target.closest('a, button'); if (!t) return;
    var href = t.getAttribute('href') || '';
    if (byLink[href]) return track('ingreso_sesion', Object.assign(sesParams(byLink[href]), { origen: origen(t) }));
    if (t.closest('[data-if="hasSel"]') && t.tagName === 'A' && href && href !== '#') return track('inscripcion_continuar', { modalidad: modalidad() });
    if (/meet\.google\.com\/|script\.google\.com\/.*\/exec\?qr=/.test(href)) return track('ingreso_sesion', { origen: origen(t) });
    if (t.matches('[data-action="openReg"]')) return track('inscripcion_abrir', { origen: origen(t) });
    if (t.hasAttribute('data-fav')) {
      var on = t.getAttribute('aria-pressed') === 'true';
      return track(on ? 'agenda_quitar' : 'agenda_agregar', sesParams(byId[t.getAttribute('data-fav')]));
    }
    if (t.hasAttribute('data-mia-rm')) return track('agenda_quitar', Object.assign(sesParams(byId[t.getAttribute('data-mia-rm')]), { origen: 'mi_agenda' }));
    if (t.hasAttribute('data-mia-ics')) return track('calendario_exportar', { formato: 'ics', alcance: 'mi_agenda' });
    if (t.hasAttribute('data-mia-one')) return track('calendario_exportar', Object.assign(sesParams(byId[t.getAttribute('data-mia-one')]), { formato: 'ics', alcance: 'una' }));
    if (t.hasAttribute('data-ics')) return track('calendario_exportar', Object.assign(sesParams(byId[t.getAttribute('data-ics')]), { formato: 'ics', alcance: 'una' }));
    if (t.hasAttribute('data-ics-event')) return track('calendario_exportar', { formato: 'ics', alcance: 'congreso', origen: origen(t) });
    if (/calendar\.google\.com/.test(href)) return track('calendario_exportar', Object.assign(sesParams(byId[t.getAttribute('data-gcal')]), { formato: 'google', alcance: t.hasAttribute('data-gcal') ? 'una' : 'mi_agenda' }));
    for (var i = 0; i < RED.length; i++) if (RED[i][0].test(href)) return track('share', { method: RED[i][1], content_type: 'conferencista', item_id: slug });
    if (t.hasAttribute('data-copy')) return track('share', { method: 'copiar_enlace', content_type: 'conferencista', item_id: slug });
    if (t.hasAttribute('download') && /compartir\//.test(href)) return track('share', { method: 'descargar_imagen', content_type: 'conferencista', item_id: slug });
    if (t.hasAttribute('data-filter')) return track('filtro_agenda', { filtro: { mia: 'mi_agenda', todo: 'todas' }[t.getAttribute('data-filter')] || 'sala_' + t.getAttribute('data-filter') });
    var m = href.match(/(instagram|youtube|facebook|x)\.com\/(?!sharer|intent)/);
    if (m && t.closest('footer')) return track('red_social', { red: m[1] });
  }, true);

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('[data-linea-filter]')) track('filtro_agenda', { filtro: 'linea', linea: t.value || 'todas' });
    if (t.matches('input[name="modalidad"]')) track('inscripcion_modalidad', { modalidad: t.value });
  }, true);
})();
