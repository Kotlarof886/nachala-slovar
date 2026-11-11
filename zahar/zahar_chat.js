/* ============================================================
   zahar_chat.js — слой живой болтовни Захара, правка №9.
   Подключать ПОСЛЕ zahar_brain.js:
     <script src="zahar/zahar_chat.js"></script>
   Погода — из блока самого сайта: читает wxVal/wxTs,
   localStorage barnaul-wx2, при нужде просит сайт запустить
   гонку (wxFetch); запас — своя гонка через те же прокси.
   Цифры Захара и ленты совпадают всегда.
   Диагностика: «проверка», «погода проверка». Логи — F12.
   ============================================================ */
(function () {
  if (window.__zaharChatLoaded) return;
  window.__zaharChatLoaded = true;
  if (typeof window.ZAHAR_CHAT_1896 === 'undefined') window.ZAHAR_CHAT_1896 = true;
  if (!window.ZAHAR_USER_NAME) window.ZAHAR_USER_NAME = null;
  if (!window.ZAHAR_USER_JOB) window.ZAHAR_USER_JOB = false;

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
  function nmOr() { return window.ZAHAR_USER_NAME ? cap(window.ZAHAR_USER_NAME) : 'сударь'; }
  function fill(s) { return String(s || '').replace(/\{N\}/g, nmOr()); }

  /* ---------- ты -> вы (границы слов без \b — с кириллицей он не работает) ---------- */
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
  function numWords(n) {
    n = Math.round(Math.abs(Number(n) || 0));
    if (n < 20) return ONES[n] || String(n);
    var t = Math.floor(n / 10), o = n % 10;
    return TENS[t] + (o ? ' ' + ONES[o] : '');
  }
  function gradForm(n) {
    var d = Math.abs(n) % 100, l = d % 10;
    if (d >= 11 && d <= 14) return 'градусов';
    if (l === 1) return 'градус';
    if (l >= 2 && l <= 4) return 'градуса';
    return 'градусов';
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
    var form = (h12 === 1) ? 'час' : (h12 >= 2 && h12 <= 4) ? 'часа' : 'часов';
    var mf = (m === 1) ? 'минута' : (m % 10 >= 2 && m % 10 <= 4 && !(m >= 11 && m <= 14)) ? 'минуты' : 'минут';
    return pick(['На аппаратных часах', 'Часы показывают', 'Стенные часы бьют']) +
      ': ' + numWords(h12) + ' ' + form + ' ' + numWords(m) + ' ' + mf + ' ' + part + ', ' + nmOr() + '.';
  }
  function answerDate() {
    var now = new Date();
    var y = window.ZAHAR_CHAT_1896 ? 1896 : now.getFullYear();
    var d = now.getDate(), mo = now.getMonth();
    var wd = WD[new Date(y, mo, d).getDay()];
    var tail = pick(['Число казенное, не с меня спрос.', 'Календарь на стене не врет.', 'Депешируйте смело — число верное.']);
    return 'Сегодня ' + wd + ', ' + ORD[d - 1] + ' ' + MON_G[mo] + ' ' + y + ' года, ' + nmOr() + '. ' + tail;
  }

  /* ---------- погода: блок сайта (wxVal) -> запрос к сайту -> запасная гонка ---------- */
  var WX_TAIL = ['Мороз не беда — чай горячий спасает.',
    'Такая погода рыбу под лед гонит, приметьте.',
    'На линии то дождь, то снег — провода гудут.',
    'Гулять — да в шубе, сударь.'];
  function siteTemp() {   /* свежий градус от погодного блока сайта */
    try {
      if (typeof window.wxVal === 'number' && isFinite(window.wxVal) &&
          typeof window.wxTs === 'number' && Date.now() - window.wxTs < 600000) return window.wxVal;
    } catch (e) {}
    try {
      var raw = localStorage.getItem('barnaul-wx2');
      if (raw) {
        var o = JSON.parse(raw);
        if (o && typeof o.t === 'number' && typeof o.ts === 'number' && Date.now() - o.ts < 600000) return o.t;
      }
    } catch (e) {}
    return null;
  }
  function askSite(cb) {  /* просим блок сайта запустить гонку и опрашиваем его градус */
    try {
      if (typeof window.wxKick === 'function') window.wxKick();
      if (typeof window.wxFetch === 'function' && !window.wxBusy) window.wxFetch();
    } catch (e) { warn('запуск гонки сайта не удался: ' + e); }
    var n = 0;
    var iv = setInterval(function () {
      var t = siteTemp();
      if (t !== null) { clearInterval(iv); cb(t); return; }
      if (++n > 26) { clearInterval(iv); cb(null); }   /* ~6,5 сек */
    }, 250);
  }
  function proxyRace() {  /* запасная гонка тем же манером, что у сайта */
    var OM = 'https://api.open-meteo.com/v1/forecast?latitude=53.35&longitude=83.78&current=temperature_2m';
    var OMcb = OM + '&_cb=' + Date.now();
    var enc = encodeURIComponent(OMcb);
    var RE = /temperature_2m"\s*:\s*(-?\d+(?:\.\d+)?)/;
    var jobs = [
      [OM, RE],
      ['https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=53.35&lon=83.78', null],
      ['https://corsproxy.io/?url=' + enc, RE],
      ['https://api.allorigins.win/raw?url=' + enc, RE],
      ['https://api.codetabs.com/v1/proxy?quest=' + enc, RE]
    ];
    return new Promise(function (res) {
      var done = false;
      jobs.forEach(function (u) {
        fetch(u[0]).then(function (r) { return r.ok ? r.text() : null; }).then(function (t) {
          if (done || !t) return;
          var v = null;
          if (u[1]) { var m = u[1].exec(t); if (m) v = Math.round(parseFloat(m[1])); }
          else {
            try {
              var o = JSON.parse(t);
              var ts = o && o.properties && o.properties.timeseries;
              if (ts && ts.length && ts[0].data && ts[0].data.instant && ts[0].data.instant.details)
                v = ts[0].data.instant.details.air_temperature;
            } catch (e) {}
          }
          if (v !== null && !done) { done = true; res(Math.round(v)); }
        }).catch(function () {});
      });
      setTimeout(function () { if (!done) { done = true; res(null); } }, 7000);
    });
  }
  function wxLine(t) {   /* строка Захара: только честный градус, как на ленте */
    var sign = t < 0 ? 'минус ' + numWords(-t) : (t === 0 ? 'ноль' : 'плюс ' + numWords(t));
    return 'Метеорная станция доносит: ' + sign + ' ' + gradForm(t) + '. ' + pick(WX_TAIL);
  }
  var WX_FAIL = ['Провода к метеостанции молчат, {N} — поди, обметало их снегом. По приметам так: воробьи нахохлились, к холоду.',
    'Приборы молчат, {N}: связь со станцией не идет. Гадаю по приметам: дым столбом — к морозу, ласточки низко — к дождю.'];
  function answerWeather() {
    return new Promise(function (res) {
      var t = siteTemp();
      if (t !== null) { res(wxLine(t)); return; }
      askSite(function (t2) {
        if (t2 !== null) { res(wxLine(t2)); return; }
        proxyRace().then(function (t3) { res(t3 !== null ? wxLine(t3) : fill(pick(WX_FAIL))); });
      });
    });
  }
  function answerWeatherDiag() {
    return new Promise(function (res) {
      var t = siteTemp();
      var fns = (typeof window.wxKick === 'function') || (typeof window.wxFetch === 'function');
      warn('погодная проверка: сайт=' + t + ', функции сайта=' + fns);
      if (t !== null) { res('Погодная проверка, ' + nmOr() + ': блок сайта ОТВЕЧАЕТ — на аппарате ' + t + ' ' + gradForm(t) + ' по Цельсию, те же цифры, что на ленте.'); return; }
      askSite(function (t2) {
        if (t2 !== null) { res('Погодная проверка, ' + nmOr() + ': блок сайта ОТВЕТИЛ по запросу — ' + t2 + ' ' + gradForm(t2) + '.'); return; }
        res('Погодная проверка, ' + nmOr() + ': блок сайта и запасная гонка молчат. Подробности в консоли (F12).');
      });
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
  'не,хочу,живу,работаю,думаю,устал,занят,болен,рад,согласен,против,спросить,люблю,нравится,тут,здесь,сегодня,бот,робот,машина,человек,телеграфист,сударь,простой,известно,доволен,готов,молод,стар,должен,свободен,секрет,русский,немец,англичанин,барин,купец,нельма,карась,карп,потом,весело,грустно,плохо,так,знаю,слышал,видел,читал,учусь,один,дома,честный,молчу'.split(',').forEach(function (w) { if (w) NAME_STOP[norm(w)] = 1; });
  function tryName(raw) {
    var n = norm(raw);
    var m = n.match(/^(?:а\s+)?(?:меня\s+зовут|мо[еи]\s+имя|моя\s+фамилия|звать\s+меня|я)\s+(.+)$/);
    if (!m) return null;
    var cand = m[1].split(' ')[0];
    if (!cand || cand.length < 3) return null;
    if (NAME_STOP[cand]) return null;
    if (/^(как|что|где|когда|почему|зачем|сколько)$/.test(cand)) return null;
    return cand;
  }
  function recallName() {
    if (window.ZAHAR_USER_NAME)
      return 'Вы изволили представиться: ' + cap(window.ZAHAR_USER_NAME) + '. Память у меня казенная — ничего не теряется.';
    return 'Имени вашего я не слыхал, сударь. Представьтесь — и буду звать по имени.';
  }
  function nameReply(name) {
    window.ZAHAR_USER_NAME = name;
    lastCounter = true;
    return 'Приятно познакомиться, ' + cap(name) + '! Записал в тетрадку — память депешная, цепкая. ' + counterText();
  }

  /* ---------- встречные вопросы ---------- */
  var COUNTERS = [
    'А вы кроме депеш чем занимаетесь, {N}?',
    'Как вам Барнаул наш, {N} — по нраву?',
    'Слыхали вы о нельме, {N}? Лучшая рыба в Оби, серебром отливающая.',
    'Давно вы в наших краях, {N}?',
    'Чай горячий отведали, {N}? Самовар у меня не зря топится.'
  ];
  var lastCounter = false, askNameDone = false, lastTopic = null;
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
    'Рад слышать, {N}! Телеграф Барнаул на линии. О чем разговор?'
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
  var WORK_WHERE = [
    'Служу младшим телеграфистом на барнаульской станции, {N}. Депеши принимаю и отправляю — служба казенная.',
    'При телеграфе я, {N}: станция Барнаул, ключ, лента. Младший телеграфист — но аппарату дай срок, стану старшим.'
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
  var JOB_PRINT = [
    'Печатное дѣло, {N}! Станка печатного воочию не видал, а газеты в лавке беру исправно — реклама ваша, поди, и мои глаза ласкала.',
    'Рекламу, значит, {N}? Дѣло полезное: безъ объявленія теперь и товару не продать. Уважаю людей при станкѣ.'
  ];
  var JOB_FOLLOW = [
    'Дѣло ваше славно, {N}. Как в нем дела — строгое ли начальство, попроще?',
    'Почтенно, {N}. Казенное ли дѣло, или свое — на свою волю?',
    'Занятно, {N}. Давно ли при этом деле? Я вот у аппарата неполный год.'
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
    return 'Связь исправна, ' + nmOr() + '! ' + st + '. Время, число, погода, имя — все принимаю. ' +
      (window.ZAHAR_USER_NAME ? 'Имя ваше записано: ' + cap(window.ZAHAR_USER_NAME) + '.' : 'Имени вашего еще не слыхал — представьтесь.');
  }

  /* ---------- разбор депеши слоем ---------- */
  var HANDLERS = [
    { re: /^(проверка|проверка связи)$/, run: diagReply, topic: null },
    { re: /^(погода проверка|проверка погоды)$/, run: answerWeatherDiag, topic: null },
    { re: /(погод|температур|сколько градус|как холодно|как тепло|на улице|на дворе|метель)/, run: answerWeather, topic: null },
    { re: /(который час|сколько времени|какое время|сколько часов)/, run: answerTime, topic: 'time' },
    { re: /(числ|дат|день недели|какой день|какой год|какой месяц)/, run: answerDate, topic: 'date' },
    { re: /(кто ты|кто вы|ты кто|как тебя зовут|как вас зовут|твое имя|как твое имя|как фамилия|твоя фамилия|представ)/, run: function () { return fill(pick(IDENTITY)); }, topic: 'id' },
    { re: /(родил|родом|от\s?куда|из какого.*город|какой ты город|здешний)/, run: function () { return fill(pick(WHERE_FROM)); }, topic: 'from' },
    { re: /(живе|прожива|обитаешь|в каком городе|где находишься)/, run: function () { return fill(pick(WHERE_LIVE)); }, topic: 'where' },
    { re: /(где.*работа|кем.*работа|твоя должность|какая должность|кем служишь)/, run: function () { return fill(pick(WORK_WHERE)); }, topic: null },
    { re: /(что ты делаешь|что делаешь|что поделываешь)/, run: function () { return fill(pick(DEEDS)); }, topic: 'deed' },
    { re: /(что умеешь|что можешь|какие навыки)/, run: function () { return fill(pick(CAN_DO)); }, topic: null },
    { re: /(любимая еда|любимое блюдо|что ешь|любимая пища)/, run: function () { return fill(pick(FOOD)); }, topic: null },
    { re: /(сладк|конфет|пряник|варень|карамел|шоколад|печенье)/, run: function () { return fill(pick(SWEET)); }, topic: null },
    { re: /(любимая книга|любимые книги|что читаешь|любимая книжка)/, run: function () { return fill(pick(BOOKS)); }, topic: null },
    { re: /(любим.*писател|жюль верн)/, run: function () { return fill(pick(WRITER)); }, topic: null },
    { re: /(нравится.*работ|любишь.*работ|работа нравится|как.*работа)/, run: function () { return fill(pick(WORK_LIKE)); }, topic: null },
    { re: /(занимаешься|увлека|хобби|любимое заняти)/, run: function () { return fill(pick(HOBBY)); }, topic: null },
    { re: /(женат|семья|жена|холост)/, run: function () { return fill(pick(FAMILY)); }, topic: null },
    { re: /(^| )я (работаю|учусь|студент|школьник|инженер|врач|учитель)/, run: function () { window.ZAHAR_USER_JOB = true; return fill(pick(ABOUT_USER)); }, topic: 'job' },
    { re: /^(привет|приветствую|здравствуй|здравствуйте|салют|хай)$/, run: function () { var s = fill(pick(GREETS)); lastCounter = true; return s + ' ' + counterText(); }, topic: null }
  ];

  function chat(raw) {
    var q = String(raw || '').trim();
    if (!q) return null;
    var n = norm(q);
    if (!n) return null;

    /* «ты в Барнауле?» и короткие подтверждения после разговора о жилье */
    if (/^(ты|а ты|вы|а вы)?\s*(сейчас)?\s*(в|во) барнаул/.test(n) ||
        (lastTopic === 'where' && n.split(' ').length <= 4 && /(барнаул|здесь|тут)/.test(n))) {
      lastTopic = null;
      return maybeCounter(fill(pick(BARN_CONFIRM)));
    }

    /* «я» отдельно — предложить договорить */
    if (/^(я|а я)$/.test(n)) return 'Слушаю, ' + nmOr() + '. Договорите депешу — что вы?';

    /* продолжение о деле собеседника */
    if (window.ZAHAR_USER_JOB && !/(погод|который час|числ|кто ты|как тебя|зовут|\?$)/.test(n) &&
        n.split(' ').length > 2 && !/^(да|нет|хорошо|ничего)$/.test(n)) {
      window.ZAHAR_USER_JOB = false;
      var jr = /печата|печат|реклам|станк/.test(n) ? fill(pick(JOB_PRINT)) : fill(pick(JOB_FOLLOW));
      lastCounter = true;
      return jr;
    }

    for (var i = 0; i < HANDLERS.length; i++) {
      var h = HANDLERS[i];
      try {
        if (h.re.test(n)) {
          var out = h.run(q, n);
          if (out) {
            if (typeof out.then === 'function') return out;
            lastTopic = h.topic;
            return maybeCounter(String(out));
          }
        }
      } catch (e) { warn('ошибка в обработчике #' + i + ': ' + e); }
    }
    lastTopic = null;

    var nm = tryName(q);
    if (nm) return nameReply(nm);

    for (var j = 0; j < SHORTS.length; j++) {
      if (SHORTS[j][0].test(n)) return maybeCounter(fill(pick(SHORTS[j][1])));
    }
    return null; /* слой молчит — депеша идет мозгу */
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
    return { файл: 'правка №9', установлен: !!window.__zaharChatInstalled, имя: window.ZAHAR_USER_NAME, год1896: window.ZAHAR_CHAT_1896 };
  };
})();
