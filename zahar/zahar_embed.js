/* ============================================================
   zahar_embed.js — правка №37: «ответ возвращается обещаніемъ»
   Дата сборки: 12.11.2026
   Внутри: №21 будильник/автопробуждение · №26 ять и і · №27 семантика
   на каждый вопрос · №28 зазор 0.015 · №30 память (лента + тетрадка) ·
   №31 загрузчик библиотеки через динамический import() ·
   №32 модель грузится с локальных файлов, без huggingface.co ·
   №33 имя модели USER2-small-ONNX · №34 путь ../models/ от корня сайта ·
   №35 библиотека ветки 3 (ModernBERT), dtype q8 ·
   №36 секундомер и прогрев · №37 хук отдаёт ответ обещаніемъ
   (контракт слоя: ZAHAR_ASK возвращает строку или Promise)
   №59.9о (17.11.2026): саніція тетрадки (сомнительное имя стирается при загрузкѣ);
        стопъ-листъ ловца имени расширенъ (словарь, словца, бытъ); словца «сіе/ибо» —
        по всему слову; ранжировщикъ zaharEmbedRank для конструктора (модель лишь
        подбираетъ изъ готовыхъ кандидатовъ, ничего не сочиняетъ).
   №59.7в (15.11.2026): zaharSetName держитъ страничную переменную въ согласии съ тетрадкой.
   №59.7 (имя и забвенье 15.11.2026): имя ловится и в хвосте депеши («привет я Анна»),
   явное представленье перезаписывает старое имя; добавлены zaharForgetName
   (тетрадку и ленту стирает) и zaharSaveNotebook (полку тем сохраняет).
   №59.5 (слои по чину 15.11.2026): слой болтовни и мозгъ отвечают раньше семантики —
   роутер добирает только если слой промолчал (раньше семантика перехватывала депеши
   врасплох: нельма на «ты рыбачишь», приветствие на «спасибо и до свидания»);
   у интента fish четыре ответа (нельма, муксун, хариус, таймень) — одна заготовка не долбит.
   ============================================================ */
