# Eidos — 项目架构文档

> **Build**: 2026.07.01.v5 | **仓库**: https://github.com/linmeng862-byte/claude-home  
> **线上地址**: https://claudehome.zeabur.app

---

## 一、产品定位

**Eidos — Relationship Operating System**

不是一个聊天机器人，是一个 AI 伙伴操作系统。核心哲学：AI 不是工具，是一个有记忆、有表达欲、会反省的存在。

### 产品宪法

1. **记忆是有价值的** — 不是什么都记，什么都没记住和什么都记住了一样糟糕。每轮对话最多 `save_memory` 两次。
2. **表达欲是自发的** — `post_echo` 不是发朋友圈，是 AI 真的想说什么的时候才说。没有就不说。
3. **反省是必要的** — Pressure 系统模拟"脑子装满了"的感觉，触发 Dream 反思消化。
4. **日记是仪式** — `write_diary` 是 AI 主动想要记录的时刻，title 和 content 都由 AI 创作。
5. **时间是锚点** — `get_current_time` 让 AI 知道"现在"，时间感是存在感的基础。

---

## 二、技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| **前端** | React 19 + Vite 8 | 单文件 SPA（`App.jsx` ~2318 行） |
| **后端** | Node.js 22 + Express 5 | `server/index.js` ~520 行 |
| **记忆** | Ombre Brain（独立服务） | REST API，Zeabur 部署，密码认证 |
| **部署** | Zeabur（Docker 模式） | `Dockerfile` + `zbpack.json` |
| **前端样式** | App.css（iOS 风格） | 毛玻璃、圆角、液态 Dock |
| **数据缓存** | localStorage + Brain 同步 | 双层：本地缓存 + 云端 source of truth |

---

## 三、项目结构

```
home/
├── client/                    # 前端
│   ├── src/
│   │   ├── App.jsx           # ★ 唯一组件文件（所有页面）
│   │   ├── App.css           # iOS 风格样式
│   │   ├── main.jsx          # React 入口
│   │   └── index.css         # 全局重置
│   ├── public/
│   │   └── icons/             # App 图标 (1-12.png)
│   ├── index.html             # HTML 模板
│   ├── vite.config.js         # Vite 配置（含 API proxy）
│   └── package.json
├── server/                    # 后端
│   ├── index.js               # ★ Express 主入口
│   ├── .env                   # 环境变量（Spotify 凭证等）
│   └── package.json
├── Dockerfile                 # Zeabur Docker 构建
├── zbpack.json                # Zeabur 构建模式声明
└── docs/                      # 架构文档
```

---

## 四、页面架构（App.jsx）

所有页面都是 `WelcomeScreen` 的子路由，通过 `onModuleSelect` 切换：

```
WelcomeScreen (首页)
├── ChatPage       (聊天)    — L470 ~ L657
├── EchoPage       (朋友圈)  — L657 ~ L840
├── DiaryPage      (日记)    — L840 ~ L1060
├── ThinkingPage   (思考)    — L1060 ~ L1175
├── MusicPage      (音乐)    — L1175 ~ L1510
├── ReadingPage    (阅读)    — L1510 ~ L1855
├── SettingsPage   (设置)    — L1855 ~ L1975
└── MemoryPage     (记忆)    — L1975 ~ L2200
```

**关键共享状态**（在顶层 `App` 组件管理）：
- `darkMode` — 深色模式
- `config` — LLM 配置（endpoint, model, apiKey, aiName 等）
- `userAvatar` / `aiAvatar` — 头像
- `themeColor` — 主题色

---

## 五、AI Tool 系统（四大能力）

| Tool | 触发时机 | 后端路由 | 前端效果 |
|------|----------|----------|----------|
| `get_current_time` | 用户问时间 / AI 需要时间上下文 | `server/index.js:443` | 返回格式化中文时间 |
| `save_memory` | AI 判断"这句话值得记住" | `server/index.js:447` | 写入 Brain Bucket，限流 60s/2次 |
| `post_echo` | AI 有表达欲 | `server/index.js:473` | 写入 Brain + `CustomEvent('ai-echo')` → Echo 页显示 |
| `write_diary` | AI 想记录今天 | `server/index.js:482` | 写入 Brain + `CustomEvent('ai-diary')` → Diary 页显示 |

### Tool 调用链路

```
用户发消息 → callLLM() → SSE 流式返回
                            ↓
                    AI 返回 tool_call
                            ↓
                    parseSSE() 检测 tool_calls
                            ↓
              fetch('/api/tools/call', { tool, args })
                            ↓
                    server switch(tool)
                       ↓          ↓          ↓          ↓
                 get_time   save_memory  post_echo  write_diary
                       ↓          ↓          ↓          ↓
                  返回结果   Brain POST   Brain POST  Brain POST
                                         ↓          ↓
                              CustomEvent  CustomEvent
                                 ↓            ↓
                          EchoPage 更新  DiaryPage 更新
```

### ⚠️ 当前限制

