# Eidos v0.1 Sprint Checklist

> 架构已收敛。不再讨论新架构。所有工作围绕已确定的原则执行。
> 最终目标：**交付一个稳定、真实、可以继续迭代的 Eidos v0.1。**

---

## 原则确认

1. **不修改 Ombre Brain** — 所有优化在 Brain 之前完成
2. **不新增大型功能** — 修修补补，不造新轮子
3. **Experience Layer = 轻转换层** — 翻译 + Noise Filter，不是 Brain
4. **减少无意义 Bucket 写入** — on_memory_written 每次触发 2 次 LLM，这是真正的 Token 消耗
5. **Bucket 保持稀缺** — 真正重要的记忆应该被珍惜

---

## ✅ 已完成

| # | 任务 | Commit | 说明 |
|---|------|--------|------|
| 1 | Experience Layer 统一入口 | d68d552 | 全部走 `/api/experience`，不散落各页面 |
| 2 | Pressure 系统 | d68d552 | chat:1 echo:5 diary:4 music:2 reflection:6 argument:8 |
| 3 | Noise Filter (dedup) | d68d552 | 5分钟窗口，同类型同内容不重复写入 |
| 4 | Echo 哲学修正 | d68d552 | Tool desc: "表达欲"不是"发动态"，文案"说了" |
| 5 | 删除 Demo 数据 | d68d552 | Echo 假帖子删除，Diary 3条假日记删除 |
| 6 | save_memory 限流 | 1ae4d17 | 60秒内同一用户最多2次 |
| 7 | Importance 按类型默认值 | 1ae4d17 | chat→3 echo→7 diary→6 music→4 reflection→7 argument→8 |
| 8 | Echo rename (Moment→Echo) | 之前完成 | 全部页面、状态、事件、Tool |
| 9 | Thinking 只从 Brain 读取 | 之前完成 | Wander/Reflection/Dream，不再 AI 编造 |
| 10 | 统一数据流 | 之前完成 | 5个空间全部通过 Experience Layer |
| 11 | Kugou → NetEase 替换 | d9a8d9b | 完整搜索+播放+封面链路 |

---

## 🔲 待完成

### P0 — 必须完成才能叫 v0.1

| # | 任务 | 为什么做 | 预计耗时 | 风险 | 影响 Brain |
|---|------|----------|----------|------|-----------|
| P0-1 | **确认 NetEase 音乐搜索在线上生效** | 用户搜不到歌是阻断性问题。API 已验证可用，问题在于部署未更新 | 5 min | 低（只需确认 Zeabur 重新部署） | ❌ |
| P0-2 | **清理 localStorage 旧 key** | `bh_moments` 已改为 `bh_echoes`，但用户浏览器里可能还有旧 key 的数据残留，导致 Echo 页面显示异常 | 10 min | 低 | ❌ |
| P0-3 | **ThinkingPage Brain 未连接时的空状态** | 目前如果 Brain 未连接，只显示警告文字。应该有更友好的引导（"连接 Brain 后可以查看思维过程"） | 15 min | 低 | ❌ |

### P1 — 应该完成，让 v0.1 更稳定

| # | 任务 | 为什么做 | 预计耗时 | 风险 | 影响 Brain |
|---|------|----------|----------|------|-----------|
| P1-1 | **Music Listening Session（简化版）** | 目前每次切歌都写 Bucket（通过 Experience），浪费 Token。简化方案：同类型 music 的 dedup 窗口从 5min 改为 15min，这样快速切歌不会写入 | 10 min | 低 | ✅ 减少 Bucket 写入 |
| P1-2 | **前端 build 并推送 dist** | 本地 dist 是旧的（01:27 build），用户本地没有 Node 无法 build。需要确保 Zeabur 自动 build，或找到其他方式 | 5 min | 低 | ❌ |
| P1-3 | **save_memory 限流提示文案优化** | 被限流时 AI 收到 "这轮对话已经保存了足够多的记忆"，AI 应该把这个信息自然地传达给用户，而不是报错感 | 5 min | 低 | ❌ |
| P1-4 | **Echo 空状态引导** | 删除了 Demo 后，Echo 页面完全空白。应该有空状态引导："等待 TA 想说什么" | 15 min | 低 | ❌ |
| P1-5 | **Diary 空状态引导** | 同上，Diary 空白时应有引导："开始写第一篇日记" | 10 min | 低 | ❌ |

### P2 — 有余力再做

| # | 任务 | 为什么做 | 预计耗时 | 风险 | 影响 Brain |
|---|------|----------|----------|------|-----------|
| P2-1 | **Music Listening Session（完整版）** | GPT 提出的 Session 概念：连续播放20-30分钟才生成 Listening Experience。需要前端追踪播放时长、循环次数 | 1-2 hour | 中（前端改动大） | ✅ 大幅减少 Bucket 写入 |
| P2-2 | **Pressure 持久化** | 当前 pressure 是全局变量，重启归零。可考虑 JSON 文件持久化 | 20 min | 低 | ❌ |
| P2-3 | **Experience Layer 日志** | 记录哪些 Experience 被过滤、哪些被写入、Pressure 变化，方便调试 | 30 min | 低 | ❌ |

---

## 关键数字

- **on_memory_written = 每次 Bucket 写入触发 2 次 LLM 调用**（detect_slang + extract_encyclopedia）
- **Dream Hook = 零 Token**（只是读最近 10 个 Bucket）
- **Pressure 系统**: ≥20 触发 Dream，10min 冷却，释放 10 压力
- **save_memory 限流**: 60 秒内同一用户最多 2 次
- **dedup 窗口**: 5 分钟（Music 建议改为 15 分钟）

---

## 今晚的总目标

**不是功能最多，而是交付一个稳定、真实、可以继续迭代的 Eidos v0.1。**

宁可安静，不要假。
