# 🏠 Claude Home — AI 伴侣聊天应用

> 一个模拟 iOS 主屏幕的 AI 伴侣应用，集成 Ombre Brain 记忆系统，支持流式聊天、朋友圈、日记、音乐、阅读、思考档案等功能。

---

## 📱 功能页面

| 页面 | 功能 |
|------|------|
| **Home** | iOS 风格主屏幕，实时时钟 widget、日历 widget、快捷图标、底部 Dock |
| **Chat** | 流式 AI 对话，支持 OpenAI/Anthropic 双格式，思考过程弹窗，Tool Use（发朋友圈/写日记/保存记忆） |
| **Moment** | 朋友圈，支持评论、AI 自动发布（通过 Tool Use） |
| **Diary** | 备忘录，支持清单编辑/删除/勾选、图片上传、AI 写日记，数据 localStorage 持久化 |
| **Music** | 网易云音乐 + iTunes 双源搜索，专辑封面自动渲染到黑胶唱片中心 |
| **Reading** | 书架阅读器，侧边栏可折叠（移动端默认折叠），分类/统计动态同步 |
| **Thinking** | AI 社交档案卡，bio/性格/爱好/价值观从 config 读取，回忆画廊+时间线支持 AI 编辑 |
| **Memory** | Ombre Brain 记忆桶浏览器，密码登录后查看/搜索/新增记忆 |
| **Settings** | AI 名/用户名/头像/LLM 配置（endpoint/apiKey/model/format/systemPrompt），持久化 |

---

## 🛠 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 19 + Vite 8，单文件 `App.jsx`（~2000行），lucide-react 图标，CSS `ch-` 前缀聊天样式 |
| 后端 | Node.js 22 + Express 4，ESM 模块，`dotenv` 环境变量 |
| 记忆 | Ombre Brain 代理（breath/dream/buckets/search） |
| 音乐 | 网易云音乐 API 代理（`/api/music/search` + `/api/music/detail`） |
| LLM | OpenAI 格式 + Anthropic 格式，SSE 流式输出，Tool Use 支持 |
| 部署 | Zeabur（Docker 部署），GitHub 仓库自动构建 |
| PWA | manifest.json + service-worker，支持添加到手机主屏幕 |

---

## 📁 项目结构

```
claude-home/
├── client/                 # 前端 (React + Vite)
│   ├── src/
│   │   ├── App.jsx         # 全部页面组件（~2000行）
│   │   └── App.css         # 聊天页面样式（ch- 前缀）
│   ├── public/
│   │   ├── icons/          # App 图标 (13.png, 12.png 等)
│   │   ├── manifest.json   # PWA 清单
│   │   └── sw.js           # Service Worker
│   ├── index.html          # 入口 HTML
│   ├── vite.config.js      # Vite 配置（开发代理 /api → :3001）
│   └── package.json        # 前端依赖
├── server/                 # 后端 (Express)
│   ├── index.js             # API 路由 + 静态文件服务 + LLM 代理
│   ├── package.json         # 后端依赖 (express, cors, dotenv)
│   └── .env                 # 环境变量（不推送到 GitHub）
├── Dockerfile              # Zeabur 构建配置
├── .dockerignore
├── .gitignore
└── package.json            # 根目录（postinstall + build 脚本）
```

---

## 🔑 环境变量

在 `server/.env` 文件（本地）或 Zeabur 面板（线上）配置：

| 变量 | 值 | 说明 |
|------|----|------|
| `OMBRE_BRAIN_URL` | `https://ye-ombre-brain.zeabur.app` | Ombre Brain 地址 |
| `OMBRE_PASSWORD` | 你的密码 | 记忆桶登录密码 |
| `PORT` | `3001` | 服务端口（Zeabur 会用 `WEB_PORT`） |
| `SPOTIFY_CLIENT_ID` | 你的 Spotify Client ID | Spotify API 搜索（可选，不配置时回退到 iTunes） |
| `SPOTIFY_CLIENT_SECRET` | 你的 Spotify Client Secret | Spotify API 搜索（可选） |

---

## 🌐 线上地址

- **Zeabur 部署**: https://claudehome.zeabur.app
- **GitHub 仓库**: https://github.com/linmeng862-byte/claude-home

---

## 🔧 新电脑环境搭建

### 第一步：安装 Git

**Windows:**
1. 打开 https://git-scm.com/download/win
2. 下载 64-bit 版本
3. 双击安装，一路 Next（默认选项即可）
4. 安装完成后，打开 **命令提示符** 或 **PowerShell**，输入：
   ```
   git --version
   ```
   看到版本号说明安装成功

**macOS:**
1. 打开终端，输入 `git --version`
2. 系统会自动弹出安装提示，按提示安装 Xcode Command Line Tools

### 第二步：安装 Node.js

1. 打开 https://nodejs.org/
2. 下载 **LTS 版本**（22.x）
3. 安装完成后验证：
   ```
   node -v
   npm -v
   ```

### 第三步：克隆项目

```
git clone https://github.com/linmeng862-byte/claude-home.git
cd claude-home
```

### 第四步：安装依赖

```
npm run postinstall
```
这会自动安装 `client/` 和 `server/` 的依赖。

### 第五步：配置环境变量

在 `server/` 目录下创建 `.env` 文件：
```
OMBRE_BRAIN_URL=https://ye-ombre-brain.zeabur.app
OMBRE_PASSWORD=你的密码
PORT=3001
```

### 第六步：开发模式运行

开两个终端：

**终端 1（后端）：**
```
cd server
node --watch index.js
```

**终端 2（前端）：**
```
cd client
npx vite --host 0.0.0.0 --port 5173
```

打开 http://localhost:5173 即可。

### 第七步：构建生产版本

```
npm run build
```
前端构建到 `client/dist/`，后端 `node server/index.js` 会自动 serve 这个目录。

---

## 🚀 Zeabur 部署

1. 登录 https://zeabur.com （GitHub 登录）
2. Create Project → 添加 Service → Git → 选择 `claude-home`
3. 环境变量设置：
   - `OMBRE_BRAIN_URL` = `https://ye-ombre-brain.zeabur.app`
   - `OMBRE_PASSWORD` = 你的密码
   - `PORT` = `3001`
4. Networking → Generate Domain 或绑定自定义域名
5. HTTP 端口设为 `3001`

---

## 📋 常用 Git 命令

```bash
# 查看修改
git status

# 添加所有修改
git add -A

# 提交
git commit -m "描述你的修改"

# 推送到 GitHub
git push origin main

# 拉取最新代码（换电脑后或协作时）
git pull origin main
```

---

## ⚠️ 注意事项

- `server/.env` 不会推送到 GitHub（在 `.gitignore` 里），换电脑后需要重新创建
- 日记数据存储在浏览器 `localStorage`（`bh_diaries`），不同设备不同步
- AI 头像/用户头像存在 `localStorage`，换浏览器需重新设置
- Zeabur 的环境变量要**手动输入**，不要复制粘贴（避免不可见字符）
- Anthropic extended thinking 和 tools 互斥，默认开启 thinking（tools 禁用）
- Dock 监听端口必须是 `0.0.0.0`（不是 `localhost`），否则 Docker 内 502
