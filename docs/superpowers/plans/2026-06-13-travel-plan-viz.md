# 旅行计划可视化 Skill 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个 Claude Code skill `travel-plan-viz`，把旅行行程变成美观、可离线、手机优先的单文件 HTML（含交互地图、每日时间轴、出发前订票提醒）。

**Architecture:** 混合架构——错误率高的"机械逻辑"（Leaflet 初始化、导航链接、提醒日期计算）做成固定可复用的 JS 引擎并用 TDD 保证正确；页面布局与美学交给 frontend-design 每次重生。skill 通过 SKILL.md 编排两种入口（从零规划 / 已有计划），统一汇到"联网调研 → 生成 HTML"。

**Tech Stack:** 纯 JavaScript（无构建）、Leaflet（CDN，免费 OSM 瓦片）、Node 内置 `node:test` + `node:assert` 做单元测试、Markdown 写 skill 指令与参考文档。

---

## 文件结构

```
travel-plan-viz/
  SKILL.md              # 工作流编排：判断模式 → 规划/解析 → 调研 → 生成
  assets/
    reminders.js        # 出发前提醒：截止日期计算 + 清单/徽标渲染（纯函数，可测）
    map.js              # Leaflet 引擎：导航链接、路线坐标（纯函数）+ 地图初始化
    page-contract.md    # 给 frontend-design 的内容/数据结构契约
  references/
    research-guide.md   # 联网调研指南 + 提前预订启发式
test/
  reminders.test.js     # reminders.js 单元测试
  map.test.js           # map.js 纯函数单元测试
```

职责划分：
- `reminders.js` / `map.js`：确定性逻辑，独立可单元测试，浏览器与 Node 双用（底部 `module.exports` 守卫）。
- `*.md` 文件：给执行时的 Claude 读的指令/契约，无运行逻辑。
- `test/`：只覆盖纯函数（日期计算、链接生成、坐标排序）；Leaflet DOM 初始化与 HTML 生成靠 Task 8 手动验证。

---

### Task 1: reminders.js — 截止日期计算

**Files:**
- Create: `travel-plan-viz/assets/reminders.js`
- Test: `test/reminders.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/reminders.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { computeReminders } = require('../travel-plan-viz/assets/reminders.js');

test('computeReminders 按截止日期升序排序并正确计算', () => {
  const out = computeReminders('2026-07-01', [
    { item: '长白山门票', leadDays: 7 },
    { item: '机票', leadDays: 30 },
  ]);
  assert.deepStrictEqual(out, [
    { item: '机票', leadDays: 30, deadline: '2026-06-01' },
    { item: '长白山门票', leadDays: 7, deadline: '2026-06-24' },
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/reminders.test.js`
Expected: FAIL — `Cannot find module '../travel-plan-viz/assets/reminders.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// travel-plan-viz/assets/reminders.js
// 出发前提醒：截止日期计算 + 渲染。浏览器与 Node 双用。

// startDateISO: 'YYYY-MM-DD'；items: [{item, leadDays}]
// 返回按 deadline 升序的 [{item, leadDays, deadline}]，deadline 为 'YYYY-MM-DD'
// 用 UTC 做日期运算，避免本地时区导致的偏移。
function computeReminders(startDateISO, items) {
  return items
    .map(function (it) {
      var d = new Date(startDateISO + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() - it.leadDays);
      return { item: it.item, leadDays: it.leadDays, deadline: d.toISOString().slice(0, 10) };
    })
    .sort(function (a, b) {
      return a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : 0;
    });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { computeReminders: computeReminders };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/reminders.test.js`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add travel-plan-viz/assets/reminders.js test/reminders.test.js
git commit -m "feat: reminders.js 截止日期计算"
```

---

### Task 2: reminders.js — 清单与徽标渲染

**Files:**
- Modify: `travel-plan-viz/assets/reminders.js`
- Test: `test/reminders.test.js`

- [ ] **Step 1: Write the failing test (append to existing test file)**

```js
const { renderChecklistHTML, reminderBadgeHTML } = require('../travel-plan-viz/assets/reminders.js');

test('renderChecklistHTML 输出含截止日期与事项的清单', () => {
  const html = renderChecklistHTML([
    { item: '机票', leadDays: 30, deadline: '2026-06-01' },
  ]);
  assert.ok(html.includes('<ul class="pretrip-todo">'));
  assert.ok(html.includes('2026-06-01前'));
  assert.ok(html.includes('机票'));
  assert.ok(html.includes('建议提前30天'));
  assert.ok(html.includes('type="checkbox"'));
});

