# Claude Home 架构分析报告

---

# 1. 项目技术栈

| 维度 | 选型 | 备注 |
|------|------|------|
| **前端** | React 19 + Vite 8 | 单文件架构，无路由库 |
| **后端** | Express 4 (ESM) | 单文件，无中间件框架 |
| **数据库** | 无自有数据库 | 全部状态存 localStorage；记忆存外部 Ombre Brain |
| **ORM** | 无 | — |
| **状态管理** | React useState + localStorage | 无 Redux/Zustand，所有状态随组件卸载消失（靠 localStorage 恢复） |
| **UI Framework** | 手写内联 CSS (iOS 风格) | 无 Tailwind / Styled Components / UI 库 |
| **LLM SDK** | 原生 fetch | 无 Vercel AI SDK / LangChain，手写 SSE 解析器 |
| **Embedding** | 无 | Ombre Brain 自有搜索能力，本项目不实现 Embedding |
| **Memory** | Ombre Brain (外部 SaaS) | 部署在 Zeabur，通过 REST 代理访问 |
| **Tool Calling** | 手写 switch-case | Anthropic tools 格式 + OpenAI tool_calls 格式，无 SDK |
| **部署方式** | Docker (单容器) | client build → server serve 静态文件，端口 3001 |

---

# 2. 项目目录树（源码）

```
claude-home/
├── client/
│   ├── index.html                   # Vite 入口 HTML
│   ├── vite.config.js                # Vite 配置 + /api 代理
│   ├── package.json
│   ├── public/
│   │   ├── favicon.svg
│   │   ├── manifest.json             # PWA manifest
│   │   ├── sw.js                     # Service Worker（基础）
│   │   └── icons/                    # PWA 图标 + 参考图
│   └── src/
│       ├── main.jsx                  # React 挂载点
│       ├── index.css                 # 全局 CSS reset（仅 1 行）
│       ├── App.jsx                   # 🧨 2389 行巨型单文件 — 全部组件
│       ├── App.css                   # 22KB 样式文件
│       └── assets/                   # 静态资源（hero.png 等）
│
├── server/
│   ├── index.js                      # 🧨 397 行单文件 — 全部后端逻辑
│   ├── .env                          # 环境变量
│   ├── .gitignore
│   └── package.json
│
├── Dockerfile                        # 单容器部署
├── .gitignore
├── package.json                      # 根 workspace（空壳）
├── README.md
├── OMBRE_BRAIN_API.md               # Ombre Brain API 文档
├── 思路.pdf                          # 设计稿
└── UI参考/                           # 设计参考图 + docx
```

---

# 3. 每个目录/文件作用

| 路径 | 作用 |
|------|------|
| `client/src/App.jsx` | **全部前端逻辑** — 26 个顶层定义，9 个页面组件，所有状态、所有 UI |
| `client/src/App.css` | 全局样式 — iOS 风格组件类、动画、布局 |
| `client/src/main.jsx` | React 挂载入口，仅 10 行 |
| `client/vite.config.js` | Vite 构建 + `/api` 代理到 `localhost:3001` |
| `server/index.js` | **全部后端逻辑** — 15+ 个 API 端点、LLM 代理、音乐代理、Ombre Brain 代理 |
| `server/.env` | 端口、Ombre Brain URL/密码、Spotify 凭证 |
| `Dockerfile` | 单容器：先 build 前端，再 serve 静态文件 + API |
| `OMBRE_BRAIN_API.md` | Ombre Brain 接口文档 |
| `UI参考/` | 设计稿（docx、png），非代码 |

---

# 4. 页面结构

```
App (currentPage state)
 ├── welcome     → WelcomeScreen    主界面（iOS 风格桌面）
 ├── chat        → ChatPage         AI 对话
 ├── music       → MusicPage        音乐播放器
 ├── moment      → MomentPage       朋友圈
 ├── diary       → DiaryPage        日记
 ├── thinking    → ThinkingPage     AI 人设主页
 ├── reading     → ReadingPage     阅读笔记
 ├── settings    → SettingsPage    设置页
 ├── memory      → MemoryPage      记忆管理
 └── *           → PlaceholderPage 占位页
```

