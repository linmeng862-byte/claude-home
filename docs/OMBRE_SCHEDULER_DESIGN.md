# Ombre Brain Scheduler 设计

> 不写代码。只写设计。
> 目标：在 2G VPS 和有限 Token 下运行。

---

## 0. 核心原则

**Brain 的职责不是记录事件，Brain 的职责是理解经历。**

理解是昂贵的。不应该每发生一件事就调用一次理解。
应该积累足够的经历后，才值得花 Token 去理解。

---

## 1. 当前架构（Before）

```
事件 → Experience Layer 裁决 → 直接写 Brain Bucket
                              → importance ≥ 6 时 → 立即触发 Dream Hook
                              
每次 Dream Hook → Brain 内部可能调用 LLM → 产出理解
```

### 问题

| 问题 | 影响 |
|------|------|
| 每条高 importance Experience 都触发 Dream | Token 消耗不可控 |
| Dream 无队列，触发即执行 | 2G VPS 可能同时跑多个 Dream |
| 普通事件也写 Bucket（importance 3-4） | Bucket 膨胀，2G 内存吃紧 |
| 没有批量理解机制 | 每次 Dream 只消化 1 条，理解碎片化 |

---

## 2. Scheduler 架构（After）

```
事件 → Experience Layer 裁决
                          ↓
                    ┌─────────────┐
                    │ Pending     │  ← 内存中的待理解队列
                    │ Queue       │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         Rule Engine   Priority      Trigger
         (不调 LLM)   评分          检测
              │            │            │
              ▼            ▼            ▼
         直接归档      等待批量      触发 Dream
         写 Bucket     累积          运行
                    ┌───────┐     ┌──────────┐
                    │Batch  │────→│ Dream    │
                    │Buffer │     │ (调 LLM) │
                    └───────┘     └──────────┘
```

---

## 3. 四个组件

### 3.1 Pending Queue

- 内存中的 FIFO 队列，最大 500 条
- 每条 Experience 进入后获得：`{ type, content, source, priority, timestamp }`
- **不写 Brain**。只是等着被理解
- 超过 24 小时未被消费的低 priority 条目自动丢弃

### 3.2 Rule Engine（不调 LLM）

- 纯规则判断，零 Token 消耗
- 规则表：

| 事件类型 | 规则 | 结果 |
|---------|------|------|
| music | 同一首歌 5 分钟内重复 | 忽略 |
| music | 新歌，首听 | 进入 Queue，priority 1 |
| chat | 对话摘要 < 40 字 | 忽略 |
| chat | 对话摘要 ≥ 40 字 | 进入 Queue，priority 2 |
| echo | AI 发布的回响 | 进入 Queue，priority 3 |
| echo_comment | 用户评论 | 进入 Queue，priority 3 |
| diary | AI 写的日记 | 进入 Queue，priority 4 |
| save_memory | AI 主动保存 | 直写 Bucket，不进 Queue |

**save_memory 是唯一绕过 Queue 的路径。** 因为它是 AI 的明确判断，不是隐式事件。

### 3.3 Priority 评分

每条 Experience 的 priority = 基础分 + 时间衰减

```
priority_score = base_priority × (1 + 0.1 × 等待小时数)
```

- 等得越久，priority 越高（不会永远被忽略）
- 但超过 24 小时未消费且 base_priority ≤ 1 的直接丢弃

### 3.4 Trigger（什么时候运行 Dream）

Dream **不**被单条事件触发。只在以下三种情况触发：

| 触发条件 | 说明 | 频率估算 |
|---------|------|---------|
| **Pending 达到阈值** | Queue 中 ≥ 15 条 priority ≥ 2 的条目 | 每天约 1-3 次 |
| **用户打开 Thinking** | 前端请求 `/api/memory/evolution/wander` 时，如果 Pending ≥ 5 条，先 Dream 再返回 | 用户主动，每天约 0-2 次 |
| **重要事件** | AI 通过 Tool Call 显式保存了 importance ≥ 8 的记忆 | 极少，一周 0-1 次 |

触发后：
1. 从 Queue 中取出所有 priority ≥ 2 的条目
2. 合并为一段 Batch Text（不是逐条处理）
3. 将 Batch Text 作为上下文调用一次 Dream
4. Dream 产出一条理解 → 写入 Bucket
5. 清空已消费的 Queue 条目

---

## 4. Dream 运行方式

### Before（当前）

```
每次触发 → Dream 读 1 条 Bucket → LLM 推理 → 产出 1 条理解
```

### After（Scheduler）

