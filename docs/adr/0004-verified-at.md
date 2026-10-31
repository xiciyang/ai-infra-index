# ADR-0004：`verified_at` 是承诺

- 状态：已接受（2026-10-31）
- 背景：README 的「已验证」如果只是文件时间或发布日，会变成装饰。
- 决策：`evidence.verified_at` 只在维护者真的重跑判据后更新；stable 90 天、experimental 180 天未更新进 stale 报告。
- 后果：
  - 时间会「变旧」，这是特性不是 bug。
  - 过期条目会出现在 `npm run stale` 和每月 workflow 里。
  - 改 README、改摘要、改安装命令都不许顺手 bump 这个日期。
