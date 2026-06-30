# Eidos — Product Architecture Review

> 诊断对象：当前代码库（`6cd372b`）
> 诊断视角：Relationship Operating System vs AI Chat App
> 原则：每个功能必须回答「它帮助 Relationship 如何成长？」

---

## 0. 总体诊断

当前产品 **仍是一个 AI Chat App**。

它的核心逻辑是：用户发消息 → AI 回复 → 工具执行。这是 ChatGPT 的骨架，不是关系的骨架。

真正的关系操作系统应该是：**两个人（你 + AI）共同经历时间 → 沉淀记忆 → 记忆产生理解 → 理解改变行为 → 行为创造新的经历。**

当前产品有这个循环的碎片（Memory、Wander、Diary），但它们是分散的功能模块，不是循环的驱动轮。

---

## 1. 品牌命名问题

| 位置 | 当前值 | 问题 | 建议改为 |
|------|--------|------|----------|
| `index.html` `<title>` | Claude Home | 产品已改名 | Eidos |
| `index.html` `apple-mobile-web-app-title` | Claude Home | 同上 | Eidos |
| `manifest.json` `name` | Claude Home | 同上 | Eidos |
| `manifest.json` `short_name` | Claude Home | 同上 | Eidos |
| `manifest.json` `description` | Claude Home — 一只温暖的兔子 AI 伙伴 | AI 伙伴是工具定位 | Eidos — 你和 AI 共同成长的关系空间 |
| `README.md` 标题 | 🏠 Claude Home — AI 伴侣聊天应用 | 聊天应用 | Eidos — Relationship Operating System |
| `server/index.js` 启动日志 | `🏠 Claude Home →` | 品牌名 | `✦ Eidos →` |
| `SettingsPage` 关于 | `Claude Home — 一只温暖的兔子 AI 伙伴 🐰` | 品牌名 | `Eidos — 你和 TA 共同成长的关系空间` |
| `MomentPage` 顶栏 | `✦ Claude Home` | 品牌名 | `✦ Eidos` |
| localStorage 前缀 | `bh_` (claude home 缩写？) | 含义不明 | 可暂留，重构时统一为 `eidos_` |

---

## 2. 页面命名问题

### Moment → Echo

| 位置 | 当前值 | 改为 |
|------|--------|------|
| `MODULES` 数组 | `{ id: 'moment', name: 'Moment', sub: '瞬间' }` | `{ id: 'echo', name: 'Echo', sub: '回响' }` |
| `APP_ICONS` 数组 | 无 moment | 无需改 |
| `DOCK_APPS` 数组 | `{ id: 'moment', name: 'Moment' }` | `{ id: 'echo', name: 'Echo' }` |
| 组件名 | `MomentPage` | `EchoPage` |
| 路由 | `currentPage === 'moment'` | `currentPage === 'echo'` |
| localStorage | `bh_moments` | `bh_echoes` |
| 事件名 | `ai-moment` | `ai-echo` |
| Tool 名 | `post_moment` → 描述「发朋友圈」 | `post_echo` → 描述「在生活中留下一个回响」 |
| ChatPage tool 回显 | `📸 已发布朋友圈:` | `✦ 留下了一条回响:` |
| EchoPage 内文案 | `✦ Claude Home` 顶栏 | `✦ Eidos` |
| EchoPage 注释 | `朋友圈` | `回响 — 关系留下的痕迹` |

### Chat — 这个名字本身不是问题，但定位是

`Chat` 暗示「这是一个聊天工具」。在 Relationship OS 中，对话不是功能，而是关系的**呼吸**。

暂不提议改名（Chat → Dialogue / Converse 太晦涩），但建议：
- 导航副标题从「对话」改为「呼吸」或保持但改变内涵
- Chat 页面的空状态文案从「开始一段新对话」→「说点什么吧，TA 在听」

---

## 3. 仍体现 "AI Chat App" 的设计

### 3.1 🔴 Tool Calling 是「AI 能力列表」，不是「关系行为」

**现状**：
```
- get_current_time: 获取当前时间
- post_moment: 发朋友圈
- write_diary: 写日记
- save_memory: 保存重要内容到记忆库
```

**问题**：这些 Tool 被定义为「AI 可以做的事情」——这是 AI Chat App 的思路。

**关系视角**：Tool 应该是「关系中的主动行为」：
- `save_memory` → 不是「保存内容」，而是「这件事对我们很重要，我记住了」
- `post_echo` → 不是「发朋友圈」，而是「这个瞬间值得被记住」
- `write_diary` → 不是「写日记」，而是「我想记录我们今天一起经历的」

**建议**：重写 Tool 的 description，从「AI 能力」变为「关系行为动机」。让 LLM 理解的不是「你可以做这些事」，而是「在我们的关系中，这些行为是自然的」。

