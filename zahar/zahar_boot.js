/* ============================================================
   zahar_boot.js — Захаръ грузится последнимъ. Кэшъ №17 (59.9ц: способы ловли, нити безъ каскада,
   трактиръ съ занятостью и анафорой, veto памяти, Даніилъ, лесопилка).
   Правка №8 загрузчика (17.11.2026) — слой тетради виденъ
   Подключать ОДНИМ тегом в конце body вместо старых тегов Захара:
     <script src="zahar/zahar_boot.js"></script>
   Цепочка: словарь → память → слова → фразы → мозгъ → слой болтовни →
     кастом → тетрадь/модель → эфиръ → журнальная лента (последней).
   Требование шапки мозга (v2.18): подключать ПОСЛЕДНИМ, после
     zahar_memory.js, zahar_dict.js, words.js, zahar_phrases.js — соблюдено.
   №6 загрузчика:
     1) zahar_memory.js ДОБАВЛЕНЪ въ цепь: №4 держалъ его только въ шапке-комментарии;
        мозгъ безъ файла памяти не падаетъ (typeof-охрана есть), но реплики
        памяти пустеютъ — «доброе утро» и прочее молчатъ;
     2) zahar_ether.js и zahar_log.js добавлены въ хвост: журналъ цепляетъ дверь
        ZAHAR_ASK и обязанъ встать послѣ мозга и слоя болтовни;
     3) каждый файлъ ищется по двум путямъ: zahar/zahar_имя.js → zahar_имя.js —
        лежитъ въ папкѣ или рядомъ со страницей, цепочка найдётъ;
     4) кэш-глушение ?v=17 (№59.9ц: свежая сборка поверх старыхъ копій на сайтѣ); поверка послѣ цепочки — вердиктъ по каждому слою
        въ консоли, повторимо командой zaharBootStatus().
   Недостающий файлъ цепочку не валитъ — Захаръ встанетъ на остальномъ.
   Событие готовности: document.dispatchEvent('zahar-ready').
   ============================================================ */
