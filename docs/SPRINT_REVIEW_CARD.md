# Eidos Sprint Review Card

> 给 GPT 架构师的上下文卡片。不含代码。只含决策与争议。

---

## 1. 今天改了什么

**P0-1 Echo 改名完成**
- `Moment` → `Echo`，全栈替换：前端路由、MODULES、DOCK_APPS、组件名、localStorage key（`bh_moments` → `bh_echoes`）、事件名（`ai-moment` → `ai-echo`）、服务端 Tool（`post_moment` → `post_echo`）
- 品牌名 `Claude Home` → `Eidos`（Settings 关于页 + Echo 顶栏 + 服务端启动日志）

**P0-2 Thinking 只来自 Brain**
- 删除 `generateBio`、`generateSection` 两个独立内容生成函数（共 ~130 行）
- 删除 bio / personality / hobby / values 四个 localStorage 状态
- 删除 "AI 生成简介" 和 "AI 编辑" 按钮
- 新增三个 Brain evolution 区块：Wander（漫游手记）、Reflection（反省记录）、Dream（梦境碎片）
- 页面标题下加了一句原则声明："这里不生产内容。当 Brain 在 Dream、Reflection 或 Memory Association 中形成新的理解时，Thinking 才产生。"
- 未连接 Brain 时显示醒目的黄色警告

**P0-3 统一数据流**
- `post_echo`：执行时同步写入 Brain buckets（`[Echo] content`，tags: echo,回响）
- `write_diary`：执行时同步写入 Brain buckets（`[Diary] title: content`，tags: diary,日记）
- `save_memory`：已有，保持不变
- Chat 对话结束时：自动将最近一轮摘要写入 Brain（`[Chat] 用户: ... | AI: ...`，importance: 4）
- Music 切歌时：自动将当前歌曲写入 Brain（`[Music] 正在听: title — artist`，importance: 3）
- Echo 用户评论时：将互动写入 Brain（`[Echo 评论] 对"..."回应: ...`，importance: 4）

**音乐源替换**
- 酷狗全部移除（`/api/kugou/*` 三个端点 + 前端全部引用）
- 替换为网易云音乐（`/api/netease/search` + `/api/netease/url` + `/api/netease/detail`）
- 原因：酷狗播放 URL API 返回 `err_code: 30020`（版权限制），所有歌曲都拿不到播放地址

---

## 2. 为什么这样改

**Echo 改名**：Moment 暗示"社交媒体动态"，Echo 才是"共同生活的痕迹"。名字即产品语言。

**Thinking 去独立生成**：原来 ThinkingPage 有 `generateBio`（让 AI 写社交简介）和 `generateSection`（让 AI 编造性格/爱好/信条）。这违反了 Eidos 的核心原则——Thinking 只在 Brain 真正形成新理解时才产生，不应该让 AI 凭空生成"看起来像理解的东西"。

**统一数据流**：原来五个空间各管各的 localStorage 状态，Chat 写 dream hook 但日记和回响从不进入 Brain。现在所有 Tool 产出都写入 Brain，Brain 可以在 Dream/Wander/Reflection 中消化这些内容，产生跨空间的深层理解。

---

## 3. 争议点

**⚠️ Brain 写入频率 vs 2G VPS 内存**
现在每次 Chat 结束、每次切歌、每次发回响、每次写日记都写入 Brain。如果用户高频聊天，短时间内会产生大量低 importance 的 bucket 条目。2G VPS 上 Ombre Brain 的内存/磁盘压力需要评估。

**⚠️ Token 消耗**
Chat 结束时写入 Brain 的是"最近一轮对话的截断摘要"（各 200 字），不是全文。这比把整段对话灌进去温和得多。但 Dream/Wander/Reflection 触发时 Brain 内部是否有 LLM 调用？如果有，频繁触发 dream-hook 会消耗额外 token。

**⚠️ Music 写入 Brain 是否必要？**
当前每切一首歌就写一条 `[Music] 正在听: ...` 到 Brain（importance: 3）。这对 Brain 的 Dream/Reflection 有价值（让 AI 知道用户喜欢什么音乐），但如果用户频繁切歌，会产生大量低价值条目。

**⚠️ Echo 页面的硬编码 demo 数据**
EchoPage 仍有 `const posts = [{ id: 1, content: '今天阳光真的很好 #日常 #阳光', ... }]` 作为演示数据。这违反了 MANIFESTO 的"不给预设内容"原则。

---

## 4. 建议方案

**Brain 写入节流**
- Chat 摘要：不是每轮都写，而是累积 3-5 轮对话后，让 AI 生成一段"关系进展摘要"再写入 Brain（减少条目数，提高每条质量）
- Music：不是每切歌就写，而是用户在同一首歌停留超过 30 秒才写入（过滤误触/快速切歌）
- Echo 评论：保持现状（频率低，价值高）

**Brain 容量管理**
- 建议 Ombre Brain 增加 importance-based TTL：importance ≤ 3 的条目 7 天后自动清理
- 或者 Brain 端做定期 compaction：将多条低 importance 条目合并为一条摘要

**Token 控制**
- Dream hook 目前是 Chat 结束时自动触发 `fetch('/api/memory/dream')`。建议改为：连续对话 ≥ 10 轮 或 距上次 dream ≥ 30 分钟 时才触发
- 这样既减少 Brain 内部 LLM 调用，又避免频繁 dream 产出碎片化理解

---

## 5. 希望 GPT 帮忙做的产品/架构决策

**Q1：Brain 是"全量记录"还是"选择性记录"？**
当前设计是"所有都写进去，让 Brain 自己消化"。但 2G VPS 限制下，是否应该改为"只写 importance ≥ 5 的内容"，低价值互动不进 Brain？

**Q2：Dream hook 的触发策略？**
Chat 结束时自动触发 dream 是否合理？还是应该做成定时任务（每小时一次）？这对 token 消耗和 Brain 产出质量影响很大。

**Q3：Echo 页面是否应该完全由 Brain 驱动？**
目前 Echo 内容来源：1) AI 通过 Tool Call 发布；2) 硬编码 demo 数据。是否应该让 Echo 直接从 Brain buckets 中读取带 `echo` tag 的条目？这样 Echo 就是 Brain 的一个"只读视图"，而不是另一个独立状态。

**Q4：五个空间的"写入 Brain"是否应该是显式的？**
当前是隐式写入（切歌自动写、聊天自动写）。从"我允许你成为你"的核心理念出发，是否应该让用户决定什么进入 Brain？还是信任 AI 的判断（通过 Tool Call 的 save_memory）？

**Q5：Music 页面与 Brain 的关系应该是什么？**
Music 是唯一一个没有"内容"的页面（只有音频流）。让 Brain 知道"用户在听什么"有价值吗？还是 Music 应该纯粹是感官空间，不跟 Brain 发生关系？
