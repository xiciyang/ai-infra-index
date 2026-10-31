# ADR-0002：一条目一文件

- 状态：已接受（2026-10-31）
- 背景：单文件 `registry.yaml` 在条目多、多人/多 PR 时容易冲突，且 review diff 不聚焦。
- 决策：canonical 数据是 `plugins/<id>.yaml`，一条目一文件；聚合由 `build.mjs` 生成。
- 后果：
  - 新增条目 = 加一个文件，不碰别人的行。
  - 需要生成器提供整表视图（README / registry.json）。
  - 文件数会随条目增长；这是可接受的，Git 处理很多小文件没有问题。
