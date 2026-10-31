#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { buildArtifacts, STALE_DAYS, staleEntries, today } from './lib.mjs';

const args = process.argv.slice(2);
const JSON_OUT = args.includes('--json');
const STRICT = args.includes('--strict');
const writeIdx = args.indexOf('--write');
const writeTo = writeIdx >= 0 ? args[writeIdx + 1] : null;

let built;
try {
  built = buildArtifacts();
} catch (err) {
  console.error(`✗ ${err.message || err}`);
  process.exit(1);
}

const rows = staleEntries(built.plugins).sort((a, b) => b.age - a.age);

if (JSON_OUT) {
  const out = rows.map(({ plugin, age }) => ({
    id: plugin.id,
    status: plugin.status,
    verified_at: plugin.evidence.verified_at,
    age_days: age,
    threshold_days: STALE_DAYS[plugin.status],
  }));
  console.log(JSON.stringify(out, null, 2));
} else {
  const lines = [];
  lines.push(`# Stale registry entries · ${today()}`);
  lines.push('');
  if (rows.length === 0) {
    lines.push(`没有超期条目（stable > ${STALE_DAYS.stable} 天 / experimental > ${STALE_DAYS.experimental} 天）。`);
  } else {
    lines.push('以下条目的 `evidence.verified_at` 已超过阈值。重跑判据后更新日期；如果已不再维护，改 `deprecated`。');
    lines.push('');
    lines.push('| 条目 | 状态 | 最后验证 | 已过 | 阈值 |');
    lines.push('|---|---|---|---|---|');
    for (const { plugin, age } of rows) {
      lines.push(
        `| ${plugin.id} | ${plugin.status} | ${plugin.evidence.verified_at} | ${age} 天 | ${STALE_DAYS[plugin.status]} 天 |`,
      );
    }
  }
  const text = lines.join('\n') + '\n';
  if (writeTo) {
    writeFileSync(writeTo, text);
    console.log(`✓ 已写入 ${writeTo}（${rows.length} 条超期）`);
  } else {
    console.log(text);
  }
}

if (STRICT && rows.length) process.exit(1);
