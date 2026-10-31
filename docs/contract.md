# 数据契约

## 一条目一文件

- 路径：`plugins/<id>.yaml`
- `id` 是稳定 slug，只允许小写字母、数字、连字符。
- **`id` 不跟 repo/package 名绑定**。repo 改名、包改名时，保留原 `id`，把旧名写进 `aliases`。
- 文件名必须与 `id` 一致；`verify` 会检查。

## 必填字段

| 字段 | 说明 |
|---|---|
| `schema` | 当前固定 `1` |
| `id` | 稳定 slug |
| `kind` | `plugin` 或 `library` |
| `repo` | 公开 GitHub 仓库 URL |
| `package` | repo 的 `package.json` 里的包名 |
| `summary` | 一句话，给 README / 站点用 |
| `category` | 必须是 `taxonomy.yaml` 里的 category |
| `stages` | 覆盖的生命周期阶段数组 |
| `status` | `experimental` / `stable` / `deprecated` |
| `license` | SPDX 标识 |
| `install` | 可复制的 shell 块；`stable` 必须单行 |
| `compat` | 兼容范围，见下 |
| `evidence` | 判据与验证，见下 |
| `maintainers` | 至少一个 GitHub handle |

可选：`collection`（默认 `ai-infra`）、`order`（同类内排序，默认 100）、`install_note`、`superseded_by`、`aliases`。

## 命名契约

- 新插件包名统一 `@xiciyang/dsh-<name>`；库统一 `@xiciyang/<name>`。
- 历史包名不强制重命名；用 `aliases` 记录旧名，安装命令可以继续用旧路径。
- 仓库名与包名可以不同，但 `package` 必须与 repo 的 `package.json` 一致（`verify:links` 会核对）。

## 安装契约

`install` 是**给读者复制粘贴的**，不是描述。

- `stable`：一条命令，单行，干净机器可执行。
- `experimental`：可以多步，但必须一条块内可执行，并在 `install_note` 说明前提。
- 不写「参考 README」这种非命令内容。

## 兼容契约

`compat` 只填**已验证过**的维度：

```yaml
compat:
  dsh: ">=0.2.0 <0.3.0"
  node: ">=20"
  os: [linux]
  backends: [vllm]
  requires: [gpu, docker]
```

空数组 = 不声明，不等于不支持。`compat.md` 由这些字段生成；不要手工编辑。

## 证据契约

```yaml
evidence:
  proves: 端点可达 + 三段健康检查
  fails: 内存→并发→精度→端口逐级降级，最后回滚
  url: "https://github.com/xiciyang/x#验证章节"
  verified_at: "2026-10-20"
  verified_by: xiciyang
```

- `proves` / `fails` 必须可判定；禁止「高性能」「生产级」这类形容词。
- `url` 必须指向验证章节或报告，不能是 repo 根。
- `verified_at` 只在维护者真的重跑判据后更新；90 天（stable）/ 180 天（experimental）未更新会进 stale 报告。
- `verified_by` 第一版固定 `xiciyang`；未来第三方用 `community:<handle>`。

## 状态

- `experimental`：可用，但可能缺单命令安装、外部复核或不稳定接口。
- `stable`：满足 `docs/inclusion.md` 的五条硬规则。
- `deprecated`：不再维护；必须写 `superseded_by`（有替代品时填 id，没有时先别下线，写清原因再讨论）。

`stale` 不是 status，是运营信号；不要让条目假装年轻。

## Schema 版本

- `schema: 1` 为当前版本。
- 加字段（可选、有默认）是 minor；删字段、改语义、改枚举是 major。
- major 变更必须：ADR + 迁移脚本 + 旧数据一次性转换 + release notes。
- 外部消费者应 pin release 的 `registry.json`，不要直接读 `main`。

## 生成物

`npm run build` 生成并提交：

- `registry.json`：机器可读聚合，确定性排序，无时间戳
- `README.md`：人读目录
- `compat.md` / `evidence.md`：派生的两个视图
- `site-blocks.yaml`：站点 `/open-source/` 的区块快照

生成物不许手改；`npm run verify` 会比对。
