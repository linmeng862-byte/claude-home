# Eidos Architecture Overview
### 架构总览 v0.1

---

## 系统全景

```
┌─────────────────────────────────────────────────────────┐
│                        用户                              │
│              iPhone / Browser / PWA                      │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────┐
│                  Eidos Frontend                          │
│              React 19 · Vite 6 · PWA                     │
│                                                          │
│  ┌──────┐ ┌───────┐ ┌───────┐ ┌──────┐ ┌─────────┐     │
│  │ Chat │ │ Diary │ │ Music │ │ Echo │ │Thinking │     │
│  └──┬───┘ └───┬───┘ └───┬───┘ └──┬───┘ └────┬────┘     │
│     │         │          │        │           │ (read)   │
└─────┼─────────┼──────────┼────────┼───────────┼─────────┘
      │  POST /api/experience (unified)          │
      ▼                                          │
┌─────────────────────────────────────────────────────────┐
│                  Eidos Backend                           │
│           Node.js · Express · ESM                        │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │            Experience Layer                       │   │
│  │  ┌──────────────┐   ┌────────────────────────┐   │   │
│  │  │  Noise Filter│   │  Pressure System       │   │   │
│  │  │  (dedup 5min)│   │  chat:1 echo:5 diary:4 │   │   │
│  │  │  music: 15min│   │  → Dream when ≥ 20     │   │   │
│  │  └──────────────┘   └────────────────────────┘   │   │
│  │              ↓ translate                          │   │
│  │     [type] content · tags · importance            │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────┐   ┌──────────────────────────┐    │
│  │  LLM Proxy       │   │  save_memory Rate Limit  │    │
│  │  Anthropic Claude│   │  ≤ 2 per 60s per user    │    │
│  │  + Tool Calls    │   └──────────────────────────┘    │
│  │  (streaming SSE) │                                    │
│  └─────────────────┘                                     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  NetEase Music Proxy                              │   │
│  │  /api/netease/search · /url · /detail · /color   │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────┘
                               │ HTTP + Cookie Auth
         ┌─────────────────────▼──────────────────────────┐
         │              Ombre Brain                        │
         │         (External Service · Zeabur)             │
         │                                                 │
         │  ┌───────────┐  ┌────────────┐  ┌──────────┐  │
         │  │  Bucket   │  │   Feel     │  │ Persona  │  │
         │  │  Manager  │  │  (Emotion) │  │  Ring    │  │
         │  └─────┬─────┘  └─────┬──────┘  └────┬─────┘  │
         │        ▼              ▼               ▼        │
         │  ┌─────────────────────────────────────────┐  │
         │  │        on_memory_written                 │  │
         │  │   detect_slang · extract_encyclopedia   │  │
         │  │   (2× LLM per Bucket write ← optimize!) │  │
         │  └─────────────────────────────────────────┘  │
         │                                                 │
         │  ┌─────────┐  ┌────────────┐  ┌───────────┐   │
         │  │ Wander  │  │ Reflection │  │   Dream   │   │
         │  │(LLM,pull)│  │(LLM, auto) │  │(0 Token!) │   │
         │  └─────────┘  └────────────┘  └───────────┘   │
         │                                                 │
         │  ┌─────────────────────────────────────────┐  │
         │  │         Decay Engine                     │  │
         │  │  score = importance × activation^0.3     │  │
         │  │        × exp(-λ×days) × emotion_weight   │  │
         │  │  auto-resolve: importance ≤ 4 + 30 days  │  │
         │  └─────────────────────────────────────────┘  │
         └─────────────────────────────────────────────────┘
```

---

## 数据流向

### 普通 Experience（Chat / Music / Diary / Echo Comment）

```
页面事件
  → POST /api/experience { type, content, source }
  → Noise Filter: 5min dedup（Music: 15min）
  → Pressure += PRESSURE_MAP[type]
  → POST Brain /api/buckets { content: [type] ..., importance: IMPORTANCE_MAP[type] }
  → if Pressure ≥ 20 && cooldown → GET Brain /dream-hook（zero Token）
  → res { received: true, pressure }
```

### AI 主动行为（Tool Calls）

```
用户发消息
  → POST /api/chat → Anthropic Claude（streaming SSE）
  → AI 决定调用 Tool：
    · post_echo → Bucket(importance:7) + Pressure+=5 + dispatch 'ai-echo' event
    · write_diary → Bucket(importance:6) + Pressure+=4 + dispatch 'ai-diary' event
    · save_memory → Rate Limit(≤2/60s) → Bucket(importance: AI指定)
    · get_current_time → 返回当前时间（本地计算）
```

### Thinking（读取 Brain 内在状态）

```
打开 Thinking 页面
  → GET /api/memory/evolution/wander  → Brain /evolution/wander
  → GET /api/memory/evolution/reflection → Brain /evolution/reflection
  → GET /api/memory/evolution/dream → Brain /dream-hook（zero Token）
  → 渲染 Brain 自己产生的内容，不 AI 编造
```

---

## 核心配置（Environment Variables）

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `ANTHROPIC_API_KEY` | Claude API Key | — |
| `OMBRE_BRAIN_URL` | Ombre Brain 地址 | https://ye-ombre-brain.zeabur.app |
| `PORT` / `WEB_PORT` | 服务端口 | 3001 |

---

## Experience Layer 核心参数

| 参数 | 值 | 说明 |
|------|-----|------|
| `PRESSURE_MAP` | chat:1, echo:5, echo_comment:4, diary:4, music:2, reflection:6, argument:8 | 各类型累加压力 |
| `DREAM_THRESHOLD` | 20 | 触发 Dream 的压力阈值 |
| `DREAM_COOLDOWN` | 10 分钟 | Dream 最小间隔 |
| `DREAM_PRESSURE_RELEASE` | 10 | Dream 后释放压力 |
| `IMPORTANCE_MAP` | chat:3, echo:7, echo_comment:5, diary:6, music:4, reflection:7, argument:8 | 写入 Brain 的重要性 |
| `DEDUP_WINDOW` | 5 分钟（Music: 15 分钟） | 同内容去重窗口 |
| `MEMORY_RATE_LIMIT` | 2 次 / 60 秒 | save_memory 限流 |

---

## 部署架构

```
GitHub (main branch)
  → Zeabur CI
  → Docker build (node:22-slim)
    → npm install (client + server)
    → vite build → client/dist
    → EXPOSE 3001
    → node server/index.js
  → Express serves client/dist as static files
  → /api/* → backend handlers
```

---

## 设计原则

1. **入口控制 > 内部重构** — 在 Brain 外部减少噪音，不修改 Brain 内部
2. **Experience Layer = 轻转换层** — 只翻译 + 过滤，不决策，不记忆
3. **Bucket 保持稀缺** — on_memory_written = 2 LLM/次，减少无意义写入
4. **Brain 有主体性** — Eidos 不侵入 Brain，只提供更好的世界让 Brain 成长
5. **宁可安静，不要假** — 空状态优于伪造内容

---

*Last updated: 2026-07-01*
