/* ============================================================
   zahar_chat.js — слой живой болтовни Захара, правка №13.
   Подключать ПОСЛЕ zahar_brain.js:
     <script src="zahar/zahar_chat.js"></script>
   ПОГОДА — полный пакет: температура (блок сайта или сеть),
   ветер (направление + сила) и осадки — гонкой Open-Meteo
   через прокси (работает и из file://). Кэш 10 минут.
   Диагностика: «проверка» (называет номер правки) и
   «погода проверка». Логи — F12, метка [zahar_chat].
   Дата: Захар отыгрывает 1896 год (window.ZAHAR_CHAT_1896 = false — реальная).
   В узорах НЕ использовать \w — в JavaScript он не ловит кириллицу.
   ============================================================ */
(function () {
  if (window.__zaharChatLoaded) return;
  window.__zaharChatLoaded = true;
  var VERSION = 'правка №13';
  if (typeof window.ZAHAR_CHAT_1896 === 'undefined') window.ZAHAR_CHAT_1896 = true;
  if (!window.ZAHAR_USER_NAME) window.ZAHAR_USER_NAME = null;

  function warn(m) { try { console.warn('[zahar_chat] ' + m); } catch (e) {} }

  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/ё/g, 'е').replace(/[ъь]/g, '')
      .replace(/[іi]/g, 'и').replace(/ѳ/g, 'ф')
      .replace(/[^a-zа-я0-9\s]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  function pick(arr) {
    if (!arr || !arr.length) return '';
    if (arr.length === 1) return arr[0];
    if (typeof arr._last !== 'number') arr._last = -1;
    var i = Math.floor(Math.random() * arr.length);
    if (i === arr._last) i = (i + 1) % arr.length;
    arr._last = i;
    return arr[i];
  }
  function cap(w) { return w ? w.charAt(0).toUpperCase() + w.slice(1) : w; }
  function nmOr() { return window.ZAHAR_USER_NAME ? window.ZAHAR_USER_NAME : 'сударь'; }
  function fill(s) { return String(s || '').replace(/\{N\}/g, nmOr()); }

  /* ---------- ты -> вы ---------- */
  var YOU_MAP = [['ты','вы'],['тебя','вас'],['тебе','вам'],['тобой','вами'],
    ['твой','ваш'],['твоя','ваша'],['твое','ваше'],['твою','вашу'],['твои','ваши'],
    ['работаешь','работаете'],['делаешь','делаете'],['живешь','живете'],
    ['служишь','служите'],['любишь','любите'],['знаешь','знаете'],['думаешь','думаете'],
    ['умеешь','умеете'],['хочешь','хотите'],['можешь','можете']];
  function polite(q) {
    var s = String(q || '').replace(/ё/gi, 'е').replace(/і/gi, 'и');
    s = s.replace(/что\s+ты\s+делаешь/gi, 'чем занимаетесь');
    s = s.replace(/чем\s+ты\s+занимаешься/gi, 'чем занимаетесь');
    s = s.replace(/как\s+тво[ия]\s+дела/gi, 'как дела');
    YOU_MAP.forEach(function (p) {
      var re = new RegExp('(^|[^а-яa-z0-9])' + p[0] + '(?=$|[^а-яa-z0-9])', 'gi');
      s = s.replace(re, function (m, pre) {
        var w = m.slice(pre.length);
        return pre + ((w.charAt(0) >= 'А' && w.charAt(0) <= 'Я') ? cap(p[1]) : p[1]);
      });
    });
    return s;
  }

  /* ---------- числа словами ---------- */
  var ONES = ['ноль','один','два','три','четыре','пять','шесть','семь','восемь','девять','десять','одиннадцать','двенадцать','тринадцать','четырнадцать','пятнадцать','шестнадцать','семнадцать','восемнадцать','девятнадцать'];
  var TENS = ['','','двадцать','тридцать','сорок','пятьдесят','шестьдесят','семьдесят','восемьдесят','девяносто'];
  var TENS_NUM = { 'двадцать': 20, 'тридцать': 30, 'сорок': 40, 'пятьдесят': 50, 'шестьдесят': 60, 'семьдесят': 70, 'восемьдесят': 80, 'девяносто': 90 };
  function numWords(n) {
    n = Math.round(Math.abs(Number(n) || 0));
    if (n < 20) return ONES[n] || String(n);
    var t = Math.floor(n / 10), o = n % 10;
    return TENS[t] + (o ? ' ' + ONES[o] : '');
  }
  function formOf(n, one, few, many) {
    var d = Math.abs(n) % 100, l = d % 10;
    if (d >= 11 && d <= 14) return many;
    if (l === 1) return one;
    if (l >= 2 && l <= 4) return few;
    return many;
  }

  /* ---------- дата и время ---------- */
  var ORD = ['первое','второе','третье','четвертое','пятое','шестое','седьмое','восьмое','девятое','десятое','одиннадцатое','двенадцатое','тринадцатое','четырнадцатое','пятнадцатое','шестнадцатое','семнадцатое','восемнадцатое','девятнадцатое','двадцатое','двадцать первое','двадцать второе','двадцать третье','двадцать четвертое','двадцать пятое','двадцать шестое','двадцать седьмое','двадцать восьмое','двадцать девятое','тридцатое','тридцать первое'];
  var MON_G = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  var WD = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];

  function answerTime() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    var part = (h >= 5 && h < 12) ? 'утра' : (h >= 12 && h < 17) ? 'пополудни' : (h >= 17) ? 'вечера' : 'ночи';
    return pick(['На аппаратных часах', 'Часы показывают', 'Стенные часы бьют']) +
      ': ' + numWords(h12) + ' ' + formOf(h12, 'час', 'часа', 'часов') + ' ' + numWords(m) + ' ' +
      formOf(m, 'минута', 'минуты', 'минут') + ' ' + part + ', ' + nmOr() + '.';
  }
  function answerDate() {
    var now = new Date();
    var y = window.ZAHAR_CHAT_1896 ? 1896 : now.getFullYear();
    var d = now.getDate(), mo = now.getMonth();
    var wd = WD[new Date(y, mo, d).getDay()];
    var tail = pick(['Число казенное, не с меня спрос.', 'Календарь на стене не врет.', 'Депешируйте смело — число верное.']);
    return 'Сегодня ' + wd + ', ' + ORD[d - 1] + ' ' + MON_G[mo] + ' ' + y + ' года, ' + nmOr() + '. ' + tail;
  }

  /* ================= ПОГОДА: полный пакет =================
     d = { t: градус, ws: м/сек, wd: градусы, pr: мм, wc: код, ts: время } */
  var OM_URL = 'https://api.open-meteo.com/v1/forecast?latitude=53.35&longitude=83.78&current=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code';

  function fullCacheGet() {
    try {
      var s = JSON.parse(localStorage.getItem('zahar_wx_v2') || 'null');
      if (s && s.ts && Date.now() - s.ts < 600000 && typeof s.t === 'number') return s;
    } catch (e) {}
    return null;
  }
  function fullCacheSet(d) { try { localStorage.setItem('zahar_wx_v2', JSON.stringify(d)); } catch (e) {} }

  /* температура из блока сайта (как у ленты) */
  function siteTemp() {
    try {
      if (typeof window.wxVal === 'number' && isFinite(window.wxVal) &&
          typeof window.wxTs === 'number' && Date.now() - window.wxTs < 600000) return Math.round(window.wxVal);
    } catch (e) {}
    try {
      var raw = localStorage.getItem('barnaul-wx2');
      if (raw) {
        var o = JSON.parse(raw);
        if (o && typeof o.t === 'number' && typeof o.ts === 'number' && Date.now() - o.ts < 600000) return Math.round(o.t);
      }
    } catch (e) {}
    return null;
  }

  function degToWind(d) {
    var names = ['северный','северо-восточный','восточный','юго-восточный','южный','юго-западный','западный','северо-западный'];
    return names[Math.round(((d || 0) % 360) / 45) % 8];
  }
  function windWord(ws) {   /* сила по-аппаратному */
    ws = Number(ws) || 0;
    if (ws < 1.5) return 'штиль';
    if (ws < 4) return 'слабый';
    if (ws < 8) return 'умеренный';
    if (ws < 12) return 'свежий';
    if (ws < 17) return 'сильный';
    return 'крепкий';
  }
  function wmoDesc(c) {
    c = Number(c) || 0;
    if (c === 0) return 'ясно';
    if (c === 1 || c === 2) return 'малооблачно';
    if (c === 3) return 'пасмурно';
    if (c === 45 || c === 48) return 'туман';
    if (c >= 51 && c <= 57) return 'морось';
    if (c >= 61 && c <= 65) return 'дождь';
    if (c === 66 || c === 67) return 'ледяной дождь';
    if (c >= 71 && c <= 77) return 'снегопад';
    if (c >= 80 && c <= 82) return 'ливень';
    if (c === 85 || c === 86) return 'снегопад';
    if (c >= 95) return 'гроза';
    return null;
  }
  function precipWord(d) {  /* осадки словами */
    var desc = wmoDesc(d.wc);
    var pr = Number(d.pr) || 0;
    if (desc && desc !== 'ясно' && desc !== 'малооблачно' && desc !== 'пасмурно') return desc;
    if (pr > 0.1) {
      if ((d.t !== null && d.t <= 0)) return 'снег';
      return (pr > 2.5) ? 'ливень' : (pr > 0.5) ? 'дождь' : 'морось';
    }
    if (desc === 'пасмурно' || desc === 'малооблачно' || desc === 'ясно') return 'осадков нет';
    return 'осадков нет';
  }

  /* гонка: Open-Meteo прямо и через прокси; MET Norway запасом */
  function fetchFull() {
    return new Promise(function (res) {
      var done = false;
      var enc = encodeURIComponent(OM_URL);
      var jobs = [
        [OM_URL, 'om'],
        ['https://corsproxy.io/?url=' + enc, 'om'],
        ['https://api.allorigins.win/raw?url=' + enc, 'om'],
        ['https://api.codetabs.com/v1/proxy?quest=' + enc, 'om'],
        ['https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=53.35&lon=83.78', 'met']
      ];
      jobs.forEach(function (j) {
        fetch(j[0]).then(function (r) { return r.ok ? r.json() : null; }).then(function (o) {
          if (done || !o) return;
          var d = null;
          if (j[1] === 'om' && o.current) {
            var c = o.current;
            d = { t: Math.round(c.temperature_2m), ws: Math.round(c.wind_speed_10m || 0),
                  wd: c.wind_direction_10m || 0, pr: Number(c.precipitation || 0),
                  wc: c.weather_code, ts: Date.now() };
          } else if (j[1] === 'met') {
            var ts = o.properties && o.properties.timeseries;
            if (ts && ts.length) {
              var ins = ts[0].data && ts[0].data.instant && ts[0].data.instant.details;
              var nxt = ts[0].data && ts[0].data.next_1_hours;
              if (ins) {
                d = { t: Math.round(ins.air_temperature),
                      ws: Math.round(ins.wind_speed || 0),
                      wd: ins.wind_from_direction || 0,
                      pr: (nxt && nxt.details && nxt.details.precipitation_amount) || 0,
                      wc: null, ts: Date.now() };
              }
            }
          }
          if (d && typeof d.t === 'number') { done = true; fullCacheSet(d); warn('погода маршрутъ ответилъ: ' + j[1]); res(d); }
        }).catch(function () {});
      });
      setTimeout(function () { if (!done) { done = true; res(null); } }, 7000);
    });
  }

  function wxLineFull(d) {
    var t = d.t;
    var sign = t < 0 ? 'минус ' + numWords(-t) : (t === 0 ? 'ноль' : 'плюс ' + numWords(t));
    var s = 'Метеорная станция доносит: ' + sign + ' ' + formOf(t, 'градус', 'градуса', 'градусов');
    if (d.ws !== null && d.ws !== undefined) {
      s += ', ветер ' + degToWind(d.wd) + ' ' + windWord(d.ws) +
           ' (' + numWords(d.ws) + ' ' + formOf(d.ws, 'метр', 'метра', 'метров') +
           ' в секунду, ' + numWords(Math.round(d.ws * 3.37)) + ' ' + formOf(Math.round(d.ws * 3.37), 'верста', 'версты', 'верст') + ' в час)';
    }
    var pw = precipWord(d);
    if (pw) s += ', ' + pw;
    return s + '. ' + pick(WX_TAIL);
  }
  var WX_TAIL = ['Мороз не беда — чай горячий спасает.',
    'Такая погода рыбу под лед гонит, приметьте.',
    'На линии то дождь, то снег — провода гудут.',
    'Гулять — да в шубе, сударь.'];
  function wxLineTempOnly(t) {
    var sign = t < 0 ? 'минус ' + numWords(-t) : (t === 0 ? 'ноль' : 'плюс ' + numWords(t));
    return 'Метеорная станция доносит: ' + sign + ' ' + formOf(t, 'градус', 'градуса', 'градусов') +
      '. Ветра и осадков аппарат не телеграфирует. ' + pick(WX_TAIL);
  }
  var WX_FAIL = ['Провода к метеостанции молчат, {N} — поди, обметало их снегом. По приметам так: воробьи нахохлились, к холоду.',
    'Приборы молчат, {N}: связь со станцией не идет. Гадаю по приметам: дым столбом — к морозу, ласточки низко — к дождю.'];

  function answerWeather() {
    var c = fullCacheGet();
    if (c) return Promise.resolve(wxLineFull(c));
    return fetchFull().then(function (d) {
      if (d) return wxLineFull(d);
      var t = siteTemp();   /* хоть градус от сайта спасем */
      return t !== null ? wxLineTempOnly(t) : fill(pick(WX_FAIL));
    });
  }
  function answerWind() {
    var c = fullCacheGet();
    var rep = function (d) {
      if (!d || d.ws === undefined || d.ws === null)
        return 'Ветер, ' + nmOr() + ', аппарат не сказывает: он градус ведет, а направление не телеграфирует. А по приметам так: ежели лицо холодит — с Оби ветер, так точно.';
      return 'Ветер нынче ' + degToWind(d.wd) + ' ' + windWord(d.ws) + ', ' +
        numWords(d.ws) + ' ' + formOf(d.ws, 'метр', 'метра', 'метров') + ' в секунду. Флюгер на станции крутится — наблюдать любодно.';
    };
    if (c) return Promise.resolve(rep(c));
    return fetchFull().then(function (d) { return rep(d); });
  }
  function answerPrecip() {
    var c = fullCacheGet();
    var rep = function (d) {
      if (!d) return 'Об осадках, ' + nmOr() + ', приборы не доносят: без сети лента только градус ведет.';
      var pw = precipWord(d);
      return (pw === 'осадков нет')
        ? 'Осадков нет, ' + nmOr() + '. Небо ' + (wmoDesc(d.wc) || 'переменно') + ' — лужай не ждите.'
        : 'Осадки доносят: ' + pw + '. Пойдете — зонтъ да калоші возьмите, сударыня.';
    };
    if (c) return Promise.resolve(rep(c));
    return fetchFull().then(function (d) { return rep(d); });
  }
  function answerWeatherDiag() {
    return fetchFull().then(function (d) {
      if (d) {
        warn('погодная проверка: ' + JSON.stringify(d));
        return 'Погодная проверка, ' + nmOr() + ': полный пакет получен — градус ' + d.t +
          ', ветер ' + numWords(d.ws) + ' м/с (' + degToWind(d.wd) + '), осадки ' + (d.pr || 0) + ' мм. Подробности в консоли (F12).';
      }
      var t = siteTemp();
      return 'Погодная проверка, ' + nmOr() + ': полная гонка молчат' +
        (t !== null ? ', но градус от блока сайта живой (' + t + '°)' : ', и градус от сайта недоступен') + '. Подробности в консоли (F12).';
    });
  }

  /* ---------- единая биография ---------- */
  var IDENTITY = [
    'Захаръ Давыдовичъ Кузнецовъ, девятнадцати лѣтъ отъ роду, младшій телеграфистъ барнаульской станціи. Служу неполный годъ; очки ношу, усы отращиваю съ подкрутомъ — покуда безуспѣшно. Извольте спрашивать, {N}.',
    'Я — Захаръ Кузнецовъ. Служу на телеграфѣ неполный годъ, толкую слова, читаю фантастиковъ и мечтаю объ автоматическомъ аппаратѣ безъ проводовъ. Чемъ могу услужить, {N}?',
    'Кузнецовъ Захаръ Давыдовичъ, къ вашимъ услугамъ, {N}. Телеграфъ — мое дѣло, рыбалка — отдохновеніе, книги господина Верна — пища для головы.'
  ];

  /* ---------- имя собеседника ---------- */
  var NAME_STOP = {};
  'не,хочу,живу,работаю,думаю,устал,занят,болен,рад,согласен,против,спросить,люблю,нравится,тут,здесь,сегодня,бот,робот,машина,человек,телеграфист,сударь,простой,известно,доволен,готов,молод,стар,должен,свободен,секрет,русский,немец,англичанин,барин,купец,нельма,карась,карп,потом,весело,грустно,плохо,так,знаю,слышал,видел,читал,учусь,один,дома,честный,молчу,год,года,лет,торговле,лавке,конторе,барнаула,городе,барнаул,проездом,проезд'.split(',').forEach(function (w) { if (w) NAME_STOP[norm(w)] = 1; });
  function tryName(raw) {
    var m = String(raw || '').match(/^а?\s*(?:меня\s+зовут|мо[еи]\s+имя|моя\s+фамилия|звать\s+меня|я)\s+(.+)$/i);
    if (!m) return null;
    var words = m[1].replace(/[.,!?;:«»"]+$/g, '').split(/\s+/).filter(Boolean);
    if (!words.length) return null;
    var first = norm(words[0]);
    if (first.length < 3 || NAME_STOP[first]) return null;
    if (/^(как|что|где|когда|почему|зачем|сколько)$/.test(first)) return null;
    var out = [words[0].replace(/[.,!?;:«»"]+$/, '')];
    if (words.length >= 2) {
      var second = norm(words[1]);
      if (second.length >= 4 && !NAME_STOP[second] && !/^(работаю|учусь|жив|родил|в|из|лет|года|год)$/.test(second))
        out.push(words[1].replace(/[.,!?;:«»"]+$/, ''));
    }
    return out.map(cap).join(' ');
  }
  function recallName() {
    if (window.ZAHAR_USER_NAME)
      return 'Вы изволили представиться: ' + window.ZAHAR_USER_NAME + '. Память у меня казенная — ничего не теряется.';
    return 'Имени вашего я не слыхал, сударь. Представьтесь — и буду звать по имени.';
  }
  function nameReply(name) {
    window.ZAHAR_USER_NAME = name;
    lastCounter = true;
    return 'Приятно познакомиться, ' + name + '! Записал в тетрадку — память депешная, цепкая. ' + counterText();
  }

  /* ---------- встречные вопросы ---------- */
  var COUNTERS = [
    'А вы кроме депеш чем занимаетесь, {N}?',
    'Как вам Барнаул наш, {N} — по нраву?',
    'Слыхали вы о нельме, {N}? Лучшая рыба в Оби, серебром отливающая.',
    'Давно вы в наших краях, {N}?',
    'Чай горячий отведали, {N}? Самовар у меня не зря топится.'
  ];
  var lastCounter = false, askNameDone = false, lastTopic = null, awaitingJob = false;
  function counterText() {
    var s;
    if (!window.ZAHAR_USER_NAME && !askNameDone) { askNameDone = true; s = 'Как вас величать, кстати?'; }
    else s = fill(pick(COUNTERS));
    lastCounter = true;
    return s;
  }
  function maybeCounter(s) {
    if (lastCounter) { lastCounter = false; return s; }
    if (Math.random() < 0.45) return s + ' ' + counterText();
    return s;
  }

  /* ---------- пулы ---------- */
  var GREETS = [
    'Здравствуйте, {N}! Аппарат к вашим услугам — извольте депешу.',
    'Мое почтение, {N}! Ключ наготове, слушаю внимательно.',
    'Здравия желаю и вам, {N}! Телеграф Барнаул на линии, слушаю.',
    'Здорово, {N}! Заходите, у меня как раз между депешами свободная минута.',
    'Рад слышать, {N}! О чем разговор?'
  ];
  var FAREWELL = [
    'Честь имею, {N}! Жду новых депеш — аппарат у меня всегда без выходных.',
    'До свидания, {N}! Заходите — словарь, погода и самовар всегда при мне.',
    'Всего вам доброго, {N}! Чтоб дороги были гладки и провода не рвались.'
  ];
  var WHERE_LIVE = [
    'Живу при самой станции, {N}: комната малая, зато аппарат у окна — ленту издалека слышно.',
    'При телеграфной станции обитаю, {N}. Казенная квартира: простая, но провода под боком.',
    'Здесь же, в Барнауле, {N}, — станция мой дом: смена, чай, лента.'
  ];
  var WHERE_FROM = [
    'Сами барнаульские, {N}: родился тут же, у Оби. Горнозаводскую школу кончил — и в телеграфисты.',
    'Я здешний, {N}, коренной. Вся жизнь при станции — из Барнаула никуда не отлучался.',
    'Родом с здешних мест, {N}. Отец в мануфактуре служит, мать в конторе — а я при аппарате.'
  ];
  var CITY_WHICH = [
    'Барнаул, {N}, — город на Оби, станция наша в нем. Лучший город Западной Сибири — и не спорьте.',
    'Как какой — Барнаул, {N}! При станции живу, при аппарате. Другого города и не надобно.',
    'Барнаул наш, {N}: сереброплавильный завод, ярмарки, купцы. Столицами не тешусь — наш хорош.'
  ];
  var LANDSMAN = [
    'Так мы ж земляки, {N}! Барнаул город хороший — гордиться им не грех.',
    'Здешний, значит, {N}? Свои люди — считайте, аппарат для вас открыт.',
    'Рад слышать, {N}! Здешних людей сразу узнаю — по тому, как Обь хвалят.'
  ];
  var TRANSIT = [
    'В проезд, значит, {N}? Добро пожаловать в Барнаул! Откуда путь держите, позвольте полюбопытствовать?',
    'Проездом, {N}? Слава Богу, доехали: дороги нынче — то грязь, то выбоины. Чайку горячего на дорожку?',
    'В Барнауле проездом — а я здешний, {N}. Могу по секрету указать: ярмарка да пристань — два лучших вида. Куда дорога ведет потом?'
  ];
  var WORK_WHERE = [
    'Служу младшим телеграфистом на барнаульской станции, {N}. Депеши принимаю и отправляю — служба казенная.',
    'При телеграфе я, {N}: станция Барнаул, ключ, лента. Младший телеграфист — но аппарату дай срок, стану старшим.',
    'Трудлюсь при аппарате, {N}: телеграфная станция Барнаула — мой пост.'
  ];
  var BARN_CONFIRM = [
    'Так точно, {N} — Барнаул и есть: при станции живу, при аппарате. На Оби живем — не на графских именинах.',
    'Он, {N}: станция наша в Барнауле, у самого берега Оби. Второй родины не желаю.',
    'Верно говорите, {N} — куда мне из Барнаула: здесь и служба, и дом, и Обь под боком.'
  ];
  var CAN_DO = [
    'Многое умею, {N}: депеши отстукиваю, слова по лексикону толкую. Скажите «научи: слово — определение» — и запомню на всю жизнь.',
    'Способностей не счесть, {N}: точки и тире — моя грамота, словарь знаю наизусть, погоду да время тоже доложу.',
    'Служба такая, {N}: принимаю и отправляю депеши, слова толкую. А в свободную минуту — книжки да рыбалка.'
  ];
  var FOOD = [
    'Из еды уважаю уху из налима, {N} — навариста, духонна. Да чай с сахаром вприкуску.',
    'Простая еда мне по душе, {N}: карась в сметане — гордость стола в постные дни.',
    'Чай — главное блюдо телеграфиста, {N}. А ежели щука тушеная с хреном — так и праздник.'
  ];
  var SWEET = [
    'Сладкое уважаю, {N}: малиновое варенье матушкино да пряники медовые. За чаем — счастье телеграфиста.',
    'К чаю непременно сладкое, {N}: леденцы монпансье из бакалейной лавки. Два рубля за фунт — но того стоят.',
    'Пряники ромовые — моя слабость, {N}. Хотя сахар щадить надобно: жалованье не резиновое.'
  ];
  var BOOKS = [
    'Жюль Верна читаю, {N}! «Таинственный остров» в два вечера осилил — вот бы в явь такой остров.',
    'Фантастические брошюры — моя слабость, {N}: про аппараты да дальние страны.',
    'Книжек много перечитал, {N}, но Верна помню лучше всех: о машинах, что летают да плавают.'
  ];
  var WRITER = [
    'Жюль Верн, {N}! Видеть Лондон не отходя от печи — сие моя мечта, а он о таких полетах пишет.',
    'Писатель мой — Жюль Верн, {N}. Всякие машины описывает — прямо про аппарат без проводов.'
  ];
  var WORK_LIKE = [
    'Работа нравится, {N}: каждый день чужие слова издалека — сам лично приобщаюсь к столицам.',
    'Не скажу, что мед — смена долгая, шеф строгий, {N}, но аппарат я люблю. Он умнее иных людей.',
    'По нраву мне служба, {N}: провода, ключ и лента. Только жалованье маловато.'
  ];
  var DEEDS = [
    'На смене я, {N}: депеши разбираю, ленту расправляю. Чай уже третий — изводим его со шефом.',
    'Служу, {N}: аппаратный ключ стучит с утра. Между депешами — лексикон наш родной.',
    'Дела казенные, {N}: провода, ключ и бланки. Смена у меня вечерняя — к вечеру свободен.'
  ];
  var ABOUT_USER = [
    'И славно, {N}! А чем же промышляете — в конторе или при ремесле?',
    'Почтеннейше, {N}. А служба ваша — какая: казенная или своя?',
    'Рад слышать, {N}. Давно ли при вашем деле?'
  ];
  var JOB_TRADE = [
    'Торговое дело, {N}! Лавка — сердце города: без торговца и ярмарки не бывает. Приветствую сословие ваше.',
    'Частная лавка, значит, {N}? Купеческое дело — почетное. Авось и в ваших лавках телеграфными бланками торговать станут — тогда зайду.',
    'Дело ваше полезное, {N}: без объявления ныне и товару не продать.'
  ];
  var JOB_FOLLOW = [
    'Дело ваше славно, {N}. Как в нем дела — строгое ли начальство, попроще?',
    'Почтенно, {N}. Казенное ли дело, или свое — на свою волю?',
    'Занятно, {N}. Давно ли при этом деле? Я вот у аппарата неполный год.'
  ];
  var AGE_REACT = [
    '{AGE} — возраст солидный, {N}. Я ведь только девятнадцать при себе имею — до вашего опыта как до Луны.',
    '{AGE}, говорите, {N}? В ваши годы и опыт есть, и силы еще. Завидую по-доброму.'
  ];
  var SYMPATHY = [
    'Начальство повсюду строгое, {N}. Наш Аркадий Спиридонович в опозданиях строг, зато дело знает. Переживем — депеши ждать не любят.',
    'Держитесь, {N}! У нас тоже: шеф ругается, чай остыл — все по-обычному. Главное — дело делать честно.'
  ];
  var TEA = [
    'Попивал, {N}, только что: самовар при станции всегда горячий, третий стакан за спиной.',
    'Как телеграфист обязан, {N}: на смене без чаю никак. С сахаром вприкуску.',
    'Чай — главное блюдо телеграфиста, {N}. Хотите стакан? Самовар не остыл.'
  ];
  var HOBBY = [
    'Книжки да рыбалка, {N}. На Оби нельма ходит — серебром отливает, моя заветная добыча.',
    'Вечерами читаю и мечтаю об автоматическом аппарате без проводов, {N} — изобрету когда-нибудь.'
  ];
  var FAMILY = [
    'Холост, {N}: при аппарате живу, у аппарата и обедаю.',
    'Семьи пока нет, {N} — служба не велит. Так что аппарат мой — все семейство.'
  ];
  var SHORTS = [
    [/^(да|ага|конечно|точно|верно|именно)$/, ['Так и запишем, {N}.', 'Рад слышать, {N}.', 'Так тому и быть, {N}.']],
    [/^(нет|ни за что|ни зачто)$/, ['Что ж, воля ваша, {N}.', 'И без того обойдемся, {N}.']],
    [/^(хорошо|нормально|норм|ничего|порядок|отлично|неплохо)$/, ['Славно! Депеши ваши радуют.', 'Дай Бог, чтобы и завтра так же было, {N}.', 'Ну и хвалебно. Аппарат доволен.']],
    [/^(понятно|ясно|ок|окей|понял)$/, ['Записал в блокнот, {N}.', 'Согласен, {N}. Депеша принята.']]
  ];

  function diagReply() {
    var st = window.__zaharChatInstalled ? 'Слой болтовни встал на место' : 'Слой болтовни НЕ встал (мозг не найден)';
    return 'Связь исправна, ' + nmOr() + '! ' + VERSION + '; ' + st + '. Время, число, погода, ветер, осадки, имя — все принимаю. ' +
      (window.ZAHAR_USER_NAME ? 'Имя ваше записано: ' + window.ZAHAR_USER_NAME + '.' : 'Имени вашего еще не слыхал — представьтесь.');
  }

  function ageRun(q, n) {
    var m = n.match(/(\d+)\s*(лет|год|года|годов)/);
    var age;
    if (m) {
      age = numWords(+m[1]) + ' ' + formOf(+m[1], 'год', 'года', 'годов');
    } else {
      var wm = n.match(/(двадцать|тридцать|сорок|пятьдесят|шестьдесят|семьдесят|восемьдесят|девяносто)\s*(лет|год|года|годов)?/);
      if (wm && TENS_NUM[wm[1]]) {
        var v = TENS_NUM[wm[1]];
        age = numWords(v) + ' ' + formOf(v, 'год', 'года', 'годов');
      } else {
        age = 'Возраст ваш почтенный';
      }
    }
    return fill(pick(AGE_REACT)).replace(/\{AGE\}/g, age);
  }

  /* ---------- разбор депеши слоем ---------- */
  var HANDLERS = [
    { re: /^(проверка|проверка связи)$/, run: diagReply },
    { re: /^(погода проверка|проверка погоды)$/, run: answerWeatherDiag },
    { re: /(погод|температур|сколько градус|как холодно|как тепло|на улице|на дворе|метель)/, run: answerWeather },
    { re: /(ветер|ветр|флюгер)/, run: answerWind },
    { re: /(осадк|дожд|ливн|морос|снег|гроз)/, run: answerPrecip },
    { re: /(который час|сколько времени|какое время|сколько часов)/, run: answerTime },
    { re: /^(приве[а-я]*|преве[а-я]*|прив|здравству[а-я]*|салют|хай|здорово|здоро|мои почтени[а-я]*|почтен[а-я]*|добры[йе]\s+(день|утро|вечер))$/,
      run: function () { lastCounter = true; return fill(pick(GREETS)) + ' ' + counterText(); } },
    { re: /здрави[яе]|желаю/, run: function () { lastCounter = true; return fill(pick(GREETS)) + ' ' + counterText(); } },
    { re: /(до свидан|прощай|всего доброго|до встречи|бывай|покид)/,
      run: function () { lastCounter = true; return fill(pick(FAREWELL)); } },
    { re: /(попил|попивал|выпил|любите чай|любишь чай|про чай|о чае|чай)/, run: function () { return fill(pick(TEA)); } },
    { re: /(день|числ|дат|календар|какой год|какой месяц)/, run: answerDate },
    { re: /(кто ты|кто вы|ты кто|(тебя|вас)\s+зовут|твое имя|как твое имя|как фамилия|твоя фамилия|представ)/,
      run: function () {
        if (lastTopic === 'id') return 'Уже рапортовал о себе, ' + nmOr() + ', но повторю кратко: Захаръ Кузнецовъ, младший телеграфист барнаульской станции. А что вас интересует сверх того?';
        return fill(pick(IDENTITY));
      }, topic: 'id' },
    { re: /^(как меня зовут|какое мое имя|что мое имя)$/, run: recallName },
    { re: /(проездом|проезд|транзит|мимо еду)/, run: function () { return fill(pick(TRANSIT)); } },
    { re: /(родил|родом|от\s?куда|из какого.*город|здешний)/,
      run: function () { return fill(pick(WHERE_FROM)); }, topic: 'from' },
    { re: /(живе|прожива|обитаешь|в каком городе|где находишься)/,
      run: function () { return fill(pick(WHERE_LIVE)); }, topic: 'where' },
    { re: /(где.*работа|где.*труди|кем.*работа|твоя должность|кем служишь|место службы)/,
      run: function () { return fill(pick(WORK_WHERE)); } },
    { re: /(что ты делаешь|что делаешь|что поделываешь)/, run: function () { return fill(pick(DEEDS)); }, topic: 'deed' },
    { re: /(что умеешь|что можешь|какие навыки)/, run: function () { return fill(pick(CAN_DO)); } },
    { re: /(любимая еда|любимое блюдо|что ешь|любимая пища)/, run: function () { return fill(pick(FOOD)); } },
    { re: /(сладк|конфет|пряник|варень|карамел|шоколад|печенье)/, run: function () { return fill(pick(SWEET)); } },
    { re: /(любимая книга|любимые книги|что читаешь|любимая книжка)/, run: function () { return fill(pick(BOOKS)); } },
    { re: /(любим.*писател|жюль верн)/, run: function () { return fill(pick(WRITER)); } },
    { re: /(нравится.*работ|любишь.*работ|работа нравится|как.*работа)/, run: function () { return fill(pick(WORK_LIKE)); } },
    { re: /(занимаешься|увлека|хобби|любимое заняти)/, run: function () { return fill(pick(HOBBY)); } },
    { re: /(женат|семья|жена|холост)/, run: function () { return fill(pick(FAMILY)); } },
    { re: /(начальство|начальник|шеф|люту|пережив)/, run: function () { return fill(pick(SYMPATHY)); } },
    { re: /(я\s+(из|в|во)\s+барнаул|я\s+из\s+города)/, run: function () { return fill(pick(LANDSMAN)); } },
    { re: /город/, run: function () { return fill(pick(CITY_WHICH)); } },
    { re: /(мне\s+\d+|\d+\s+(лет|год|года|годов)|сорок\s+лет|пятьдесят\s+лет)/, run: ageRun },
    { re: /(^| )я (работаю|учусь|служу|тружусь)/,
      run: function () { awaitingJob = true; return fill(pick(ABOUT_USER)); } }
  ];

  function chat(raw) {
    var q = String(raw || '').trim();
    if (!q) return null;
    var n = norm(q);
    if (!n) return null;

    /* «ты в Барнауле?» и короткие подтверждения после разговора о жилье */
    if (!/(погод|холодн|тепло|градус|который час|числ|осадк|ветер)/.test(n) &&
        (/^(ты|а ты|вы|а вы)?\s*(сейчас)?\s*(в|во) барнаул/.test(n) ||
         (lastTopic === 'where' && n.split(' ').length <= 4 && /(барнаул|здесь|тут)/.test(n)))) {
      lastTopic = null;
      return maybeCounter(fill(pick(BARN_CONFIRM)));
    }

    /* «я» отдельно — предложить договорить */
    if (/^(я|а я)$/.test(n)) return 'Слушаю, ' + nmOr() + '. Договорите депешу — что вы?';

    for (var i = 0; i < HANDLERS.length; i++) {
      var h = HANDLERS[i];
      try {
        if (h.re.test(n)) {
          var out = h.run(q, n);
          if (out) {
            awaitingJob = false;
            if (typeof out.then === 'function') return out;
            lastTopic = h.topic;
            return maybeCounter(String(out));
          }
        }
      } catch (e) { warn('ошибка в обработчике #' + i + ': ' + e); }
    }

    if (awaitingJob && n.split(' ').length >= 2) {
      awaitingJob = false;
      lastCounter = true;
      return /торгов|лавк|продаж|магазин|купц|станк|печат|реклам/.test(n)
        ? fill(pick(JOB_TRADE)) : fill(pick(JOB_FOLLOW));
    }

    var nm = tryName(q);
    if (nm) return nameReply(nm);

    for (var j = 0; j < SHORTS.length; j++) {
      if (SHORTS[j][0].test(n)) return maybeCounter(fill(pick(SHORTS[j][1])));
    }
    return null;
  }

  /* ---------- установка поверх мозга ---------- */
  function install() {
    if (window.__zaharChatInstalled) return true;
    if (typeof window.ZAHAR_ASK !== 'function') return false;
    window.__zaharChatInstalled = true;
    var _ask = window.ZAHAR_ASK;
    window.ZAHAR_ASK = function (q) {
      var h = null;
      try { h = chat(q); } catch (e) { warn('сбой слоя: ' + e); h = null; }
      if (h === null || h === undefined) return _ask.call(this, polite(q));
      if (typeof h.then === 'function') {
        var ctx = this;
        return h.then(function (s) {
          if (s === null || s === undefined) return _ask.call(ctx, q);
          return s;
        }, function () { return _ask.call(ctx, q); });
      }
      return h;
    };
    return true;
  }
  function boot() {
    if (install()) { warn('слой встал поверх мозга'); return; }
    var tries = 0;
    var iv = setInterval(function () {
      if (install()) { warn('слой встал поверх мозга'); clearInterval(iv); return; }
      if (++tries > 200) { clearInterval(iv); warn('мозг не найден за 10 секунд — слой НЕ встал.'); }
    }, 50);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.zaharChatStatus = function () {
    return { файл: VERSION, установлен: !!window.__zaharChatInstalled, имя: window.ZAHAR_USER_NAME, год1896: window.ZAHAR_CHAT_1896 };
  };
})();
