export type UUID = string;
export type ISOString = string;

export interface Project {
  id: string;
  name: string;
  meta: Record<string, unknown>;
  created_at: ISOString;
}

export interface AGI {
  id: string;
  name: string | null;
  description: string | null;
  version: string | null;
  tags: string[];
  meta: Record<string, unknown>;
  created_at: ISOString;
}

export interface NodeUnit {
  id: string;
  project_id: string;
  name: string | null;
  type: 'agent' | 'orchestrator' | 'sentinel';
  status: 'online' | 'offline' | 'quarantine';
  last_seen_at: ISOString | null;
  tags: string[];
  meta: Record<string, unknown>;
  created_at: ISOString;
  updated_at: ISOString;
}

export interface SystemControl {
  id: string;
  project_id: string;
  kill_switch: boolean;
  allow_write: boolean;
  meta: Record<string, unknown>;
  updated_at: ISOString;
}

export interface CommandLog {
  id: UUID;
  command_id: UUID | null;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string | null;
  metadata: Record<string, unknown>;
  created_at: ISOString;
}
