# ADR-0005：站点消费 vendored 快照

- 状态：已接受（2026-10-31）
- 背景：站点是静态构建；构建时联网读 registry 会增加一个失败点。
- 决策：索引仓生成 `registry.json` + `site-blocks.yaml`；站点把两者 vendor 进 `src/data/`，并用 `registry.lock.json` 记录 sha256 与版本 tag。
- 后果：
  - 站点构建离线、可复现。
  - 同步靠 `scripts/sync-plugins.mjs`；`verify:plugins` 校验 hash 与条目一致。
  - 索引仓 release 后需要一次显式同步，不会「自动神奇更新」。
