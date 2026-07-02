// Leaflet 地图引擎。纯函数（buildNavLink/routeCoordinates/gcj02ToWgs84）可单元测试；
// initTravelMap 需浏览器 + Leaflet (L)。浏览器与 Node 双用。

// HTML 转义，防止 XSS
function escapeHTML(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 生成跳转手机地图导航的链接。
// iOS 不识别 geo: scheme，用 Apple Maps 的 https 通用链接；其余平台用 geo:。
// ua 可选（浏览器里传 navigator.userAgent），不传则回退 geo:。
function buildNavLink(lat, lng, label, ua) {
  if (ua && /iPhone|iPad|iPod/.test(ua)) {
    return 'https://maps.apple.com/?ll=' + lat + ',' + lng + '&q=' + encodeURIComponent(label);
  }
  return 'geo:' + lat + ',' + lng + '?q=' + lat + ',' + lng + '(' + encodeURIComponent(label) + ')';
}

// —— GCJ-02 → WGS-84 坐标转换 ——
// 高德/腾讯地图返回的坐标是 GCJ-02（国测局加密），直接画在 OSM（WGS-84）瓦片上
// 会偏移一百到几百米。凡坐标来自高德/腾讯类 skill，必须先经此函数转换。
// 中国境外坐标原样返回（GCJ-02 仅在境内加偏）。
var GCJ_A = 6378245.0;
var GCJ_EE = 0.00669342162296594323;

function isInChinaBBox(lat, lng) {
  return lng >= 72.004 && lng <= 137.8347 && lat >= 0.8293 && lat <= 55.8271;
}

function gcjTransformLat(x, y) {
  var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0;
  ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320.0 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0;
  return ret;
}

function gcjTransformLng(x, y) {
  var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0;
  ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0;
  return ret;
}

function gcj02ToWgs84(lat, lng) {
  if (!isInChinaBBox(lat, lng)) return { lat: lat, lng: lng };
  var dLat = gcjTransformLat(lng - 105.0, lat - 35.0);
  var dLng = gcjTransformLng(lng - 105.0, lat - 35.0);
  var radLat = lat / 180.0 * Math.PI;
  var magic = Math.sin(radLat);
  magic = 1 - GCJ_EE * magic * magic;
  var sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / ((GCJ_A * (1 - GCJ_EE)) / (magic * sqrtMagic) * Math.PI);
  dLng = (dLng * 180.0) / (GCJ_A / sqrtMagic * Math.cos(radLat) * Math.PI);
  return { lat: lat - dLat, lng: lng - dLng };
}

// 从有序点位提取 [lat,lng] 数组，用于连线
function routeCoordinates(points) {
  return points.map(function (p) { return [p.lat, p.lng]; });
}

// 初始化地图：编号 divIcon 标记、按序虚线路线、点击弹出 名称+时间+导航链接。
// elementId: 容器 id；points: [{lat, lng, name, time}]（按行程顺序，坐标须为 WGS-84）
// opts 可选：{ tileUrl, attribution } 替换默认 OSM 瓦片源（如 OSM 访问不稳时换镜像）。
function initTravelMap(elementId, points, opts) {
  opts = opts || {};
  var map = L.map(elementId);
  L.tileLayer(opts.tileUrl || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: opts.attribution || '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  var ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  points.forEach(function (p, i) {
    var icon = L.divIcon({
      className: 'route-pin',
      html: '<span class="route-pin__num">' + (i + 1) + '</span>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    L.marker([p.lat, p.lng], { icon: icon }).addTo(map).bindPopup(
      '<b>' + (i + 1) + '. ' + escapeHTML(p.name) + '</b><br>'
      + (p.time ? escapeHTML(p.time) + '<br>' : '')
      + '<a href="' + buildNavLink(p.lat, p.lng, p.name, ua) + '">导航</a>'
    );
  });

  var coords = routeCoordinates(points);
  if (coords.length > 1) {
    L.polyline(coords, { dashArray: '6 8', weight: 2 }).addTo(map);
  }
  map.fitBounds(coords.length ? coords : [[0, 0]], { padding: [30, 30] });
  return map;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildNavLink: buildNavLink,
    routeCoordinates: routeCoordinates,
    gcj02ToWgs84: gcj02ToWgs84,
    initTravelMap: initTravelMap,
  };
}