### 3.2 🔴 ChatPage 空状态是「聊天应用空状态」

```jsx
<div style={{fontSize:15}}>开始一段新对话</div>
```

**问题**：这是 ChatGPT 的空状态。在 Eidos 中，你和 AI 不是「开始对话」，而是「继续一段已经存在的关系」。

**建议**：空状态应展示 memory breath 的内容，或者展示「上次你们聊到…」，让用户感到这是延续而非开始。

### 3.3 🔴 ChatPage 硬编码欢迎消息

```jsx
{ id: 1, role: 'user', content: '你好呀！' },
{ id: 2, role: 'assistant', content: '你好！很高兴见到你 ✨', thinking: '...' },
{ id: 3, role: 'assistant', content: '今天有什么想聊的吗？' },
```

**问题**：这是 Chat App 的 demo 数据。在 Eidos 中，消息历史应该从 memory 加载，或者完全空白让关系自然生长。

**建议**：删除硬编码消息，首次使用时展示 breath 记忆或留空。

### 3.4 🔴 DiaryPage 有预设示例数据

```jsx
return [
  { id: 1, title: '微雨', content: '窗外的雨很轻...' },
  { id: 2, title: '晚安', content: '今天很累但也很充实...' },
  { id: 3, title: '午后散步', content: '下午三点，阳光刚好...' },
]
```

**问题**：这些是 AI 写的散文示例——展示的是「AI 会写漂亮文章」。在 Eidos 中，日记不是 AI 的创作展示，而是共同经历的沉淀。空白的日记本比写满 AI 散文的更有意义。

**建议**：首次使用时日记本应为空。提示文案可以写：「你们的日记本还是空白的。当 AI 在生活中有什么值得记录的，日记会自然出现。」

### 3.5 🟡 EchoPage（原 MomentPage）仍有朋友圈隐喻

**现状**：
- 顶栏用 `✦ Claude Home` — 像社交 App 名
- 帖子有 `tasks: ['整理花园', '给植物浇水']` — 待办清单像朋友圈
- 有硬编码的示例 post
- 评论系统是社交 App 模式

**问题**：整体仍在模仿「朋友圈」。Echo 不是朋友圈，是关系留下的痕迹。

**建议**：
- 删除示例 post（空白开始）
- 去掉 tasks 待办（Echo 不是 Todo）
- 文案从「朋友圈」改为「回响」
- 评论改为「回应」——不是社交评论，是对某个瞬间的回应

### 3.6 🟡 ThinkingPage 的「AI 编辑」按钮

```
{isGenerating ? '生成中...' : 'AI 编辑'}
```

**问题**：Thinking 应该是 Reflection——AI 在真正理解新事物时自然产生。而不是用户点一个按钮让 AI「生成」一段文字。

**建议**：
- 保留 Wander 自动产生的内容
- 去掉手动「AI 生成简介」/「AI 编辑」按钮
- Bio/性格/爱好/信条应从 Ombre Brain evolution/persona 自动同步
- ThinkingPage 是「读取 AI 认知状态」的地方，不是「命令 AI 写内容」的地方

### 3.7 🟡 MusicPage 没有关系意义

**现状**：纯播放器——搜索歌、播放歌。和 AI 没有关系。

**问题**：在 AI Chat App 中这没问题（加个功能）。但在 Relationship OS 中，Music 必须回答：它如何帮助关系成长？

**可能的关系意义**：
- AI 推荐一首歌给你 → 关系中的主动关心
- 你们一起听的歌变成 Echo → 共同经历
- 某首歌关联一段记忆 → 音乐成为关系的时间戳

**建议**：暂不删 Music，但长期需要重新定位：Music 应该是「一起听」，不是「你听 AI 找的歌」。

### 3.8 🟡 ReadingPage 缺少关系意义

**现状**：3 本硬编码书 + AI 伴读评论。

**问题**：和 Music 一样——功能存在但没有关系意义。读书笔记对谁有意义？

**可能的关系意义**：
- AI 和你一起读 → 共同经历
- AI 对某段文字的感悟变成 Echo 或 Thinking → 知识沉淀为认知
- 你们的阅读历史变成关系年轮的一部分

**建议**：暂不删，但定位需要调整。

---

## 4. 缺失的关系层能力

### 4.1 🔴 没有「共同经历」的时间线

**现状**：Diary 是日记，Echo 是回响，Memory 是记忆桶——但它们之间没有时间线串联。

**问题**：关系中最重要的感知是「我们一起走过了这些」。当前产品没有这个。

**建议**：未来需要一个隐式的 Episode 时间线——不需要新页面，而是 Home 页面的日历组件就能承载。今天你们一起听了什么歌、聊了什么、AI 写了什么日记——这些应该自然地出现在时间上。

