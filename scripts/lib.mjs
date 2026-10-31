// Shared loaders, validators and renderers for the AI Infra Index.
//
// Design rules:
//   · Canonical data is one file per plugin under plugins/.
//   · Everything else (registry.json, README.md, compat.md, evidence.md,
//     site-blocks.yaml) is generated and checked in.
//   · Output must be deterministic: no timestamps, stable ordering.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';
import Ajv from 'ajv';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PLUGINS_DIR = path.join(ROOT, 'plugins');
export const TAXONOMY_PATH = path.join(ROOT, 'taxonomy.yaml');
export const SCHEMA_DIR = path.join(ROOT, 'schema');
export const OUTPUTS = {
  registry: path.join(ROOT, 'registry.json'),
  readme: path.join(ROOT, 'README.md'),
  compat: path.join(ROOT, 'compat.md'),
  evidence: path.join(ROOT, 'evidence.md'),
  siteBlocks: path.join(ROOT, 'site-blocks.yaml'),
};

export const STALE_DAYS = { stable: 90, experimental: 180 };

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function daysSince(date) {
  const then = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(then)) return Infinity;
  return Math.floor((Date.now() - then) / 86_400_000);
}

export function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

function readYamlFile(file) {
  const raw = readFileSync(file, 'utf8');
  try {
    return parse(raw) ?? {};
  } catch (err) {
    throw new Error(`${path.relative(ROOT, file)}: YAML 解析失败：${err.message}`);
  }
}

export function loadTaxonomy() {
  const tax = readYamlFile(TAXONOMY_PATH);
  if (tax.schema !== 1) throw new Error('taxonomy.yaml: schema 必须是 1');
  for (const key of ['groups', 'categories', 'stages', 'statuses']) {
    if (!Array.isArray(tax[key]) || tax[key].length === 0) {
      throw new Error(`taxonomy.yaml: ${key} 必须是非空数组`);
    }
  }
  const groups = new Map();
  for (const g of tax.groups) {
    if (!g?.id || !g?.title) throw new Error('taxonomy.yaml: group 需要 id/title');
    if (groups.has(g.id)) throw new Error(`taxonomy.yaml: group id 重复：${g.id}`);
    groups.set(g.id, { id: g.id, title: g.title, note: g.note ?? '', order: Number(g.order ?? 0) });
  }
  const categories = new Map();
  for (const c of tax.categories) {
    if (!c?.id || !c?.title || !c?.group) throw new Error('taxonomy.yaml: category 需要 id/group/title');
    if (categories.has(c.id)) throw new Error(`taxonomy.yaml: category id 重复：${c.id}`);
    if (!groups.has(c.group)) throw new Error(`taxonomy.yaml: category ${c.id} 指向不存在的 group ${c.group}`);
    categories.set(c.id, { id: c.id, group: c.group, title: c.title, order: Number(c.order ?? 0) });
  }
  const stages = new Set();
  for (const s of tax.stages) {
    if (!s?.id || !s?.title) throw new Error('taxonomy.yaml: stage 需要 id/title');
    if (stages.has(s.id)) throw new Error(`taxonomy.yaml: stage id 重复：${s.id}`);
    stages.add(s.id);
  }
  const statuses = new Map();
  for (const s of tax.statuses) {
    if (!s?.id || !s?.title) throw new Error('taxonomy.yaml: status 需要 id/title');
    if (statuses.has(s.id)) throw new Error(`taxonomy.yaml: status id 重复：${s.id}`);
    statuses.set(s.id, { id: s.id, title: s.title });
  }
  return {
    raw: tax,
    groups,
    categories,
    stages,
    statuses,
    sortedGroups: [...groups.values()].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)),
    sortedCategories: [...categories.values()].sort((a, b) => {
      const ga = groups.get(a.group)?.order ?? 0;
      const gb = groups.get(b.group)?.order ?? 0;
      return ga - gb || a.order - b.order || a.id.localeCompare(b.id);
    }),
  };
}

