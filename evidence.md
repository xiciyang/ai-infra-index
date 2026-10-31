# 证据台账

> 由 `npm run build` 从 `plugins/*.yaml` 的 `evidence` 字段生成。`verified_at` 只在维护者真的重跑判据后更新。

| 条目 | 状态 | 证明了什么 | 失败怎么退 | 证据 | 最后验证 |
|---|---|---|---|---|---|
| inference-serving | 稳定 | 端点可达 + 三段健康检查 | 内存→并发→精度→端口逐级降级，最后回滚 | [链接](https://github.com/xiciyang/inference-serving#健康检查三关) | 2026-10-20（xiciyang） |
| inference-quantization | 稳定 | 精度退化与真实吞吐两道独立验收 | 按精度档位降级，不把「看起来没掉点」当通过 | [链接](https://github.com/xiciyang/inference-quantization#三道硬门禁) | 2026-10-20（xiciyang） |
| inference-tuning | 稳定 | 双闭环验证 + 分子分母只认本机实测 | 规格书峰值硬拒绝，失败自动回退 | [链接](https://github.com/xiciyang/inference-tuning#精度回归契约) | 2026-10-20（xiciyang） |
| inference-diagnose | 稳定 | 带反证条件的原因排序 | 只补采缺失的探针，不把整轮证据重跑一遍 | [链接](https://github.com/xiciyang/inference-diagnose#兼容与门禁) | 2026-10-20（xiciyang） |
| training-sft | 稳定 | 数据 / 训练 / 合并 / 验收 / 回退哈希链 | 任一阶段验收不成立即回退 | [链接](https://github.com/xiciyang/training-sft#测试) | 2026-10-20（xiciyang） |
| training-rl | 稳定 | 收益真实 + KL 未失控 + 单一判据实现 | 奖励或 KL 不成立即回退 | [链接](https://github.com/xiciyang/training-rl#测试) | 2026-10-20（xiciyang） |
| training-qat | 稳定 | checkpoint 可被量化流程消费 + 拒收假通过 | 量化消费或精度门禁不成立即回退 | [链接](https://github.com/xiciyang/training-qat#测试) | 2026-10-20（xiciyang） |
| training-pretrain | 稳定 | 权重真的变了 + 格式没有崩 | 任一项不成立即回退 | [链接](https://github.com/xiciyang/training-pretrain#测试) | 2026-10-20（xiciyang） |
| ai-infra-core | 稳定 | 测量有效性 / 无泄漏切分 / 审计链可复算 | 证明不成立时抛错，不返回数字 | [链接](https://github.com/xiciyang/ai-infra-core#run-the-contracts) | 2026-10-20（xiciyang） |

