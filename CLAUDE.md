# CLAUDE.md

给在本仓库**开发/维护这个 skill** 的 AI。终端用户怎么用 skill 见 `README.md`，skill 运行逻辑见 `travel-plan-viz/SKILL.md`。

## 这是什么

`travel-plan-viz` —— 一个 Claude Code Skill，把旅行行程生成为单文件、可离线、手机优先的 HTML（交互地图 + 每日时间轴 + 出发前提醒 + 行前须知 + 待选航班 + 片区价位酒店）。

## 架构红线

- **混合架构**：易错的机械逻辑固化为可复用 JS 引擎，视觉表现每次交给 `frontend-design` skill 重新生成。改动时别把布局/配色写死进引擎，也别把日期/导航逻辑塞给 frontend-design 临场生成。
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

- 本地通过软链接安装：`ln -sfn "$(pwd)/travel-plan-viz" ~/.claude/skills/travel-plan-viz`
- 远程：GitHub 私有仓库 `zexuanw958-svg/travel-plan-viz`
- `git push` 若报 `HTTP2 framing layer` 错，用 `git -c http.version=HTTP/1.1 push` 绕过。

## 文档分层

- `README.md` —— 给终端用户/外部读者（中英双语，中文首页）
- `CLAUDE.md`（本文件）—— 给开发本仓库的 AI
- `docs/superpowers/specs|plans/` —— 设计文档与实现计划（含"实现后演进"记录）