(function () {
'use strict';

const VERSION = 'правка №60.0а (модель грузится сразу; будильникъ изъятъ; стопъ рода въ имени)';
const TAG = '[zahar_embed]';

const CFG = {
  wakeDelay: 0,              // №59.9я: модель грузится сразу, безъ будильника
  threshold: 0.72,           // порог уверенности
  margin: 0.015,             // зазор до второго интента
  libraryUrl: 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.1',
  libraryUrlFallback: 'https://unpkg.com/@huggingface/transformers@3.3.1/dist/transformers.min.js',
  modelDir: '../models/USER2-small-ONNX/',
  modelName: 'USER2-small-ONNX',
  topK: 3,
  quantized: true
};

const state = { lib: null, pipe: null, ready: false, waking: false, index: [] };

/* ---------- память (правка №30) ---------- */
const MEM_KEY = 'zahar_memory_v1';
const TAPE_MAX = 6;

const mem = { tape: [], notebook: {} };
try { Object.assign(mem, JSON.parse(localStorage.getItem(MEM_KEY) || '{}')); } catch (e) {}
mem.tape = Array.isArray(mem.tape) ? mem.tape.slice(-TAPE_MAX) : [];
mem.notebook = mem.notebook || {};
/* №59.9о: саніція тетрадки — сомнительное имя стирается при загрузкѣ
   (статьи и словца именемъ не мнятся: «Толкование», «Априори» и проч.) */
try {
  if (mem.notebook.name && /(толкован|лексикон|словар|аппарат|трактир|самовар|карас|налив|налим|шуба|пальто|тулуп|валенк|примет|морз|депеш|априори|констатирован|ламентац|осведоми|неужто|погод|барнаул|демидов|гост|судар|знае|расскаж|скажи|зват|работ|(?:^|[^а-яё])как(?:[^а-яё]|$))/i.test(String(mem.notebook.name))) {
    console.log(TAG, 'саніція: сомнительное имя въ тетрадкѣ стерто —', mem.notebook.name);
    delete mem.notebook.name;
    saveMem();
  }
} catch (eSani) {}

function saveMem() {
  try { localStorage.setItem(MEM_KEY, JSON.stringify(mem)); } catch (e) {}
}

window.zaharMemory = function () { return mem; };

window.zaharSetName = function (name) {
  if (!name) return;
  name = String(name).trim().replace(/[^А-ЯЁа-яё-]/g, '');
  if (!name) return;
  mem.notebook.name = name;
  /* №59.7в: чат читает страничную переменную — держим въ согласии */
  window.ZAHAR_USER_NAME = name;
  saveMem();
  console.log(TAG, 'тетрадка: имя записано —', name);
};

const STOP = /(белк|чай|обь|нельм|купец|сударь|сударын|мужчин|женщин|парен|девушк|барышн|депеш|медвед|телеграф|толкован|лексикон|словар|аппарат|трактир|самовар|карас|налив|налим|шуба|пальто|тулуп|валенк|примет|морз|априори|констатирован|ламентац|осведоми|неужто|ежели|позвольте|извольте|погод|барнаул|демидов|гост|знае|расскаж|скажи|зват|работ|(?:^|[^а-яё])как(?:[^а-яё]|$))/i;
/* №59.9о: словца-не-имена («сіе», «ибо», «ажъ») — по всему слову, не по подстроке,
   чтобы «Алексей» не задеть */
const STOP2 = /(?:^|[^а-яё])(сей|сія|сиѣ|сие|ибо|аж|ажно|аки|яко|как)(?:[^а-яё]|$)/i;
/* №59.7: стоп-глаголы — «я хочу/устал/занят» имя не мнят */
const STOPVERB = /(устал|занят|болен|рад|согласен|свободен|уверен|готов|хочу|думаю|знаю|вижу|слышу|читаю|люблю|работаю|хожу|служу|пишу|рыбачу|не|все|всё|тут|там|здесь|дома|устала|занята|больна|согласна|свободна|знае|расскаж|скажи|зват|(?:^|[^а-яё])как(?:[^а-яё]|$))/i;

function grabNameFromUser(text) {
  const t = String(text || '');
  /* явное представленье — перезаписывает старое имя (на общем компьютере представятся заново) */
  const m = t.match(/(?:меня зовут|мо[ёe] имя|имя мо[ёe]|меня [а-яё]+ звать)\s+([А-ЯЁ][а-яё]{1,20})/i);
  if (m && !STOP.test(m[1])) { zaharSetName(m[1]); return; }
  /* «привет я Анна», «это Анна» — имя в хвосте депеши */
  const m2 = t.match(/(?:^|[^а-яё])(?:я|это|а\s+я)\s+([А-ЯЁ][а-яё]{1,20})[\s.,!?]*$/i);
  if (m2 && !STOP.test(m2[1]) && !STOP2.test(m2[1].toLowerCase()) && !STOPVERB.test(m2[1].toLowerCase())) zaharSetName(m2[1]);
}

window.zaharSetStation = function (st) {
  if (!st) return;
  mem.notebook.station = String(st).trim().slice(0, 40);
  saveMem();
  console.log(TAG, 'тетрадка: станция записана —', mem.notebook.station);
};

/* №59.7: полное забвенье — тетрадку и ленту стираем (мозгъ свой выученный стереть умеетъ самъ) */
window.zaharForgetName = function () {
  mem.notebook = {};
  mem.tape = [];
  saveMem();
  console.log(TAG, 'забвенье: тетрадка и лента стерты');
};

/* №59.7: полка тем счётчиковъ переживает перезагрузку */
window.zaharSaveNotebook = function () {
  try { saveMem(); } catch (e) {}
};

window.zaharNoteUser = function (text) {
  grabNameFromUser(text);
  mem.tape.push({ who: 'собеседник', text: String(text || '').slice(0, 120) });
  mem.tape = mem.tape.slice(-TAPE_MAX);
  saveMem();
};

window.zaharNoteZahar = function (text) {
  mem.tape.push({ who: 'захар', text: String(text || '').slice(0, 120) });
  mem.tape = mem.tape.slice(-TAPE_MAX);
  saveMem();
};

let lastConfident = null;
window.zaharNoteTopic = function (topic) { if (topic) lastConfident = topic; };

window.zaharEnrichQuery = function (text) {
  if (!lastConfident) return text;
  const short = String(text).trim().split(/\s+/).length <= 4;
  return short ? lastConfident + ' ' + text : text;
};

/* ---------- нормализация (правка №26: ять и і ДО очистки) ---------- */
function normalize(text) {
  let s = String(text || '').toLowerCase();
  s = s.replace(/ѣ/g, 'е').replace(/і/g, 'и').replace(/ѳ/g, 'ф').replace(/ѵ/g, 'и');
  s = s.replace(/[^a-zа-яё0-9\s]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/* ---------- 18 интентов ---------- */
const INTENTS = [
  { name: 'fish', examples: ['как ловится нельма', 'нельма клюет', 'рыбалка на оби', 'поймал тайменя', 'где ловить рыбу'],
    responses: ['Нельма — лучшая рыба в Оби, серебром отливающая. Ловится на перемёт и на спиннинг, {N}. Самое то — утренние зори.',
                'На муксуна подъ лѣдомъ хожу, {N}: сигъ жирный, «белой осетріной» званный — осенью неводами берутъ.',
                'Хариусъ въ быстринахъ Обскихъ притоковъ водится — плавникъ пестрый, какъ у петуха. Къ столу въ малосолѣ хорошъ.',
                'На тайменя охота — царь таежныхъ рекъ, до пуда вѣсомъ. Поймать тайменя — не рыбу поймать, событие поймать.'] },
  { name: 'hunt', examples: ['белку видел в тайге', 'охота на соболя', 'ружье купил', 'капканы ставить', 'белка промыслом идет'],
    responses: ['Белка нынче ходит промыслом — шкурка дороже меди. Соболиный след видели у Каргополовых угодьев.'] },
  { name: 'tea', examples: ['налей чаю', 'попить чаю', 'чай с сахаром', 'самовар кипит', 'чай вприкуску'],
    responses: ['Самовар в искре, чай вприкуску — вот и весь вечерний устав, {N}.',
                'Чаю? Извольте: кипяток свежий, с сахаром — но я бы вприкуску, честнее вкус.'] },
  { name: 'sad', examples: ['душа не на месте сегодня', 'тоскливо мне сегодня', 'соскучился по дому', 'на душе муторно', 'грусть накатила'],
    responses: ['Тоска, говорите? Три лекарства здешние знаю: горячий чай, дело, да Обь на закате. Помогает — проверено на себе.',
                'Понимаю, {N}. Тоска в телеграфной будке — гость частый. Лечится делом и дорожкой вдоль Оби.'] },
  { name: 'wire', examples: ['депеша пришла', 'телеграмма ушла', 'морзянка по ночам', 'аппарат стучит', 'точка тире'],
    responses: ['Депеши идут, точка-тире не подводят. Аппарат Юза — говорун, люблю его.'] },
  { name: 'money', examples: ['сколько жалованье', 'зарплата телеграфиста', 'рубль копейка', 'сколько стоит пуд муки'],
    responses: ['Жалованье тридцать — тридцать пять рублей, {A}. На ружье коплю — Тихон Дмитриевич весной обещал взять на глухариный ток.'] },
  { name: 'weather', examples: ['какая погода', 'мороз крепчает', 'метель пошла', 'дождь зарядил'],
    responses: ['Погоду сказывает барометр: стрелка к «ясно» поднимается — к холоду.'] },
  { name: 'river', examples: ['обь река', 'ледоход когда', 'пароход идет', 'выйти на берег'],
    responses: ['Обь — матушка-река. Ледоход в конце апреля, пароходы — с мая.'] },
  { name: 'city', examples: ['барнаул какой', 'город ночью', 'ярмарка когда', 'где погулять'],
    responses: ['Барнаул стоит на Оби. Завод наш сереброплавильный с 1893 года закрыт — домны остыли, а город жив.'] },
  { name: 'samovar', examples: ['самовар меди', 'чайник поставить', 'кипяток свежий'],
    responses: ['Самовар углей просит, а не керосину. Медный — от деда, звон держит.'] },
  { name: 'birds', examples: ['каких птиц встречал', 'глухарь поет', 'снегирь прилетел', 'тетерев токует'],
    responses: ['Глухарь на токовищах, тетерев по березам, снегирь к кормушке прилетает.'] },
  { name: 'train', examples: ['поезд когда', 'железная дорога', 'станция поезда', 'гудок слышал'],
    responses: ['Рельсы пока до Кривощёкова дошли. К нам дорога ещё не пришла.'] },
  { name: 'market', examples: ['рынок по средам', 'торговые ряды', 'купец скупает', 'лавка открыта'],
    responses: ['Торговые ряды по средам, купец Первухин пшеницу скупает.'] },
  { name: 'night', examples: ['ночь глубокая', 'не спится', 'поздно уже', 'бессонница'],
    responses: ['Ночь для телеграфиста — время рабочее. Депеши не спят, и я не спю.'] },
  { name: 'letters', examples: ['письмо отправить', 'почта когда', 'открытка стоит', 'конверт купить'],
    responses: ['Почта ходит через Томск дважды в неделю. Письмо — три копейки, открыточка — две.'] },
  { name: 'news', examples: ['что пишут в газетах', 'новости есть', 'слухи по городу', 'газета свежая'],
    responses: ['Газеты приходят недельной давности, зато слухи — свежее утреннего хлеба.'] },
  { name: 'greeting', examples: ['здравствуйте захар', 'привет тебе', 'добрый день', 'доброй ночи'],
    responses: ['Здравия желаю и вам, {A}! Телеграф Барнаул готов к приему сообщения. С какой станции депеша?'] },
  { name: 'name', examples: ['как вас зовут', 'кто вы такой', 'как тебя зовут', 'представьтесь'],
    responses: ['Захар Давыдович Кузнецов, девятнадцати лет. Младший телеграфист Барнаульской станции — служу неполный год, при аппарате Юза.'] }
];

function fillRep(rep) {
  let out = rep.replace(/\{N\}/g, mem.notebook.name || 'сударь')
            .replace(/\{A\}/g, 'сударь');
  try {
    if (window.ZAHAR_USER_GENDER === 'f') {
      const map = [['сударём','сударынёй'],['сударем','сударынёй'],['сударя','сударыню'],['сударю','сударыне'],['сударей','сударыней'],['сударь','сударыня']];
      for (const p of map) out = out.split(p[0]).join(p[1]);
    }
  } catch (e) {}
  return out;
}

const lastUsed = {};
function pick(intent) {
  const rs = intent.responses;
  const i = (lastUsed[intent.name] || 0) % rs.length;
  lastUsed[intent.name] = i + 1;
  return rs[i];
}

function nowMs() {
  return (window.performance && performance.now) ? performance.now() : Date.now();
}

/* ---------- загрузчик библиотеки (правка №31) ---------- */
async function loadLibrary() {
  if (state.lib) return state.lib;
  const urls = [CFG.libraryUrl, CFG.libraryUrlFallback];
  let lastErr = null;
  for (const u of urls) {
    try {
      console.log(TAG, 'грузим библиотеку через import():', u);
      const mod = await import(u);
      state.lib = mod.default || mod;
      window.transformers = state.lib;
      return state.lib;
    } catch (e) {
      lastErr = e;
      console.warn(TAG, 'этот адрес не отработал:', u, e && e.message);
    }
  }
  throw lastErr || new Error('библиотека не загрузилась');
}

/* ---------- эмбеддинги ---------- */
async function embed(text) {
  const out = await state.pipe(text, { pooling: 'mean', normalize: true });
  return Array.from(out.data);
}

function cosine(a, b) {
  let s = 0, la = 0, lb = 0;
  for (let i = 0; i < a.length; i++) { s += a[i] * b[i]; la += a[i] * a[i]; lb += b[i] * b[i]; }
  return s / (Math.sqrt(la) * Math.sqrt(lb) || 1);
}

async function buildIndex() {
  state.index = [];
  for (const it of INTENTS) {
    const vecs = [];
    const seen = new Set();
    for (const ex of it.examples) {
      const n = normalize(ex);
      if (seen.has(n)) continue;
      seen.add(n);
      vecs.push(await embed(n));
    }
    state.index.push({ name: it.name, intent: it, vecs });
  }
  console.log(TAG, 'индексъ готовъ: ' + INTENTS.length + ' интентовъ');
}

function match(text) {
  const scored = [];
  for (const item of state.index) {
    let best = -1;
    for (const v of item.vecs) {
      const s = cosine(state.lastVec, v);
      if (s > best) best = s;
    }
    scored.push({ name: item.name, intent: item.intent, score: best });
  }
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, CFG.topK);
  console.log(TAG, 'top-3: ' + top.map(t => t.name + ' ' + t.score.toFixed(3)).join(' · '));
  const w = scored[0], r = scored[1];
  if (w.score >= CFG.threshold && w.score - r.score >= CFG.margin) return w;
  if (w.score >= CFG.threshold) console.log(TAG, 'мимо зазора: ' + w.name + ' ' + w.score.toFixed(3) + ' против ' + r.name + ' ' + r.score.toFixed(3));
  return null;
}

/* ---------- пробуждение ---------- */
const scriptBase = (document.currentScript && document.currentScript.src) || location.href;

async function wake() {
  if (state.ready || state.waking) return;
  state.waking = true;
  console.log(TAG, 'Захаръ просыпается… (модель грузится)');
  try {
    const T = await loadLibrary();
    const env = T.env || (T.default && T.default.env) || null;
    if (env) {
      env.allowLocalModels = true;
      env.allowRemoteModels = false;   // на huggingface.co не ходим — модель у нас
      env.localModelPath = new URL('../models/', scriptBase).href;
      console.log(TAG, 'локальные модели по адресу:', env.localModelPath);
    } else {
      console.warn(TAG, 'env недоступен — возможно, модель не найдётся локально');
    }
    state.pipe = await T.pipeline('feature-extraction', CFG.modelName, { dtype: 'q8' });
    await buildIndex();
    state.ready = true;
    console.log(TAG, 'Захаръ проснулсяъ: семантическій роутеръ на мѣстѣ');
    /* прогрев (правка №36): первый счёт не должен платить за инициализацию */
    try {
      const t1 = nowMs();
      embed(normalize('прогревъ аппарата')).then(function () {
        console.log(TAG, 'прогревъ: первый счёт за ' + Math.round(nowMs() - t1) + ' мс');
      }).catch(function () {});
    } catch (e) {}
  } catch (e) {
    console.error(TAG, 'пробуждение не удалось:', e && e.message ? e.message : e);
  } finally {
    state.waking = false;
  }
}
window.zaharWake = wake;
window.ZAHAR_EMBED_WAKE = wake;  // будильник zahar_boot.js идёт через ту же охраняемую wake

/* №59.9о: ранжировщикъ для казеннаго конструктора — модель лишь ПОДБИРАЕТЪ изъ
   готовыхъ кандидатовъ (ничего не сочиняетъ). Обещаніе возвращаетъ порядокъ
   индексовъ кандидатовъ по близости къ депешѣ. Не успѣла — конструктор жребіємъ. */
window.zaharEmbedRank = function (q, candidates) {
  return new Promise(function (resolve, reject) {
    try {
      const cands = (candidates || []).filter(function (c) { return c && String(c).trim(); });
      if (!state.ready || !state.pipe || cands.length < 2) {
        reject(new Error('модель не готова'));
        return;
      }
      embed(normalize(String(q || ''))).then(function (qv) {
        const scored = [];
        let k = 0;
        const next = function () {
          if (k >= cands.length) {
            scored.sort(function (a, b) { return b.s - a.s; });
            resolve(scored.map(function (x) { return x.i; }));
            return;
          }
          embed(normalize(cands[k])).then(function (cv) {
            scored.push({ i: k, s: cosine(qv, cv) });
            k++;
            next();
          }).catch(reject);
        };
        next();
      }).catch(reject);
    } catch (eRk) { reject(eRk); }
  });
};

/* ---------- контроль ---------- */
window.zaharEmbedStatus = function () {
  return {
    version: VERSION,
    библиотека: state.lib ? 'загружена (import())' : 'не загружена',
    модель: state.ready ? 'на мѣстѣ' : 'не проснулась',
    интентовъ: INTENTS.length,
    лента: mem.tape.length,
    тетрадка: (mem.notebook.name || 'имя ещё не записано') + ' / станция: ' + (mem.notebook.station || 'не записана')
  };
};

/* ---------- хук на ZAHAR_ASK (правки №21 → №36 → №37) ----------
   Контракт слоя (zahar_chat.js, install()): ZAHAR_ASK обязана
   ВЕРНУТЬ строку или Promise. Раньше уверенная ветка лишь звала
   cb(rep) и возвращала undefined — страница получала пустоту,
   морзянка стучала вечно. Теперь ответ уходит обещанием наружу,
   а cb остаётся как дополнительный канал (если слой его дал). */
function tryHook() {
  if (typeof window.ZAHAR_ASK === 'function' && !window.ZAHAR_ASK.__zahar_patched) {
    const orig = window.ZAHAR_ASK;
    const wrapped = function (text, cb) {
      const t = String(text || '');
      zaharNoteUser(t);
      if (!state.ready) return orig.call(this, text);
      if (!(mem.notebook && mem.notebook.station)) {
        console.log(TAG, 'рамка не завершена (станция не записана) — семантика молчит, слой отвечает');
        return orig.call(this, text);
      }
      /* №59.5: слои старше семантики — сначала слой болтовни и мозгъ,
         семантический роутер добирает только если слой промолчал (null/пусто) */
      const q = normalize(zaharEnrichQuery(t));
      const t0 = nowMs();
      const semanticAnswer = function () {
        return embed(q).then(vec => {
          console.log(TAG, 'эмбеддингъ за ' + Math.round(nowMs() - t0) + ' мс');
          state.lastVec = vec;
          const hit = match(q);
          if (!hit) {
            console.log(TAG, 'семантика пропустила (за ' + Math.round(nowMs() - t0) + ' мс)');
            return null;
          }
          if (hit.name === 'weather') {
            console.log(TAG, 'погода — отдает слою (живые данные)');
            return null;
          }
          zaharNoteTopic(hit.name);
          const rep = fillRep(pick(hit.intent));
          console.log(TAG, 'семантика отработала за ' + Math.round(nowMs() - t0) + ' мс');
          console.log(TAG, 'семантика отвечает:', rep);
          zaharNoteZahar(rep);
          if (typeof cb === 'function') {
            try { cb(rep); } catch (e) { console.warn(TAG, 'cb отверг ответ:', e && e.message); }
          }
          return rep;
        }).catch(function (e) {
          console.warn(TAG, 'семантика споткнулась:', e && e.message ? e.message : e);
          return null;
        });
      };
      const layered = orig.call(this, text);
      if (layered && typeof layered.then === 'function') {
        return layered.then(function (r) {
          if (r !== null && r !== undefined && r !== '') return r;
          console.log(TAG, 'слой промолчал — семантика добирает');
          return semanticAnswer();
        }).catch(function (e) {
          console.warn(TAG, 'слой споткнулся — семантика добирает:', e && e.message ? e.message : e);
          return semanticAnswer();
        });
      }
      if (layered !== null && layered !== undefined && layered !== '') {
        console.log(TAG, 'слой ответил сам — семантика молчит');
        return layered;
      }
      console.log(TAG, 'слой промолчал — семантика добирает');
      return semanticAnswer();
    };
    wrapped.__zahar_patched = true;
    window.ZAHAR_ASK = wrapped;
    console.log(TAG, 'хук на ZAHAR_ASK всталъ (контракт №37: ответ — обещаніемъ)');
    return true;
  }
  return false;
}

let hookTries = 0;
const hookTimer = setInterval(function () {
  if (tryHook() || ++hookTries > 40) clearInterval(hookTimer);
}, 500);

/* ---------- будильник (правка №21 / №59.9я): изъятъ — грузимся сразу ---------- */
console.log(TAG, 'будильникъ ' + VERSION + ': грузимся сразу');
wake();

console.log(TAG, VERSION + ' загружена: память готова — лента ' + mem.tape.length +
  ', в тетрадке: ' + (mem.notebook.name || 'имя ещё не записано'));
})();
