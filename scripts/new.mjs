#!/usr/bin/env node
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadTaxonomy, PLUGINS_DIR, ROOT } from './lib.mjs';

const args = process.argv.slice(2);
const get = (name, fallback = '') => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] ?? fallback) : fallback;
};

if (args.includes('--help') || args.includes('-h')) {
  console.log(`用法：
  npm run new -- --id <id> --category <category> [--kind plugin|library] [--status experimental|stable]

可用 category：
${[...loadTaxonomy().categories.values()].map((c) => `  - ${c.id}（${c.group} · ${c.title}）`).join('\n')}
`);
  process.exit(0);
}

const id = get('id');
const category = get('category');
const kind = get('kind', 'plugin');
const status = get('status', 'experimental');

const taxonomy = loadTaxonomy();
const errors = [];
if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) errors.push('--id 必须是 kebab-case（小写字母/数字/连字符）');
if (!taxonomy.categories.has(category)) errors.push(`--category ${category || '(空)'} 不在 taxonomy.yaml`);
if (!['plugin', 'library'].includes(kind)) errors.push('--kind 只能是 plugin 或 library');
if (!taxonomy.statuses.has(status)) errors.push('--status 只能是 experimental / stable / deprecated');
const file = path.join(PLUGINS_DIR, `${id}.yaml`);
if (existsSync(file)) errors.push(`plugins/${id}.yaml 已存在`);
if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`);
  process.exit(1);
}

const install = kind === 'library'
  ? `git clone https://github.com/xiciyang/${id}.git`
  : `dsh plugin --profile <name> add github:xiciyang/${id}`;

const body = `schema: 1
id: ${id}
kind: ${kind}
collection: ai-infra
repo: https://github.com/xiciyang/${id}
package: "@xiciyang/${id}"
summary: TODO 一句话说明它替谁解决哪一步。
category: ${category}
stages: [verify]
status: ${status}
license: MIT
install: "${install}"
compat:
  dsh: ">=0.2.0 <0.3.0"
  node: ">=20"
  os: [linux]
  backends: []
  requires: []
evidence:
  proves: TODO 它能证明什么（可判定的结果，不是形容词）。
  fails: TODO 证明不成立时怎么退（降级 / 回滚 / 报错）。
  url: "https://github.com/xiciyang/${id}#测试"
  verified_at: "TODO"  # 改成你真正重跑判据的日期
  verified_by: xiciyang
maintainers: [xiciyang]
superseded_by: null
aliases: []
`;

writeFileSync(file, body);
console.log(`✓ 已创建 plugins/${id}.yaml`);
console.log('  下一步：替换所有 TODO，确认 stages / license / compat，然后跑：');
console.log('    npm run build && npm run verify');
console.log(`  文件：${path.relative(ROOT, file)}`);