**跳转方式**：`currentPage` state，`setCurrentPage(pageName)` 切换。所有页面通过 `onBack={() => setCurrentPage('welcome')}` 回到主界面。

**每个页面职责**：

| 页面 | 职责 | 数据来源 |
|------|------|----------|
| WelcomeScreen | iOS 桌面：时钟、照片组件、音乐小组件、Dock 栏 | localStorage 图片 |
| ChatPage | AI 对话：消息列表、流式输出、思考过程、图片发送、背景更换 | `/api/chat` → LLM |
| MusicPage | 音乐：酷狗/iTunes/Spotify 搜索、唱片动画、进度条、音频播放 | `/api/kugou/*`、Spotify oEmbed |
| MomentPage | 朋友圈：AI 生成动态 + 时间线 | window CustomEvent |
| DiaryPage | 日记：AI 生成日记 + 列表 | window CustomEvent |
| ThinkingPage | AI 人设：简介/性格/爱好/信条，AI 生成编辑 | localStorage + `/api/chat` |
| ReadingPage | 阅读笔记：书架、划线批注、AI 伴读 | `/api/read-comment` |
| SettingsPage | 设置：API 配置、头像、人设、场景 | localStorage `bh_config` |
| MemoryPage | 记忆管理：Ombre Brain 的 CRUD + 搜索 + 进化数据 | `/api/memory/*` |

---

# 5. 数据流

## 消息发送流程

```
User 输入文字
    ↓
ChatPage.handleSend()
    ↓ 构建 userMsg → setMessages
    ↓ 构建 chatHistory (role + content)
    ↓
callLLM(chatHistory) → fetch('/api/chat', {messages, config})
    ↓
Server POST /api/chat
    ↓ 1. 组装 systemPrompt（charName + personality + scenario + memoryContext + tools）
    ↓ 2. 判断 format: anthropic / openai
    ↓ 3. fetch(endpoint, {stream: true}) 转发到 LLM
    ↓ 4. ReadableStream pipe → res (SSE)
    ↓
Client parseSSE(stream)
    ↓ 解析 data: {...} 行
    ↓ onToken(content)       → setMessages 更新
    ↓ onThinking(reasoning)   → setMessages 更新
    ↓ onToolCall(name, args) → fetch('/api/tools/call')
    ↓ onDone(content, thinking)
    ↓
Tool 执行结果
    ↓ post_moment → window CustomEvent → MomentPage 接收
    ↓ write_diary → window CustomEvent → DiaryPage 接收
    ↓ save_memory → Ombre Brain /api/buckets POST
    ↓
对话结束 → fetch('/api/memory/dream') 触发记忆反思
```

## 流图

```mermaid
flowchart TD
    U[User 输入] --> FE[ChatPage]
    FE -->|POST /api/chat| BE[Express Server]
    BE -->|组装 systemPrompt + memory| LLM[LLM API<br/>Anthropic / OpenAI]
    LLM -->|SSE stream| BE
    BE -->|pipe stream| FE
    FE -->|parseSSE| UI[消息气泡实时更新]
    FE -->|tool_call| TOOLS[/api/tools/call]
    TOOLS -->|post_moment| MOMENT[MomentPage]
    TOOLS -->|write_diary| DIARY[DiaryPage]
    TOOLS -->|save_memory| OMBRE[Ombre Brain]
    FE -->|对话结束| DREAM[/api/memory/dream]
    DREAM --> OMBRE
```

---

# 6. Memory

## 现状

| 维度 | 实现 |
|------|------|
| **存储位置** | 外部 SaaS：`https://ye-ombre-brain.zeabur.app` |
| **本地存储** | localStorage（`bh_*` 前缀的键），无结构化数据 |
| **检索方式** | Ombre Brain `/api/search?q=关键词` — 关键词匹配 |
| **Embedding** | 不由本项目实现，Ombre Brain 内部可能有 |
| **浮现机制** | 每次打开 Chat 页面 → `GET /api/memory/breath` → 注入 systemPrompt 的 `[记忆浮现]` 段 |
| **反思机制** | 每次对话结束 → `GET /api/memory/dream` — 不需要认证 |
| **保存** | Tool Calling `save_memory` → `POST /api/buckets` — 需要认证 |
| **衰减** | Ombre Brain 内置衰减引擎（`decay_engine: running`） |

