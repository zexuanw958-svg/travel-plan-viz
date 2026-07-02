const { test } = require('node:test');
const assert = require('node:assert');
const { validateTrip, validateHTML, extractTripData, validateAll } = require('../travel-plan-viz/assets/validate.js');

const goodTrip = {
  title: '香港 4 天 3 晚',
  startDate: '2026-07-15',
  disclaimer: '本页全部信息均为 AI 基于公开资料整理的参考建议，可能不准确或已过时，请自行核实。',
  preTrip: { weather: {} },
  tips: ['贴士'],
  hotelAreas: [{ area: '尖沙咀', options: [] }],
  flights: { booked: [], candidates: [] },
  reminders: [{ item: '门票', leadDays: 7 }],
  days: [
    { date: '2026-07-15', slots: [{ name: '维港', lat: 22.293, lng: 114.169 }] },
    { date: '2026-07-16', slots: [{ name: '太平山', lat: 22.271, lng: 114.150 }] },
    { date: '2026-07-17', slots: [{ name: '星光大道', lat: 22.293, lng: 114.174 }] },
  ],
};

test('validateTrip 对完整 trip 返回零 error', () => {
  const out = validateTrip(goodTrip);
  assert.deepStrictEqual(out.errors, []);
});

test('validateTrip 抓住缺字段与非法日期', () => {
  const out = validateTrip({ title: '', startDate: '7月15日', days: [] });
  assert.ok(out.errors.some((e) => e.includes('title')));
  assert.ok(out.errors.some((e) => e.includes('startDate')));
  assert.ok(out.errors.some((e) => e.includes('disclaimer')));
  assert.ok(out.errors.some((e) => e.includes('days')));
});

test('validateTrip 抓住 lat/lng 写反（越界）', () => {
  const trip = JSON.parse(JSON.stringify(goodTrip));
  trip.days[0].slots[0] = { name: '维港', lat: 114.169, lng: 22.293 };
  const out = validateTrip(trip);
  assert.ok(out.errors.some((e) => e.includes('lat 越界')));
});

test('validateTrip 对离群坐标给 warning（查错城市）', () => {
  const trip = JSON.parse(JSON.stringify(goodTrip));
  trip.days[2].slots[0] = { name: '误入北京', lat: 39.9, lng: 116.4 };
  const out = validateTrip(trip);
  assert.deepStrictEqual(out.errors, []);
  assert.ok(out.warnings.some((w) => w.includes('离群')));
});

test('validateTrip 抓住 needsBooking 缺 leadDays', () => {
  const trip = JSON.parse(JSON.stringify(goodTrip));
  trip.days[0].slots[0].needsBooking = true;
  const out = validateTrip(trip);
  assert.ok(out.errors.some((e) => e.includes('needsBooking')));
});

function goodHTML() {
  return [
    '<!DOCTYPE html><html><head><link href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">',
    '<style>@media (min-width:768px){} img{object-fit:cover}</style></head><body>',
    '<p>' + goodTrip.disclaimer + '</p>',
    '<script id="trip-data" type="application/json">' + JSON.stringify(goodTrip) + '</script>',
    '<script>function gcj02ToWgs84(){}function computeReminders(){}function renderChecklistHTML(){}',
    'function initTravelMap(){}</script></body></html>',
  ].join('\n');
}

test('validateHTML 对合规 HTML 返回零 error', () => {
  const out = validateHTML(goodHTML());
  assert.deepStrictEqual(out.errors, []);
});

test('validateHTML 抓住缺 trip-data / 缺引擎调用 / 缺响应式', () => {
  const out = validateHTML('<html><body>hi</body></html>');
  assert.ok(out.errors.some((e) => e.includes('trip-data')));
  assert.ok(out.errors.some((e) => e.includes('initTravelMap')));
  assert.ok(out.errors.some((e) => e.includes('@media')));
  assert.ok(out.errors.some((e) => e.includes('Leaflet')));
});

test('validateHTML 对免责声明只藏在 JSON 里给 warning', () => {
  const html = goodHTML().replace('<p>' + goodTrip.disclaimer + '</p>', '');
  const out = validateHTML(html);
  assert.ok(out.warnings.some((w) => w.includes('免责声明')));
});

test('extractTripData 解析内嵌 JSON；validateAll 全链路零 error', () => {
  const trip = extractTripData(goodHTML());
  assert.strictEqual(trip.title, goodTrip.title);
  const out = validateAll(goodHTML());
  assert.deepStrictEqual(out.errors, []);
});
