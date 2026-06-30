# Eidos Sprint Review Card v2

> 给 GPT 架构师。不含代码。只含决策与争议。

---

## 1. 今天改了什么

**Echo 改名（P0-1）**  
Moment → Echo，全栈替换：路由、组件、localStorage key、事件名、服务端 Tool。品牌名 Claude Home → Eidos。

**Thinking 只来自 Brain（P0-2）**  
删除 `generateBio`、`generateSection` 两个独立 AI 生成函数（~130 行）。删除 bio/personality/hobby/values 四个 localStorage 状态和对应"AI 编辑"按钮。Thinking 现在只渲染 Brain 三个 evolution 区块：Wander（漫游手记）、Reflection（反省记录）、Dream（梦境碎片）。未连接 Brain 时显示黄色警告。

**音乐源替换**  
酷狗全删（播放 URL API 返回 err_code 30020，版权限制全部歌曲不可用）。替换为网易云音乐（search + url + detail 三个端点均可用）。

**Experience Layer（新架构）**  
在所有页面和 Ombre Brain 之间增加一层。页面不再直接写 Brain buckets。所有事件先变成 Experience，POST 到 `/api/experience`，由 Layer 的 Rule Engine 裁决后决定：忽略、写入 Bucket、或触发 Dream。Dream 触发有 30 分钟冷却期。

**Brain Scheduler 设计（未实现，仅文档）**  
`docs/OMBRE_SCHEDULER_DESIGN.md`。核心：Pending Queue 暂存事件，Rule Engine 零 Token 判断，批量 Dream（N 条经历 → 1 次综合理解）。预估 Token 节省 60%，Bucket 条目减少 82%。

---

## 2. 为什么这样改

**Echo 改名**：Moment 暗示"社交媒体动态"。Echo 是"共同生活的痕迹"。产品语言即产品灵魂。

**Thinking 去独立生成**：原来的 generateBio/generateSection 让 AI 凭空编造性格、爱好、信条，违反 Eidos 核心原则——Thinking 只在 Brain 真正形成新理解时才产生，不应该"看起来像理解的东西"。

**Experience Layer**：五个空间各自直接写 Brain 导致两个问题：1) Bucket 膨胀（每次聊天、每首歌曲、每条评论都写一条），2) Dream 过频触发（importance ≥ 6 就触发，每天 8 次以上）。在 2G VPS 上不可持续。Layer 的职责是：先变成 Experience，再由 Brain 判断是否值得理解。

**Scheduler 设计**：Brain 的职责不是记录事件，是理解经历。理解是昂贵的（Token），不应该每发生一件事就理解一次。应该积累足够的经历后，才值得花 Token 去理解。

---

## 3. 争议点

**⚠️ Experience Layer 是否应该有自己的持久化？**  
当前 experienceBuffer 是纯内存，服务器重启则丢失。在 2G VPS 上是否应该写 SQLite？还是接受"重启前的未理解经历被丢弃"？

**⚠️ Dream Hook 是否需要改造？**  
当前 Ombre Brain 的 `/dream-hook` 可能只读最近 1 条 Bucket 然后 LLM 推理。Scheduler 需要把 Batch Text（多条经历合并）传入 Dream，但 Brain 的 API 是否支持这种输入？如果不支持，Scheduler 无法实现批量 Dream。

**⚠️ Echo 页面的 demo 数据**  
仍有 `const posts = [{ content: '今天阳光真的很好 #日常 #阳光' }]` 硬编码。违反"不给预设内容"原则，但删掉后首次进入 Echo 页面会是空白。

**⚠️ save_memory 绕过 Queue 的合理性**  
AI 主动保存直接写 Brain，不进 Pending Queue。这是否意味着 AI 的判断总是对的？如果 AI 在一次闲聊中频繁调用 save_memory（比如存了 10 条"重要"记忆），Bucket 仍然会膨胀。

**⚠️ 24 小时丢弃规则是否太激进**  
用户如果一天没打开 Eidos，所有 priority ≤ 1 的 Pending 经历被丢弃。但有些经历可能三天后回头看才有意义（比如连续三天听同一首歌，第三天才形成"偏好"理解）。

---

## 4. 建议方案

**Experience 持久化**：不写 SQLite。2G VPS 的磁盘 I/O 更珍贵。接受内存丢失，但加一条规则：服务器启动时检查 Brain 最近的 Dream 产出时间，如果 > 6 小时，立即触发一次 Dream（消费可能的遗留事件）。实际效果：重启约等于一次"睡醒后消化昨晚记忆"。

**Dream Hook 改造**：优先确认 Ombre Brain 的 `/dream-hook` 是否能接收 POST body。如果能，Scheduler 传入 Batch Text。如果不能，Plan B：将 Batch Text 先写入一条高 importance Bucket（`[Batch] ...`），然后触发 `/dream-hook`，Brain 自然会读到这条。

**Echo demo 数据**：删除硬编码。首次空白时显示"当 AI 觉得有值得分享的想法时，这里会出现回响"。空 Echo 比假 Echo 好。

**save_memory 限流**：给 save_memory 加频率限制——同一轮对话中，AI 最多调用 2 次 save_memory。超出则忽略。

**24 小时丢弃 → 渐进衰减**：不是一刀切丢弃，而是 priority 每过 12 小时 +0.5（越老越容易在下次 Dream 中被选中）。7 天后仍无人消费才丢弃。

---

## 5. 希望 GPT 帮忙做的决策

**Q1：Brain API 能力边界**  
Ombre Brain 的 `/dream-hook` 能否接收自定义输入？Reflection 和 Wander 的 API 是否只读还是也能触发？这决定了 Scheduler 是"推模式"（Scheduler 推 Batch Text 给 Brain）还是"拉模式"（Scheduler 只写 Bucket，Brain 自己去读）。

**Q2：Experience 是否需要类型体系？**  
当前类型是 flat string（chat/music/echo/echo_comment/diary）。是否应该引入结构化类型（比如 `{ emotion: string, intensity: number, relationship_relevance: number }`）？这会让 Rule Engine 的裁决更精确，但也增加复杂度。

**Q3：Pending Queue 的阈值是固定值还是自适应？**  
固定 15 条简单，但用户使用频率差异大。高频用户可能半天就 15 条，低频用户三天才 15 条。是否应该基于"经历密度"（条目/小时）来动态调整阈值？

**Q4：Echo 页面应该从 Brain 读取还是继续独立状态？**  
当前 Echo 内容存在 localStorage，不回写 Brain 读取。如果 Echo 变成 Brain 的"带 echo tag 的 Bucket 只读视图"，Brain 产出的理解也能自然出现在 Echo 里（比如 Dream 产出"最近你在反复听周杰伦，似乎在怀念某段时光" → 自动成为 Echo）。但这意味着 Echo 不再是"发布"动作，而是"理解浮现"。这符合 Eidos 的哲学吗？

**Q5：Music 空间的定位**  
Music 是纯感官空间（只听歌，不产生"理解"），还是也是关系空间的一部分（Brain 应该理解"我们在一起时听了什么"）？如果前者，Music 事件不该进 Pending Queue。如果后者，Music 是五种感官通道之一，Brain 应该跨通道理解。
