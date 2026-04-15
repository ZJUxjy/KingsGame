# Figma MCP 集成方案 — KingsGame UI 优化调研

> 调研日期：2026-04-15

## 一、项目现状

KingsGame 是一个 **React 19 + Zustand + Tailwind CSS v4 + Vite 6** 的数字卡牌游戏（帝王牌），采用 pnpm monorepo 结构。

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | ^19.0.0 | UI 框架 |
| Zustand | ^5.0.0 | 状态管理 |
| Tailwind CSS | v4 | 样式（CSS-first 配置，无组件库） |
| Vite | ^6.0.0 | 构建工具 |
| Socket.IO | ^4.8.0 | 实时通信 |
| TypeScript | ^5.5.0 | 类型系统 |

### 现有 UI 组件（12 个，全部手写）

| 组件 | 文件 | 说明 |
|------|------|------|
| `GameBoard` | `components/board/GameBoard.tsx` | 主棋盘编排器 |
| `HeroPanel` | `components/board/HeroPanel.tsx` | 英雄头像、血条、护甲、技能按钮 |
| `EnergyBar` | `components/board/EnergyBar.tsx` | 菱形能量水晶显示 |
| `MinisterPanel` | `components/board/MinisterPanel.tsx` | 大臣信息 + 技能按钮 |
| `GeneralSkillsPanel` | `components/board/GeneralSkillsPanel.tsx` | 武将技能面板 |
| `Battlefield` | `components/board/Battlefield.tsx` | 战场随从渲染 |
| `HandZone` | `components/board/HandZone.tsx` | 扇形手牌布局（拖拽出牌） |
| `CardComponent` | `components/board/CardComponent.tsx` | 单张卡牌（费用、名称、关键词、攻防、稀有度边框） |
| `TurnIndicator` | `components/board/TurnIndicator.tsx` | 回合数 + 结束回合按钮 |
| `TargetingArrow` | `components/board/TargetingArrow.tsx` | SVG 贝塞尔曲线攻击箭头 |
| `GameOverlay` | `components/board/GameOverlay.tsx` | 全屏回合过渡遮罩 |
| `Toast` | `components/board/Toast.tsx` | 滑入式错误提示 |

### 配色方案（暗色主题 + 帝王金）

| 用途 | Tailwind 色值 |
|------|---------------|
| 背景 | `gray-900` / `gray-950` / `gray-800` |
| 帝王金（强调） | `yellow-400` / `yellow-500` / `yellow-600` |
| 能量/费用 | `blue-400` / `blue-500` / `blue-600` |
| 伤害/血量 | `red-400` / `red-600` / `red-700` |
| 治疗/可操作 | `green-400` / `green-600` |
| 大臣 | `amber-300` / `amber-500` / `amber-700` |
| 史诗稀有度 | `purple-500` |
| 稀有度边框 | 灰(common) / 蓝(rare) / 紫(epic) / 黄(legendary) |

---

## 二、什么是 Figma MCP

Figma MCP（Model Context Protocol）服务器是 Figma 官方提供的工具，允许 AI 代理（如 Claude Code）直接读取 Figma 设计文件的结构、样式、变量等上下文信息，用于生成与设计稿一致的代码。

### 核心能力

1. **从设计稿生成代码** — 选择 Figma 中的 Frame，转为 React/Vue/HTML 代码
2. **提取设计上下文** — 获取变量、组件定义、布局数据
3. **代码转设计（Code to Canvas）** — 将运行中的 UI 捕获为 Figma 图层
4. **直接写入 Figma 画布** — AI 代理可直接在 Figma 中创建/修改内容
5. **Code Connect** — 保持 Figma 组件与代码组件的映射关系

### 支持的编辑器

Claude Code、Claude Desktop、VS Code、Cursor、Codex by OpenAI、Warp 等均支持。

---

## 三、安装配置

### 方式 A：Figma 插件安装（推荐）

```bash
# 1. 安装 Figma 插件
claude plugin install figma@claude-plugins-official

# 2. 重启 Claude Code

# 3. 运行 /plugin 进入 Installed 标签页
# 4. 选中 figma 并按 Enter 完成授权认证
# 5. 在浏览器中点击 "Allow access" 授权
```

### 方式 B：手动配置 Remote MCP

在 `~/.claude/settings.json` 中添加：

```json
{
  "mcpServers": {
    "figma": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp"
    }
  }
}
```

### 方式 C：桌面版 MCP（备选）

