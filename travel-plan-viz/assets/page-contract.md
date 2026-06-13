# 页面内容契约（给 frontend-design）

生成 HTML 时，frontend-design 负责布局与美学，但必须包含以下区块与数据结构，并接入 `map.js` / `reminders.js` 两个引擎脚本（用 `<script>` 内联到单文件 HTML）。

## 输入数据结构

```js
const trip = {
  title: "香港 4 天 3 晚",
  startDate: "2026-07-01",           // ISO，用于提醒日期计算
  colorScheme: "<每趟行程不同，由 frontend-design 决定>",
  // 航班：已预订的高亮；未预订时给 3-5 个待选班次供用户自行核实预订
  flights: {
    booked: [ { label, code, time } ],            // 已确认的，标"已预订"；可为空
    candidates: [ { label, code, time, note } ]   // 未定时给 3-5 个待选；note 写机型/经停/大致价位区间等
  },
  // 酒店：综合各景点位置，按"片区 + 价位"推荐（不直接指定单一酒店）
  hotelAreas: [
    {
      area: "尖沙咀",
      reason: "靠近星光大道、天星小轮，地铁交通便利",
      options: [
        { tier: "经济", name: "...", priceRange: "约 ¥500/晚", note: "一句话说明" },
        { tier: "中档", name: "...", priceRange: "约 ¥1000/晚", note: "..." },
        { tier: "高端", name: "...", priceRange: "约 ¥2000/晚", note: "..." }
      ]
    }
  ],
  // 免责声明：机票/酒店为建议，可能与实时有出入，提示用户去 App 核实
  disclaimer: "航班与酒店为基于公开资料的建议，可能与实时班次/房价/房态有出入，请务必在订票/订房 App 上核实后再预订。",
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
2. **航班区**：`flights.booked` 的项高亮并标"已预订"；`flights.candidates` 以列表展示 3-5 个待选班次，每项标注"待选 · 请自行核实预订"并显示 `note`。两者至少展示一种（通常未预订时只有 candidates）。
3. **酒店区（按片区 + 价位推荐）**：遍历 `hotelAreas`，每个片区显示 `area` + 推荐理由 `reason`，其下按 `经济/中档/高端` 列出 `options`（名称 + `priceRange` + `note`）。
4. **免责声明**：在航班/酒店区域附近显著展示 `trip.disclaimer` 全文。
5. **交互地图**：一个 `<div id="map">`，调用 `initTravelMap('map', points)`，其中 `points` 为所有 slot 按行程顺序汇总的 `{lat,lng,name,time}`。引入 Leaflet CSS/JS（CDN）。
6. **每日时间轴**：早/中/晚分段；每个 slot 卡片含 `photo`、`rating`、`review`；`needsBooking` 为 true 时插入 `reminderBadgeHTML(leadDays)`。
7. **每日当地美食**：展示 `days[].meals.food`。

## 硬性约束

- 单个 `.html` 文件，手机优先、可离线（图片为在线 URL，离线时可截图存档）。
- `map.js` 与 `reminders.js` 的内容必须内联进 HTML（不外链本地文件），保证单文件自包含。
- 每趟行程用不同配色以便区分。
- 航班/酒店尽量基于公开资料给真实可信的建议，但**必须**同时展示免责声明（第 4 区块），引导用户到 App 核实。
- `escapeHTML` 函数在 `map.js` 与 `reminders.js` 中各自定义一份，属故意重复——两个文件须各自独立（Node require 与浏览器内联均不依赖另一方），维护时请勿合并去重。
