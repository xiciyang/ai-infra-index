#!/usr/bin/env node
import { buildArtifacts, checkArtifacts, staleEntries } from './lib.mjs';

const WITH_LINKS = process.argv.includes('--links');
const STRICT = process.argv.includes('--strict');

function statusOf(res) {
  return `${res.status}${res.statusText ? ` ${res.statusText}` : ''}`;
}

function githubTarget(url) {
  try {
    const u = new URL(url);
    if (u.hostname !== 'github.com') return null;
    const [owner, repo] = u.pathname.split('/').filter(Boolean);
    if (!owner || !repo) return null;
    return { owner, repo: repo.replace(/\.git$/, ''), anchor: u.hash ? decodeURIComponent(u.hash.slice(1)) : '' };
  } catch {
    return null;
  }
}

const UA = 'ai-infra-index/1.0 (+https://xiciyang.com)';
const headers = (extra = {}) => ({
  'user-agent': UA,
  ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  ...extra,
});

async function checkUrl(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const gh = githubTarget(url);
    // github.com itself is blocked in some networks; the API is the stable
    // machine-readable surface. Use it for repo existence + README anchor.
    const target = gh
      ? `https://api.github.com/repos/${gh.owner}/${gh.repo}`
      : url;
    const accept = gh ? 'application/vnd.github+json' : '*/*';
    let res = await fetch(target, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: headers({ accept }),
    });
    if (!res.ok) throw new Error(statusOf(res));

    if (gh?.anchor) {
      const readme = await fetch(`https://api.github.com/repos/${gh.owner}/${gh.repo}/readme`, {
        redirect: 'follow',
        signal: ctrl.signal,
        headers: headers({ accept: 'application/vnd.github.raw' }),
      });
      if (!readme.ok) throw new Error(`README ${statusOf(readme)}`);
      const text = await readme.text();
      // GitHub anchors slugify headings: lowercase + spaces -> hyphens.
      // Compare both the raw anchor (Chinese headings stay as-is) and the
      // hyphen-expanded form (English headings).
      const expanded = gh.anchor.replace(/-/g, ' ');
      const hit = text.includes(gh.anchor) || text.toLowerCase().includes(expanded.toLowerCase());
      if (!hit) throw new Error(`README 里没有锚点「${gh.anchor}」`);
    }
    return null;
  } catch (err) {
    return err.name === 'AbortError' ? 'timeout' : String(err.message || err);
  } finally {
    clearTimeout(timer);
  }
}

const failures = [];
const warnings = [];

let built;
try {
  built = buildArtifacts();
} catch (err) {
  console.error(`✗ ${err.message || err}`);
  for (const w of err.warnings ?? []) console.warn(`  ⚠ ${w}`);
  process.exit(1);
}

const { plugins } = built;
warnings.push(...built.warnings);

const stale = checkArtifacts(built.artifacts);
if (stale.length) {
  failures.push(`生成物与源不一致：${stale.join('、')}（跑 npm run build）`);
}

const staleRows = staleEntries(plugins);
if (staleRows.length) {
  const msg = staleRows.map(({ plugin, age }) => `${plugin.id}（${age} 天）`).join('、');
  if (STRICT) failures.push(`超期未验证：${msg}`);
  else warnings.push(`超期未验证：${msg}（用 npm run stale 看报告）`);
}

if (WITH_LINKS) {
  console.log(`  检查 ${plugins.length * 2} 个外链 …`);
  const checks = [];
  for (const p of plugins) {
    checks.push([`${p.id} repo`, p.repo]);
    checks.push([`${p.id} evidence`, p.evidence.url]);
  }
  const results = await Promise.all(checks.map(async ([label, url]) => [label, url, await checkUrl(url)]));
  for (const [label, url, err] of results) {
    if (err) failures.push(`链接不可达：${label} → ${url}（${err}）`);
  }
}

if (warnings.length) {
  for (const w of warnings) console.warn(`  ⚠ ${w}`);
}
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error(`\n✗ 校验失败（${failures.length} 项）`);
  process.exit(1);
}

console.log(
  `✓ ${plugins.length} 条通过：schema / 分类 / 唯一性 / 生成物${WITH_LINKS ? ' / 外链' : ''}` +
    `${warnings.length ? `（${warnings.length} 条提醒）` : ''}`,
);