(function () {
  /* №7: ловец ошибок — называет повреждённый/недошедший слой по имени */
  window.__zaharBootErrors = window.__zaharBootErrors || [];
  window.addEventListener('error', function (ev) {
    var m;
    if (ev && ev.target && ev.target.tagName && ev.target.tagName.toUpperCase() === 'SCRIPT') {
      m = 'НЕ ДОШЕЛЪ ФАЙЛЪ: ' + (ev.target.src || '?');
    } else if (ev && ev.error instanceof SyntaxError) {
      m = 'ПОВРЕЖДЕННЫЙ СЛОЙ: ' + (ev.filename || '?') + ' строка ' + (ev.lineno || '?') + ' — ' + (ev.message || '?');
    } else {
      m = 'ОШИБКА: ' + ((ev && ev.message) || '?') + ' @ ' + ((ev && ev.filename) || '?') + ':' + ((ev && ev.lineno) || '?');
    }
    if (window.__zaharBootErrors.indexOf(m) === -1) {
      window.__zaharBootErrors.push(m);
      try { console.log('⚠ ' + m); } catch (e) {}
      if (window.__zaharBootStatusShown && window.zaharBootStatus) { try { window.zaharBootStatus(); } catch (e) {} }
    }
  }, true);

  var BOOTV = '17';

  /* каждый слай — списокъ путей по очереди: всталъ первый — хватаемъ */
  var FIRST = [
    { name: 'словарь',           paths: ['zahar/zahar_dict.js', 'zahar_dict.js'] },
    { name: 'память репликъ',    paths: ['zahar/zahar_memory.js', 'zahar_memory.js'] }
  ];

  var WORDS = { name: 'казённыя статьи',
    paths: ['zahar/words.js', 'words.js', 'zahar/zahar_words.js'] };

  var REST = [
    { name: 'фразы',             paths: ['zahar/zahar_phrases.js', 'zahar_phrases.js'] },
    { name: 'мозгъ',             paths: ['zahar/zahar_brain.js', 'zahar_brain.js'] },
    { name: 'слой болтовни',     paths: ['zahar/zahar_chat.js', 'zahar_chat.js'] },
    { name: 'кастомныя пары',    paths: ['zahar/zahar_custom.js', 'zahar_custom.js'] },
    { name: 'тетрадь и модель',  paths: ['zahar/zahar_embed.js', 'zahar_embed.js'] },
    { name: 'эфиръ',             paths: ['zahar/zahar_ether.js', 'zahar_ether.js'] },
    { name: 'журнальная лента',  paths: ['zahar/zahar_log.js', 'zahar_log.js'] }
  ];

  var AUTO_WAKE_MS = 20000; // 0 = модель просыпается только по кнопке;
                            // 20000 = фоновый прогрев через 20 секунд тишины

  var loaded = [], failed = [];

  function loadPaths(step) {
    return new Promise(function (res) {
      var i = 0;
      function next() {
        if (i >= step.paths.length) {
          failed.push(step.name + ' (' + step.paths.join(' | ') + ')');
          console.warn('[zahar_boot] слой не загрузился: ' + step.name + ' — ' + step.paths.join(' → '));
          return res(false);
        }
        var src = step.paths[i++];
        var s = document.createElement('script');
        s.src = src + '?v=' + BOOTV; /* кэш-глушение: всегда свежий файл */
        s.onload = function () { loaded.push(step.name + ' ← ' + src); res(true); };
        s.onerror = function () {
          failed.push(step.name + ' (' + src + ')');
          next(); /* путь не всталъ — пробуемъ запасной */
        };
        document.head.appendChild(s);
      }
      next();
    });
  }

  /* слова: встал файл, но массива нет? пробуем след. путь */
  function loadWords() {
    var i = 0;
    function next() {
      if (i >= WORDS.paths.length) {
        console.warn('[zahar_boot] words.js не нашёлся ни по одному пути: ' + WORDS.paths.join(' → '));
        return Promise.resolve(false);
      }
      var src = WORDS.paths[i++];
      var s = document.createElement('script');
      s.src = src + '?v=' + BOOTV;
      return new Promise(function (res) {
        s.onload = function () {
          var has = false;
          try { has = (typeof ENTRIES !== 'undefined' && Array.isArray(ENTRIES)); } catch (e) { has = false; }
          if (has) { loaded.push(WORDS.name + ' ← ' + src); res(true); }
          else { failed.push(WORDS.name + ' (' + src + ' — безъ ENTRIES)'); res(next()); }
        };
        s.onerror = function () {
          failed.push(WORDS.name + ' (' + src + ')');
          res(next());
        };
        document.head.appendChild(s);
      });
    }
    return next();
  }

  function pageLoaded() {
    return new Promise(function (res) {
      if (document.readyState === 'complete') return res();
      window.addEventListener('load', function once() {
        window.removeEventListener('load', once); res();
      });
    });
  }
  function idle() {
    return new Promise(function (res) {
      if (window.requestIdleCallback)
        window.requestIdleCallback(function () { res(); }, { timeout: 2000 });
      else setTimeout(res, 300);
    });
  }

  function zaharBootStatus() {
    function arr(v) { return (v && v.length) ? v.length : 0; }
    var D, M, P, C;
    try { D = (typeof ZAHAR_DICT_FILE !== 'undefined' && Array.isArray(ZAHAR_DICT_FILE)) ? ZAHAR_DICT_FILE : null; } catch (e) { D = null; }
    try { M = (typeof ZAHAR_MEMORY_FILE !== 'undefined' && Array.isArray(ZAHAR_MEMORY_FILE)) ? ZAHAR_MEMORY_FILE : null; } catch (e) { M = null; }
    try { P = (typeof ZAHAR_PHRASES !== 'undefined' && ZAHAR_PHRASES && ZAHAR_PHRASES.greetings) ? ZAHAR_PHRASES : null; } catch (e) { P = null; }
    try { C = window.ZAHAR_CUSTOM_DATA || null; } catch (e) { C = null; }
    var words = -1;
    try { if (typeof ENTRIES !== 'undefined' && Array.isArray(ENTRIES)) words = ENTRIES.length; } catch (e) {}
    console.info('[zahar_boot] ВЕРДИКТЪ: словарь — ' + (D ? 'всталъ (' + arr(D) + ' статей)' : 'НЕТЪ') +
      '; память — ' + (M ? 'встала (' + arr(M) + ' паръ)' : 'НЕТЪ') +
      '; казённыя статьи — ' + (words >= 0 ? 'встали (' + words + ')' : 'НЕТЪ') +
      '; фразы — ' + (P ? 'встали (' + arr(P.greetings) + ' greeting[овъ])' : 'НЕТЪ') +
      '; кастомъ — ' + (C ? 'всталъ (' + (C.pairs ? C.pairs.length : 0) + ' паръ)' : 'НЕТЪ') +
      '; дверь мозга — ' + (typeof window.ZAHAR_ASK !== 'undefined' ? 'на мѣстѣ' : 'НЕТЪ') +
      '; тетрадь и модель — ' + (typeof window.ZAHAR_EMBED_WAKE !== 'undefined' ? 'всталъ' : 'НЕТЪ (файл zahar_embed.js не дошелъ!)') +
      '; журналъ — ' + (window.__zaharLogLoaded ? 'всталъ' : 'НЕТЪ') +
      (window.__zaharBootErrors && window.__zaharBootErrors.length ? '; поврежденія — ' + window.__zaharBootErrors.length + ' (см. zaharBootErrors)' : ''));
    if (window.__zaharBootErrors && window.__zaharBootErrors.length) console.warn('[zahar_boot] ПОВРЕЖДЕНІЯ:', window.__zaharBootErrors);
    window.__zaharBootStatusShown = true;
    console.info('[zahar_boot] дошли: ' + (loaded.length ? loaded.join('; ') : 'никто'));
    if (failed.length) console.warn('[zahar_boot] НЕ ДОШЛИ: ' + failed.join('; '));
    return { loaded: loaded.slice(), failed: failed.slice() };
  }
  window.zaharBootStatus = zaharBootStatus;

  pageLoaded().then(function () {
    return idle();
  }).then(function () {
    var p = Promise.resolve();
    FIRST.forEach(function (step) {
      p = p.then(function () { return loadPaths(step); });
    });
    p = p.then(loadWords);
    REST.forEach(function (step) {
      p = p.then(function () { return loadPaths(step); });
    });
    return p;
  }).then(function () {
    try { document.dispatchEvent(new Event('zahar-ready')); } catch (e) {
      try { document.dispatchEvent(new CustomEvent('zahar-ready')); } catch (e2) {}
    }
    zaharBootStatus();
    if (AUTO_WAKE_MS > 0 && typeof window.ZAHAR_EMBED_WAKE === 'function') {
      console.info('[zahar_boot] прогрѣвъ модели черезъ ' + (AUTO_WAKE_MS / 1000) + ' сек.');
      setTimeout(function () { window.ZAHAR_EMBED_WAKE(); }, AUTO_WAKE_MS);
    }
  }).catch(function (e) {
    console.warn('[zahar_boot] ' + (e && e.message || e));
  });
})();