export function loadPlugins() {
  if (!existsSync(PLUGINS_DIR)) throw new Error('缺少 plugins/ 目录');
  const files = readdirSync(PLUGINS_DIR)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .sort();
  return files.map((f) => {
    const file = path.join(PLUGINS_DIR, f);
    const raw = readYamlFile(file);
    const plugin = { ...raw };
    if (plugin.collection == null) plugin.collection = 'ai-infra';
    if (plugin.aliases == null) plugin.aliases = [];
    if (plugin.superseded_by === undefined) plugin.superseded_by = null;
    return { file, rel: path.relative(ROOT, file), plugin };
  });
}

export function makeValidator() {
  const pluginSchema = JSON.parse(readFileSync(path.join(SCHEMA_DIR, 'plugin.schema.json'), 'utf8'));
  const registrySchema = JSON.parse(readFileSync(path.join(SCHEMA_DIR, 'registry.schema.json'), 'utf8'));
  const ajv = new Ajv({ allErrors: true, strict: true });
  ajv.addSchema(pluginSchema, 'plugin.schema.json');
  const validatePlugin = ajv.getSchema('plugin.schema.json');
  const validateRegistry = ajv.compile(registrySchema);
  return { validatePlugin, validateRegistry };
}

export function validateData({ taxonomy, entries }) {
  const { validatePlugin } = makeValidator();
  const errors = [];
  const warnings = [];

  const ids = new Map();
  const aliases = new Map();
  for (const { file, rel, plugin } of entries) {
    if (!validatePlugin(plugin)) {
      for (const e of validatePlugin.errors ?? []) {
        errors.push(`${rel}${e.instancePath || ''}: ${e.message}`);
      }
      continue;
    }
    const placeholder = JSON.stringify(plugin).match(/TODO|FIXME|TBD/);
    if (placeholder) {
      errors.push(`${rel}: 还有占位符 ${placeholder[0]}（npm run new 生成的骨架需要填完）`);
    }
    if (ids.has(plugin.id)) {
      errors.push(`${rel}: id 重复：${plugin.id}（另一处：${ids.get(plugin.id)}）`);
    } else {
      ids.set(plugin.id, rel);
    }
    for (const alias of plugin.aliases) {
      if (ids.has(alias)) errors.push(`${rel}: alias ${alias} 与现有 id 冲突`);
      if (aliases.has(alias)) errors.push(`${rel}: alias ${alias} 重复（另一处：${aliases.get(alias)}）`);
      aliases.set(alias, rel);
    }
    if (!taxonomy.categories.has(plugin.category)) {
      errors.push(`${rel}: category ${plugin.category} 不在 taxonomy.yaml`);
    }
    for (const stage of plugin.stages) {
      if (!taxonomy.stages.has(stage)) errors.push(`${rel}: stage ${stage} 不在 taxonomy.yaml`);
    }
    if (!taxonomy.statuses.has(plugin.status)) {
      errors.push(`${rel}: status ${plugin.status} 不在 taxonomy.yaml`);
    }
    if (plugin.status === 'deprecated' && !plugin.superseded_by) {
      errors.push(`${rel}: deprecated 条目必须写 superseded_by（没有替代品可写 null 以外的说明时先别下线）`);
    }
    if (plugin.status === 'stable' && /[\r\n]/.test(plugin.install)) {
      errors.push(`${rel}: stable 条目的 install 必须是单行命令（可复制的一次粘贴）`);
    }
    if (plugin.evidence.verified_at > today()) {
      errors.push(`${rel}: evidence.verified_at ${plugin.evidence.verified_at} 在未来`);
    }
    const age = daysSince(plugin.evidence.verified_at);
    if (plugin.status !== 'deprecated' && age > STALE_DAYS[plugin.status]) {
      warnings.push(
        `${rel}: ${plugin.status} 条目已 ${age} 天未验证（阈值 ${STALE_DAYS[plugin.status]} 天）`,
      );
    }
  }
  return { errors, warnings };
}

export function groupOf(taxonomy, categoryId) {
  return taxonomy.categories.get(categoryId)?.group ?? 'unknown';
}

