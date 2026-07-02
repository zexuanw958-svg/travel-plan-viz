const { test } = require('node:test');
const assert = require('node:assert');
const { buildNavLink, routeCoordinates, gcj02ToWgs84 } = require('../travel-plan-viz/assets/map.js');

// 注：initTravelMap 依赖浏览器 + Leaflet，单测只覆盖纯函数，地图初始化由端到端手动验证。

test('buildNavLink 默认（无 ua）生成带 label 的 geo 链接', () => {
  const link = buildNavLink(31.23, 121.47, '外滩');
  assert.strictEqual(link, 'geo:31.23,121.47?q=31.23,121.47(%E5%A4%96%E6%BB%A9)');
});

test('buildNavLink 在 iOS ua 下生成 Apple Maps https 链接（iOS 不识别 geo:）', () => {
  const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
  const link = buildNavLink(31.23, 121.47, '外滩', ua);
  assert.strictEqual(link, 'https://maps.apple.com/?ll=31.23,121.47&q=%E5%A4%96%E6%BB%A9');
});

test('buildNavLink 在 Android ua 下仍用 geo 链接', () => {
  const ua = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36';
  const link = buildNavLink(31.23, 121.47, '外滩', ua);
  assert.ok(link.startsWith('geo:31.23,121.47'));
});

test('routeCoordinates 按顺序提取 [lat,lng]', () => {
  const out = routeCoordinates([
    { lat: 1, lng: 2, name: 'A' },
    { lat: 3, lng: 4, name: 'B' },
  ]);
  assert.deepStrictEqual(out, [[1, 2], [3, 4]]);
});

test('gcj02ToWgs84 对境内坐标做百米级纠偏（天安门）', () => {
  // GCJ-02 的天安门（高德坐标），转 WGS-84 后应向西南偏约 0.002–0.007°
  const { lat, lng } = gcj02ToWgs84(39.90875, 116.39723);
  const dLat = 39.90875 - lat;
  const dLng = 116.39723 - lng;
  assert.ok(dLat > 0.001 && dLat < 0.01, `lat 偏移量异常: ${dLat}`);
  assert.ok(dLng > 0.001 && dLng < 0.01, `lng 偏移量异常: ${dLng}`);
});

test('gcj02ToWgs84 对境外坐标原样返回（东京）', () => {
  assert.deepStrictEqual(gcj02ToWgs84(35.6595, 139.7005), { lat: 35.6595, lng: 139.7005 });
});