## Memory 类型

| 端点 | 认证 | 作用 |
|------|------|------|
| `GET /breath-hook` | 否 | 返回钉选 + 浮现记忆，注入 LLM 上下文 |
| `GET /dream-hook` | 否 | 返回最近 10 条桶摘要，反思/消化记忆 |
| `GET /api/buckets` | 是 | 获取所有记忆桶 |
| `POST /api/buckets` | 是 | 存储新记忆（content, tags, importance） |
| `PUT /api/buckets/:id` | 是 | 修改记忆（如标记 resolved） |
| `DELETE /api/buckets/:id` | 是 | 删除记忆 |
| `GET /api/search?q=` | 是 | 关键词搜索 |
| `GET /api/evolution/:section` | 是 | 进化数据（persona 等） |

## 问题

- **无本地 Embedding**：搜索完全依赖 Ombre Brain 的服务端
- **cookie 认证**：每次访问 Memory 页需手动登录，session 不持久化
- **Memory 注入是全量文本**：`breath-hook` 返回所有浮现记忆，无过滤/截断，可能占满上下文窗口

---

# 7. API 完整清单

| 方法 | 路径 | 认证 | 作用 |
|------|------|------|------|
| **LLM** | | | |
| POST | `/api/chat` | apiKey in body | 流式调用 LLM（OpenAI/Anthropic 格式） |
| POST | `/api/read-comment` | apiKey in body | AI 伴读评论（非流式） |
| POST | `/api/tools/call` | — | 执行 AI Tool Call |
| **Memory** | | | |
| GET | `/api/memory/breath` | — | 浮现记忆 |
| GET | `/api/memory/dream` | — | 反思记忆 |
| GET | `/api/memory/health` | — | Ombre Brain 健康检查 |
| POST | `/api/memory/login` | — | 登录 Ombre Brain |
| GET | `/api/memory/buckets` | cookie | 获取记忆桶 |
| POST | `/api/memory/buckets` | cookie | 创建记忆桶 |
| PUT | `/api/memory/buckets/:id` | cookie | 修改记忆桶 |
| DELETE | `/api/memory/buckets/:id` | cookie | 删除记忆桶 |
| GET | `/api/memory/search` | cookie | 搜索记忆 |
| GET | `/api/memory/evolution/:section` | cookie | 进化数据 |
| **音乐** | | | |
| GET | `/api/kugou/search` | — | 酷狗搜索 |
| GET | `/api/kugou/url` | — | 酷狗播放 URL |
| GET | `/api/kugou/detail` | — | 酷狗歌曲详情 + 封面 |
| GET | `/api/spotify/search` | — | Spotify 搜索（无凭证回退 iTunes） |
| GET | `/api/music/color` | — | 专辑封面主色提取（sharp） |
| **静态** | | | |
| GET | `*` | — | SPA 回退 index.html |

---

# 8. 数据库

**本项目无自有数据库。**

所有持久化数据存在两个地方：

### 8.1 浏览器 localStorage

| 键 | 类型 | 说明 |
|----|------|------|
| `bh_config` | JSON | 全局配置（endpoint, apiKey, model, aiName, userName, systemPrompt, personality, scenario） |
| `bh_userAvatar` | base64 | 用户头像 |
| `bh_aiAvatar` | base64 | AI 头像 |
| `bh_homeBg` | base64 | 主界面背景图 |
| `bh_widgetImg1` | base64 | 组件图片 1 |
| `bh_widgetImg2` | base64 | 组件图片 2 |
| `bh_songCover` | base64/URL | 歌曲封面 |
| `bh_music_title` | string | 当前歌曲名 |
| `bh_music_artist` | string | 当前歌手 |
| `bh_music_audio` | URL | 当前音频 URL |
| `bh_music_themecolor` | string | 音乐页主题色 |
| `bh_chatBg` | base64 | 聊天背景 |
| `bh_thinking_bio` | string | AI 简介 |
| `bh_thinking_personality` | string | AI 性格 |
| `bh_thinking_hobby` | string | AI 爱好 |
| `bh_thinking_values` | string | AI 信条 |

