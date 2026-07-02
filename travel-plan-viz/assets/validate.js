// 契约机械校验引擎：trip 数据结构 + 生成的 HTML 是否符合 page-contract.md。
// 纯函数可单元测试；也可作 CLI 用（node validate.js <生成的.html>）。浏览器不需要它。
//
// 设计原则：只校验"机械可判定"的东西（字段缺失、坐标越界/离群、必需区块标记），
// 美学与文案质量不归它管。errors 必须修复；warnings 供人工判断。

// 校验 trip 数据结构，返回 { errors: [], warnings: [] }
function validateTrip(trip) {
  var errors = [];
  var warnings = [];
  if (!trip || typeof trip !== 'object') {
    return { errors: ['trip 不是对象'], warnings: [] };
  }
  if (!trip.title) errors.push('缺 trip.title');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trip.startDate || '')) {
    errors.push('trip.startDate 须为 YYYY-MM-DD，当前: ' + trip.startDate);
  }
  if (!trip.disclaimer || String(trip.disclaimer).length < 20) {
    errors.push('缺 trip.disclaimer（全覆盖免责声明）');
  }
  if (!trip.preTrip) warnings.push('缺 trip.preTrip（行前须知）');
  if (!trip.tips || !trip.tips.length) warnings.push('缺 trip.tips（全程贴士）');
  if (!trip.hotelAreas || !trip.hotelAreas.length) warnings.push('缺 trip.hotelAreas（片区酒店）');
  if (!trip.flights) warnings.push('缺 trip.flights（航班区）');

  (trip.reminders || []).forEach(function (r, i) {
    if (!r.item || typeof r.leadDays !== 'number') {
      errors.push('reminders[' + i + '] 须含 item 与数字 leadDays');
    }
  });

  if (!Array.isArray(trip.days) || !trip.days.length) {
    errors.push('trip.days 缺失或为空');
    return { errors: errors, warnings: warnings };
  }

  var lats = [], lngs = [];
  trip.days.forEach(function (day, di) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date || '')) {
      errors.push('days[' + di + '].date 须为 YYYY-MM-DD');
    }
    (day.slots || []).forEach(function (s, si) {
      var at = 'days[' + di + '].slots[' + si + ']';
      if (!s.name) errors.push(at + ' 缺 name');
      if (typeof s.lat !== 'number' || typeof s.lng !== 'number') {
        errors.push(at + ' 缺数字 lat/lng');
        return;
      }
      // 越界通常是 lat/lng 写反（如 lat: 116.4）
      if (s.lat < -90 || s.lat > 90) errors.push(at + ' lat 越界（是否与 lng 写反？）: ' + s.lat);
      if (s.lng < -180 || s.lng > 180) errors.push(at + ' lng 越界: ' + s.lng);
      lats.push(s.lat); lngs.push(s.lng);
      if (s.needsBooking && typeof s.leadDays !== 'number') {
        errors.push(at + ' needsBooking 为 true 但缺数字 leadDays');
      }
    });
    if (!day.slots || !day.slots.length) warnings.push('days[' + di + '] 没有 slots');
  });

  // 离群检测：与中位数偏差 > 3°（约 300km）多半是查错城市/写错数量级
  function median(arr) {
    var a = arr.slice().sort(function (x, y) { return x - y; });
    return a[Math.floor(a.length / 2)];
  }
  if (lats.length >= 3) {
    var mLat = median(lats), mLng = median(lngs);
    trip.days.forEach(function (day, di) {
      (day.slots || []).forEach(function (s, si) {
        if (typeof s.lat !== 'number' || typeof s.lng !== 'number') return;
        if (Math.abs(s.lat - mLat) > 3 || Math.abs(s.lng - mLng) > 3) {
          warnings.push('days[' + di + '].slots[' + si + '] "' + s.name
            + '" 坐标疑似离群（与行程中位点差 >3°），请核实: ' + s.lat + ',' + s.lng);
        }
      });
    });
  }
  return { errors: errors, warnings: warnings };
}

// 从生成的 HTML 中提取内嵌的 trip JSON（<script id="trip-data" type="application/json">）
// 返回 trip 对象；缺块或解析失败返回 null。
function extractTripData(html) {
  var m = String(html).match(/<script[^>]*id="trip-data"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch (e) { return null; }
}

// 校验生成的 HTML 是否含契约必需的机械标记，返回 { errors, warnings }
function validateHTML(html) {
  var errors = [];
  var warnings = [];
  var s = String(html);
  var checks = [
    ['id="trip-data"', '缺内嵌 trip JSON（<script id="trip-data" type="application/json">）'],
    ['initTravelMap', '未调用 initTravelMap（交互地图）'],
    ['computeReminders', '未调用 computeReminders（提醒计算）'],
    ['renderChecklistHTML', '未调用 renderChecklistHTML（页顶待办清单）'],
    ['gcj02ToWgs84', 'map.js 引擎未完整内联（缺 gcj02ToWgs84）'],
  ];
  checks.forEach(function (c) {
    if (s.indexOf(c[0]) === -1) errors.push(c[1]);
  });
  if (!/leaflet/i.test(s)) errors.push('未引入 Leaflet CSS/JS');
  if (s.indexOf('@media') === -1) errors.push('缺响应式 @media 断点');
  if (s.indexOf('object-fit') === -1) warnings.push('未见 object-fit（图片防变形），请确认');
  if (s.indexOf('trip-data') !== -1 && !extractTripData(s)) {
    errors.push('trip-data 块存在但 JSON 解析失败');
  }
  var trip = extractTripData(s);
  if (trip && trip.disclaimer) {
    var probe = String(trip.disclaimer).slice(0, 15);
    // disclaimer 全文须出现在正文（不只藏在 JSON 里）：JSON 外应至少再出现一次
    var first = s.indexOf(probe);
    var second = s.indexOf(probe, first + 1);
    if (second === -1) warnings.push('免责声明疑似只在 trip-data JSON 里、未渲染进正文，请确认');
  }
  return { errors: errors, warnings: warnings };
}

// 一次跑全：HTML 标记 + 内嵌 trip 结构
function validateAll(html) {
  var h = validateHTML(html);
  var trip = extractTripData(html);
  if (trip) {
    var t = validateTrip(trip);
    h.errors = h.errors.concat(t.errors);
    h.warnings = h.warnings.concat(t.warnings);
  }
  return h;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateTrip: validateTrip,
    validateHTML: validateHTML,
    extractTripData: extractTripData,
    validateAll: validateAll,
  };
  // CLI: node validate.js <生成的.html>
  if (require.main === module) {
    var fs = require('fs');
    var file = process.argv[2];
    if (!file) { console.error('用法: node validate.js <生成的.html>'); process.exit(2); }
    var out = validateAll(fs.readFileSync(file, 'utf8'));
    out.errors.forEach(function (e) { console.error('✗ ERROR   ' + e); });
    out.warnings.forEach(function (w) { console.warn('! WARNING ' + w); });
    if (!out.errors.length) console.log('✓ 契约校验通过' + (out.warnings.length ? '（有 ' + out.warnings.length + ' 条 warning 请人工确认）' : ''));
    process.exit(out.errors.length ? 1 : 0);
  }
}
