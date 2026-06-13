# 页面内容契约（给设计步骤）

生成 HTML 时，**设计步骤**（frontend-design / huashu-design / 内置美学准则，见 SKILL.md）负责布局与美学，但必须包含以下区块与数据结构，并接入 `map.js` / `reminders.js` 两个引擎脚本（用 `<script>` 内联到单文件 HTML）。

## 输入数据结构

```js
const trip = {
  title: "香港 4 天 3 晚",
  startDate: "2026-07-15",           // ISO，用于提醒日期计算
  colorScheme: "<每趟行程不同，由设计步骤决定>",

  // 行前须知（按出发日期/季节定制）
  preTrip: {
    weather: {
      summary: "7 月平均 31°C / 26°C，午后 3–6 点常有短时强雷暴，上午与晚上多晴",
      typhoon: "7–9 月为台风季，出发前 3 天起关注香港天文台预警（8 号风球以上交通景点关闭）"
    },
    packing: "短袖短裤 + 轻薄防晒衣 + 防滑凉鞋 + 晴雨两用伞；室内空调极冷，务必带一件长袖外套",
    payment: "推荐电子八达通（Apple/华为钱包可加，内地卡可充值），另备 500–800 港币现金给传统茶餐厅/红色小巴",
    apps: ["MTR Mobile（港铁）", "香港天文台（天气）", "景点官方 App（如迪士尼查排队）"],
    ticketTip: "热门景点门票建议提前 3–7 天网上购买，避免现场排队"
  },

  // 航班：已预订高亮；未预订时给 3-5 个待选班次供自行核实
  flights: {
    booked: [ { label, code, time } ],
    candidates: [ { label, code, time, note } ]   // note 写机型/直飞或经停/大致价位区间
  },

  // 酒店：综合各景点位置，按"片区 + 价位"推荐
  hotelAreas: [
    {
      area: "尖沙咀",
      reason: "靠近星光大道、天星小轮，地铁交通便利",
      options: [
        { tier: "经济", name: "...", priceRange: "约 ¥500/晚", note: "..." },
        { tier: "中档", name: "...", priceRange: "约 ¥1000/晚", note: "..." },
        { tier: "高端", name: "...", priceRange: "约 ¥2000/晚", note: "..." }
      ]
    }
  ],

  disclaimer: "本页全部信息（天气、航班、酒店、餐厅、景点、门票、价格、营业时间、评分、活动等）均为 AI 基于公开资料整理的参考建议，可能不准确或已过时，不保证与实时情况一致；请务必在官方渠道 / 订票订房 / 地图等 App 上核实后再做决定或前往。",

  // 全程通用避坑贴士
  tips: [
    "户外活动尽量排在上午 9 点前与晚上 7 点后，下午雷暴时段安排室内（商场/博物馆/乐园）",
    "热门餐厅避开 12–13 点、18–20 点高峰；非高峰几乎不排队",
    "如遇台风预警（8 号风球以上），公共交通与景点会关闭，留酒店休息"
  ],

  reminders: [ { item: "迪士尼乐园门票", leadDays: 7 } ],  // 喂给 computeReminders

  days: [
    {
      date: "2026-07-15",
      weekday: "周二",
      theme: "港岛经典 · 都市印象",        // 当日主题（可选）
      tips: ["上午先排户外，午后转室内避雷暴"],   // 当日小贴士（可选）
      alternatives: [                          // 单日二选一（可选）
        { label: "方案A 香港迪士尼", summary: "暑期皮克斯限定，成人约 ¥580 起，港铁迪士尼线直达" },
        { label: "方案B 海洋公园",   summary: "水上乐园重开，联票约 ¥800，南港岛线海洋公园站直达" }
      ],
      slots: [   // 早/中/晚
        {
          period: "morning|noon|evening",
          name: "维多利亚港",
          time: "09:00–12:00",            // 可为单点或时间段
          lat: 22.293, lng: 114.169,
          photo: "https://...缩略图URL",
          rating: 4.7,
          review: "一句话点评",
          openingHours: "全天开放",        // 可选
          closedDays: "周一休",            // 可选，无则省略
          ticketPrice: "免费 / 缆车套票约 ¥88",  // 可选，参考价（非实时）
          transport: { mode: "天星小轮", fare: "约 ¥3", duration: "约 10 分钟" }, // 可选：如何到达本点
          seasonal: "暑期限定灯光秀（6/12–8/31）",  // 可选：时令活动
          needsBooking: false,
          leadDays: 0
        }
      ],
      dining: [   // 当日餐饮（替代旧的 meals.food）；每餐可带必点菜 + 参考价
        {
          meal: "午餐",
          place: "九记牛腩",
          hours: "12:30–22:30，周日休",
          dishes: [ { name: "清汤牛腩面", price: "¥68" }, { name: "咖喱牛腩面", price: "¥72" } ]
        }
      ]
    }
  ]
};
```

