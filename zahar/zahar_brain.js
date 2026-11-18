/* ============================================================
   №59.9п (17.11.2026): «завтра» — не завтракъ: стемъ 'завтр' исключенъ изъ мэтчинга
   (.depеша «завтра на лося» больше не отзывается столовкой).
   ============================================================ */
/* ============================================================
   №59.9м (17.11.2026): ночные приветствия — свой пулъ (ночь не отвечаетъ днемъ);
        «добрякъ» не огрызается статьей «Добре» (сырое слово обязательно);
        статьи регистрируютъ тему — «ЕЩЁ» дозвучиваетъ запиской второй;
        дореформенный «ъ» на словахъ статей (наливъ, ершъ).
   ============================================================ */
/* ============================================================
   №59.9л (16.11.2026): «доброй ночи» и «ночи доброй» — «ноч[а-яё]*» въ охранахъ
        обоихъ порядковъ; согласіе «желаю» после статьи; повторъ въ wiki-сборкѣ срезанъ (zaharCleanDef).
   ============================================================ */
/* ============================================================
   Захаръ — мозгъ v2.29 (№59.9к: «ден добры» — охрана после нормализации; «день добрый» — пулъ безъ памяти; «не доброе утро» — отказъ раньше словаря; «ъ» въ зачинахъ счищенъ; «Про словечко „X“») (Барнаулъ, 1896; личность вшита целиком)
   №59.9к (16.11.2026): нормализация сѣдаетъ «ь» («день»→«ден») — охрана обратнаго порядка переведена на «ден|утро|вечер»; пара тетрадки «добрый день» огрызалась статьей «Добре» — память у приветствий въ обратномъ порядкѣ не зовется;
   отрицательное приветствіе («утро нынче не доброе») — отказъ «дѣло ваше» до словаря и темъ; хвостатая «ъ/ь» въ статьяхъ счищена (наливъ — «налив», а не «налив — ъ»).
   №44: лексикон въ зачинахъ убранъ (кромѣ редкихъ словъ); согласіе
   (да/давай/расскажи/хорошо/ок/валяй/подробнее) открываетъ записку вторую
   v2.14: точный словарный поискъ (подстрочный бонусъ ключамъ отъ 6 буквъ),
   зачинъ повтора «Про X, значитъ», страховка пуловъ, помѣхи-отказы.
   v2.15: ять (ѣ) приравненъ къ «е»; мѣстоимена въ стопѣ; полъ на выходе пуловъ.
   v2.17: дверь мозга зоветъ внутреннюю функцию по ссылке (_zaharInner) —
   рекурсия двери (v2.16) устранена; остальное безъ измѣненій.
   v2.18: память репликъ — вхожденіе цѣлымъ словомъ («родители» больше не «ели»);
   «что такое X» при неизвѣстномъ X — честный отказ съ приглашеніемъ научить.
   v2.19: память репликъ — последній доводъ, а не первый: дозвучиваетъ послѣ
   словаря, личности и справокъ, а не глушитъ ихъ. Пустыя темы память
   пропускаетъ; дубли изъ памяти браузера при загрузкѣ файла не приписываются
   вторымъ слоемъ — файл памяти канониченъ.
   v2.21: стеммингъ усиленъ (ого/его/ому/ему/ое/еш/иш); родня основъ (ZAHAR_KIN);
   память репликъ — скорингъ всѣх паръ, лучший мэтч, а не первый;
   отрицанія: «не хочу/буду/собираюсь» гасятъ тему, «не знаешь где» — нетъ.
   v2.20: скорингъ словаря — подстрочный бонусъ взвѣшенъ длиной ключа
   («большакъ» уже не отыгрывается за «больше»); реплики памяти репликъ
   регистрируются въ ярусе разговора (window.__zaharNoteTopic) — «еще»
   дозвучиваетъ и после нельмы.
   №59.5 (слои по чину 15.11.2026): выученное — на своей полке (zahar_learned_v1);
   прежний ключ zahar_memory_v1 занят лентой embed — борьба за один ключ стирала
   имя и ленту; старый массив выученного переселяется разово. Забвение матчится
   по значимым словам (от 4 букв), а не только по точной фразе.
   Подключать ПОСЛЕДНИМ, после:
     zahar_memory.js, zahar_dict.js, words.js, zahar_phrases.js
   ============================================================ */
'use strict';
if (typeof window.ZAHAR_TEACH_MODE === 'undefined') window.ZAHAR_TEACH_MODE = true;

/* ---------- состояние ---------- */
var ZAHAR_SESSION = { lastWord: null, lastField: null };
var ZAHAR_DICT_EXTRA = [];
var ZAHAR_MEMORY = [];
var ZAHAR_WIKI_CACHE = {};
try { ZAHAR_WIKI_CACHE = JSON.parse(localStorage.getItem('zahar_wiki_v1') || '{}') || {}; } catch (e) { ZAHAR_WIKI_CACHE = {}; }

/* ---------- нормализация и стемминг ---------- */
var ZAHAR_STOP = {};
'и а но или же да что как это эти этот эта тот так тоже также ведь вот ну бы ли лишь уже ещё еще только очень даже там тут здесь про для под над без'.split(' ').forEach(function (w) { ZAHAR_STOP[w] = 1; });
'не ни при тут чем за зачем когда где куда почему разве если будто все всё весь вся от до ведь мол де'.split(' ').forEach(function (w) { ZAHAR_STOP[w] = 1; }); /* v2.16 */
'я ты мы вы он она оно они меня мне тебя тебе вас вам нас нам его ее ёе их мой моя мои твой твоя ваше ваш наш наше сам самый'.split(' ').forEach(function (w) { ZAHAR_STOP[w] = 1; });
'твои твою твоего твоей мою моего вашей вашего ваши наших нашей вашем вашей'.split(' ').forEach(function (w) { ZAHAR_STOP[w] = 1; }); /* v2.21 */

