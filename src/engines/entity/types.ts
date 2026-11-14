// src/engines/entity/types.ts
// Types for the Entity Engine — powers 400+ CRUD features in HEY.

export type EntityFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'boolean'
  | 'tags';

export interface EntityField {
  name: string;
  label: string;
  type: EntityFieldType;
  required?: boolean;
  default?: unknown;
  options?: string[]; // for select
  placeholder?: string;
}

export type EntityView = 'list' | 'kanban' | 'calendar' | 'timeline';

export interface EntityIntegrations {
  voice?: boolean;
  vision?: boolean;
  gesture?: boolean;
  memory?: boolean;
  agent?: string;         // agent ID from registry
  proactive?: boolean;
  crossDevice?: boolean;
  automation?: boolean;
  verification?: boolean;
  pinsThroughTrust?: boolean;
  senses?: Array<'voice'|'vision'|'gesture'|'stylus'|'screen'|'os'|'mesh'>;
}

export interface EntityDerived<T> {
  [selectorName: string]: (items: T[]) => unknown;
}

export interface EntityConfig<T = Record<string, unknown>> {
  engine: 'entity';
  id: string;
  name: string;
  path: string;
  icon: string;
  fields: EntityField[];
  views: EntityView[];
  integrations: EntityIntegrations;
  derived?: EntityDerived<T>;
}

export interface EntityItem {
  id: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}