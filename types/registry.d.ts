/** Types for the generated registry.json. Keep in sync with schema/plugin.schema.json. */

export type PluginKind = 'plugin' | 'library';
export type PluginStatus = 'experimental' | 'stable' | 'deprecated';

export interface Compat {
  dsh?: string;
  node?: string;
  os?: Array<'linux' | 'macos' | 'windows'>;
  backends?: string[];
  requires?: Array<'gpu' | 'cuda' | 'docker' | 'network' | 'disk'>;
}

export interface Evidence {
  proves: string;
  fails: string;
  url: string;
  verified_at: string;
  verified_by: string;
}

export interface Plugin {
  schema: 1;
  id: string;
  kind: PluginKind;
  collection: string;
  repo: string;
  package: string;
  summary: string;
  category: string;
  stages: string[];
  order?: number;
  status: PluginStatus;
  license: string;
  install: string;
  install_note?: string;
  compat: Compat;
  evidence: Evidence;
  maintainers: string[];
  superseded_by: string | null;
  aliases: string[];
}

export interface Group {
  id: string;
  title: string;
  note?: string;
  order: number;
}

export interface Category {
  id: string;
  group: string;
  title: string;
  order: number;
}

export interface Registry {
  schema: 1;
  collection: string;
  count: number;
  source: 'plugins/*.yaml';
  groups: Group[];
  categories: Category[];
  plugins: Plugin[];
}
