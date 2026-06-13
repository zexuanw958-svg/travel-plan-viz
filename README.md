<div align="center">

# 🗺️ travel-plan-viz · 旅行计划可视化

**把一趟旅行变成一个美观、可离线、手机优先的单文件 HTML 页面**

交互地图 · 每日时间轴 · 出发前订票提醒 · 行前须知 · 待选航班 · 片区价位酒店

一个 [Claude Code](https://claude.com/claude-code) / Codex 通用 Skill（也可适配其他 Agent）

<sub><a href="#-中文">中文</a> · <a href="#-english">English</a></sub>

</div>

---

## 🌏 中文

### 这是什么

`travel-plan-viz` 是一个 Claude Code / Codex 通用 Skill（也可适配其他 Agent）。你只要说一句"帮我做香港 4 天 3 晚的旅行计划"，它就会**联网调研、排好行程、生成一个精美的单文件 HTML 网页**——手机上随时打开、离线可看、整页可截图存相册。

灵感来自社区的 "vibe coding 旅游攻略" 玩法，升级为一个正式、可复用、把易错逻辑固化下来的 Skill。

### ✨ 特点

| | 功能 |
|---|---|
| 🧭 | **两种入口**：只给目的地+天数让它帮你规划；或丢一份现成计划让它直接出页面 |
| 🗺️ | **交互地图**：Leaflet + 免费地图（无需 API key），编号景点 + 按序虚线路线 + 一键跳手机导航 |
| 📅 | **每日时间轴**：早/中/晚分段，每个景点带真实照片、评分、一句话点评 |
| ⏰ | **出发前提醒**：根据出发日期倒推"几号前订什么"，页顶待办清单 + 时间轴 ⚠️ 徽标 |
| 🌦️ | **行前须知**：按出发季节定制的天气/穿搭/台风提醒、支付方式、必备 App、购票时机 |
| ✈️ | **待选航班**：未预订时给 3–5 个真实候选班次，订不上有备选 |
| 🏨 | **片区价位酒店**：综合各景点位置推荐住宿片区，每片区给经济/中档/高端选项 |
| 🍜 | **每日美食**：每餐推荐 + 必点菜及参考价 |
| 📄 | **单文件离线 + 响应式**：一个 `.html`，手机/桌面自适应布局（手机单列、桌面多列加宽），图片在线加载、无网可截图 |
| 💡 | **不止转网页，还给建议**：把现成计划丢进来，会顺手对照"完善行程"标准提几条可选优化（克制、不硬来）——这是 Agent 区别于"纯提示词转 HTML"的地方 |
| ⚠️ | **全覆盖免责声明**：明确所有信息为 AI 整理、可能过时，引导到官方 App 核实 |

### 🏗️ 工作原理

混合架构——**易错的机械逻辑固化为可复用引擎，视觉表现每次交给"设计步骤"重新生成**：

- `assets/map.js`：Leaflet 地图引擎（编号标记、路线、导航深链）
- `assets/reminders.js`：提醒引擎（截止日期计算、清单/徽标渲染）
- `assets/page-contract.md`：内容契约，告诉设计步骤每个区块要哪些数据
- `references/research-guide.md`：联网调研指南（坐标/图片/营业时间/天气/交通…，含图片必须校验可加载、票价不查实时）
- `references/design-guidelines.md`：内置美学准则（无外部设计 skill 时的兜底）

> **设计步骤可插拔、无硬依赖**：如果你装了 `frontend-design` 或 `huashu-design`（花叔Design）这类设计 skill，会自动调用、效果更佳；都没装也能用内置美学准则出一份像样的页面。所以本 skill 可独立安装，不强制先装别的。

### 🚀 安装（跨 Agent）

把 skill 链接到对应 Agent 的 skills 目录：

```bash
# Claude Code
ln -sfn "$(pwd)/travel-plan-viz" ~/.claude/skills/travel-plan-viz
# OpenAI Codex
ln -sfn "$(pwd)/travel-plan-viz" ~/.codex/skills/travel-plan-viz
```

**用其他 Agent？** 本 skill 平台无关——核心是一份指令 + 两个纯 JS 引擎。没有 skills 机制的 Agent，把 `travel-plan-viz/SKILL.md` 当作指令喂给它即可。完整适配方法与「通用适配提示词」见 [`travel-plan-viz/references/porting-to-other-agents.md`](travel-plan-viz/references/porting-to-other-agents.md)。

### 💬 用法

在 Claude Code / Codex 里直接说：

```
帮我做香港 4 天 3 晚的旅行计划          # 模式 A：从零规划
```
```
这是我的行程<贴上文字/HTML>，帮我做成网页   # 模式 B：已有计划
```

生成后，把 HTML 文件丢回给 Claude 还能继续改，例如："第三天太赶，把 X 挪到第四天"。

### 🖼️ 样例

`samples/` 目录下有现成产物，浏览器直接打开：

- `hongkong-4d3n-real.html` —— 香港 4 天 3 晚（真实联网数据）
- `shenzhen-3d2n-real.html` —— 深圳 3 天 2 晚（只给天数，从零生成）
- `tokyo-5d4n-real.html` —— 东京 5 天 4 晚（模式 B：粗略计划 + Agent 建议后生成）

### 📁 项目结构

```
travel-plan-viz/
  SKILL.md              # 工作流编排：判断模式 → 调研 → 生成
  assets/
    map.js              # Leaflet 地图引擎（已单测）
    reminders.js        # 提醒引擎（已单测）
    page-contract.md    # 给设计步骤的内容契约
  references/
    research-guide.md   # 联网调研指南
    design-guidelines.md # 内置美学准则（无外部设计 skill 时兜底）
    porting-to-other-agents.md # 跨 Agent 适配指南 + 通用提示词
samples/                # 生成的示例页面
test/                   # 引擎单元测试（node --test）
docs/superpowers/       # 设计文档与实现计划
```

### 🧪 测试

```bash
node --test test/*.test.js
```

### ⚠️ 免责声明

页面中所有信息（天气、航班、酒店、餐厅、门票、价格、营业时间、评分、活动等）均为 AI 基于公开资料整理的**参考建议**，可能不准确或已过时，**请务必在官方渠道核实后再预订或前往**。

---

## 🌐 English

### What is this

`travel-plan-viz` is a [Claude Code](https://claude.com/claude-code) / Codex Skill (and portable to other agents). Just say *"plan me a 4-day Hong Kong trip"* and it will **research online, build the itinerary, and generate a polished single-file HTML page** — mobile-first, openable offline, screenshot-friendly.

Inspired by the community "vibe-coding travel guide" trick, turned into a proper, reusable Skill that hard-codes the error-prone bits.

### ✨ Features

| | Feature |
|---|---|
| 🧭 | **Two modes**: give only a destination + days and let it plan; or hand it an existing plan and it just renders the page |
| 🗺️ | **Interactive map**: Leaflet + free tiles (no API key), numbered stops + ordered dashed route + tap-to-navigate deep links |
| 📅 | **Daily timeline**: morning/noon/evening, each stop with a real photo, rating, and one-line review |
| ⏰ | **Pre-trip reminders**: deadlines back-calculated from the departure date — a top checklist + ⚠️ badges on the timeline |
| 🌦️ | **Pre-trip essentials**: season-aware weather/packing/typhoon notes, payment, must-have apps, ticket timing |
| ✈️ | **Candidate flights**: 3–5 real options when nothing is booked, so there's a fallback |
| 🏨 | **Hotels by area & price**: recommends staying areas based on the itinerary, with budget/mid/premium options |
| 🍜 | **Daily food**: per-meal picks with signature dishes and reference prices |
| 📄 | **Single offline file, responsive**: one `.html`, adapts to phone & desktop (single column on mobile, multi-column on desktop); images load online, screenshot it for offline |
| 💡 | **Not just conversion — advice too**: hand it an existing plan and it offers a few optional improvements against a "complete-itinerary" checklist (restrained, never pushy) — the agent's edge over a plain prompt-to-HTML trick |
| ⚠️ | **Full disclaimer**: states all info is AI-compiled and may be outdated; points users to official apps |

### 🏗️ How it works

A hybrid architecture — **error-prone mechanics are baked into reusable engines, while the visual design is regenerated each time by a "design step"**:

- `assets/map.js` — Leaflet engine (numbered markers, route, navigation deep links)
- `assets/reminders.js` — reminder engine (deadline math, checklist/badge rendering)
- `assets/page-contract.md` — content contract telling the design step what each block needs
- `references/research-guide.md` — web-research guide (coords/photos/hours/weather/transport…, images must be verified loadable, no realtime pricing)
- `references/design-guidelines.md` — built-in aesthetic guidelines (fallback when no external design skill is present)

> **The design step is pluggable, with no hard dependency**: if you have a design skill like `frontend-design` or `huashu-design`, it's used automatically for better results; without any, the built-in guidelines still produce a presentable page. So this skill installs standalone — no need to install anything else first.

### 🚀 Install (cross-agent)

Link the skill into your agent's skills directory:

```bash
# Claude Code
ln -sfn "$(pwd)/travel-plan-viz" ~/.claude/skills/travel-plan-viz
# OpenAI Codex
ln -sfn "$(pwd)/travel-plan-viz" ~/.codex/skills/travel-plan-viz
```

**Using another agent?** This skill is platform-agnostic — it's just an instruction file plus two vanilla-JS engines. For agents without a skills mechanism, feed `travel-plan-viz/SKILL.md` as instructions. Full porting steps and a ready-to-paste adaptation prompt: [`travel-plan-viz/references/porting-to-other-agents.md`](travel-plan-viz/references/porting-to-other-agents.md).

### 💬 Usage

In Claude Code or Codex, just say:

```
Plan me a 4-day, 3-night trip to Hong Kong       # Mode A: plan from scratch
```
```
Here is my itinerary <paste text/HTML>, make a page   # Mode B: existing plan
```

After it's generated, hand the HTML back to Claude to keep editing, e.g. *"Day 3 is too packed, move X to Day 4."*

### 🖼️ Samples

Ready-made outputs in `samples/`, open them in a browser:

- `hongkong-4d3n-real.html` — Hong Kong, 4D3N (real researched data)
- `shenzhen-3d2n-real.html` — Shenzhen, 3D2N (generated from days only)
- `tokyo-5d4n-real.html` — Tokyo, 5D4N (Mode B: rough plan + agent suggestions)

### 📁 Structure

```
travel-plan-viz/
  SKILL.md              # workflow: detect mode → research → generate
  assets/
    map.js              # Leaflet engine (unit-tested)
    reminders.js        # reminder engine (unit-tested)
    page-contract.md    # content contract for the design step
  references/
    research-guide.md   # web-research guide
    design-guidelines.md # built-in aesthetics (fallback w/o external design skill)
    porting-to-other-agents.md # cross-agent porting guide + adaptation prompt
samples/                # generated example pages
test/                   # engine unit tests (node --test)
docs/superpowers/       # design specs & implementation plans
```

### 🧪 Tests

```bash
node --test test/*.test.js
```

### ⚠️ Disclaimer

All information on the page (weather, flights, hotels, restaurants, tickets, prices, opening hours, ratings, events, etc.) is AI-compiled from public sources, **for reference only** — it may be inaccurate or outdated. **Always verify on official channels before booking or going.**