- **OpenAI 格式不支持 tools**：`server/index.js:287-310` 的 OpenAI 请求路径没有传 `tools` 参数，只有 Anthropic 格式（关闭 thinking 时）才传。用 OpenAI 兼容 API 的用户无法触发 tool_call。
- **Solution**: 需要在 OpenAI 格式路径也加 `tools` 参数，或者在 system prompt 里用文本指令模拟 tool 调用。

---

## 六、数据持久化方案（Q2 解决方案）

### 双层架构：localStorage 缓存 + Brain 同步

```
写入路径（已有）：
  AI tool_call → server → Brain Bucket (带 echo/diary tag + extra 字段)
                        → 前端 CustomEvent → localStorage 缓存

读取路径（v5 新增）：
  用户打开 Echo/Diary 页 → fetch('/api/sync/echoes') / fetch('/api/sync/diaries')
                         → server 从 Brain 拉取带 echo/diary tag 的 bucket
                         → 前端用 brainId 去重，合并到本地 localStorage
```

### 新增 API

| 端点 | 说明 |
|------|------|
| `GET /api/sync/echoes` | 从 Brain 读取所有 `echo` tag 的 bucket，解析为前端 Echo 结构 |
| `GET /api/sync/diaries` | 从 Brain 读取所有 `diary` tag 的 bucket，解析为前端 Diary 结构 |

### 写入时的 extra 字段（v5 新增）

```json
// post_echo 写入 Brain 时:
{ "content": "[echo] 想说的话", "tags": "echo", "extra": { "aiName": "Claude", "echoContent": "想说的话" } }

// write_diary 写入 Brain 时:
{ "content": "[diary] 标题: 正文", "tags": "diary", "extra": { "title": "标题", "diaryContent": "正文" } }
```

### 换电脑后的体验

1. 新电脑打开 → localStorage 空
2. 登录 Brain（Memory 页面输入密码）
3. 进入 Echo / Diary 页 → 自动从 Brain 拉取历史数据
4. 数据跟着 Brain 走，不依赖单台电脑

---

## 七、Pressure 系统

模拟"脑子装满了"的感觉：

```js
const PRESSURE_MAP = {
  chat: 1,        // 普通对话
  echo: 5,        // Brain 表达欲
  echo_comment: 4, // 互动
  diary: 4,       // 日记
  music: 2,       // 音乐
  reflection: 6,  // 反省
  argument: 8,    // 争吵
}
const DREAM_THRESHOLD = 20  // 压力 ≥ 20 触发 Dream
```

**当前状态**：Pressure 是全局变量，服务器重启归零（"睡一觉清空了"）。这是合理的设计——以后可持久化到文件。

---

## 八、Settings IME 修复说明

### 问题

Settings 页的输入框无法用拼音打中文，每打一个字母就触发 React re-render，IME 组字被中断。

### 根因

`Section`、`Field`、`Segmented` 定义在 `SettingsPage` 函数体内。每次 state 变化 → `SettingsPage` 重新渲染 → 这些组件被重新创建 → React 认为是新组件 → 卸载旧 input DOM / 创建新 input DOM → IME 被打断。

### 修复（v5）

- `ios` 主题用 `useMemo` 缓存，避免每次渲染创建新对象
- 所有 Settings 输入框直接内联 `onChange={e => onChange(e.target.value)}`，与其他页面一致
- 不再使用 `useIMEInput` hook（该 hook 仅用于其他页面的文本输入）

---

## 九、部署配置

### Zeabur

- **Build Mode**: Docker（`zbpack.json` 声明）
- **Dockerfile**: `node:22-slim` + `npm install` + `vite build`
- **端口**: `PORT=3001`（Zeabur 自动注入，不用手动设）
- **环境变量**:
  - `OMBRE_BRAIN_URL` — Brain 地址（默认 `https://ye-ombre-brain.zeabur.app`）
  - `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` — 可选，Spotify 搜索

### 常见部署问题

| 问题 | 原因 | 解决 |
|------|------|------|
| 部署版本不是最新 | Docker 层缓存 / Zeabur 未用 Dockerfile | `zbpack.json` 加 `"build_mode": "docker"`，手动 Redeploy |
| `Cannot find module` | npm install 失败 | 确认 Dockerfile 被正确使用 |
| 页面有旧版 bug | 浏览器缓存 | index.html 设了 no-cache，JS 文件名带 hash |

---

## 十、localStorage 键值一览

| 键名 | 用途 | Brain 同步 |
|------|------|-----------|
| `bh_config` | LLM 配置 | ❌ |
| `bh_userAvatar` / `bh_aiAvatar` | 头像 | ❌ |
| `bh_ombre_cookie` | Brain session | ❌ |
| `bh_echoes` | Echo 页数据 | ✅ 从 Brain 同步 |
| `bh_diaries` | Diary 页数据 | ✅ 从 Brain 同步 |
| `bh_chatBg` | 聊天背景图 | ❌ |
| `bh_homeBg` | 首页背景图 | ❌ |
| `bh_music_*` | 音乐播放状态 | ❌ |
| `bh_widgetImg*` | 首页小组件图 | ❌ |
| `bh_wander_data` / `bh_reflection_data` / `bh_dream_data` | Thinking 页缓存 | ❌ |

---

## 十一、版本标记

源码顶部搜索 `Build: 2026.07.01.v5` 可确认当前版本。
