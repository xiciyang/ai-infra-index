#!/usr/bin/env node
import { buildArtifacts, checkArtifacts, writeArtifacts } from './lib.mjs';

const CHECK = process.argv.includes('--check');

try {
  const { artifacts, warnings, plugins } = buildArtifacts();
  for (const w of warnings) console.warn(`  ⚠ ${w}`);
  if (CHECK) {
    const stale = checkArtifacts(artifacts);
    if (stale.length) {
      console.error(`✗ 生成物与源不一致：${stale.join('、')}`);
      console.error('  跑 `npm run build` 后把生成物一起提交。');
      process.exit(1);
    }
    console.log(`✓ 生成物是最新的（${plugins.length} 条）`);
  } else {
    writeArtifacts(artifacts);
    console.log(`✓ 已生成 ${plugins.length} 条：registry.json / README.md / compat.md / evidence.md / site-blocks.yaml`);
  }
} catch (err) {
  console.error(`✗ ${err.message || err}`);
  for (const w of err.warnings ?? []) console.warn(`  ⚠ ${w}`);
  process.exit(1);
}
