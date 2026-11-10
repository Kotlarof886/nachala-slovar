/* Двигатель Захара во вкладке «Изысканіе въ эфирѣ», правка №6.
   Переходы — точная копія телеграфныхъ, съ тем же порядком фазъ:
   входъ — статейки падаютъ внизъ (видимыя), мѣсто ихъ держится до конца
   (виньетка внизу не мигнётъ), затемъ пустая колонка выезжаетъ снизу;
   выходъ — плашки уезжаютъ внизъ и стираются, только потом статейки
   выезжаютъ снизу. Клавиша «Телеграфъ» изъ эфира сначала проводитъ
   полный выходъ изъ эфира, потомъ открываетъ телеграфъ. */
(function () {
  window.__zaharBusy = false;
  window.__zaharNavSeq = 0;

  /* ---- стили: приборы задавлены, отступъ плашекъ — какъ въ телеграфѣ ---- */
  (function () {
    var st = document.createElement('style');
    st.textContent =
      'body.zahar-ether:not(.telegraph-on) .tab .tab-meter { opacity: 0 !important; transition: none !important; }' +
      'body.zahar-ether:not(.telegraph-on) .tab .tab-label { display: block !important; visibility: visible !important; opacity: 1 !important; }' +
      'body.zahar-ether:not(.telegraph-on) #tg-plates { margin-top: -8px; padding-top: 12px; }';
    document.head.appendChild(st);
  })();

  function etherOn() {
    try {
      if (document.body.classList.contains('telegraph-on')) return false;
      return typeof currentTab !== 'undefined' && currentTab === 'online';
    } catch (e) { return false; }
  }
  /* классы кнопокъ — ровно какъ въ родномъ switchTab */
  function tabActive(tab) {
    document.querySelectorAll('.tab').forEach(function (b) {
      b.classList.toggle('active', (b.getAttribute('onclick') || '').indexOf("'" + tab + "'") >= 0);
    });
  }
  function markEther() {
    document.body.classList.toggle('zahar-ether', etherOn());
    var ph = document.getElementById('s-ph');
    if (!ph) return;
    if (!etherOn()) ph.style.visibility = '';
    else if (window.__zaharAsked) ph.style.visibility = 'hidden';
    else ph.style.visibility = '';
  }

  /* ---- копія tgSlideCardsOut безъ телеграфного стража ---- */
  function cardsOut(col, done) {
    if (!col) { if (done) done(); return; }
    tgTransEpoch++; var ep = tgTransEpoch;
    tgSlideLock(true);
    var cards = col.children;
    if (!cards.length) { tgSlideLock(false); if (done) done(); return; }
    for (var i = 0; i < cards.length; i++) {
      cards[i].style.animation = 'dict-out .52s cubic-bezier(.5,0,.9,.4) forwards';
      cards[i].style.animationDelay = Math.min(i, 12) * 24 + 'ms';
    }
    var total = 560 + Math.min(cards.length, 13) * 24;
    setTimeout(function () {
      if (ep === tgTransEpoch) {
        for (var i = 0; i < cards.length; i++) { cards[i].style.animation = 'none'; cards[i].style.animationDelay = ''; }
        if (done) done();
      }
      tgSlideLock(false);
    }, total);
  }

  /* ================= установка: только когда весь телеграфный кодъ на мѣстѣ ================= */
  function install() {
    if (window.__zaharInstalled) return true;
    if (typeof window.switchTab !== 'function') return false;
    if (typeof window.tgCol !== 'function' || typeof window.tgClear !== 'function' ||
        typeof window.tgSlideLock !== 'function' || typeof window.tgColSlideIn !== 'function' ||
        typeof window.tgColSlideOut !== 'function' || typeof window.tgSlideCardsIn !== 'function' ||
        typeof window.toggleTelegraph !== 'function' || typeof window.teleEndReverse !== 'function' ||
        typeof window.render !== 'function') return false;
    window.__zaharInstalled = true;
    var _sw = window.switchTab;

    /* ---- переходы по вкладкамъ ---- */
    window.switchTab = function (tab) {
      if (window.__zaharBusy) return;   /* Захаръ печатаетъ — вкладку не трогаемъ */
      if (document.body.classList.contains('telegraph-on')) return _sw.apply(this, arguments);
      var wasEther = etherOn();
      var toEther = (tab === 'online');
      var res = document.getElementById('results');
      var cn = document.getElementById('count-note');

      if (!wasEther && toEther) {
        /* ВХОДЪ ВЪ ЭФИРЪ = входъ въ телеграфъ */
        window.__zaharNavSeq++;
        var seq = window.__zaharNavSeq;
        tabActive('online');
        cardsOut(res, function () {
          if (seq !== window.__zaharNavSeq) return;   /* переходъ успѣлъ обернуться */
          var h0 = res.offsetHeight;
          res.style.visibility = 'hidden';            /* мѣсто словаря держимъ — виньетка не мигнётъ */
          try { currentTab = 'online'; } catch (e) {}
          tabActive('online');
          markEther();
          if (typeof render === 'function') render(); /* приветствіе Захара въ гаснутую колонку */
          res.style.minHeight = h0 + 'px';            /* высота страницы стоитъ коломъ до въезда плашекъ */
          var tgc = tgCol();
          if (typeof tgNum !== 'undefined') tgNum = 1 + Math.floor(Math.random() * 100);   /* новая сессія */
          tgClear();
          if (tgc) tgc.style.minHeight = '640px';
          if (cn) cn.style.display = 'none';
          var sb = document.getElementById('search-box');
          if (sb) sb.value = '';
          if (typeof window._kbSyncPrev === 'function') window._kbSyncPrev();
          window.__zaharAsked = false;                /* надпись ленты является въ началѣ входа */
          tgColSlideIn();
          setTimeout(function () {
            if (!etherOn()) return;
            res.style.display = 'none';
            res.style.minHeight = '';
            res.style.visibility = '';
          }, 720);   /* колонка въѣхала — теперь словарь можно спрятать совсемъ */
        });
        return;
      }

      if (wasEther && !toEther) {
        /* ВЫХОДЪ ИЗЪ ЭФИРА = выходъ изъ телеграфа (копія teleEndReverse) */
        window.__zaharNavSeq++;
        try { currentTab = tab; } catch (e) {}
        tabActive(tab);
        markEther();
        if (cn) cn.style.display = '';
        tgColSlideOut(function () {
          if (etherOn()) return;
          if (res) res.style.display = '';
          if (typeof render === 'function') render();
          tgSlideCardsIn(res);   /* статейки выскальзываютъ снизу каскадомъ */
        });
        return;
      }

      return _sw.apply(this, arguments);
    };
    markEther();

    /* ---- страховка рендера: въ эфирѣ никакого словаря ---- */
    var _render = window.render;
    window.render = function () {
      var r = _render.apply(this, arguments);
      if (etherOn() && !window.__zaharBusy) {
        var out = document.getElementById('results');
        if (out && out.style.display !== 'none') {
          out.innerHTML = '<p class="empty">Спросите Захара — наберите депешу и отправьте въ эфиръ (ϕ или Enter).</p>';
        }
        var cn = document.getElementById('count-note');
        if (cn) cn.textContent = '';
      }
      return r;
    };

    /* ---- «Телеграфъ» изъ эфира: полный выходъ изъ эфира, потомъ родной входъ въ телеграфъ ---- */
    var _tgg = window.toggleTelegraph;
    window.toggleTelegraph = function () {
      if (document.body.classList.contains('telegraph-on') || (typeof teleRev !== 'undefined' && teleRev))
        return _tgg.apply(this, arguments);
      if (etherOn() && !window.__zaharBusy) {
        window.__zaharNavSeq++;
        tgColSlideOut(function () {
          if (!etherOn()) return;
          try { currentTab = 'local'; } catch (e) {}
          tabActive('local');          /* кнопки становятся честными — «Мои слова» */
          var cn = document.getElementById('count-note');
          if (cn) cn.style.display = '';
          markEther();
          _tgg();   /* родной входъ въ телеграфъ: статейки падаютъ, колонка выезжаетъ */
        });
        return;
      }
      return _tgg.apply(this, arguments);
    };

    /* ---- выходъ изъ телеграфа: классы эфира освѣжаются по стыкѣ ---- */
    var _ter = window.teleEndReverse;
    window.teleEndReverse = function () {
      var r = _ter.apply(this, arguments);
      setTimeout(function () { markEther(); }, 800);
      return r;
    };

    /* ---- сторожъ: класс телеграфа меняется — эфирное состояніе пересчитывается ---- */
    if (window.MutationObserver) {
      try {
        new MutationObserver(function () { markEther(); })
          .observe(document.body, { attributes: true, attributeFilter: ['class'] });
      } catch (e) {}
    }
    return true;
  }

  function boot() {
    if (install()) return;
    var tries = 0;
    var iv = setInterval(function () { if (install() || ++tries > 200) clearInterval(iv); }, 50);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  try { markEther(); } catch (e) {}

  /* ====================== печать Захара (безъ измѣненій) ====================== */
  window.zaharSend = function () {
    if (window.__zaharBusy || document.body.classList.contains('telegraph-on')) return;
    var box = document.getElementById('search-box');
    if (!box) return;
    var q = (box.value || '').trim();
    if (!q) return;
    markEther();
    window.__zaharBusy = true;

    var MORSE = '.. -.. . -  .--. . .-. . -.. .- ---. .-';
    var MIN = 16;
    var m = MORSE.split(''), mi = 0, emitted = 0, mTimer = null, morseOn = true;
    var pending = null;
    function morseStep() {
      if (!morseOn) return;
      var ch = m[mi++];
      window.sTapePush(ch);
      emitted++;
      var d = (ch === ' ') ? 280 : 105;
      if (mi >= m.length) { mi = 0; d = 950; }
      if (pending && emitted >= MIN) { stopMorse(); var a = pending; pending = null; printAnswer(a); return; }
      mTimer = setTimeout(morseStep, d);
    }
    function stopMorse() { morseOn = false; if (mTimer) { clearTimeout(mTimer); mTimer = null; } }
    mTimer = setTimeout(morseStep, 350);

    function ready(ans) {
      if (emitted >= MIN) { stopMorse(); printAnswer(flat(ans)); }
      else pending = flat(ans);
    }
    var out;
    try { out = window.ZAHAR_ASK ? window.ZAHAR_ASK(q) : 'Мозгъ не на связи, сударь.'; }
    catch (e) { out = 'Помѣха на линии, сударь.'; }
    if (out && typeof out.then === 'function')
      out.then(ready, function () { ready('Помѣха на линии, сударь.'); });
    else ready(out);

    function printAnswer(ans) {
      var chars = ans.split(''), idx = 0;
      function tick() {
        if (idx >= chars.length) { finish(); return; }
        var ch = chars[idx++];
        window.sTapePush(ch);
        var d = 60;
        if (ch === ' ') d = 140;
        else if ('.,!?:;—-'.indexOf(ch) >= 0) d = 220;
        setTimeout(tick, d);
      }
      function finish() {
        window.sTapeTeleOut(function () {
          zaharCard(q, ans);
          window.sTapeWake();
          var b = document.getElementById('search-box'); if (b) b.value = '';
          var ph = document.getElementById('s-ph'); if (ph) ph.style.visibility = 'hidden';
          window.__zaharAsked = true;
          window.__zaharBusy = false;
        });
      }
      setTimeout(tick, 320);
    }
  };

  function flat(s) { return String(s || '').replace(/\r?\n+/g, ' ').replace(/ {2,}/g, ' ').trim(); }

  function escPlain(t) { return (t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function zaharDepesha(q, ans) {
    var ch = (typeof teleCharsHTML === 'function') ? teleCharsHTML : null;
    var depot = document.createElement('span');
    depot.className = 'tape-msg';
    depot.innerHTML =
      (ch ? ch(q) : escPlain(q)) +
      '<span data-tgcut="sep">' + (ch ? ch('\u00A0\u00A0\u00A0—\u00A0\u00A0\u00A0') : '—') + '</span>' +
      (ch ? ch(ans) : escPlain(ans));
    return depot;
  }

  function zaharBirth(depot) {
    if (!depot || !depot.querySelector || !depot.querySelector('.tpc')) return;
    var c = (typeof tgCol === 'function') ? tgCol() : document.getElementById('tg-plates');
    if (!c) return;
    var w = tgMake(tgNum++);
    c.insertBefore(w, c.firstChild);
    if (typeof tgFeed === 'function') tgFeed(depot, w);
    var plate = w.querySelector('.tgp');
    plate.classList.add('tgp-s' + tgShadePick(c));
    plate.style.transform = 'translateY(calc(-100% - 14px))';
    plate.style.opacity = '0';
    var h = plate.offsetHeight;
    if (typeof tgAlignClip === 'function') tgAlignClip();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        w.style.height = h + 'px';
        plate.style.transform = '';
        plate.style.opacity = '';
      });
    });
    setTimeout(function () { w.classList.add('entered'); w.style.height = 'auto'; }, 600);
    var ws = c.querySelectorAll('.tgp-w');
    if (ws.length > 10) {
      for (var i = ws.length - 1; i >= 0; i--) {
        if (!ws[i].classList.contains('tg-open')) { tgRetire(ws[i]); break; }
      }
    }
  }

  function zaharCard(q, ans) {
    var depot = zaharDepesha(q, ans);
    depot.style.position = 'absolute';
    depot.style.visibility = 'hidden';
    document.body.appendChild(depot);
    zaharBirth(depot);
    if (depot.parentNode) depot.parentNode.removeChild(depot);
  }
})();