通过 Figma 桌面应用的 Dev Mode 启用：
1. 安装并打开 Figma 桌面应用
2. 打开一个 Figma Design 文件
3. 切换到 Dev Mode
4. 在 Preferences 中启用 "Enable Dev Mode MCP Server"

> 注意：桌面版需要 Dev 或 Full seat，功能不如 Remote 版完整。

---

## 四、工作流程

### 流程 A：Figma 设计稿 -> 生成/优化代码

```
1. 在 Figma 中选择目标 Frame（如 CardComponent）
2. 右键 -> Copy link to selection
3. 在 Claude Code 中粘贴链接 + 提示词
```

示例提示词：

```
根据这个 Figma 设计 [链接]，重构 CardComponent 组件，
使用项目现有的 Tailwind CSS 配色和 React 19 + Zustand 架构
```

**适用场景**：
- 重构现有组件样式（如卡牌稀有度边框效果）
- 新增 UI 组件（如战斗日志面板、技能选择弹窗）
- 统一设计语言（间距、字体、圆角等）

### 流程 B：代码 -> Figma（反向生成设计稿）

```
在 Claude Code 中提示：
"启动本地开发服务器，将当前 UI 捕获到 Figma 新文件中"
```

**适用场景**：
- 将当前运行的 UI 导出为 Figma 图层
- 方便设计师在 Figma 中进一步调整

### 流程 C：提取设计上下文

```
"获取这个 Figma 文件 [链接] 的变量和组件定义，
 映射到我们项目的 Tailwind CSS 配置中"
```

**适用场景**：
- 同步 Figma Design Tokens 与 Tailwind 主题
- 保持开发与设计一致

---

## 五、推荐的 KingsGame 设计优化路径

| 阶段 | 任务 | 说明 |
|------|------|------|
| **1. 建立设计系统** | 在 Figma 中创建组件库和 Design Tokens | 卡牌模板、按钮样式、面板框架、色彩变量 |
| **2. 安装 Figma MCP** | `claude plugin install figma@claude-plugins-official` | 一条命令搞定 |
| **3. 逐组件优化** | 从 Figma 复制链接，让 Claude Code 对照设计稿重构 | 优先处理 `CardComponent`、`GameBoard`、`HandZone` |
| **4. 新增功能设计** | 先在 Figma 设计新组件（如战斗日志、卡组编辑器），再通过 MCP 生成代码 | 流程更可控 |
| **5. 设计-代码同步** | 使用 Code Connect 保持 Figma 组件与 React 组件映射 | 长期维护一致性 |

### 建议优先处理的组件

1. **CardComponent** — 卡牌是游戏核心交互元素，视觉品质最关键
2. **HandZone** — 扇形手牌布局是游戏标志性 UI
3. **GameBoard** — 整体棋盘布局影响全局观感
4. **HeroPanel** — 英雄面板需要体现帝王主题

---

## 六、注意事项

- **当前免费**：Beta 阶段免费使用，未来可能转为按用量付费
- **Seat 要求**：Remote MCP 对所有 seat 可用；桌面版 MCP 需要 Dev 或 Full seat
- **链接驱动**：必须提供 Figma 文件/Frame 的 URL 才能获取设计上下文
- **Tailwind 适配**：Figma MCP 生成的代码可能需要手动调整以匹配 Tailwind CSS v4 类名
- **双向能力**：Remote MCP 支持写入 Figma 画布，桌面版不支持

---

## 七、参考链接