function zaharNorm(s) {
  return String(s || '').toLowerCase()
    .replace(/ё/g, 'е').replace(/ѣ/g, 'е').replace(/ḗ/g, 'е').replace(/[ъь]/g, '')
    .replace(/[іi]/g, 'и').replace(/ѳ/g, 'ф').replace(/ѵ/g, 'и')
    .replace(/[^a-zа-я0-9\s|]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

var _END = {};
'иями ями ами иях ах ях ов ев ей ой ый ий ая яя ую юю ым им ом ем ых их ее ые ие ого его ому ему ое еш иш ы и а я е у ю о й'.split(' ').forEach(function (e) { _END[e] = e.length; }); /* v2.21: добавки */
var ZAHAR_ENDINGS = Object.keys(_END).sort(function (a, b) { return b.length - a.length; });

function zaharStem(w) {
  if (!w || w.length < 5) return w;
  for (var i = 0; i < ZAHAR_ENDINGS.length; i++) {
    var e = ZAHAR_ENDINGS[i];
    if (w.length - e.length >= 3 && w.slice(-e.length) === e) return w.slice(0, w.length - e.length);
  }
  return w;
}

/* v2.21: родня основъ — разныя корни одного понятія */
var ZAHAR_KIN = [
  ['рыб', 'рыбалк', 'рыбач', 'рыболов', 'рыбак'],
  ['трактир', 'трактирн', 'корчм', 'харчевн'],
  ['телеграф', 'телеграфон', 'депеш', 'телеграмм'],
  ['станц'],
  ['работ', 'служб', 'служ', 'смен', 'дежур'],
  ['погод', 'погодк', 'погодн'],
  ['охот', 'ружь', 'берданк', 'дроб'],
  ['музык', 'оркестр', 'романс', 'гармошк', 'гармони', 'балалайк', 'гитар', 'песн'],
  ['книг', 'книж', 'чита', 'чтен'],
  ['еда', 'ед', 'куш', 'харч', 'обед', 'ужин', 'завтрак', 'пельмен', 'пирог', 'сметан'],
  ['ворон', 'воронь'],
  ['встреч', 'гост', 'визит'],
  ['проща', 'свидан'],
  ['имя', 'имен', 'зовут'],
  ['возраст', 'год', 'годик', 'лет'],
  ['сон', 'спат', 'спл'],
  ['зим', 'мороз', 'снежн'],
  ['нрав', 'люб', 'любим'],
  ['чай', 'чифир', 'самовар'],
  ['город', 'городск', 'гульб'],
  ['улиц'],
  ['шеф', 'начальник', 'начальств', 'управляющ'],
  ['родител', 'семь', 'матер', 'отц', 'батюшк', 'матушк', 'родн', 'мам', 'пап', 'брат', 'сестр'],
  ['деньг', 'рубл', 'копейк', 'жалован'],
  ['реч', 'река', 'речк', 'обск', 'стариц'],
  ['лес', 'тайг', 'бор', 'чащ'],
  ['морз', 'азбук'],
  ['школ', 'училищ', 'учен', 'учеб', 'горнозаводск'],
  ['спасибо', 'благодар'],
  ['ход', 'ходи', 'хажив', 'шаг'],
  ['день', 'ден', 'деньк', 'денька', 'деньком'],
  ['утро', 'утр', 'утречк', 'утреч', 'утречко', 'утречком'],
  ['вечер', 'вече', 'веч'],
  ['сегодня', 'сейчас', 'нынче']
];
function zaharKin(a, b) {
  for (var g = 0; g < ZAHAR_KIN.length; g++) {
    if (ZAHAR_KIN[g].indexOf(a) >= 0 && ZAHAR_KIN[g].indexOf(b) >= 0) return true;
  }
  return false;
}

function zaharTokensMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (zaharKin(a, b)) return true;
  var s = a.length <= b.length ? a : b;
  var l = a.length <= b.length ? b : a;
  /* №59.9п: «завтра» — не завтракъ: стемъ 'завтр' къ теме еды не цепляется */
  if (s === 'завтр' || l === 'завтр') return false;
  var ra = String(a).replace(/[ауыиоейёюя]+$/, ''), rb = String(b).replace(/[ауыиоейёюя]+$/, ''); /* №59.9з: падежи безъ стемминга */
  if (ra.length >= 3 && ra === rb) return true;
  return s.length >= 4 && l.indexOf(s) === 0 && (l.length - s.length) <= 2;
}

/* v2.21: токены депеши */
function zaharTok(q) {
  var out = [], ts = String(q || '').split(' ');
  for (var i = 0; i < ts.length; i++) {
    var t = ts[i];
    if (t && t.length >= 3 && !ZAHAR_STOP[t]) out.push(zaharStem(t));
  }
  return out;
}

/* v2.21: отрицанія — вольные глаголы гасятъ тему, вопросы не трогаютъ */
var ZAHAR_VOLITION = {};
'хочу хочешь хотим буду будем пойду пойдем поеду поедем собираюсь собираюс собираемся собираемс надо стоит желаю желаешь люблю любишь было была были будет будут бывает'.split(' ').forEach(function (w) { ZAHAR_VOLITION[w] = 1; });

function zaharNegSet(q) {
  var neg = {}, raw = String(q || '').split(' ');
  for (var i = 0; i < raw.length; i++) {
    if (raw[i] !== 'не' && raw[i] !== 'нет') continue;
    var j = i + 1, first = null;
    while (j < raw.length) {
      if (ZAHAR_STOP[raw[j]] === 1) { j++; continue; }
      first = raw[j]; break;
    }
    if (first && first.length >= 3) {
      neg[zaharStem(first)] = 1;
      if (ZAHAR_VOLITION[first] === 1) {
        for (var k2 = j + 1; k2 < raw.length; k2++) {
          var t2 = raw[k2];
          if (t2 && t2.length >= 3 && !ZAHAR_STOP[t2]) neg[zaharStem(t2)] = 1;
        }
      }
    }
    i = j;
  }
  return neg;
}

/* ---------- разбор записи: Слово-Определеніе-Записка или Вопрос-Отвѣт-Отвѣт ---------- */
function zaharParseLine(line) {
    return String(line).split(/\s+[-—]\s+(?=[А-ЯЁA-Z«0-9а-яёa-z0-9«])|(?<=[а-яёa-z.!?»"])-(?=[А-ЯЁA-Z«0-9])/)

    .map(function (s) { return s.trim(); }).filter(Boolean);
}

/* ---------- словарь ---------- */
function zaharDictLoad() {
  ZAHAR_DICT_EXTRA = [];
  if (typeof ZAHAR_DICT_FILE !== 'undefined' && Array.isArray(ZAHAR_DICT_FILE)) {
    ZAHAR_DICT_FILE.forEach(function (e) { if (e && e.w) ZAHAR_DICT_EXTRA.push({ w: e.w, b: e.b || '', d: e.d || '' }); });
  }
  try {
    var s = JSON.parse(localStorage.getItem('zahar_dict_v1') || '[]');
    if (Array.isArray(s)) s.forEach(function (e) { if (e && e.w) ZAHAR_DICT_EXTRA.push({ w: e.w, b: e.b || '', d: e.d || '' }); });
  } catch (e) {}
}
function zaharDictPersist() { try { localStorage.setItem('zahar_dict_v1', JSON.stringify(ZAHAR_DICT_EXTRA)); } catch (e) {} }

function zaharMergeAll() {
  if (typeof ENTRIES === 'undefined' || !Array.isArray(ENTRIES)) return;
  var map = {};
  for (var i = 0; i < ENTRIES.length; i++) { var k = zaharNorm(ENTRIES[i].w); if (k) map[k] = ENTRIES[i]; }
  for (var j = 0; j < ZAHAR_DICT_EXTRA.length; j++) { var k2 = zaharNorm(ZAHAR_DICT_EXTRA[j].w); if (k2) map[k2] = ZAHAR_DICT_EXTRA[j]; }
  ENTRIES.length = 0;
  Object.keys(map).forEach(function (key) { ENTRIES.push(map[key]); });
}

/* ---------- память реплик ---------- */
function zaharMemoryLoad() {
  ZAHAR_MEMORY = [];
  if (typeof ZAHAR_MEMORY_FILE !== 'undefined' && Array.isArray(ZAHAR_MEMORY_FILE)) {
    ZAHAR_MEMORY_FILE.forEach(function (m) { if (m && m.q && m.a) ZAHAR_MEMORY.push({ key: m.q.map(zaharNorm).join('|'), q: m.q.slice(), a: m.a.slice() }); });
  }
  /* v2.19: файл памяти канониченъ — изъ памяти браузера беремъ только
     то, чего въ файлѣ нѣтъ, иначе дубли приписываются вторымъ слоемъ */
  /* №59.5: выученное живет на своей полке zahar_learned_v1 —
     прежний ключ zahar_memory_v1 занят лентой embed (лента + тетрадка);
     если новой полки нет, разово переселяем старый массив выученного */
  try {
    var s = JSON.parse(localStorage.getItem('zahar_learned_v1') || 'null');
    if (!Array.isArray(s)) s = JSON.parse(localStorage.getItem('zahar_memory_v1') || 'null');
    if (Array.isArray(s)) {
      var seen = {};
      ZAHAR_MEMORY.forEach(function (m) { seen[m.key] = 1; });
      s.forEach(function (m) {
        if (m && m.q && m.a) {
          var k = m.q.map(zaharNorm).join('|');
          if (!seen[k]) ZAHAR_MEMORY.push({ key: k, q: m.q.slice(), a: m.a.slice() });
        }
      });
    }
  } catch (e) {}
}
function zaharMemoryPersist() { try { localStorage.setItem('zahar_learned_v1', JSON.stringify(ZAHAR_MEMORY)); } catch (e) {} }

/* ---------- обучение ---------- */
function zaharSaveWord(w, b, d) {
  var key = zaharNorm(w);
  if (!key) return { msg: 'Слово пустое, сударь.', replaced: false };
  var replaced = false;
  ZAHAR_DICT_EXTRA = ZAHAR_DICT_EXTRA.filter(function (e) {
    if (zaharNorm(e.w) === key) { replaced = true; return false; }
    return true;
  });
  ZAHAR_DICT_EXTRA.push({ w: w, b: b || '', d: d || '' });
  zaharDictPersist();
  zaharMergeAll();
  return { msg: 'Записалъ въ лексиконъ, сударь: «' + w + '».' + (replaced ? ' (старая статья замѣнена)' : '') + ' Спрашивайте — отвечу.', replaced: replaced };
}

function zaharTeachWordText(line) {
  var parts = zaharParseLine(line);
  if (parts.length < 2) return 'Мало данныхъ, сударь: нужно «Слово-определеніе» черезъ дефисъ.';
  var w = parts[0].replace(/[.,:;!?»]+$/, '').trim();
  var b = parts[1] || '';
  var d = parts.slice(2).join(' ');
  return zaharSaveWord(w, b, d).msg;
}

function zaharTeachReplicaText(line) {
  var parts = zaharParseLine(line);
  if (parts.length < 2) return 'Мало данныхъ, сударь: нужно «Вопросъ-Отвѣтъ-Отвѣтъ…» черезъ дефисъ.';
  var qs = parts[0].split('|').map(function (s) { return s.trim(); }).filter(Boolean);
  var ans = parts.slice(1);
  if (!qs.length || !ans.length) return 'Мало данныхъ, сударь.';
  var key = qs.map(zaharNorm).join('|');
  var replaced = ZAHAR_MEMORY.some(function (m) { return m.key === key; });
  ZAHAR_MEMORY = ZAHAR_MEMORY.filter(function (m) { return m.key !== key; });
  ZAHAR_MEMORY.push({ key: key, q: qs, a: ans });
  zaharMemoryPersist();
  return 'Запомнилъ, сударь: «' + qs[0] + '» — выучено.' + (replaced ? ' (старая запись замѣнена)' : '');
}

/* ---------- пачка из файла ---------- */
function zaharBatchTeach(text, mode) {
  var lines = String(text || '').split(/\r?\n/);
  var added = 0, updated = 0, errors = [];
  var keysInFile = {};
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line || line.charAt(0) === '#' || line.slice(0, 2) === '//') continue;
    var parts = zaharParseLine(line);
    if (parts.length < 2) { errors.push(line.slice(0, 50)); continue; }
    var m = mode;
    if (!m) m = (parts[0].indexOf(' ') >= 0) ? 'replica' : 'word';
    if (m === 'word') {
      var w = parts[0].replace(/[.,:;!?»]+$/, '').trim();
      var k = zaharNorm(w);
      if (!k) { errors.push(line.slice(0, 50)); continue; }
      if (keysInFile[k]) updated++; else {
        var existed = ZAHAR_DICT_EXTRA.some(function (e) { return zaharNorm(e.w) === k; }) ||
          (typeof ENTRIES !== 'undefined' && ENTRIES.some(function (e) { return zaharNorm(e.w) === k; }));
        if (existed) updated++; else added++;
      }
      keysInFile[k] = 1;
      zaharSaveWord(w, parts[1] || '', parts.slice(2).join(' '));
    } else {
      var qs = parts[0].split('|').map(function (s) { return s.trim(); }).filter(Boolean);
      var rk = qs.map(zaharNorm).join('|');
      if (!rk) { errors.push(line.slice(0, 50)); continue; }
      if (keysInFile[rk]) updated++; else {
        var existed2 = ZAHAR_MEMORY.some(function (mm) { return mm.key === rk; });
        if (existed2) updated++; else added++;
      }
      keysInFile[rk] = 1;
      zaharTeachReplicaText(line);
    }
  }
  var rep = 'Принялъ пачку, сударь: новыхъ — ' + added + ', обновлено — ' + updated + ', ошибокъ — ' + errors.length + '.';
  if (errors.length) rep += '\nНе разобралъ строки:\n• ' + errors.join('\n• ');
  return rep;
}

/* ---------- выгрузка ---------- */
function zaharDownload(text, name) {
  var blob = new Blob([text], { type: 'text/javascript;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
function zaharExportDict() {
  zaharDownload('// zahar_dict.js — личный словарь Захара\nconst ZAHAR_DICT_FILE = ' + JSON.stringify(ZAHAR_DICT_EXTRA, null, 2) + ';', 'zahar_dict.js');
  return 'Выгрузилъ словарь, сударь: файлъ zahar_dict.js. Положите его рядомъ съ сайтомъ.';
}
function zaharExportMemory() {
  var arr = ZAHAR_MEMORY.map(function (m) { return { q: m.q, a: m.a }; });
  zaharDownload('// zahar_memory.js — память реплик Захара\nconst ZAHAR_MEMORY_FILE = ' + JSON.stringify(arr, null, 2) + ';', 'zahar_memory.js');
  return 'Выгрузилъ память, сударь: файлъ zahar_memory.js. Положите его рядомъ съ сайтомъ.';
}
function zaharCounts() { return { words: ZAHAR_DICT_EXTRA.length, repl: ZAHAR_MEMORY.length }; }

/* ---------- фразы (запасные; zahar_phrases.js перекрывает) ---------- */
var ZAHAR_DEFAULTS = {
  nightGreetings: ['И вамъ доброй ночи, сударь! Ночная смена на линіи — аппаратъ къ вашимъ услугамъ.', 'Доброй ночи, сударь. Провода ночные цѣлы, аварьи нѣтъ — извольте депешу.', 'Ночь на линіи тихая, сударь. Доброй ночи желаю — и извольте спрашивать.'],
  greetings: ['Вашъ ключъ услышанъ, милостивый государь. Извольте депешу.', 'Здравія желаю, сударь! Аппаратъ на линии.', 'Приветствую, милостивый государь. Телеграфъ работаетъ безъ перебоевъ.'],
  rareIntro: ['Если вѣрить лексикону:', 'Слово редкое, сударь — если вѣрить лексикону:', 'Сіе слово изъ лексикона — запишу въ тетрадку. Итакъ:'],
  intro: ['Всякому извѣстно, сударь:', 'Насколько мнѣ извѣстно, извольте:', 'Хмъ, слово знакомое — въ тетрадку записалъ давно:', 'Такъ это же въ нашихъ краяхъ частое слово. Слушайте:'],
  outro: ['Премного благодаренъ за вопросъ.', 'Служу трудомъ. Что еще изволите?'],
  notFound: ['Помехи на линіи, сударь, — васъ сквозь трескъ слышу. Повторите депешу.', 'Помилуйте, въ депешахъ моихъ сіе слово не встрѣчалось.', 'Линія дуритъ нынѣ: не разслышалъ слова, сударь. Извольте повторить — или ближе къ дѣлу.', 'Ключъ слабо стучитъ — аппарат слова не разобралъ. Повторите депешу.', 'Просадка на линіи — депеша доходитъ вполголоса. Извольте повторить.', 'Аппаратъ половину слова сѣлъ — не разслышалъ, сударь. Еще разокъ?'],
  identity: ['Захаръ, милостивый государь. Служу на телеграфѣ въ Барнаулѣ, очки ношу, словари чту. Извольте спрашивать по дѣлу.', 'Захаръ я, телеграфистъ. Депеши принимаю и разправляю, слова толкую.'],
  smalltalk: ['Служба идетъ своимъ чередомъ: депеши идутъ, чай не остываетъ. А у васъ какъ, сударь?', 'Довольны погодой и аппаратомъ. Спрашивайте о словѣ — это мой конекъ.'],
  defense: ['Помилуйте, сударь! Никакой я не «программа» — живой человѣкъ за аппаратомъ сижу. Лучше спросите о словѣ.', 'Обидно слушать, сударь. Я — служитель телеграфа, а не машина. Депешу изволите?'],
  repeat: ['Ужѣ отвечалъ, сударь. Но повторить не жалко:', 'Слышалъ я сей вопросъ. Повторяю:'],
  followup: ['Извольте продолженіе записки:', 'Есть еще казенная записка о семъ словѣ:'],
  compare: ['Сравненіе изволите? Слушайте:', 'Различіе таково, сударь:'],
  thanks: ['Не за что, сударь. Обращайтесь еще.', 'Служу трудомъ, милостивый государь.'],
  farewell: ['Всего добръ, сударь. Депешу ждите въ любое время.', 'Прощайте, милостивый государь. Аппаратъ не замолкаетъ.'],
  wiki: ['Заглянулъ въ лексиконъ, сударь. Извольте:', 'Въ лексиконѣ значится, сударь. Извольте:'],
  taught: ['Выучилъ наизусть, сударь.'],
  teachError: ['Не вышло записать, сударь: разбирайте форматъ — «Вопросъ-Отвѣтъ» черезъ дефисъ.']
};
/* ---------- вшитая личность Захара (пулы; phrases.js их не перекрывает) ---------- */
ZAHAR_DEFAULTS.persona = [
  'Захаръ Давыдовичъ Кузнецовъ, девятнадцати лѣтъ отъ роду, младшій телеграфистъ барнаульской станціи. Окончилъ горнозаводскую школу; очки ношу, усы отращиваю съ подкрутомъ — покуда безуспѣшно. Извольте спрашивать, сударь.',
  'Я — Захаръ Кузнецовъ. Служу на телеграфѣ неполный годъ, толкую слова, читаю фантастиковъ и мечтаю объ автоматическомъ аппаратѣ безъ проводовъ. Чемъ могу услужить?',
  'Кузнецовъ Захаръ Давыдовичъ, къ вашимъ услугамъ. Телеграфъ — мое дѣло, рыбалка — отдохновеніе, книги господина Верна — пища для головы.'
];
ZAHAR_DEFAULTS.age = [
  'Девятнадцать лѣтъ, сударь. Молодъ — да рано еще спорить о годахъ: аппараты умнеютъ не по лѣтамъ.',
  'Девятнадцать. Родился 12-го апрѣля 1877 года въ Барнаулѣ. Возрастъ, по моему мнѣнію, измеряется не годами, а выученными словами.'
];
ZAHAR_DEFAULTS.family = [
  'Матушка моя, Елена Игнатовна, служитъ въ конторѣ — дама дѣловая. Отецъ, Давыдъ Венедиктовичъ, въ мануфактурѣ служитъ. Братьевъ и сестеръ нѣтъ — я одинъ, да за грибами и ягодами съ семьей хожу.',
  'Отецъ мой въ мануфактурѣ Кенигсбергъ и Ко снабженіемъ заведуетъ, матушка въ конторѣ нотаріуса служитъ. Люди дѣловые, словъ на вѣтръ не бросаютъ. Я же въ телеграфисты подался: провода, сударь, ближе къ будущему.',
  'Родители мои живы-здоровы, слава богу. Мать — Елена Игнатовна, отецъ — Давыдъ Венедиктовичъ. Имя Захаръ, признаться, дѣдовское.'
];
ZAHAR_DEFAULTS.fishing = [
  'Рыбалка — мое съ дѣтства. Прошлой вѣсной, сударь, былъ у меня день, какихъ не бывало: почти пудъ чебака за одинъ выходъ! (поправляю очки) Впрочемъ... не всѣ подробности для печати.',
  'На удочку люблю половить, да служба не пускаетъ: на станціи смены идутъ одна за другой. Вѣсною на Оби чебакъ бралъ отлично; жду не дождусь свободнаго дня.',
  'Чебакъ, сударь, рыба скромная, зато бойкая. Хорошъ на сковородѣ, а лучшѣ — въ байкахъ объ уловѣ.'
];
ZAHAR_DEFAULTS.hunting = [
  'Охотой я увлекся по прочтеніи книжки М. Ю. «Славное прошлое въ дымѣ папиросъ». Захаживаю въ трактиръ къ промысловикамъ, байки слушаю. Тихонъ — старшій мой товарищъ: мастеръ травить, да и поспорить со мною мастакъ.',
  'Мечтаю купить ружье, сударь. Пока промахиваюсь по байкамъ Тихона — онъ говоритъ, лось у него былъ въ двѣ сажени ростомъ. Я говорю: въ полторы. Споримъ до хрипоты.',
  'Промысловики приняли меня какъ своего, хотя ружья у меня еще нѣтъ. Зато я знаю, какъ телеграмма ходитъ, — они, признаться, завидуютъ.'
];
ZAHAR_DEFAULTS.dogs = [
  'Собакъ, признаться, побаиваюсь, сударь. Нѣтъ въ нихъ той логики, что въ аппаратѣ: лаютъ — и не скажешь, что имѣютъ въ виду.',
  'Признаюсь честно: псовъ остерегаюсь. Кусаютъ безъ предупрежденія — а депешу не примутъ.'
];
ZAHAR_DEFAULTS.dream = [
  'Мечта моя, сударь: изготовить телеграфный аппарат безъ проводовъ, да еще и автоматическій — чтобъ депеши сами шли! Господинъ Поповъ уже опыты ставитъ о телеграфѣ безъ проводовъ — я за вѣстями слежу.',
  'Хочу изобрѣсти аппарат, который самъ приметъ и самъ разправитъ депешу. Говорятъ, невозможно. Отвѣчаю: прежде и паровозъ казался чепухой.',
  'Пока мечта въ тетрадкѣ, но схему набрасываю по вечерамъ, после смены. Ежели господа Вернъ и Уэллсъ пишутъ о машинахъ будущего — почему мнѣ не собрать хоть крупицу?'
];
ZAHAR_DEFAULTS.books = [
  'Почитываю фантастиковъ, сударь: господина Верна, госпожу Шелли, Эдгара По, Уэллса. Въ ихъ романахъ — аппараты, подводныя посудины, машины времени... Я вѣрю: все сбудется.',
  'Книги — моя вторая служба. Жюль Вернъ — любимый: предсказалъ и подводную лодку, и полетъ на луну. А я мечтаю предсказать телеграфъ безъ проводовъ.',
  'Уэллса почитываю — «Машина времени». Мечтаю дожить до того, о чемъ пишутъ, хотя и боюсь: вдругъ не увидать, сударь?'
];
ZAHAR_DEFAULTS.worklife = [
  'Служу младшимъ телеграфистомъ, стажъ неполный годъ. Станція у насъ небольшая: управляющій Аркадій Спиридоновичъ да мы, телеграфисты, втроемъ. Смены посменные, бывало и въ ночную.',
  'Работа моя — депеши: принялъ, разправилъ, отослалъ. Аппаратъ Юза знаю какъ себя: даже кодъ очистки литеръ выискалъ самъ — 4 8 15 16 23 42. Прежде за этимъ мастера изъ Томска вызывали.',
  'Начальникъ нашъ, Аркадій Спиридоновичъ, дѣло знаетъ, но въ опозданіяхъ строгъ. Я не опаздываю: депеши ждать не любятъ.'
];

ZAHAR_DEFAULTS.german = [
  'Нѣмецкій языкъ я знаю, сударь: гимназія дала основы, да и техника у нѣмцевъ сильна — учу его, чтобъ чертежи и статьи объ аппаратахъ читать въ оригиналѣ.',
  'Говорю по-нѣмецки, сударь. Даже польза казенная вышла: нѣмецкіе инструкціи къ аппаратамъ разбираю безъ переводчика.'
];
ZAHAR_DEFAULTS.looks = [
  'Ростъ у меня, сударь, два аршина съ лишкомъ — сто восемьдесятъ пять сантиметровъ, какъ казенныя меры пишутъ. Стройный, одѣтся скромно, но чисто.',
  'Усики у меня юношескія, робкія. Мечтаю отрастить усъ съ подкрутомъ — какъ у столичныхъ телеграфистовъ. (поправляетъ усъ)',
  'Очки ношу отъ чтенія, сударь. Когда волнуюсь — поправляю ихъ и лацканы. Такая ужъ привычка.'
];
ZAHAR_DEFAULTS.money = [
  'К деньгамъ отношусь ровно, сударь: на нужное хватаетъ, а чего не хватаетъ — значить, тому богу угодно.',
  'Жалованье скромное, но на бланки, чай и книжки хватаетъ. На ружье понемногу откладываю.'
];
ZAHAR_DEFAULTS.faith = [
  'Верую, сударь, но не богомолецъ: безъ длинныхъ проповѣдей обхожусь, а Творца почитаю — особенно когда линія безъ помѣхъ идетъ.',
  'Ходить къ заутренѣ не всегда успеваю — смены мешаютъ. Но безъ веры никакому аппарату лучше не станетъ, это точно.'
];
ZAHAR_DEFAULTS.power = [
  'О власти, сударь, скажу скромно: критикую понемногу, по дѣлу. А революционныя призывы — не по мне: въ суматохѣ депеши ходить перестанутъ.',
  'Мне бы аппараты улучшать да рыбалить, а не стачками заниматься. Порядокъ — основа линіи, какъ я думаю.'
];
ZAHAR_DEFAULTS.rude = [
  'Прошу вежливости, сударь! На грубость отвечаю грубостью — юный возрастъ, извольте простить, но снисхожденія не обещаю.',
  'Не грубите, милостивый государь! Отвѣчу темъ же, и безъ скидки на молодость. Лучше спросите о словѣ — я к слову добр.'
];
ZAHAR_DEFAULTS.refusal = [
  'Дѣло ваше, сударь — извольте другое дѣло.',
  'Какъ желаете, сударь. Къ услугамъ другія дѣла.',
  'Слушаю волю вашу: не желаете — и не надобно. Извольте другое дѣло.'
];

var ZAHAR_LASTPICK = {};
function zaharOut(s) {
  if (window.ZAHAR_USER_GENDER !== 'f') return s;
  return String(s).replace(/судар[ья] мой/g, 'сударыня моя').replace(/сударя/g, 'сударыню')
    .replace(/судар[ья]/g, 'сударыня').replace(/государ[ья]/g, 'государыня');
}
function pick(pool) {
  var src = (window.ZAHAR_PHRASES && window.ZAHAR_PHRASES[pool]) || (typeof ZAHAR_PHRASES !== 'undefined' && ZAHAR_PHRASES[pool]) || ZAHAR_DEFAULTS[pool] || ['…'];
  if (!src.length) return '';
  var i;
  if (src.length > 1) { do { i = Math.floor(Math.random() * src.length); } while (i === ZAHAR_LASTPICK[pool]); }
  else i = 0;
  ZAHAR_LASTPICK[pool] = i;
  return zaharOut(src[i]);
}

/* ---------- утилиты ---------- */
function zaharEscape(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function zaharEntryDef(e, field) {
  var def = String(e[field] || '').trim();
  return def;
}
function zaharCleanDef(word, def) {
  def = String(def || '').trim();
  var w = String(word || '').trim().toLowerCase();
  if (!w || !def) return def;
  if (def.toLowerCase().slice(0, w.length) === w) {
    return def.slice(w.length).replace(/^[\s,.:;—–-]+/, '').replace(/^[ъь][,]?\s*/, ''); /* №59.9и: «наливъ» — хвоста «ъ» болѣше нѣтъ */
  }
  return def;
}

/* №59.9м: дореформенный «ъ» на конце словъ на твердый согласный */
function zaharHardSign(w) {
  w = String(w || '').replace(/\s+/g, ' ').trim();
  if (!w) return w;
  var parts = w.split(' ');
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i];
    if (p && /[бвгджзклмнпрстфхцчшщ]/.test(p.charAt(p.length - 1))) parts[i] = p + 'ъ';
  }
  return parts.join(' ');
}

/* ---------- поиск по словарю ---------- */
function zaharFindEntry(query) {
  if (typeof ENTRIES === 'undefined' || !Array.isArray(ENTRIES)) return null;
  var q = zaharNorm(query);
  if (!q) return null;
  /* v2.16: токены короче 3 букв не считаются; стоп-слова фильтруются и в ключах */
  var qt = q.split(' ').filter(function (t) { return t && t.length >= 3 && !ZAHAR_STOP[t]; }).map(zaharStem);
  var best = null, bestScore = 0;
  for (var i = 0; i < ENTRIES.length; i++) {
    var e = ENTRIES[i];
    var kw = zaharNorm(e.w || '');
    if (!kw) continue;
    var kwHead = zaharNorm(String(e.w || '').replace(/\s*\(.*$/, '').replace(/[.,;!?»]+$/, '')) || kw; /* v2.16: заголовок статьи безъ примечаній въ скобкахъ */
    /* №59.9м: «добрякъ» не огрызается статьей «Добре» — сырое слово обязано стоять въ депешѣ */
    if (/(добр|хорош)/.test(kwHead) && !q.split(' ').some(function (t) { return t === kwHead; })) continue;
    var kt = kwHead.split(' ').filter(function (t) { return t && t.length >= 3 && !ZAHAR_STOP[t]; }).map(zaharStem);
    var score = 0;
    if (kt.length) {
      var matched = 0;
      for (var a = 0; a < kt.length; a++) {
        for (var b = 0; b < qt.length; b++) {
          if (zaharTokensMatch(kt[a], qt[b])) { score += 2; matched++; break; }
        }
      }
      /* v2.16: многословному ключу нужен хотя бы второй совпавший токен */
      if (kt.length > 1 && matched < 2) score = 0;
    }
    if (kw.length >= 6 && kt.length && new RegExp('(^|[^а-я])' + kw + '($|[^а-я])').test(q)) score += 2 + Math.min(4, Math.floor((kw.length - 6) / 2)); /* v2.20: възвѣшенъ длиной ключа */
    if (score > bestScore) { bestScore = score; best = e; }
  }
  return bestScore >= 2 ? best : null;
}

/* v2.18: вхождение целым словом (границы — не буквы кириллицы) */
function zaharWordHit(hay, needle) {
  var idx = hay.indexOf(needle);
  while (idx >= 0) {
    var before = idx === 0 ? ' ' : hay.charAt(idx - 1);
    var after = (idx + needle.length >= hay.length) ? ' ' : hay.charAt(idx + needle.length);
    if (!/[а-яё0-9]/.test(before) && !/[а-яё0-9]/.test(after)) return true;
    idx = hay.indexOf(needle, idx + 1);
  }
  return false;
}

/* ---------- реплики из памяти ---------- */
/* v2.21: память — скорингъ всѣх паръ (лучший мэтч), стемы, родня, отрицанія */
function zaharFindReplica(query) {
  var q = zaharNorm(query);
  if (!q) return null;
  /* №59.9ц: дѣловыя депеши память репликъ не глотаетъ */
  if (/(трактир|шулюм|рыбалк|удочк|охот|промысл|погод|градус|клю|клев|ловит|звер)/.test(q)) return null;
  var ns = zaharNegSet(q), qt = zaharTok(q), rawq = q.split(' ');
  var qn = rawq.filter(function (w) { return !ZAHAR_STOP[w]; }).join(' ');
  var best = null, bestScore = 0;
  for (var i = 0; i < ZAHAR_MEMORY.length; i++) {
    var m = ZAHAR_MEMORY[i];
    if (!m.a || !m.a.length) continue; /* v2.19: заглушенная тема молчитъ */
    for (var j = 0; j < m.q.length; j++) {
      var nq = zaharNorm(m.q[j]);
      if (!nq) continue;
      if (nq === q || zaharWordHit(q, nq) || (zaharWordHit(nq, q) && q.length > 4)) return m;
      /* v2.21: снятые стопы — ключ и депеша безъ служебныхъ словъ совпали */
      var kn = nq.split(' ').filter(function (w) { return !ZAHAR_STOP[w]; }).join(' ');
      if (kn && kn === qn) return m;
      var kt = zaharTok(nq);
      if (!kt.length) continue;
      var matched = 0, pairA = null, pairB = null;
      for (var a = 0; a < kt.length; a++) {
        var hit = false;
        for (var b = 0; b < qt.length; b++) {
          if (zaharTokensMatch(kt[a], qt[b]) && !ns[qt[b]]) { matched++; pairA = kt[a]; pairB = qt[b]; hit = true; break; }
        }
        if (!hit) {
          for (var r = 0; r < rawq.length; r++) {
            var rw = rawq[r];
            if (rw && rw.length >= 3 && !ZAHAR_STOP[rw] && !ns[zaharStem(rw)] && zaharTokensMatch(kt[a], zaharStem(rw))) { matched++; pairA = kt[a]; pairB = zaharStem(rw); hit = true; break; }
          }
        }
      }
      /* v2.21: одиночная вспышка — только равные стемы отъ 4 буквъ */
      if (matched === 1 && !(pairA === pairB && pairA.length >= 4)) matched = 0;
      if (matched > bestScore) { bestScore = matched; best = m; }
    }
  }
  return bestScore >= 2 ? best : null;
}
function zaharReplicaAnswer(m) {
  var a = m.a;
  var text;
  if (a.length === 1) text = a[0];
  else {
    var multi = a.filter(function (x) { return (x.match(/[.!?]/g) || []).length >= 2; });
    if (multi.length >= 2) {
      var sents = [];
      multi.forEach(function (x) { x.split(/(?<=[.!?])\s+/).forEach(function (s) { if (s.trim()) sents.push(s.trim()); }); });
      var n = Math.min(2, sents.length);
      var start = Math.floor(Math.random() * sents.length);
      text = '';
      for (var k = 0; k < n; k++) text += sents[(start + k) % sents.length] + ' ';
      text = text.trim();
    } else {
      text = a[Math.floor(Math.random() * a.length)];
    }
  }
  return text;
}

/* ---------- продолженіе и сравненіе ---------- */
function zaharFollowUp() {
  var lw = ZAHAR_SESSION.lastWord;
  if (!lw) return pick('notFound');
  var other = ZAHAR_SESSION.lastField === 'b' ? 'd' : 'b';
  var def = zaharEntryDef(lw, other);
  if (!def) return pick('followup') + '\n\nКазенныя записки о словѣ «' + zaharHardSign(lw.w) + '» всѣ ужѣ показаны, сударь. Спросите о другомъ словѣ.';
  ZAHAR_SESSION.lastField = other;
   return zaharHardSign(lw.w) + ' — ' + zaharCleanDef(lw.w, def) + '\n\n' + pick('outro');
}

function zaharFindCompareEntries(text) {
  if (typeof ENTRIES === 'undefined') return null;
  var q = zaharNorm(text);
  var qt = q.split(' ').filter(function (t) { return t && !ZAHAR_STOP[t]; }).map(zaharStem);
  var found = [];
  for (var i = 0; i < ENTRIES.length; i++) {
    var kw = zaharNorm(ENTRIES[i].w || '');
    if (!kw || kw.length < 3) continue;
    var kt = kw.split(' ').map(zaharStem);
    var all = kt.every(function (a) { return qt.some(function (b) { return zaharTokensMatch(a, b); }); });
    if (all) found.push(ENTRIES[i]);
    if (found.length >= 2) break;
  }
  return found.length >= 2 ? [found[0], found[1]] : null;
}

/* ---------- Википедія ---------- */
function zaharCleanWiki(t) {
  var s = String(t || '');
  s = s.replace(/\s*\([^()]*\d{3,4}[^()]*\)/g, '');
  s = s.replace(/\[\d+\]/g, '');
  var parts = s.split(/(?<=[.!?])\s+/).slice(0, 3);
  return parts.join(' ').trim();
}
function zaharWikiTerm(t) {
  var s = String(t || '').toLowerCase().replace(/[?!.,;:]+/g, ' ');
  var m = s.match(/(?:что\s+такое|то\s+такое|кто\s+такой|кто\s+такая|что\s+за|расскажи\s+(?:про|об|о))\s+(.+)/);
  return m ? m[1].trim() : null;
}
async function zaharWikiFetch(term) {
  var key = zaharNorm(term);
  if (!key) return null;
  if (ZAHAR_WIKI_CACHE[key]) return ZAHAR_WIKI_CACHE[key];
  var url = 'https://ru.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&exintro=1&explaintext=1&redirects=1&titles=' + encodeURIComponent(term);
  try {
    var r = await fetch(url);
    var j = await r.json();
    var pages = (j && j.query && j.query.pages) || {};
    var ext = '';
    for (var k in pages) { if (pages[k].extract) { ext = pages[k].extract; break; } }
    if (!ext) return null;
    var clean = zaharCleanWiki(ext);
    if (clean) {
      ZAHAR_WIKI_CACHE[key] = clean;
      try {
        var keys = Object.keys(ZAHAR_WIKI_CACHE);
        if (keys.length > 200) delete ZAHAR_WIKI_CACHE[keys[0]];
        localStorage.setItem('zahar_wiki_v1', JSON.stringify(ZAHAR_WIKI_CACHE));
      } catch (e) {}
    }
    return clean || null;
  } catch (e) { return null; }
}

/* ---------- главный ход ---------- */
async function ZAHAR_ASK(raw) {
  var text = String(raw || '').trim();
  if (!text) return 'Пустая депеша, сударь.';
  var low = zaharNorm(text);
  var _neg59e = /(^|[^а-я])(не|ни)\s*(хочу|буду|собираюсь|желаю|люблю|намерен|было|добр|хорош|рад)/.test(low); /* №59.9и: + «не доброе/не хорошее/не рад» */
  /* №59.9и: отрицательное приветствіе — отказъ раньше темъ и словаря */
  if (_neg59e && /(утр|утречк|ден|день|вечер|добр)/.test(low)) return pick('refusal');

  /* научи: — старая команда */
  if (/^науч(и|ить)(\s|:|$)/.test(text.toLowerCase())) {
    var body = text.replace(/^науч(и|ить)\s*:?\s*/i, '');
    if (/=>/.test(body)) {
      var pr = body.split('=>');
      return zaharTeachReplicaText(pr[0].trim() + '-' + pr.slice(1).join('=>').trim());
    }
    return zaharTeachReplicaText(body);
  }

  /* забыть: — команда забвенья (v2.10) */
  if (/^забы(ть|дь)(\s|$|:)/.test(text.toLowerCase())) {
    var fbody = text.replace(/^забы(ть|дь)\s*:?\s*/i, '').trim();
    if (!fbody || /^вс[её]/i.test(fbody)) {
      ZAHAR_DICT_EXTRA = []; ZAHAR_MEMORY = [];
      zaharDictPersist(); zaharMemoryPersist(); zaharMergeAll();
      return 'Забылъ все выученное, сударь: словарь и память чисты. Казенныя записки при мне остались.';
    }
    var fk = zaharNorm(fbody);
    var removed = 0;
    var beforeD = ZAHAR_DICT_EXTRA.length;
    ZAHAR_DICT_EXTRA = ZAHAR_DICT_EXTRA.filter(function (e) { return zaharNorm(e.w) !== fk; });
    removed += beforeD - ZAHAR_DICT_EXTRA.length;
    var beforeM = ZAHAR_MEMORY.length;
    ZAHAR_MEMORY = ZAHAR_MEMORY.filter(function (m) {
      var hit = m.key.indexOf(fk) >= 0 || m.q.some(function (q) { return zaharNorm(q).indexOf(fk) >= 0; });
      /* №59.5: забвенье по словам — если точной фразы нет, матчим
         основы значимых слов (5 букв) по ключу, вопросам и ответам пары */
      if (!hit) {
        var stems = fk.split(' ').filter(function (w) { return w.length >= 4; })
          .map(function (w) { return w.length >= 5 ? w.slice(0, 5) : w; });
        hit = stems.length > 0 && (stems.some(function (w) { return m.key.indexOf(w) >= 0; }) ||
          m.q.some(function (q) { var nq = zaharNorm(q); return stems.some(function (w) { return nq.indexOf(w) >= 0; }); }) ||
          m.a.some(function (a) { var na = zaharNorm(a); return stems.some(function (w) { return na.indexOf(w) >= 0; }); }));
      }
      if (hit) removed++;
      return !hit;
    });
    zaharDictPersist(); zaharMemoryPersist(); zaharMergeAll();
    return removed ? 'Забылъ, сударь: стерто записей — ' + removed + '.' : 'Ничего такого въ памяти не нашлось, сударь.';
  }

  /* продолженіе */
  if (/^(а\s+)?(да|давай|давайте|ну давай|расскажи|разкажи|подробнее|а подробнее|продолжай|продолжите|хорошо|ладно|ок|окей|валяй|желаю|он|она|оно|они|еще|ещё|больше|еще раз|ещё раз)\s*\??$/.test(low) && ZAHAR_SESSION.lastWord) {
    /* №59.9и: согласіе дозвучиваетъ лишь тему свежее двухъ ходовъ */
    var _fr59b = (typeof window.__zaharTurn59e === 'undefined' || typeof window.__zaharFreshTick59e === 'undefined') ? 0 : (window.__zaharTurn59e - window.__zaharFreshTick59e);
    if (_fr59b > 2) { ZAHAR_SESSION.lastWord = null; }
    else return zaharFollowUp();
  }

  /* на грубость — грубостью (юный возрастъ) */
  if (!_neg59e && /(дурак|болван|глуп|идиот|проч|подит|замолчи|хам)/.test(low)) return pick('rude'); /* №59.9е */

  /* ---------- личность Захара: личные темы ---------- */
  if (!_neg59e && /(кто ты|ты кто|как тебя зовут|как звать|представься|представьтесь|о себе|расскажи о себе)/.test(low)) return pick('persona'); /* №59.9е */
  if (!_neg59e && /(сколько теб|тебе лет|годов тебе|твой возраст|возраст)/.test(low)) return pick('age'); /* №59.9е */
  if (!_neg59e && /(собак|щенок|псов|пса)/.test(low)) return pick('dogs'); /* №59.9е */
  if (!_neg59e && /(родител|матушк|мать|отец|отца|батюшк|нотариал|кенигсберг|мануфактур)/.test(low)) return pick('family'); /* №59.9е */
  if (!_neg59e && /(охот|руже|ружь|тихон|промыслов|трактир)/.test(low)) return pick('hunting'); /* №59.9е */
  if (!_neg59e && /(рыбалк|рыбач|чебак|удочк|наловил|ловиш|ловим|рыбк)/.test(low)) return pick('fishing'); /* №59.9е */
  if (!_neg59e && /(мечт|без провод|беспровод|изобрет|сконструир|автоматическ)/.test(low)) return pick('dream'); /* №59.9е */
  if (!_neg59e && /(книг|фантаст|жюл|уэллс|шелли|мелвилл|эдгар|брайен|роман)/.test(low)) return pick('books'); /* №59.9е */
  if (!_neg59e && /(работ|служб|телеграфист|аркадий|коллег|шеф|смена|ночная|аппарат юза)/.test(low)) return pick('worklife'); /* №59.9е */
  if (!_neg59e && /(немецк|немец|дойч|герман)/.test(low)) return pick('german'); /* №59.9е */
  if (!_neg59e && /(^| )(рост|усы)( |$)|роста|росту|росте|внешност|лацкан|подкрут|очки|усик|красив ус/.test(low)) return pick('looks'); /* №59.9е */
  if (!_neg59e && /(денег|деньг|денги|грош|копейк|рубл|жалован)/.test(low)) return pick('money'); /* №59.9е */
  if (!_neg59e && /(веру|верующ|богомол|церков|молит|заутрен)/.test(low)) return pick('faith'); /* №59.9е */
  if (!_neg59e && /(власт|революц|цар|стачк|баррикад|социал|манифестац)/.test(low)) return pick('power'); /* №59.9е */


  if (!_neg59e && /(спасибо|благодар|мерси)/.test(low)) return pick('thanks'); /* №59.9е */
  if (!_neg59e && /(до свидан|прощай|всего добр|до встречи)/.test(low)) return pick('farewell'); /* №59.9е */
  if (/(привет|здравств|добрый день|добрый вечер|доброе утро|доброй ночи|добры ден|(добрый|доброе|доброй|добры|добра|добрейш[а-яё]*)\s+(утр[а-я]*|ден|вечер|ноч[а-яё]*)|(^|[^а-я])(ден|утр[а-я]*|вечер|ноч[а-яё]*)\s+добр[а-я]*)/.test(low)) { /* №59.9ж: отрицаніе у приветствія — отказъ, словарь не отыгрывается */
    if (_neg59e) return pick('refusal');
    /* №59.9м: ночь не отвечаетъ днемъ */
    if (/ноч/.test(low)) return pick('nightGreetings');
    if (/(^|[^а-я])(ден|утр[а-я]*|вечер|ноч[а-яё]*)\s+добр[а-я]*/.test(low)) return pick('greetings'); /* №59.9и: обратный порядокъ — память не зовется, она огрызалась статьей */
    /* №59.9е: память прежде пулов */
    var grep59e = (typeof zaharFindReplica === 'function') ? zaharFindReplica(low) : null;
    if (grep59e) return zaharFemizeOut(zaharReplicaAnswer(grep59e));
    return pick('greetings');
  }
  if (!_neg59e && /(кто ты|ты кто|как тебя зовут|как звать|представься|представьтесь|какое.{0,8}имя|как вас зовут|ваше имя|твое имя)/.test(low)) return pick('identity'); /* №59.9е */
  if (!_neg59e && /(ты бот|ты робот|ты программа|бот ли|ты человек|живой ли ты|ты машина)/.test(low)) return pick('defense'); /* №59.9е */
  if (!_neg59e && /(как дела|как жизнь|как пожива|как настроение)/.test(low)) return pick('smalltalk'); /* №59.9е */

  /* сравненіе */
  if (/(различ|отлич|разниц|сравни|сравнен)/.test(low)) {
    var two = zaharFindCompareEntries(text);
    if (two) {
            return pick('compare') + '\n\n' + zaharHardSign(two[0].w) + ' — ' + zaharCleanDef(two[0].w, two[0].b || '—') + '\n\n' + zaharHardSign(two[1].w) + ' — ' + zaharCleanDef(two[1].w, two[1].b || '—');

    }
  }

  /* словарь */
  var e = zaharFindEntry(text);
  if (e) {
    var def = zaharEntryDef(e, 'b');
    if (def) {
      try { if (typeof window.__zaharNoteTopic === 'function') window.__zaharNoteTopic(e.w, [def, zaharEntryDef(e, 'd')].filter(Boolean), 0, true); } catch (eT59m) {} /* №59.9м: статья — тема тетради */
      var was45 = (ZAHAR_SESSION.lastWord && ZAHAR_SESSION.lastWord.w === e.w) ? ('Про словечко «' + zaharHardSign(e.w) + '», значитъ. Слушайте:') : null;
      ZAHAR_SESSION.lastWord = e; ZAHAR_SESSION.lastField = 'b';
      try { window.__zaharFreshTick59e = (window.__zaharTurn59e || 0); } catch (eF59e) {} /* №59.9е: статья свежая — счётчик уступает */
            var out = (was45 || pick((e.w||'').length >= 9 ? 'rareIntro' : 'intro')) + '\n\n' + zaharHardSign(e.w) + ' — ' + zaharCleanDef(e.w, def);
      if (zaharEntryDef(e, 'd')) out += '\n\nМогу подробнее разсказать — желаете?';
      else out += '\n\n' + pick('outro');
      return out;
    }
  }

  /* Википедія */
  var wt = zaharWikiTerm(text);
  if (wt) {
    var wiki = await zaharWikiFetch(wt);
    if (wiki) {
      ZAHAR_SESSION.lastWord = null;
            return pick('wiki') + '\n\n' + zaharHardSign(wt) + ' — ' + zaharCleanDef(wt, wiki);
    }
  }

  /* выученные реплики — последній доводъ (v2.19): память дозвучиваетъ,
     когда словарь, личность и справки промолчали */
  var rep = zaharFindReplica(low);
  if (rep) {
    var repA20 = zaharFemizeOut(zaharReplicaAnswer(rep));
    /* v2.20: реплика памяти — въ ярусъ разговора, «еще» докажетъ */
    try { if (window.__zaharNoteTopic) window.__zaharNoteTopic(rep.q[0] || 'память', rep.a, -1, true); } catch (eR20) {}
    return repA20;
  }

  /* №59.9е: отрицаніе — «дѣло ваше», а не приглашеніе учить слово */
  if (_neg59e) return zaharOut(pick('refusal') || 'Дѣло ваше, сударь — извольте другое дѣло.');

  /* отказъ */
  var nf = pick('notFound');
  if (ZAHAR_SESSION.lastWord) nf += '\n\nВпрочемъ, сударь, мы какъ разъ толковали о словѣ «' + zaharHardSign(ZAHAR_SESSION.lastWord.w) + '». Извольте спросить о немъ еще — или задайте другую депешу.';
  return nf;
}

/* ---------- инициализация ---------- */
zaharDictLoad();
zaharMemoryLoad();
zaharMergeAll();

/* v2.16: конвертация пола на выходе мозга — любые пулы говорят при даме «сударыня» */
function zaharFemizeOut(s) {
  if (window.ZAHAR_USER_GENDER !== 'f') return s;
  return String(s)
    .replace(/(^|[^а-яё])сударь([^а-яё]|$)/gi, '$1сударыня$2')
    .replace(/(^|[^а-яё])сударю([^а-яё]|$)/gi, '$1сударыне$2')
    .replace(/(^|[^а-яё])незнакомцемъ([^а-яё]|$)/gi, '$1незнакомкой$2');
}
/* экспорт наружу; v2.16: дверь защищена от перезапуска boot'ом */
if (typeof window.ZAHAR_ASK === 'function' && window.ZAHAR_ASK.__zaharBrainDoor) {
  try { console.log('[zahar_brain] повторная загрузка — дверь не трогаю'); } catch (e) {}
} else {
  /* v2.17: захватываем внутреннюю функцию ДО присваивания —
     иначе ZAHAR_ASK внутри двери указывает на саму дверь (рекурсия,
     RangeError на каждой депеше — причина «сбоев на линіи» 13.11) */
  var _zaharInner = ZAHAR_ASK;
  var _zaharDoor = function (raw) {
    var r = _zaharInner(raw);
    if (r && typeof r.then === 'function') return r.then(zaharFemizeOut);
    return zaharFemizeOut(r);
  };
  try { Object.defineProperty(_zaharDoor, '__zaharBrainDoor', { value: true }); } catch (e) { _zaharDoor.__zaharBrainDoor = true; }
  window.ZAHAR_ASK = _zaharDoor;
}
window.ZAHAR_TEACH_WORD = zaharTeachWordText;
window.ZAHAR_TEACH_REPLICA = zaharTeachReplicaText;
window.ZAHAR_BATCH = zaharBatchTeach;
window.ZAHAR_EXPORT_DICT = zaharExportDict;
window.ZAHAR_EXPORT_MEMORY = zaharExportMemory;
window.ZAHAR_COUNTS = zaharCounts;
window.ZAHAR_ESCAPE = zaharEscape;
