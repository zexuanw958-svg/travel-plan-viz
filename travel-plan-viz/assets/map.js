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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { buildNavLink: buildNavLink, routeCoordinates: routeCoordinates };
}
