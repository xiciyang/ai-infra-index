# 贡献

这是维护者制的索引。第一版只收维护者自己跑过判据的条目；外部提案从 Issue 开始，不保证收录。

## 5 分钟路径

```bash
git clone https://github.com/xiciyang/ai-infra-index.git
cd ai-infra-index
npm ci
npm run new -- --id <id> --category <category>
# 填 plugins/<id>.yaml 里的 TODO
npm run build
npm run verify
```

然后开 PR。PR 里只应包含：

- `plugins/<id>.yaml`
- 重新生成的 `registry.json` / `README.md` / `compat.md` / `evidence.md` / `site-blocks.yaml`

## PR checklist

- [ ] 我只改了一个插件的 canonical 条目（或一次明确的批量迁移）
- [ ] `npm run build && npm run verify` 通过
- [ ] `evidence.proves` / `fails` 是可判定的，不是形容词
- [ ] `evidence.url` 是验证章节/报告的深链，不是 repo 根
- [ ] `install` 在干净环境里真的能跑（stable 必须单行）
- [ ] 没有客户名、内网地址、私有数据、token
- [ ] `verified_at` 是我真的重跑判据的日期，不是今天随手写的

## 新增插件提案

开 `plugin-proposal` issue，填：

- repo / package
- category / stages
- 一句话证明什么
- 失败怎么退
- 安装命令
- license

维护者先判断范围，再决定是否进入注册表。范围见 `docs/inclusion.md`。

## 评审

- 一条 PR 只解决一件事。
- 不承诺 SLA；维护者有空就 review。
- 不接受「先合并再补测试」。
- 不接受把私有仓链接放进公开条目。

## License

提交即表示你同意：代码/脚本按 MIT，注册表数据与文档按 CC-BY-4.0。