```
触发 → 取出 Pending Queue 全部高优先条目
     → 合并为 Batch Text（上限 2000 字，超出截断最旧的）
     → 调用一次 Brain Dream Hook
     → 产出 1 条综合理解
     → 写入 Bucket
     → 已消费条目从 Queue 清除
```

**关键差异**：不是 1 条经历 → 1 次理解，而是 N 条经历 → 1 次综合理解。

---

## 5. 估算对比

### 假设场景：用户每天聊天 20 轮，听歌 5 首，1 次 Echo 评论

| | Before（当前） | After（Scheduler） | 节省 |
|---|---|---|---|
| **Bucket 写入次数/天** | ~28 次（20 chat + 5 music + 1 echo + 2 diary） | ~5 次（1 save_memory + 4 Dream 产出） | **82%** |
| **Dream Hook 触发次数/天** | ~8 次（importance ≥ 6 的 chat/echo/diary） | ~2 次（Queue 满 + 用户看 Thinking） | **75%** |
| **LLM 调用次数/天** | ~8 次（每次 Dream 可能内部调 LLM） | ~2 次 | **75%** |
| **Token 消耗/天** | ~8 × 平均 500 token = ~4000 token | ~2 × 平均 800 token = ~1600 token | **60%** |
| **CPU 峰值** | 多次 Dream 可能并行 | 串行，一次只跑一个 Dream | 显著降低 |
| **内存占用（Brain 端）** | Bucket 日增 ~28 条，月增 ~840 条 | Bucket 日增 ~5 条，月增 ~150 条 | **82%** |
| **Experience Layer 内存** | Buffer 200 条 ~40KB | Queue 500 条 ~100KB + 旧条目自动清理 | 可控 |

### 为什么 After 的 Dream 单次 Token 更高（800 vs 500）

因为 Scheduler 的 Dream 一次消化 Batch Text（多经历合并），上下文更长。但总调用次数大幅减少，所以总 Token 仍然节省 60%。

### 2G VPS 内存估算

| | Before（6 个月运行） | After（6 个月运行） |
|---|---|---|
| Bucket 条目数 | ~5000 条 | ~900 条 |
| Bucket 内存占用 | 估算 ~5MB | 估算 ~1MB |
| Queue 内存占用 | 0 | ~100KB |
| **Brain 总内存压力** | 高（需定期手动清理） | 低（可自动维持） |

---

## 6. 数据流总结

```
┌─────────────────────────────────────────────────┐
│  Experience 进来                                  │
│    ↓                                             │
│  Rule Engine（零 Token）                          │
│    ├── 忽略 → 丢弃                                │
│    ├── save_memory → 直写 Bucket                  │
│    └── 其他 → 进 Pending Queue                    │
│                                                  │
│  Pending Queue（内存，零 Token）                    │
│    ↓                                             │
│  Trigger 检测                                     │
│    ├── Queue ≥ 15 条 → 批量 Dream                │
│    ├── 用户看 Thinking + Queue ≥ 5 → 批量 Dream   │
│    └── 什么都不做 → 继续等                         │
│                                                  │
│  Dream 运行（调 LLM，花 Token）                     │
│    → 取出 Queue 批量                               │
│    → 合并为 Batch Text                            │
│    → 一次调用                                     │
│    → 产出 1 条理解                                 │
│    → 写入 Bucket                                  │
│    → 清除已消费 Queue                              │
│                                                  │
│  Thinking 读取（零 Token，读 Brain 现有数据）        │
│    → Wander / Reflection / Dream 结果             │
└─────────────────────────────────────────────────┘
```

---

## 7. 待决策项

| # | 问题 | 选项 | 建议 |
|---|------|------|------|
| Q1 | Queue 阈值多少合适？ | 10 / 15 / 20 | 15（约等于半天正常使用的积累量） |
| Q2 | 24 小时未消费的低 priority 是否丢弃？ | 是 / 否 | 是。2G VPS 无法无限暂存 |
| Q3 | Dream Hook 是否需要改造？ | 当前 / 改为接收 Batch Text | 需要改造。当前 Brain 的 Dream Hook 可能只读最近 1 条 Bucket，Scheduler 需要把 Batch Text 作为输入传入 |
| Q4 | 用户离线 3 天后回来，累积了大量 Pending，怎么处理？ | 全量 Dream / 只取最近 15 条 | 只取最近 15 条 + priority 最高的 5 条，其余丢弃 |
| Q5 | Reflection 和 Wander 是否也需要 Scheduler？ | 是 / 否 | Wander 不需要（它只读不写）。Reflection 建议也走 Queue 逻辑：只在用户主动请求时触发 |
