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

1. 按 `references/research-guide.md` 联网补全：坐标、真实图片 URL、评分、一句话点评、每日美食、需提前订的项目及 `leadDays`；航班给 3-5 个**待选班次**、酒店按**片区+价位**推荐、并准备**免责声明**。**不查实时票价。**
2. 组织成 `assets/page-contract.md` 里定义的 `trip` 数据结构。
3. 调用 **frontend-design** skill 生成风格化 HTML，严格遵守 `assets/page-contract.md` 的区块与约束：
   - 内联 `assets/map.js`、`assets/reminders.js` 内容到 HTML（保证单文件）。
   - 页顶清单用 `computeReminders` + `renderChecklistHTML`。
   - 航班区展示待选班次（已预订的高亮），酒店区按片区+价位展示，附近显著展示免责声明。
   - 地图用 `initTravelMap`，引入 Leaflet CDN 的 CSS/JS。
   - 时间轴上 `needsBooking` 项插入 `reminderBadgeHTML(leadDays)`。
   - 每趟行程用不同配色。
4. 保存为 `<行程名>-旅行计划.html` 到工作目录。
5. 告诉用户：之后可把该 HTML 文件丢回来，说"把第三天的 X 挪到第四天"，会在原结构上修改。

## 不做

实时票价/机票价格、代订票、多语言 UI、后端。全程静态单文件。