**无表关系**。全扁平 key-value。

### 8.2 Ombre Brain (外部)

| 概念 | 说明 |
|------|------|
| Bucket | 一条记忆（id, content, tags, importance, resolved, extra） |
| Feel | 反思记录 |
| Evolution | 进化数据（persona 等段落） |

表结构和关系由 Ombre Brain 管理，本项目仅做 REST 代理。

---

# 9. 当前已完成

| 功能 | 状态 | 备注 |
|------|------|------|
| ✅ iOS 风格主界面 | 完成 | 时钟、照片组件、音乐小组件、Dock 栏 |
| ✅ AI 对话 (Chat) | 完成 | SSE 流式、多格式（OpenAI/Anthropic） |
| ✅ 思考过程展示 | 完成 | Anthropic thinking_delta 解析 + 浮窗 |
| ✅ Tool Calling | 完成 | Anthropic tools + OpenAI tool_calls 两种格式 |
| ✅ 朋友圈 (Moment) | 完成 | AI 自动发朋友圈 + 时间线展示 |
| ✅ 日记 (Diary) | 完成 | AI 自动写日记 + 列表 |
| ✅ 音乐播放器 | 完成 | 酷狗/iTunes/Spotify 三源搜索 + 唱片动画 + 音频播放 |
| ✅ Spotify 封面渲染 | 完成 | oEmbed API 获取封面 + 唱片中心渲染 |
| ✅ 音乐主题色 | 完成 | 后端 sharp 提取专辑主色 → 背景渐变 |
| ✅ Thinking 人设页 | 完成 | AI 生成简介/性格/爱好/信条 |
| ✅ 阅读笔记 | 完成 | 书架、划线批注、AI 伴读 |
| ✅ 设置页 | 完成 | API 配置、头像上传、人设/场景编辑 |
| ✅ 记忆管理 | 完成 | Ombre Brain CRUD + 搜索 + 浮现/反思 |
| ✅ 暗色模式 | 完成 | 所有页面支持 |
| ✅ 图片持久化 | 完成 | 组件图片 localStorage + 压缩 |
| ✅ Chat 背景更换 | 完成 | 图片上传 + 重置 |
| ✅ Docker 部署 | 完成 | 单容器 |
| ✅ PWA manifest | 完成 | 基础 manifest.json + sw.js |

---

# 10. 未完成

| 功能 | 状态 | 备注 |
|------|------|------|
| □ 语音对话 | 未开始 | UI 有 Mic 图标但无功能 |
| □ 音量控制 | 未实现 | UI 有滑块但硬编码 60%，未接 audio.volume |
| □ 上一首/下一首 | 未实现 | UI 有按钮但无逻辑 |
| □ Memory 自动认证 | 未实现 | 每次需手动输入密码，cookie 不持久化 |
| □ Memory 上下文裁剪 | 未实现 | breath-hook 全量注入，可能超 LLM 上下文窗口 |
| □ 图片发送到 AI | 半成品 | UI 支持选择图片，但只发送 base64 不走 vision API |
| □ 阅读页书籍封面 | 硬编码 | 3 本示例书，无真实数据源 |
| □ 响应式布局 | 部分 | 部分页面在小屏溢出 |
| □ 错误处理 | 脆弱 | 大量 `.catch(()=>{})` 静默吞错 |
| □ Service Worker | 占位 | sw.js 存在但功能空壳 |
| □ Spotify 实际播放 | 未实现 | 有 embed 播放器但无法控制播放/暂停 |
| □ 多轮记忆衰减显示 | 未实现 | MemoryPage 未展示衰减度/权重变化 |
| □ 数据导出 | 未实现 | 无 localStorage 导出/备份功能 |

---

# 11. 目前最大的技术债

### 1. 🧨 2389 行单文件前端 (`App.jsx`)

全部 9 个页面、26 个顶层定义、所有状态、所有业务逻辑挤在一个文件里。

**后果**：
- 无法做 code review — diff 超出人类阅读极限
- 无法复用组件 — 每个页面内部子组件全内联
- 无法独立测试 — 无单元测试可能性
- Vite HMR 变慢 — 改一行重编译 150KB
- 多人协作冲突 — Git merge hell