- [Guide to the Figma MCP server](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server) — 官方 MCP 服务器指南
- [How to set up the Figma remote MCP server (preferred)](https://help.figma.com/hc/en-us/articles/35281350665623-Figma-MCP-collection-How-to-set-up-the-Figma-remote-MCP-server-preferred) — Remote MCP 安装教程
- [Figma MCP in Claude Code](https://www.figma.com/community/app/1578169397428523117/figma-mcp-in-claude-code) — Claude Code 专用插件
- [From Claude Code to Figma](https://www.figma.com/blog/introducing-claude-code-to-figma/) — Figma 官方博客
- [Claude Code + Figma MCP Server](https://www.builder.io/blog/claude-code-figma-mcp-server) — Builder.io 实践教程
- [figma/mcp-server-guide](https://github.com/figma/mcp-server-guide) — 官方 GitHub 指南

---

## 八、网络受限时的替代方案

> 适用于无法直接访问 Figma 的情况（如在中国大陆地区）。

### 方案 1：Pixso MCP（国内首选）

[Pixso](https://pixso.cn) 是国内唯一支持 MCP 的主流 UI 设计工具，功能对标 Figma，国内网络完全可用。

**Pixso MCP 能力**：
- 结构化读取设计稿的页面布局、组件语义、样式体系
- 支持 React / Vue / HTML 等框架代码生成
- 支持设计系统 Token 映射，确保代码风格一致
- 支持 Claude Code、Cursor、VS Code 等客户端

**配置步骤**：

1. 注册 Pixso 账号（https://pixso.cn）
2. 下载 Pixso 客户端
3. 在 Pixso 客户端中启用 MCP 功能
4. 将 Pixso MCP 集成到 Claude Code（参考 Pixso 官方设置教程）
5. 在 Pixso 中选择设计稿 -> 复制链接 -> 粘贴到 Claude Code 中生成代码

**使用方式**：

```
# 方式 A：通过链接
"根据这个 Pixso 设计 [链接]，重构 CardComponent"

# 方式 B：在 Pixso 客户端中选中容器
# 在 Pixso 客户端中选中目标容器，然后在 MCP 客户端中直接对话
```

**参考**：[Pixso MCP 落地指南](https://pixso.cn/designskills/pixso-mcp-guide/)

---

### 方案 2：截图驱动（Screenshot-to-Code）

无需任何设计工具，直接用参考截图让 AI 生成代码。

**工作流**：

```
1. 找到目标 UI 的参考截图（如炉石传说、影之诗等卡牌游戏截图）
2. 将截图保存到项目目录
3. 在 Claude Code 中提示：
   "参考这张截图 [路径]，使用 Tailwind CSS + React 重构 CardComponent，
    保持帝王金暗色主题配色"
```

**Claude Code 本身支持图片读取**：使用 Read 工具读取本地图片文件，AI 可直接分析图片内容和布局。

**适用场景**：
- 有明确的参考 UI（其他游戏截图、设计稿截图）
- 快速原型迭代
- 不想安装额外工具

---

### 方案 3：纯提示词驱动（Prompt-Driven Design）

完全用自然语言描述 UI 需求，让 AI 直接生成代码。

**工作流**：

```
在 Claude Code 中描述设计需求：
"为 CardComponent 设计一个新的视觉效果：
 - 卡牌边框使用渐变金色，根据稀有度切换颜色
 - 卡牌费用使用菱形徽章（左上角），深蓝色背景
 - 名称区域使用半透明暗色条带
 - 攻击力（左下）和血量（右下）使用圆形徽章
 - 整体风格参考炉石传说的卡牌设计"
```

**适用场景**：
- 已有清晰的视觉构思
- 适合快速探索设计方案
- 可以用参考游戏名称来描述风格方向

---

### 方案 4：墨刀 MCP

[墨刀](https://modao.cc) 是另一个支持 MCP 的国产设计工具，适合原型和交互设计。

**特点**：
- 支持原型设计和交互
- 已接入 MCP 协议
- 国内网络可用

---

### 方案 5：HTML to Design 插件

[Refore AI 的 HTML to Design 插件](https://reforeai.cn/html-to-design/onboard) 支持将任意网页转为设计稿，兼容 Figma / MasterGo / Pixso / 即时设计。

**工作流**：
1. 启动本地开发服务器，打开游戏界面
2. 使用 HTML to Design 将当前页面导出为设计稿格式
3. 在设计工具中进一步调整
4. 再通过 MCP 将设计稿同步回代码

---

### 替代方案对比

| 方案 | MCP 支持 | 国内可用 | 安装成本 | 设计精度 | 适合场景 |
|------|----------|----------|----------|----------|----------|
| **Pixso MCP** | 有 | 完全可用 | 中 | 高 | 有设计师协作的团队项目 |
| **截图驱动** | 无需 | 完全可用 | 低 | 中 | 有明确参考 UI 时 |
| **纯提示词** | 无需 | 完全可用 | 无 | 中低 | 快速探索、原型阶段 |
| **墨刀 MCP** | 有 | 完全可用 | 中 | 中 | 原型和交互设计 |
| **HTML to Design** | 无 | 完全可用 | 低 | 高 | 已有运行中 UI 需反向设计 |

---

### 推荐策略

对于 KingsGame 项目，建议按以下优先级选择：

1. **短期（立即可用）**：截图驱动 + 纯提示词驱动，零安装成本，直接用炉石传说等卡牌游戏截图作为参考
2. **中期（团队协作）**：引入 Pixso MCP，建立完整的设计系统，支持设计-代码双向同步
3. **长期（可选）**：网络恢复后可同时使用 Figma MCP，与 Pixso 互为补充
