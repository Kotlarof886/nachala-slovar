/* ============================================================
   zahar_sky.js — мостъ неба для Захара (правка №60.0а)
   Луна — той же формулой, что въ сценѣ «Начала»:
   новолуніе — точка отсчёта (JD 2451550.1), синодическій мѣсяцъ 29.530588853 сут.
   Тринадцать ярусовъ: 0 — новорождённый серпъ за мгновенье ПОСЛЕ чёрного
   диска, 12 — убывающая за мгновенье ДО него; ярусы 0 и 12 держатся
   около 12 часовъ каждый, между ними живутъ фазы 1…11.
   Облачность и вѣтеръ — изъ кэша сцены (localStorage 'barnaul-precip-v2',
   свежесть 4 минуты, как у самой сцены). Ночь/день — по высотѣ солнца
   (ночь, ежели солнце ниже −6°, как в сцене).
   Наружу: window.ZAHAR_SKY_INFO() — данные и готовые словеса для Захара.
   ============================================================ */
(function () {
  'use strict';

  var LAT = 53.35, LON = 83.78;
  var SYNODIC = 29.530588853, NEW_MOON_JD = 2451550.1;
  var TTL = 4 * 60 * 1000;          /* свежесть кэша сцены */
  var HALF_TIER_H = 12;             /* ярусы 0 и 12 держатся по ~12 часовъ */
  var RECALC_MS = 60 * 1000;        /* пересчёт не чаще раза въ минуту */

  /* --- высота солнца — дословно формула сцены --- */
  function sunAltitude(date) {
    var start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
    var doy = Math.floor((date - start) / 86400000);
    var g = 2 * Math.PI / 365 * (doy - 1 + (date.getUTCHours() - 12) / 24);
    var eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g)
             - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    var decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g)
             - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
             - 0.002697 * Math.cos(3 * g) + 0.001480 * Math.sin(3 * g);
    var utcMin = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
    var tst = ((utcMin + eqt + 4 * LON) % 1440 + 1440) % 1440;
    var ha = ((tst / 4) - 180) * Math.PI / 180;
    var lr = LAT * Math.PI / 180;
    var cz = Math.sin(lr) * Math.sin(decl) + Math.cos(lr) * Math.cos(decl) * Math.cos(ha);
    return 90 - Math.acos(Math.max(-1, Math.min(1, cz))) * 180 / Math.PI;
  }

  /* --- луна: фаза, высота, азимутъ — дословно формула сцены --- */
  function moonData(date) {
    var jd = date.getTime() / 86400000 + 2440587.5;
    var T = (jd - 2451545.0) / 36525;
    var dsn = (jd - NEW_MOON_JD) % SYNODIC;
    if (dsn < 0) dsn += SYNODIC;
    var phase = dsn / SYNODIC;

    var lat = LAT * Math.PI / 180;
    var Lp = 218.316 + 481267.881 * T;
    var Mp = 134.963 + 477198.867 * T;
    var F  = 93.272 + 483202.017 * T;
    var lambda = Lp + 6.289 * Math.sin(Mp * Math.PI / 180);
    var beta   = 5.128 * Math.sin(F * Math.PI / 180);
    var eps    = 23.439 - 0.013 * T;
    var sl = Math.sin(lambda * Math.PI / 180), cl = Math.cos(lambda * Math.PI / 180);
    var sb = Math.sin(beta * Math.PI / 180),  cb = Math.cos(beta * Math.PI / 180);
    var se = Math.sin(eps * Math.PI / 180),   ce = Math.cos(eps * Math.PI / 180);
    var alpha = Math.atan2(sl * ce - Math.tan(beta) * se, cl) * 180 / Math.PI;
    var delta = Math.asin(sb * ce + cb * se * sl) * 180 / Math.PI;
    var gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000;
    var lst = (gmst + LON) % 360;
    var ha = (lst - alpha) * Math.PI / 180;
    var dr = delta * Math.PI / 180;
    var sinAlt = Math.sin(lat) * Math.sin(dr) + Math.cos(lat) * Math.cos(dr) * Math.cos(ha);
    var alt = Math.asin(sinAlt) * 180 / Math.PI;
    var az = Math.atan2(-Math.cos(dr) * Math.sin(ha), Math.sin(dr) * Math.cos(lat) - Math.cos(dr) * Math.sin(lat) * Math.cos(ha)) * 180 / Math.PI;
    az = (az + 360) % 360;
    return { phase: phase, alt: alt, az: az };
  }

  /* --- тринадцать ярусов: 0 и 12 — по ~12 часовъ, 1…11 — равные доли середины --- */
  function tierFromPhase(phase) {
    var hw = HALF_TIER_H / (SYNODIC * 24);      /* доля суток на половину тёмнаго яруса */
    if (phase < hw) return 0;
    if (phase > 1 - hw) return 12;
    var p = (phase - hw) / (1 - 2 * hw);
    var t = 1 + Math.floor(p * 11);
    return Math.min(11, t);
  }

  var TIER_NAME = [
    'новорождённый серпъ — луна только что родилась',
    'молодой серпъ, растётъ',
    'луна на прибавѣ',
    'прибывающая половинка',
    'луна почти круглая, добираетъ светъ',
    'наливная луна, скоро полная',
    'полная луна',
    'луна на убыли',
    'убывающая горбатая',
    'последняя четверть',
    'старѣющая луна, света мало',
    'тонкій старый серпъ',
    'убывающая луна — за мгновенье до чёрного диска'
  ];

  function starsDesc(cloud) {
    if (cloud === null || cloud === undefined) return '';
    if (cloud < 20) return 'небо чистое — звёзды горятъ ярко';
    if (cloud < 50) return 'лёгкая дымка — звёзды скромнее';
    if (cloud < 80) return 'облачно — звёзды тускло пробиваютсяъ';
    return 'сплошныя тучи — звёздъ почти не видать';
  }

  function readSkyCache() {
    try {
      var raw = localStorage.getItem('barnaul-precip-v2');
      if (!raw) return { cloud: null, wind: null, fresh: false };
      var o = JSON.parse(raw);
      if (o && typeof o.ts === 'number' && Date.now() - o.ts < TTL) {
        return {
          cloud: (typeof o.cloud === 'number') ? o.cloud : null,
          wind:  (typeof o.wind  === 'number') ? o.wind  : null,
          fresh: true
        };
      }
    } catch (e) {}
    return { cloud: null, wind: null, fresh: false };
  }

  var _last = 0, _cached = null;

  function info() {
    var now = Date.now();
    if (_cached && now - _last < RECALC_MS) return _cached;
    var d = new Date();
    var sun = sunAltitude(d);
    var md = moonData(d);
    var night = sun < -6;
    var sky = readSkyCache();
    var tier = tierFromPhase(md.phase);
    var out = {
      phase:   md.phase,            /* 0..1, новолуніе = 0 */
      ph12:    tier,                /* ярусъ 0..12, как на сайтѣ */
      tierName: TIER_NAME[tier],
      sunAlt:  sun,
      night:   night,
      moonUp:  night,               /* въ сценѣ луна выходитъ только ночью */
      cloud:   sky.cloud,           /* 0..100 изъ кэша сцены */
      wind:    sky.wind,            /* м/с изъ кэша сцены */
      fresh:   sky.fresh,           /* кэш сцены ещё живой? */
      moon:    TIER_NAME[tier],
      stars:   starsDesc(sky.cloud)
    };
    _cached = out; _last = now;
    return out;
  }

  window.ZAHAR_SKY_INFO = info;
})();
