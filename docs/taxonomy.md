# 分类法

三套维度是正交的，不要混：

- `category`：**是什么**（推理服务 / 量化 / 调优 / 排障 / 训练 / 判定原语）
- `stages`：**在生命周期哪一步**（探测 / 部署 / 量化 / 调优 / 训练 / 诊断 / 验收 / 回退 / 观测）
- `status`：**成熟度**（实验 / 稳定 / 已弃用）

一个 `inference-serving` 条目可以是：

```yaml
category: serving
stages: [probe, deploy, verify, rollback]
status: stable
```

这三行分别回答三个问题，不重复。

## groups

`group` 是**展示层**的粗分组，只用于 README / 站点分区。当前：

| group | 标题 | 包含 category |
|---|---|---|
| `inference` | 推理交付 | serving / quantization / tuning / diagnosis |
| `training` | 训练 | training |
| `foundations` | 判定与测量 | primitives |

站点的三个分组与这里一一对应。新增 group 要同时改站点渲染（或让站点按 group 自动生成）。

## 新增 category / stage

1. 先开 issue，说明为什么现有分类放不下。
2. 写一页 ADR（`docs/adr/`），记录边界与反例。
3. 在 `taxonomy.yaml` 追加，**只增不改**；旧 ID 永远保留。
4. 跑 `npm run build && npm run verify`，确认站点分组仍能渲染。

不要为了一个条目造一个新 category。宁可先放进现有分类，等第二个同类条目出现再拆。