test('reminderBadgeHTML 输出带提前天数的徽标', () => {
  const badge = reminderBadgeHTML(7);
  assert.ok(badge.includes('⚠️'));
  assert.ok(badge.includes('建议提前7天订'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/reminders.test.js`
Expected: FAIL — `renderChecklistHTML is not a function`

- [ ] **Step 3: Write minimal implementation (add functions + update exports)**

在 `computeReminders` 之后、`module.exports` 之前插入：

```js
function renderChecklistHTML(reminders) {
  var lis = reminders.map(function (r) {
    return '<li class="todo-item">'
      + '<input type="checkbox"> '
      + '<span class="todo-deadline">' + r.deadline + '前</span> '
      + '<span class="todo-text">' + r.item + '（建议提前' + r.leadDays + '天）</span>'
      + '</li>';
  }).join('');
  return '<ul class="pretrip-todo">' + lis + '</ul>';
}

function reminderBadgeHTML(leadDays) {
  return '<span class="reminder-badge">⚠️ 建议提前' + leadDays + '天订</span>';
}
```

把导出改为：

```js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    computeReminders: computeReminders,
    renderChecklistHTML: renderChecklistHTML,
    reminderBadgeHTML: reminderBadgeHTML,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/reminders.test.js`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add travel-plan-viz/assets/reminders.js test/reminders.test.js
git commit -m "feat: reminders.js 清单与徽标渲染"
```

---

### Task 3: map.js — 导航链接与路线坐标（纯函数）

**Files:**
- Create: `travel-plan-viz/assets/map.js`
- Test: `test/map.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/map.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { buildNavLink, routeCoordinates } = require('../travel-plan-viz/assets/map.js');

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/map.test.js`
Expected: FAIL — `Cannot find module '../travel-plan-viz/assets/map.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// travel-plan-viz/assets/map.js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/map.test.js`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add travel-plan-viz/assets/map.js test/map.test.js
git commit -m "feat: map.js 导航链接与路线坐标"
```

---

### Task 4: map.js — Leaflet 地图初始化（编号点 + 虚线路线 + 导航弹窗）

**Files:**
- Modify: `travel-plan-viz/assets/map.js`

无单元测试（依赖浏览器 DOM 与 Leaflet）；正确性由 Task 8 手动验证。

- [ ] **Step 1: 在 `routeCoordinates` 之后、`module.exports` 之前插入实现**

```js
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
```

把导出改为：

```js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildNavLink: buildNavLink,
    routeCoordinates: routeCoordinates,
    initTravelMap: initTravelMap,
  };
}
```

- [ ] **Step 2: 确认纯函数测试仍通过**

Run: `node --test test/map.test.js`
Expected: PASS (2 tests) —— 新增的 `initTravelMap` 引用 `L`，但仅在浏览器调用时执行，require 加载不报错。

- [ ] **Step 3: Commit**

```bash
git add travel-plan-viz/assets/map.js
git commit -m "feat: map.js Leaflet 地图初始化"
```

---

### Task 5: page-contract.md — 内容/数据契约

**Files:**
- Create: `travel-plan-viz/assets/page-contract.md`

- [ ] **Step 1: 写入完整契约文档**

```markdown
# 页面内容契约（给 frontend-design）

生成 HTML 时，frontend-design 负责布局与美学，但必须包含以下区块与数据结构，并接入 `map.js` / `reminders.js` 两个引擎脚本（用 `<script>` 内联到单文件 HTML）。

## 输入数据结构

```js
const trip = {
  title: "香港 4 天 3 晚",
  startDate: "2026-07-01",           // ISO，用于提醒日期计算
  colorScheme: "<每趟行程不同，由 frontend-design 决定>",
  flights: [ { label, code, time, booked: true/false } ],
  hotels:  [ { name, nights, booked: true/false } ],
  reminders: [ { item: "长白山门票", leadDays: 7 } ],  // 喂给 computeReminders
  days: [
    {
      date: "2026-07-01",
      meals: { food: "推荐的当地美食一句话" },
      slots: [   // 早/中/晚
        {
          period: "morning|noon|evening",
          name: "维多利亚港",
          time: "09:00",
          lat: 22.293, lng: 114.169,
          photo: "https://...缩略图URL",
          rating: 4.7,
          review: "一句话点评",
          needsBooking: false,        // true 则挂 reminderBadgeHTML
          leadDays: 0
        }
      ]
    }
  ]
};
```

## 必须包含的区块（顺序可由美学微调，内容不可缺）

1. **页顶**：行程标题 + 出发前待办清单。清单用 `reminders.js` 的 `computeReminders(trip.startDate, trip.reminders)` 再 `renderChecklistHTML(...)` 生成。
2. **航班/酒店高亮区**：突出展示；`booked: true` 的项加"已预订"标识。
3. **交互地图**：一个 `<div id="map">`，调用 `initTravelMap('map', points)`，其中 `points` 为所有 slot 按行程顺序汇总的 `{lat,lng,name,time}`。引入 Leaflet CSS/JS（CDN）。
4. **每日时间轴**：早/中/晚分段；每个 slot 卡片含 `photo`、`rating`、`review`；`needsBooking` 为 true 时插入 `reminderBadgeHTML(leadDays)`。
5. **每日当地美食**：展示 `days[].meals.food`。

## 硬性约束

- 单个 `.html` 文件，手机优先、可离线（图片为在线 URL，离线时可截图存档）。
- `map.js` 与 `reminders.js` 的内容必须内联进 HTML（不外链本地文件），保证单文件自包含。
- 每趟行程用不同配色以便区分。
```

- [ ] **Step 2: Commit**

```bash
git add travel-plan-viz/assets/page-contract.md
git commit -m "docs: page-contract 内容契约"
```

---

### Task 6: research-guide.md — 联网调研指南

**Files:**
- Create: `travel-plan-viz/references/research-guide.md`

- [ ] **Step 1: 写入完整指南**

```markdown
# 联网调研指南

生成页面前，用 WebSearch / WebFetch 补全数据。**不查实时票价/机票价格**（易过期出错）。

## 每个景点/酒店需采集

- 坐标（lat/lng）：搜索"<名称> 经纬度 / coordinates"，或从地图类结果取。
- 真实图片 URL：取可公开访问的缩略图链接（优先稳定 CDN）。
- 评分：来自点评类来源的概览分（注明是概览，非实时）。
- 一句话点评：综合调研后用一句中文概括亮点。

## 每日当地美食

- 搜索"<城市> 必吃 / 当地特色美食"，每天给 1 条具体推荐。

## 提前预订项与提前天数（喂给 reminders）

按经验 + 联网确认，标记需提前订的项目并给 `leadDays`：

| 类型 | 建议提前天数 | 说明 |
|------|------------|------|
| 机票（国内） | 30 | 越早越便宜 |
| 机票（国际） | 45 | 含签证缓冲请另列 |
| 跨城高铁 | 15 | 放票后尽早 |
| 热门景点/限流（如长白山、故宫） | 7 | 官方放票窗口 |
| 网红餐厅/演出 | 3 | 需预约 |
| 酒店（旺季） | 30 | 旺季房紧 |

- 实际数值应结合目的地与季节联网核实后微调，并在对话里向用户说明依据。
```

- [ ] **Step 2: Commit**

```bash
git add travel-plan-viz/references/research-guide.md
git commit -m "docs: research-guide 调研指南"
```

---

### Task 7: SKILL.md — 工作流编排

**Files:**
- Create: `travel-plan-viz/SKILL.md`

- [ ] **Step 1: 写入完整 SKILL.md（含 frontmatter）**

```markdown
---
name: travel-plan-viz
description: 把旅行行程做成美观、可离线、手机优先的单文件 HTML（交互地图+每日时间轴+出发前订票提醒）。两种用法——只给目的地和天数让它帮你规划，或丢一份现成计划让它直接出页面。触发：旅行计划可视化、做旅行攻略网页、行程 HTML、travel plan visualization。
---

# 旅行计划可视化

把一趟旅行变成单文件 HTML 页面：交互地图、每日时间轴、出发前订票提醒。机械逻辑用自带引擎（`assets/map.js`、`assets/reminders.js`），美学交给 frontend-design。

## 第一步：判断模式

- 用户**只给了目的地+天数**（如"香港 4 天 3 晚"）→ 模式 A（从零规划）。
- 用户**已提供行程**（文字或旧 HTML 文件）→ 模式 B（解析已有计划）。

## 模式 A：从零规划

1. 读 `references/research-guide.md`，联网调研目的地。
2. 在对话里用 markdown 提出详实逐日计划（早/中/晚、景点、交通、住宿）。
3. 与用户来回迭代，直到用户明确确认。
4. 进入"调研补全 + 生成"。

## 模式 B：已有计划

1. 解析用户给的行程（若是旧 HTML，从中提取结构化数据）。
2. 进入"调研补全 + 生成"。

## 调研补全 + 生成

1. 按 `references/research-guide.md` 联网补全：坐标、真实图片 URL、评分、一句话点评、每日美食、需提前订的项目及 `leadDays`。**不查实时票价。**
2. 组织成 `assets/page-contract.md` 里定义的 `trip` 数据结构。
3. 调用 **frontend-design** skill 生成风格化 HTML，严格遵守 `assets/page-contract.md` 的区块与约束：
   - 内联 `assets/map.js`、`assets/reminders.js` 内容到 HTML（保证单文件）。
   - 页顶清单用 `computeReminders` + `renderChecklistHTML`。
   - 地图用 `initTravelMap`，引入 Leaflet CDN 的 CSS/JS。
   - 时间轴上 `needsBooking` 项插入 `reminderBadgeHTML(leadDays)`。
   - 每趟行程用不同配色。
4. 保存为 `<行程名>-旅行计划.html` 到工作目录。
5. 告诉用户：之后可把该 HTML 文件丢回来，说"把第三天的 X 挪到第四天"，会在原结构上修改。

## 不做

实时票价/机票价格、代订票、多语言 UI、后端。全程静态单文件。
```

- [ ] **Step 2: 校验 frontmatter 合法**

Run: `head -5 travel-plan-viz/SKILL.md`
Expected: 看到 `---` / `name:` / `description:` / `---`。

- [ ] **Step 3: Commit**

```bash
git add travel-plan-viz/SKILL.md
git commit -m "feat: SKILL.md 工作流编排"
```

---

### Task 8: 端到端手动验证（样例行程）

**Files:**
- Create (临时产物，验证后可删): `samples/hongkong-4d3n.html`

- [ ] **Step 1: 跑全部单元测试**

Run: `node --test test/`
Expected: PASS（共 5 个测试：reminders 3 + map 2）

- [ ] **Step 2: 用样例行程驱动 skill 生成 HTML**

在一次会话中，把 skill 安装/链接到 `~/.claude/skills/travel-plan-viz`（或在本仓库内直接按 SKILL.md 流程执行），输入："香港 4 天 3 晚，出发日期 2026-07-01"，走完模式 A → 生成 `samples/hongkong-4d3n.html`。

- [ ] **Step 3: 浏览器打开核对清单**

Run: `open samples/hongkong-4d3n.html`
逐项确认：
- 地图渲染出编号标记（1,2,3…）与按序虚线路线。
- 点击标记弹出 名称+时间+可点的"导航"链接。
- 页顶出发前待办清单存在，且按截止日期升序（基于 2026-07-01 倒推）。
- 时间轴上需提前订的项挂 ⚠️ 徽标。
- 每天有当地美食推荐；航班/酒店高亮区存在。
- 页面为单文件、手机宽度下排版正常。

- [ ] **Step 4: 修正发现的问题后提交**

```bash
git add -A
git commit -m "test: 香港样例端到端验证"
```

---

## 自检（Self-Review）

- **Spec 覆盖**：两种入口→Task 7；混合架构（固定引擎）→Task 1-4；美学交给 frontend-design→Task 5/7；联网数据+不实时票价→Task 6；页面五区块→Task 5/7；提醒清单+徽标→Task 2/5；单文件离线手机优先→Task 5/7；测试→Task 1-3、8；YAGNI→Task 7。无遗漏。
- **占位符扫描**：除 `page-contract.md` 内 `colorScheme` 与 `samples/` 产物外，无 TBD/TODO；所有代码步骤含完整代码。
- **类型一致**：`computeReminders`/`renderChecklistHTML`/`reminderBadgeHTML`/`buildNavLink`/`routeCoordinates`/`initTravelMap` 命名在测试、实现、契约、SKILL.md 中保持一致；`trip`/`points`/`leadDays`/`needsBooking` 字段一致。