## 必须包含的区块（顺序可由美学微调，内容不可缺）

1. **页顶**：行程标题 + 出发前待办清单。清单用 `reminders.js` 的 `computeReminders(trip.startDate, trip.reminders)` 再 `renderChecklistHTML(...)` 生成。
2. **行前须知区块**：展示 `preTrip` 全部——天气与台风提醒、穿搭、支付、必备 App、购票时机。突出"日期/季节定制"。
3. **航班区**：`flights.booked` 高亮标"已预订"；`flights.candidates` 列表展示 3-5 个待选班次，每项标"待选 · 请自行核实预订"并显示 `note`。
4. **酒店区（片区 + 价位）**：遍历 `hotelAreas`，每片区显示 `area` + `reason`，其下按 `经济/中档/高端` 列出 `options`（名称 + `priceRange` + `note`）。
5. **免责声明**：在航班/酒店区域附近显著展示 `trip.disclaimer` 全文。
6. **交互地图**：`<div id="map">`，调用 `initTravelMap('map', points)`，`points` 为所有 slot 按行程顺序汇总的 `{lat,lng,name,time}`。引入 Leaflet CSS/JS（CDN）。
7. **每日时间轴**：按天分组，显示当日 `weekday`/`theme`；早/中/晚分段，每个 slot 卡片含 `photo`、`rating`、`review`，并展示存在的可选字段（`openingHours`、`closedDays`、`ticketPrice`、`transport` 的方式/票价/耗时、`seasonal`）；`needsBooking` 为 true 时插入 `reminderBadgeHTML(leadDays)`。当日若有 `tips`、`alternatives`（二选一卡片）也要展示。
8. **每日餐饮**：展示当日 `dining`，每餐含 `place`、`hours` 与必点菜（`dishes` 的名称 + `price`）。
9. **全程实用贴士**：展示 `trip.tips` 列表。

## 硬性约束

- 单个 `.html` 文件，手机优先、可离线（图片为在线 URL，离线时可截图存档）。
- `map.js` 与 `reminders.js` 的内容必须内联进 HTML（不外链本地文件），保证单文件自包含。
- 每趟行程用不同配色以便区分。
- 图片**严禁变形**：图片容器固定尺寸/比例，`<img>` 用 `object-fit: cover` + `display:block`（推荐绝对定位 `inset:0` 填满容器），只裁切不拉伸。
- 所有联网信息（**含天气、餐厅、景点、评分**，不止航班/酒店）尽量基于公开资料给真实可信信息，但全部为**参考**、可能不准或过时，**必须**展示覆盖全部信息的免责声明（第 5 区块）引导用户核实。
- 排程应体现**天气/季节逻辑**：把户外项目放在凉爽时段（上午、傍晚），午后高温/雷暴时段安排室内（仅在该目的地确有此类天气特征时）。
- `escapeHTML` 函数在 `map.js` 与 `reminders.js` 中各自定义一份，属故意重复——两个文件须各自独立（Node require 与浏览器内联均不依赖另一方），维护时请勿合并去重。
