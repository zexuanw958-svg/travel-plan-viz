# 跨 Agent 适配指南

本 skill 设计为**平台无关**：核心是一份指令文档（SKILL.md）+ 三个纯 JavaScript 引擎（map/reminders 浏览器/Node 双用，validate 为生成后校验）+ 几份参考文档。没有绑定任何单一厂商的专有能力。

## 它需要宿主 Agent 提供什么能力

| 能力 | 用途 | 没有怎么办 |
|------|------|-----------|
| 联网搜索 / 网页抓取 | 调研坐标、图片、天气、营业时间等 | 退化为模型已知信息（要标注可能过时） |
| 写文件 | 输出 `.html` | 直接把 HTML 文本返回给用户 |
| 读本仓库文件 | 读 assets/ 引擎与契约 | 把引擎内容粘进 prompt |
| 跑浏览器/打开文件（可选） | 验证页面效果 | 让用户自己打开 |
| 调用设计类 skill（可选） | 更好的美学 | 用 `design-guidelines.md` 内置准则 |
| 调用第三方旅行 skill（可选，飞猪/高德/腾讯地图/滴滴等） | 实时航班/酒店/路线规划/天气/坐标 + 官方行动链接 | 走静态联网调研，照常出完整页面 |

## 三种宿主，三种装法

**1. Claude Code** —— 放进 skills 目录：
```bash
ln -sfn "<repo>/travel-plan-viz" ~/.claude/skills/travel-plan-viz
```

**2. OpenAI Codex** —— 同样有 skills 目录：
```bash
ln -sfn "<repo>/travel-plan-viz" ~/.codex/skills/travel-plan-viz
```
（若两端共用一份源，可只放一处真目录、另一处软链过去。）

**3. 其他 Agent（无 skills 机制）** —— 把 `SKILL.md` 的内容作为系统/任务指令喂给它，并保证它能读到 `assets/`、`references/` 下的文件（或一并粘贴）。可直接用下面的「通用适配提示词」。

## 通用适配提示词（粘给任意 Agent）

```
你将扮演一个「旅行计划可视化」工具。请先阅读我提供的这套文件并严格遵循：
- SKILL.md：工作流（判断模式 → 联网调研 → 用设计步骤生成单文件 HTML）
- assets/page-contract.md：输出 HTML 必须包含的区块与 trip 数据结构
- assets/map.js、assets/reminders.js：必须原样内联进输出 HTML 的引擎（地图、提醒）；完整 trip 对象以 <script id="trip-data" type="application/json"> 内嵌
- assets/validate.js：生成后的机械校验（能跑 Node 就执行，否则人工对照契约）
- references/research-guide.md：联网调研规范（图片用 Special:FilePath 且校验 200；不查实时票价；全覆盖免责声明）
- references/design-guidelines.md：没有专业设计 skill 时的内置美学准则

请用你自身的联网搜索、文件写入能力执行。若你没有某项能力（如不能联网），就用已知信息但在页面免责声明里说明，绝不编造可验证的事实（如不可加载的图片链接）。
开始前先用一句话复述你将如何执行，确认理解无误。
```

## 适配时最容易翻车的点

- **图片**：必须用 `https://commons.wikimedia.org/wiki/Special:FilePath/<文件名>?width=N` 并校验返回 200，别让模型手拼哈希直链。
- **单文件自包含**：`map.js`/`reminders.js` 内容要内联进 HTML，不要外链本地文件。
- **免责声明**：覆盖全部联网信息（天气/餐厅/评分…），不只是机票酒店。
- **不查实时价**：机票/门票只给参考区间。
- **坐标系**：高德/腾讯类工具返回的 GCJ-02 坐标须先经 `map.js` 的 `gcj02ToWgs84` 转成 WGS-84 再入 `trip`，否则 OSM 地图上偏移几百米。
- **生成后校验**：宿主能跑 Node 就执行 `node assets/validate.js <生成的.html>`（校验字段/坐标/必需区块），有 ERROR 修复重跑；不能跑 Node 就人工对照 page-contract 检查。
