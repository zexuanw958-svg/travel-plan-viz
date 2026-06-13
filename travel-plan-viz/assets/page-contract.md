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
