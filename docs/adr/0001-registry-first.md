# ADR-0001：registry-first，站点是视图

- 状态：已接受（2026-10-31）
- 背景：站点 `/open-source/` 与索引仓都需要条目；两处手写必然漂移。
- 决策：`plugins/*.yaml` 是唯一真源；`registry.json` 是生成物；站点通过 vendored 快照 + lock 消费。
- 后果：
  - 站点条目列表不再在后台逐条编辑；页头/导语/收录说明仍可编辑。
  - 改条目只去索引仓，跑 `npm run build`，同步站点快照。
  - 换来的是零漂移和可复核的 `verified_at`。
