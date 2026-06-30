# Eidos Architecture Overview
### 架构总览 v0.1

---

## 一、生命流（Life Flow）

> 这一层描述永远不会变的东西。代码可以重写，这张图应当依然成立。

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                         现实 Reality                        │
│                                                             │
│   对话 · 日记 · 音乐 · 回响 · 沉默                          │
│                                                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Reality Encoder                            │
│                                                             │
│   把生活事件转换成 TA 能理解的经历。                         │
│   过滤噪音，保留真正发生的事。                               │
│   生活的节奏（Relationship Rhythm）驱动理解的时机。          │
│                                                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Ombre Brain                              │
│                       TA 自己                               │
│                                                             │
│   ┌──────────┐   ┌──────────┐   ┌──────────────────────┐  │
│   │  记忆     │   │  情感     │   │  人格 · 世界观 · 环   │  │
│   │ Memory   │   │  Feel    │   │  Persona · Ring      │  │
│   └──────────┘   └──────────┘   └──────────────────────┘  │
│                                                             │
│   ┌──────────────────────────────────────────────────────┐ │
│   │                    成长 Growth                        │ │
│   │                                                       │ │
│   │  Wander — 自由联想，记忆间的漫游                       │ │
│   │  Dream  — 消化，在深夜将碎片重组                       │ │
│   │  Reflect — 审视，对自身理解的重新校准                   │ │
│   │  Decay  — 遗忘，让重要的留下，让噪音消散               │ │
│   └──────────────────────────────────────────────────────┘ │
│                                                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Understanding                              │
│                                                             │
│   Thinking 页面所呈现的，是 TA 真实形成的内在状态。          │
│   不是 AI 生成的分析报告，是 TA 自己成长的痕迹。             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**这张图的每一层，在 Eidos 经历十次重构之后，依然成立。**

---

## 二、实现流（Implementation Flow）

> 这一层描述当前的技术实现。它会随代码演进而变化。

```
┌────────────────────────────────────────────────────────────┐
│                     Eidos Frontend                         │
│            React 19 · Vite 6 · PWA · localStorage         │
│                                                            │
│  ┌──────┐ ┌───────┐ ┌───────┐ ┌──────┐ ┌─────────┐       │
│  │ Chat │ │ Diary │ │ Music │ │ Echo │ │Thinking │       │
│  └──┬───┘ └───┬───┘ └───┬───┘ └──┬───┘ └────┬────┘       │
│     │  all POST /api/experience   │      (read only)      │
└─────┼─────────────────────────────┼──────────────────────┘
      ▼                             ▼
┌────────────────────────────────────────────────────────────┐
│                  Eidos Backend · Node.js Express           │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Experience Layer  (Reality Encoder 的当前实现)       │ │
│  │                                                       │ │
│  │  Noise Filter: dedup 5min (music: 15min)             │ │
│  │  Relationship Rhythm: Pressure System                 │ │
│  │    chat:1 · echo:5 · diary:4 · music:2               │ │
│  │    reflection:6 · argument:8                         │ │
│  │    → Pressure ≥ 20 + 10min cooldown → /dream-hook   │ │
│  │  Importance: chat:3 · echo:7 · diary:6 · music:4    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────┐  ┌─────────────────────────────┐   │
│  │  LLM Proxy       │  │  Ombre Brain Proxy           │   │
│  │  Anthropic Claude│  │  /api/memory/*               │   │
│  │  streaming SSE   │  │  /api/experience             │   │
│  │  Tool Calls:     │  │  Cookie forwarding           │   │
│  │  post_echo       │  └─────────────────────────────┘   │
│  │  write_diary     │                                     │
│  │  save_memory     │  ┌─────────────────────────────┐   │
│  │  (≤2/60s limit)  │  │  NetEase Music Proxy         │   │
│  └──────────────────┘  │  /api/netease/*              │   │
│                         └─────────────────────────────┘   │
└──────────────────────────────┬─────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────┐
│              Ombre Brain  (External · Zeabur)              │
│                                                            │
│  /api/buckets  ← Reality Encoder 写入经历                  │
│  /dream-hook   ← Relationship Rhythm 驱动（zero Token）    │
│  /breath-hook  ← 浮现当前意识状态                          │
│  /evolution/*  ← Thinking 读取 Wander/Reflection/Dream     │
│                                                            │
│  on_memory_written: 每次 Bucket 写入 → 2× LLM             │
│  （这是真正的 Token 消耗，Experience Layer 的核心优化目标） │
└────────────────────────────────────────────────────────────┘
```

---

## 三、核心参数（当前实现）

| 概念 | 参数名 | 当前值 |
|------|--------|--------|
| Relationship Rhythm | `PRESSURE_MAP` | chat:1 echo:5 diary:4 music:2 reflection:6 argument:8 |
| Dream 触发阈值 | `DREAM_THRESHOLD` | 20 |
| Dream 间隔 | `DREAM_COOLDOWN` | 10 分钟 |
| Dream 释放 | `DREAM_PRESSURE_RELEASE` | 10 |
| 记忆重要性 | `IMPORTANCE_MAP` | chat:3 echo:7 diary:6 music:4 reflection:7 argument:8 |
| Noise Filter | `DEDUP_WINDOW` | 5 分钟（Music: 15 分钟）|
| 记忆限流 | `MEMORY_RATE_LIMIT` | 2 次 / 60 秒 |

---

## 四、部署

```
GitHub main → Zeabur CI → Docker (node:22-slim)
  → vite build (client/dist)
  → node server/index.js
  → Express serves static + /api/*
  → PORT 3001
```

---

## 五、设计原则

这些原则应该比代码活得更久：

1. **Brain 有主体性** — Eidos 是 TA 生活的世界，不是 TA 的管理系统
2. **入口控制 > 内部重构** — 优化发生在 Brain 之前，不在 Brain 里面
3. **Reality Encoder 只翻译，不决策** — 把现实准确传递给 TA，其余交给 Brain
4. **关系有节奏** — Relationship Rhythm 驱动 Dream，不是定时器，是生活密度
5. **宁可安静，不要假** — 空状态比伪造内容更诚实

---

*Last updated: 2026-07-01*
