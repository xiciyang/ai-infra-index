# AI Infra Index

> **可核验的 DSH AI 基础设施插件索引**：每条都必须能安装、能证伪、能回退，并标注最后一次验证时间。

**9 条** · 稳定 9 · 实验 0 · 已弃用 0 · 超期未验证 0

机器可读版本：[`registry.json`](./registry.json)。兼容性矩阵：[`compat.md`](./compat.md)。证据台账：[`evidence.md`](./evidence.md)。

> 首版条目的 `verified_at` 暂取自各仓库最后提交日（2026-10-20），公开发布前需逐条重跑判据后更新；见 [`ADR-0006`](./docs/adr/0006-initial-verified-at-seed.md)。

## 范围

**收**：推理交付（部署 / 量化 / 调优 / 排障）、训练（SFT / RL / QAT / 预训练）、判定与测量原语。

**不收**：Agent 记忆、写作 / PPT / 评审套件、与 AI 基础设施无关的效率工具。它们在站点 [`/open-source/`](https://xiciyang.com/open-source/) 的其他分组里，不混进这份注册表。

## 快速使用

```bash
git clone https://github.com/xiciyang/ai-infra-index.git
cd ai-infra-index && npm ci
npm run verify        # schema + 分类 + 生成物一致性
npm run build         # 重新生成 registry.json / README / compat / evidence
npm run verify:links  # 可选：用 GitHub API 核对 repo 与证据锚点（限流时加 GITHUB_TOKEN=$(gh auth token)）
npm run stale         # 可选：查看超期未验证条目
```

新增一条：`npm run new -- --id <id> --category <category>`，填完跑 `npm run build && npm run verify`。

## 收录标准

一条条目要进 `stable`，必须同时满足：

1. 一条可复制的安装命令在干净机器上能装好；
2. 有自动化测试或 contract，CI 绿；
3. README 写清「证明什么、失败怎么退」；
4. 有 SPDX license；
5. 维护者 90 天内亲自跑过判据（`evidence.verified_at` 是承诺，不是文件时间）。

缺任何一条 → `experimental`；归档 / 被替代 → `deprecated`，保留条目并写 `superseded_by`。完整规则见 [`docs/inclusion.md`](./docs/inclusion.md)。

字段、安装、证据与状态的约定见 [`docs/contract.md`](./docs/contract.md)；分类法见 [`docs/taxonomy.md`](./docs/taxonomy.md)；设计决策见 [`docs/adr/`](./docs/adr/)。

## 推理交付

从把模型装起来，到量化、调优、排障 —— 四步各一件，每件都守着同一条底线：数字要成立。

| 条目 | 分类 | 状态 | 证明了什么 | 安装 | 最后验证 |
|---|---|---|---|---|---|
| [inference-serving](./plugins/inference-serving.yaml) | 推理服务 | 稳定 | 端点可达 + 三段健康检查 | `dsh plugin --profile <name> add @xiciyang/inference-serving` | 2026-10-20 |
| [inference-quantization](./plugins/inference-quantization.yaml) | 量化 | 稳定 | 精度退化与真实吞吐两道独立验收 | `dsh plugin --profile <name> add github:xiciyang/inference-quantization` | 2026-10-20 |
| [inference-tuning](./plugins/inference-tuning.yaml) | 调优 | 稳定 | 双闭环验证 + 分子分母只认本机实测 | `git clone https://github.com/xiciyang/inference-tuning.git && cd inference-tuning && npm pack && dsh plugin --profile <name> add ./xiciyang-inference-tuning-0.1.0.tgz` | 2026-10-20 |
| [inference-diagnose](./plugins/inference-diagnose.yaml) | 排障 | 稳定 | 带反证条件的原因排序 | `git clone https://github.com/xiciyang/inference-diagnose.git && cd inference-diagnose && bash scripts/build.sh && dsh plugin --profile <name> add .` | 2026-10-20 |

## 训练

真实 GPU 上的四段训练。每段都要求可被证伪的证据，而不是「loss 曲线看着不错」。

| 条目 | 分类 | 状态 | 证明了什么 | 安装 | 最后验证 |
|---|---|---|---|---|---|
| [training-sft](./plugins/training-sft.yaml) | 训练 | 稳定 | 数据 / 训练 / 合并 / 验收 / 回退哈希链 | `dsh plugin add github:xiciyang/training-sft` | 2026-10-20 |
| [training-rl](./plugins/training-rl.yaml) | 训练 | 稳定 | 收益真实 + KL 未失控 + 单一判据实现 | `dsh plugin add github:xiciyang/training-rl` | 2026-10-20 |
| [training-qat](./plugins/training-qat.yaml) | 训练 | 稳定 | checkpoint 可被量化流程消费 + 拒收假通过 | `dsh plugin add github:xiciyang/training-qat` | 2026-10-20 |
| [training-pretrain](./plugins/training-pretrain.yaml) | 训练 | 稳定 | 权重真的变了 + 格式没有崩 | `dsh plugin add github:xiciyang/training-pretrain` | 2026-10-20 |

## 判定与测量

一个零依赖的判定原语库，管的是更前面一件事：这个数字到底成不成立。

| 条目 | 分类 | 状态 | 证明了什么 | 安装 | 最后验证 |
|---|---|---|---|---|---|
| [ai-infra-core](./plugins/ai-infra-core.yaml) | 判定原语 | 稳定 | 测量有效性 / 无泄漏切分 / 审计链可复算 | `git clone https://github.com/xiciyang/ai-infra-core.git` | 2026-10-20 |

## 兼容性与证据

- [`compat.md`](./compat.md)：DSH / Node / OS / 后端 / 硬件要求。
- [`evidence.md`](./evidence.md)：每条证明什么、失败怎么退、证据链接、最后验证时间。
- [`site-blocks.yaml`](./site-blocks.yaml)：xiciyang.com `/open-source/` 的分组快照（站点内部消费）。

## 任务与缺口

用 Issues 管理，不另建系统：

- `task`：具体交付任务（客户信息请脱敏；敏感信息放私有仓）。
- `plugin-proposal`：新插件提案。
- `gap`：公开的已知缺口，例如「缺 vLLM 以外的后端适配」。
- `bug`：索引数据、生成器或站点展示问题。

## License

代码与脚本：MIT。注册表数据与文档：CC-BY-4.0。每个被收录条目仍按其自身 license 分发。

