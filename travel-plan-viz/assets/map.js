// Leaflet 地图引擎。纯函数（buildNavLink/routeCoordinates）可单元测试；
// initTravelMap 需浏览器 + Leaflet (L)。浏览器与 Node 双用。

// 生成跳转手机地图导航的通用 geo 链接
function buildNavLink(lat, lng, label) {
  return 'geo:' + lat + ',' + lng + '?q=' + lat + ',' + lng + '(' + encodeURIComponent(label) + ')';
}

// 从有序点位提取 [lat,lng] 数组，用于连线
function routeCoordinates(points) {
  return points.map(function (p) { return [p.lat, p.lng]; });
}

// 初始化地图：编号 divIcon 标记、按序虚线路线、点击弹出 名称+时间+导航链接。
// elementId: 容器 id；points: [{lat, lng, name, time}]（按行程顺序）
function initTravelMap(elementId, points) {
  var map = L.map(elementId);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19,
  }).addTo(map);

  points.forEach(function (p, i) {
    var icon = L.divIcon({
      className: 'route-pin',
      html: '<span class="route-pin__num">' + (i + 1) + '</span>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    L.marker([p.lat, p.lng], { icon: icon }).addTo(map).bindPopup(
      '<b>' + (i + 1) + '. ' + p.name + '</b><br>'
      + (p.time ? p.time + '<br>' : '')
      + '<a href="' + buildNavLink(p.lat, p.lng, p.name) + '">导航</a>'
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
    initTravelMap: initTravelMap,
  };
}