export function sortPlugins(taxonomy, entries) {
  const groupOrder = new Map(taxonomy.sortedGroups.map((g, i) => [g.id, i]));
  const categoryOrder = new Map(taxonomy.sortedCategories.map((c, i) => [c.id, i]));
  return entries
    .map((e) => e.plugin)
    .sort((a, b) => {
      const ga = groupOrder.get(groupOf(taxonomy, a.category)) ?? 999;
      const gb = groupOrder.get(groupOf(taxonomy, b.category)) ?? 999;
      const ca = categoryOrder.get(a.category) ?? 999;
      const cb = categoryOrder.get(b.category) ?? 999;
      const oa = a.order ?? 100;
      const ob = b.order ?? 100;
      return ga - gb || ca - cb || oa - ob || a.id.localeCompare(b.id);
    });
}

export function staleEntries(plugins) {
  return plugins
    .filter((p) => p.status !== 'deprecated')
    .map((p) => ({ plugin: p, age: daysSince(p.evidence.verified_at) }))
    .filter(({ plugin, age }) => age > STALE_DAYS[plugin.status]);
}

export function renderRegistry(taxonomy, plugins) {
  return {
    schema: 1,
    collection: 'ai-infra',
    count: plugins.length,
    source: 'plugins/*.yaml',
    groups: taxonomy.sortedGroups.map((g) => ({ id: g.id, title: g.title, note: g.note, order: g.order })),
    categories: taxonomy.sortedCategories.map((c) => ({
      id: c.id,
      group: c.group,
      title: c.title,
      order: c.order,
    })),
    plugins,
  };
}

function statusTitle(taxonomy, status) {
  return taxonomy.statuses.get(status)?.title ?? status;
}

function kindTitle(kind) {
  return kind === 'library' ? '源码库' : 'DSH 插件';
}

function oneLine(s) {
  return String(s ?? '').replace(/\s+/g, ' ').trim();
}

function mdCell(s) {
  return oneLine(s).replace(/\|/g, '\\|');
}

