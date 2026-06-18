# CLAUDE.md

给在本仓库**开发/维护这个 skill** 的 AI。终端用户怎么用 skill 见 `README.md`，skill 运行逻辑见 `travel-plan-viz/SKILL.md`。

## 这是什么

`travel-plan-viz` —— 一个 Claude Code / Codex 通用 Skill（也可适配其他 Agent），把旅行行程生成为单文件、可离线、手机优先的 HTML（交互地图 + 每日时间轴 + 出发前提醒 + 行前须知 + 待选航班 + 片区价位酒店）。

> **命名分层（别去"统一"）**：README 门面品牌名是 **Migo · 旅行领航**（Migo = 候鸟领航员吉祥物），但技术 id、SKILL.md `name`、触发词、GitHub 仓库名一律保持 `travel-plan-viz` 不变——这是有意的分层设计（门面品牌与技术标识各司其职，保持安装路径与触发词稳定）。README 与 SKILL.md 名称"不一致"属正常，请勿为对齐而改动触发词或仓库名。

## 架构红线

- **混合架构**：易错的机械逻辑固化为可复用 JS 引擎，视觉表现每次交给**设计步骤**重新生成。改动时别把布局/配色写死进引擎，也别把日期/导航逻辑塞给设计步骤临场生成。
- **设计步骤可插拔（无硬依赖）**：优先用 `frontend-design` 或 `huashu-design` skill（任一已安装），都没有则走 `references/design-guidelines.md` 内置准则。这样 skill 可独立分享，不强制别人先装别的 skill。别把它改回硬依赖某个外部 skill。
- **引擎双端可用**：`assets/map.js`、`assets/reminders.js` 同时跑在浏览器和 Node，靠文件底部的 `if (typeof module !== 'undefined' && module.exports)` 守卫导出。改这两个文件别破坏这个守卫。
- **`escapeHTML` 在 map.js 与 reminders.js 各有一份，是故意重复**——两文件须各自独立，别合并去重。
- **内容契约是权威**：`assets/page-contract.md` 定义 `trip` 数据结构和必须包含的区块。改了引擎导出的函数名/数据字段，必须同步这份契约和 `SKILL.md`。

## 测试

```bash
node --test test/*.test.js          # 注意是 glob，不是 `node --test test/`（后者在本机 Node 会报模块找不到）
```
只覆盖纯函数（提醒日期计算、导航链接、路线坐标）；地图初始化与 HTML 生成靠 `samples/` 手动验证。

## 数据采集约束（写在 references/research-guide.md，改动要同步）

- **不查实时票价/机票价**（易过期）。机票/门票只给参考区间。
- **图片必须能加载**：用 `https://commons.wikimedia.org/wiki/Special:FilePath/<URL编码文件名>?width=N`（不要手拼 `upload.wikimedia.org/.../thumb/...` 哈希直链），且每个 URL 要 `curl` 校验返回 200 才用；图片 CSS 用 `object-fit: cover` 防变形。
- **全覆盖免责声明**：所有联网信息（含天气、餐厅、评分）都标注为 AI 整理、可能过时、需自行核实。

## 部署与仓库

- **跨 Agent 安装**（软链接）：Claude Code → `~/.claude/skills/`；OpenAI Codex → `~/.codex/skills/`。
- 平台无关：核心是指令 + 纯 JS 引擎，无厂商专有依赖。其他 Agent 的适配方法与通用提示词见 `references/porting-to-other-agents.md`；改动 skill 时别引入某个 Agent 的专有工具名（如直接写 `WebSearch`），用「联网搜索工具」这类通用说法。
- 远程：GitHub 公开仓库 `zexuanw958-svg/travel-plan-viz`（MIT，见 `LICENSE`）
- `git push` 若报 `HTTP2 framing layer` / SSL 瞬时错，用 `git -c http.version=HTTP/1.1 push` 并重试几次。

## 文档分层

- `README.md` —— 给终端用户/外部读者（中英双语，中文首页）
- `CLAUDE.md`（本文件）—— 给开发本仓库的 AI
- `docs/superpowers/specs|plans/` —— 设计文档与实现计划（含"实现后演进"记录）
