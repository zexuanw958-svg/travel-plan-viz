const { test } = require('node:test');
const assert = require('node:assert');
const { buildNavLink, routeCoordinates } = require('../travel-plan-viz/assets/map.js');

// 注：initTravelMap 依赖浏览器 + Leaflet，单测只覆盖纯函数，地图初始化由端到端手动验证。

test('buildNavLink 生成带 label 的 geo 链接', () => {
  const link = buildNavLink(31.23, 121.47, '外滩');
  assert.strictEqual(link, 'geo:31.23,121.47?q=31.23,121.47(%E5%A4%96%E6%BB%A9)');
});

test('routeCoordinates 按顺序提取 [lat,lng]', () => {
  const out = routeCoordinates([
    { lat: 1, lng: 2, name: 'A' },
    { lat: 3, lng: 4, name: 'B' },
  ]);
  assert.deepStrictEqual(out, [[1, 2], [3, 4]]);
});