function codeCell(s) {
  return '`' + oneLine(s).replace(/`/g, '\\`') + '`';
}

export function renderReadme(taxonomy, plugins) {
  const stale = staleEntries(plugins);
  const counts = { stable: 0, experimental: 0, deprecated: 0 };
  for (const p of plugins) counts[p.status] += 1;
  const byGroup = new Map(taxonomy.sortedGroups.map((g) => [g.id, []]));
  for (const p of plugins) {
    const g = groupOf(taxonomy, p.category);
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g).push(p);
  }

  const lines = [];
  lines.push('# AI Infra Index');
  lines.push('');
  lines.push('> **可核验的 DSH AI 基础设施插件索引**：每条都必须能安装、能证伪、能回退，并标注最后一次验证时间。');
  lines.push('');
  lines.push(
    `**${plugins.length} 条** · 稳定 ${counts.stable} · 实验 ${counts.experimental} · 已弃用 ${counts.deprecated} · 超期未验证 ${stale.length}`,
  );
  lines.push('');
  lines.push('机器可读版本：[`registry.json`](./registry.json)。兼容性矩阵：[`compat.md`](./compat.md)。证据台账：[`evidence.md`](./evidence.md)。');
  lines.push('');
  lines.push('> 首版条目的 `verified_at` 暂取自各仓库最后提交日（2026-10-20），公开发布前需逐条重跑判据后更新；见 [`ADR-0006`](./docs/adr/0006-initial-verified-at-seed.md)。');
  lines.push('');
  lines.push('## 范围');
  lines.push('');
  lines.push('**收**：推理交付（部署 / 量化 / 调优 / 排障）、训练（SFT / RL / QAT / 预训练）、判定与测量原语。');
  lines.push('');
  lines.push('**不收**：Agent 记忆、写作 / PPT / 评审套件、与 AI 基础设施无关的效率工具。它们在站点 [`/open-source/`](https://xiciyang.com/open-source/) 的其他分组里，不混进这份注册表。');
  lines.push('');
  lines.push('## 快速使用');
  lines.push('');
  lines.push('```bash');
  lines.push('git clone https://github.com/xiciyang/ai-infra-index.git');
  lines.push('cd ai-infra-index && npm ci');
  lines.push('npm run verify        # schema + 分类 + 生成物一致性');
  lines.push('npm run build         # 重新生成 registry.json / README / compat / evidence');
  lines.push('npm run verify:links  # 可选：用 GitHub API 核对 repo 与证据锚点（限流时加 GITHUB_TOKEN=$(gh auth token)）');
  lines.push('npm run stale         # 可选：查看超期未验证条目');
  lines.push('```');
  lines.push('');
  lines.push('新增一条：`npm run new -- --id <id> --category <category>`，填完跑 `npm run build && npm run verify`。');
  lines.push('');
  lines.push('## 收录标准');
  lines.push('');
  lines.push('一条条目要进 `stable`，必须同时满足：');
  lines.push('');
  lines.push('1. 一条可复制的安装命令在干净机器上能装好；');
  lines.push('2. 有自动化测试或 contract，CI 绿；');
  lines.push('3. README 写清「证明什么、失败怎么退」；');
  lines.push('4. 有 SPDX license；');
  lines.push('5. 维护者 90 天内亲自跑过判据（`evidence.verified_at` 是承诺，不是文件时间）。');
  lines.push('');
  lines.push('缺任何一条 → `experimental`；归档 / 被替代 → `deprecated`，保留条目并写 `superseded_by`。完整规则见 [`docs/inclusion.md`](./docs/inclusion.md)。');
  lines.push('');
  lines.push('字段、安装、证据与状态的约定见 [`docs/contract.md`](./docs/contract.md)；分类法见 [`docs/taxonomy.md`](./docs/taxonomy.md)；设计决策见 [`docs/adr/`](./docs/adr/)。');
  lines.push('');

  for (const group of taxonomy.sortedGroups) {
    const list = byGroup.get(group.id) ?? [];
    if (list.length === 0) continue;
    lines.push(`## ${group.title}`);
    lines.push('');
    if (group.note) {
      lines.push(group.note);
      lines.push('');
    }
    lines.push('| 条目 | 分类 | 状态 | 证明了什么 | 安装 | 最后验证 |');
    lines.push('|---|---|---|---|---|---|');
    for (const p of list) {
      const category = taxonomy.categories.get(p.category)?.title ?? p.category;
      lines.push(
        `| [${p.id}](./plugins/${p.id}.yaml) | ${mdCell(category)} | ${mdCell(statusTitle(taxonomy, p.status))} | ${mdCell(p.evidence.proves)} | ${codeCell(p.install)} | ${p.evidence.verified_at} |`,
      );
    }
    lines.push('');
  }

  lines.push('## 兼容性与证据');
  lines.push('');
  lines.push('- [`compat.md`](./compat.md)：DSH / Node / OS / 后端 / 硬件要求。');
  lines.push('- [`evidence.md`](./evidence.md)：每条证明什么、失败怎么退、证据链接、最后验证时间。');
  lines.push('- [`site-blocks.yaml`](./site-blocks.yaml)：xiciyang.com `/open-source/` 的分组快照（站点内部消费）。');
  lines.push('');
  lines.push('## 任务与缺口');
  lines.push('');
  lines.push('用 Issues 管理，不另建系统：');
  lines.push('');
  lines.push('- `task`：具体交付任务（客户信息请脱敏；敏感信息放私有仓）。');
  lines.push('- `plugin-proposal`：新插件提案。');
  lines.push('- `gap`：公开的已知缺口，例如「缺 vLLM 以外的后端适配」。');
  lines.push('- `bug`：索引数据、生成器或站点展示问题。');
  lines.push('');
  lines.push('## License');
  lines.push('');
  lines.push('代码与脚本：MIT。注册表数据与文档：CC-BY-4.0。每个被收录条目仍按其自身 license 分发。');
  lines.push('');
  return lines.join('\n');
}

export function renderCompat(taxonomy, plugins) {
  const lines = [];
  lines.push('# 兼容性矩阵');
  lines.push('');
  lines.push('> 由 `npm run build` 从 `plugins/*.yaml` 的 `compat` 字段生成。空单元格表示该条目不声明此维度，不表示不支持。');
  lines.push('');
  lines.push('| 条目 | 类别 | DSH | Node | OS | 后端 | 依赖 |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const p of plugins) {
    const c = p.compat ?? {};
    lines.push(
      `| ${p.id} | ${mdCell(taxonomy.categories.get(p.category)?.title ?? p.category)} | ${mdCell(c.dsh ?? '—')} | ${mdCell(c.node ?? '—')} | ${mdCell((c.os ?? []).join(', ') || '—')} | ${mdCell((c.backends ?? []).join(', ') || '—')} | ${mdCell((c.requires ?? []).join(', ') || '—')} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

export function renderEvidence(taxonomy, plugins) {
  const lines = [];
  lines.push('# 证据台账');
  lines.push('');
  lines.push('> 由 `npm run build` 从 `plugins/*.yaml` 的 `evidence` 字段生成。`verified_at` 只在维护者真的重跑判据后更新。');
  lines.push('');
  lines.push('| 条目 | 状态 | 证明了什么 | 失败怎么退 | 证据 | 最后验证 |');
  lines.push('|---|---|---|---|---|---|');
  for (const p of plugins) {
    const e = p.evidence;
    lines.push(
      `| ${p.id} | ${mdCell(statusTitle(taxonomy, p.status))} | ${mdCell(e.proves)} | ${mdCell(e.fails)} | [链接](${e.url}) | ${e.verified_at}（${mdCell(e.verified_by)}） |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

export function renderSiteBlocks(taxonomy, plugins) {
  const blocks = [];
  for (const group of taxonomy.sortedGroups) {
    const list = plugins.filter((p) => groupOf(taxonomy, p.category) === group.id);
    if (list.length === 0) continue;
    blocks.push({
      id: group.id,
      type: 'os-group',
      data: {
        title: group.title,
        note: group.note,
        items: list.map((p) => ({
          name: p.id,
          repo: p.repo,
          meta: `${p.license} · ${kindTitle(p.kind)} · ${statusTitle(taxonomy, p.status)} · 验证于 ${p.evidence.verified_at}`,
          line: `${oneLine(p.summary).replace(/[。.!！?？；;]$/, '')}。判据：${oneLine(p.evidence.proves)}；失败：${oneLine(p.evidence.fails)}。`,
          install: p.install,
        })),
      },
    });
  }
  return stringify({ blocks }, { lineWidth: 0 });
}

export function buildArtifacts() {
  const taxonomy = loadTaxonomy();
  const entries = loadPlugins();
  const { errors, warnings } = validateData({ taxonomy, entries });
  if (errors.length) {
    const err = new Error('数据校验失败：\n' + errors.map((e) => `  - ${e}`).join('\n'));
    err.errors = errors;
    err.warnings = warnings;
    throw err;
  }
  const plugins = sortPlugins(taxonomy, entries);
  const registry = renderRegistry(taxonomy, plugins);
  const { validateRegistry } = makeValidator();
  if (!validateRegistry(registry)) {
    const err = new Error(
      'registry.json 结构校验失败：\n' +
        (validateRegistry.errors ?? []).map((e) => `  - ${e.instancePath} ${e.message}`).join('\n'),
    );
    err.errors = [err.message];
    throw err;
  }
  return {
    taxonomy,
    plugins,
    artifacts: {
      [OUTPUTS.registry]: JSON.stringify(registry, null, 2) + '\n',
      [OUTPUTS.readme]: renderReadme(taxonomy, plugins) + '\n',
      [OUTPUTS.compat]: renderCompat(taxonomy, plugins) + '\n',
      [OUTPUTS.evidence]: renderEvidence(taxonomy, plugins) + '\n',
      [OUTPUTS.siteBlocks]: renderSiteBlocks(taxonomy, plugins),
    },
    warnings,
  };
}

export function writeArtifacts(artifacts) {
  for (const [file, content] of Object.entries(artifacts)) {
    writeFileSync(file, content);
  }
}

export function checkArtifacts(artifacts) {
  const stale = [];
  for (const [file, content] of Object.entries(artifacts)) {
    const current = existsSync(file) ? readFileSync(file, 'utf8') : null;
    if (current !== content) stale.push(path.relative(ROOT, file));
  }
  return stale;
}