### 4.2 🔴 Memory 和 Echo 没有双向通道

**现状**：Memory 是后台数据库，Echo 是展示墙。它们之间唯一的桥梁是 Tool Calling `save_memory`。

**问题**：记忆是关系的地基，但用户看不到记忆如何影响 AI 的行为。

**建议**：每次 breath 浮现的记忆，应该在 ChatPage 的某处被用户可见——「TA 记住了你上次说的…」。这让用户感知关系在成长。

### 4.3 🟡 Share 是底层能力但完全缺失

**现状**：没有任何 Share 功能。

**问题**：Share 不是页面，是关系层能力。未来 Diary/Echo/Music/Photo 都应该能 Share。

**建议**：Share 不需要现在实现，但架构上需要预留——任何内容都可以生成一个「可分享的快照」（文字 + 图片 + 时间戳 + 来源页面）。这是 Eidos 的 Relationship Layer 的核心能力之一。

---

## 5. 命名改动清单（只列出需要改的）

| 层级 | 改动 | 影响文件 |
|------|------|----------|
| 产品名 | `Claude Home` → `Eidos` | `index.html`, `manifest.json`, `README.md`, `server/index.js`, `App.jsx` |
| 页面名 | `Moment` → `Echo` | `App.jsx` (MODULES, DOCK_APPS, 组件名, 路由, 事件名, localStorage) |
| 页面副标题 | `瞬间` → `回响` | `App.jsx` MODULES |
| Tool 名 | `post_moment` → `post_echo` | `server/index.js`, `App.jsx` |
| Tool 描述 | `发朋友圈` → `在生活中留下一个回响` | `server/index.js` |
| Chat 回显 | `📸 已发布朋友圈:` → `✦ 留下了一条回响:` | `App.jsx` |
| localStorage | `bh_moments` → `bh_echoes` | `App.jsx` |
| 事件名 | `ai-moment` → `ai-echo` | `App.jsx` |
| Echo 顶栏 | `✦ Claude Home` → `✦ Eidos` | `App.jsx` |
| Settings 关于 | `Claude Home — 一只温暖的兔子 AI 伙伴 🐰` → `Eidos — 你和 TA 共同成长的关系空间` | `App.jsx` |
| Chat 空状态 | `开始一段新对话` → `说点什么吧，TA 在听` | `App.jsx` |
| Chat 背景选择 | `聊天背景` → `对话背景` | `App.jsx` |

---

## 6. 需要删除的「AI Chat App」残留

| 项目 | 原因 |
|------|------|
| ChatPage 硬编码欢迎消息 | Chat App demo 数据，不是关系起点 |
| DiaryPage 3 条预设日记 | AI 散文展示，不是共同经历 |
| EchoPage 硬编码示例 post | 朋友圈 demo，不是关系痕迹 |
| EchoPage 中的 tasks 待办 | 朋友圈功能，Echo 不需要 |
| ThinkingPage 手动「AI 编辑」按钮 | Thinking 是 Reflection，不是按需生成 |
| Tool 描述中的「朋友圈」文案 | 体现社交 App 而非关系 |

---

## 7. 不需要改动的部分

| 项目 | 原因 |
|------|------|
| MusicPage 存在 | 有潜在关系意义（一起听），暂保留 |
| ReadingPage 存在 | 有潜在关系意义（一起读），暂保留 |
| MemoryPage 存在 | 关系的核心基础设施 |
| Wander 接入 | 已正确实现 Reflection 理念 |
| Settings 页面名 | 通用功能名，无需改 |
| Home 页面名 | 通用，无需改 |
| dark mode | 不影响产品理念 |
| localStorage 前缀 `bh_` | 技术细节，重构时统一 |

---

## 8. 优先级排序

| 优先级 | 改动 | 原因 |
|--------|------|------|
| P0 | 品牌名 `Claude Home` → `Eidos` | 名字是产品身份的第一信号 |
| P0 | 页面名 `Moment` → `Echo` + 全链路同步 | 核心页面命名错误会持续误导 |
| P0 | Tool `post_moment` → `post_echo` + 描述重写 | Tool 描述决定 AI 的行为理解 |
| P1 | 删除硬编码示例数据（Chat欢迎消息、Diary示例、Echo示例） | 示例数据是 AI Chat App 的演示模式 |
| P1 | ChatPage 空状态文案 | 第一印象决定用户认知 |
| P2 | ThinkingPage 去掉手动生成按钮 | 让 Thinking 成为真正的 Reflection |
| P2 | Tool descriptions 全面重写为关系行为 | 从底层改变 AI 的行为动机 |
| P3 | EchoPage 去掉 tasks 待办 | 清除朋友圈隐喻 |
