# 收录标准

这份索引的价值在**筛**，不在全。每条被收录的条目都必须能被外部读者复核；做不到就不要收。

## 范围

**收**：

- 推理交付：部署、量化、调优、排障
- 训练：SFT、RL、QAT、继续预训练
- 判定与测量原语：测量有效性、无泄漏切分、审计链、沙箱探针

**不收**：

- Agent 记忆、工具调用、工作流编排
- 写作 / PPT / 评审 / 配图等效率套件
- 与 AI 基础设施无关的通用库
- 私有仓库、客户定制代码、不能公开的证据

这些内容可以留在 [xiciyang.com/open-source](https://xiciyang.com/open-source/) 的其他分组，但不进这份注册表。

## 进 `stable` 的五条硬规则

1. **一条可复制的安装命令**在干净机器上能装好。`stable` 不接受多行步骤；`experimental` 可以，但必须在 `install_note` 里写清。
2. **有自动化测试或 contract**，CI 绿。没有测试的条目不进注册表，最多先在站点展示。
3. **README 写清两件事**：它证明了什么（可判定的结果），证明不成立时怎么退（降级 / 回滚 / 报错）。
4. **有 SPDX license**。
5. **维护者 90 天内亲自跑过判据**。`evidence.verified_at` 是承诺，不是文件 mtime；改 README 不许顺手更新它。

缺任何一条 → `experimental`。归档、失联、被替代 → `deprecated`，保留条目并写 `superseded_by`。

## 正例

- `inference-serving`：一条 `dsh plugin add` 安装；README 有健康检查三关与降级链；MIT；`verified_at` 在 90 天内。
- `ai-infra-core`：`kind: library`，安装是 `git clone`；七个包各有 `CONTRACT.md` 与测试；BSD-3-Clause。
- `training-qat`：明确写了「拒绝把看起来没掉点当成验收通过」——这是可证伪的判据，不是形容词。

## 反例

- **无测试**：只有 README 和示例，不能进。
- **多步安装且没说明**：`git clone` + 改配置 + 手动拷文件，且没有 `install_note`。先降到 `experimental`，或做成一条命令。
- **证据链接指向仓库根**：`evidence.url` 必须是验证章节/报告的深链，不能只写 repo URL。
- **只有营销词**：`proves: 高性能、易用、生产级` —— 不可判定，退回重写。
- **客户定制代码**：公开仓库里带客户名、内网地址、私有数据，直接拒收。

## 隐私

- 公开 Issues 里不写客户名、合同信息、内网路径、未公开数据。
- 客户任务卡放私有仓 / 私有 Project；公开侧只留脱敏后的 `gap`，例如「缺 vLLM 以外的后端适配」。
- PR 模板有隐私 checklist，合并前人工复核。

## 提议流程

1. 开 `plugin-proposal` issue，填 repo、category、proves、fails、install。
2. 维护者先做范围判断（是不是 AI 基础设施）。
3. 按模板加 `plugins/<id>.yaml`，跑 `npm run build && npm run verify`。
4. PR 通过后，条目进入 `experimental`；满足五条硬规则后再改 `stable`。

维护者对收录有最终决定权；不接受「先收进来再说」。