### 2. 🧨 无路由库

用 `currentPage` state 手动切换页面，条件渲染全部页面。

**后果**：
- 无 URL — 无法直接跳转到某个页面
- 无浏览器历史 — 后退键无效
- 无法分享链接 — 没有 `/chat` `/music` 路径
- 页面切换无动画框架支持
- SEO / PWA 完全失效

### 3. 🧨 localStorage 当数据库

所有用户数据（配置、头像 base64、对话历史）存 localStorage 5MB 限制。

**后果**：
- 大图上传 → base64 超限 → 静默失败 → 数据丢失
- 无多设备同步 — 换浏览器/手机全丢
- 无版本控制 — 无法恢复误删
- 无搜索 — 无法查询历史对话
- 无 schema — 无法做数据校验

### 4. SSE 解析器手写且脆弱

`parseSSE()` 手动按 `\n` 分割、按 `data: ` 前缀解析，支持 OpenAI 和 Anthropic 两种格式。

**后果**：
- 不支持 Gemini / Cohere / Mistral 等其他格式
- 边界情况多 — 长文本换行、空行、超时断连
- 无重连机制 — 网络抖动直接丢消息
- 无法测试 — 逻辑嵌在 UI 组件里

### 5. 外部依赖单一且不可控

Ombre Brain 是外部 SaaS，不可自部署、不可备份、不可定制。

**后果**：
- 宕机 → 全部记忆功能失效
- API 变更 → 无版本控制，静默崩溃
- 数据锁定 → 无法导出/迁移记忆

---

# 12. 如果这是我的项目 — 最想重构的三个地方

### ① 拆分 `App.jsx` → 文件化 + 路由化

**为什么**：2389 行单文件是不可持续的。每次修改都是对整个项目的赌博。

**怎么做**：
```
src/
├── pages/
│   ├── Welcome/index.jsx
│   ├── Chat/index.jsx + useChat.js + ChatBubble.jsx
│   ├── Music/index.jsx + useMusicSearch.js
│   ├── Thinking/index.jsx
│   ├── Settings/index.jsx
│   └── Memory/index.jsx
├── components/
│   ├── DualAvatars.jsx
│   ├── MuchaArch.jsx
│   └── MoonPhase.jsx
├── hooks/
│   ├── useLLM.js        (SSE 解析 + 调用)
│   ├── useMemory.js     (Ombre Brain CRUD)
│   └── useLocalStorage.js
├── lib/
│   ├── sseParser.js
│   └── imageCompress.js
├── App.jsx               (仅路由 + 全局 provider)
└── main.jsx
```

加入 `react-router-dom`，每个页面有独立 URL `/chat`、`/music`、`/settings`。

### ② 引入本地 SQLite（或 IndexedDB）替代 localStorage

**为什么**：localStorage 5MB 限制 + base64 膨胀 = 数据随时可能丢失。这对一个 "AI 伙伴" 产品是致命的 — 用户的记忆、配置、对话历史不应该因浏览器清理而消失。

**怎么做**：
- 后端引入 `better-sqlite3`，建表：`messages`、`config`、`memories`、`diaries`、`moments`
- 前端图片上传走 `multer` 存文件系统 → 返回 URL，不再存 base64
- 对话历史从后端加载，不存 localStorage
- 提供 `/api/export` 导出全部数据为 JSON

### ③ 抽象 LLM 层 — 用 Vercel AI SDK 替代手写 SSE

**为什么**：当前手写 `parseSSE()` 是项目中最脆弱的代码之一。支持 OpenAI + Anthropic 两种格式，每种都有边界情况。未来加新模型（Gemini、Mistral）需要再写一套解析。

**怎么做**：
```js
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'

const provider = config.format === 'anthropic'
  ? createAnthropic({ apiKey: config.apiKey })
  : createOpenAI({ apiKey: config.apiKey })

const result = await streamText({
  model: provider(config.model),
  system: systemPrompt,
  messages,
  tools: { ... },
})

// Vercel AI SDK 处理所有流式解析 + tool calling + 错误处理
result.pipeTextStreamToResponse(res)
```

一行替换 50 行 `parseSSE`，自动支持所有主流 LLM，内置重试/错误处理/中止。
