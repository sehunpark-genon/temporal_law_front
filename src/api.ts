import axios from "axios";

// vite proxy: /api → http://localhost:8000
export const http = axios.create({ baseURL: "/api" });

// ── 타입 ──
export interface Stats {
  catalog_active: number; repealed: number; collected: number;
  pending: number; done: number; failed: number;
}
export interface Worker { task_queue: string; online: boolean; pollers: number; identities: string[]; }

export interface LawListItem {
  law_id: string; law_name: string; law_type: string | null; ministry: string | null;
  enforcement_date: string | null; mst: string | null; is_active: boolean;
  status: string | null; attempts: number | null; last_collected_at: string | null;
}
export interface LawsResponse { total: number; page: number; size: number; items: LawListItem[]; }

export interface Relation {
  relation_type: string; delegation_type: string | null; target_category: string;
  source_article_no: string; source_clause: string; link_text: string;
  target_law_name: string; target_article_no: string; target_url: string; resolve_method: string;
}
export interface Article {
  article_no: string; article_title: string; chapter: string; content: string; relations: Relation[];
}
export interface OrdinanceGroup {
  source_article_no: string; link_text: string; ordinance_count: number;
  ordinances: { target_law_name: string; target_url: string; target_mst: string }[];
}
export interface Payload {
  law_name: string; mst: string; law_type: string; enforcement_date: string;
  body: { format: string; article_count: number; articles: Article[]; unmatched_relations?: Relation[] };
  ordinance_delegations: OrdinanceGroup[];
  relation_stats: Record<string, any>;
}
export interface LawDetail {
  law_id: string; law_name: string; collected: boolean; synced_at: string | null;
  catalog: any; state: any; payload: Payload | null;
}

export interface Run {
  workflow_id: string; run_id: string; type: string; status: string | null;
  start_time: string | null; close_time: string | null;
}
export interface Schedule { exists: boolean; cron?: string[]; paused?: boolean; default_cron?: string; }
export interface SyncHistoryItem {
  law_id: string; law_name: string; changed_at: string | null;
  old_signature: string | null; new_signature: string | null; reason: string | null;
}
export interface Failure { law_id: string; law_name: string; attempts: number; last_error: string | null; last_checked_at: string | null; }

// ── 함수 ──
export const api = {
  stats: () => http.get<Stats>("/stats").then((r) => r.data),
  worker: () => http.get<Worker>("/worker").then((r) => r.data),
  laws: (p: { query?: string; status?: string; ministry?: string;
              ef_from?: string; ef_to?: string; col_from?: string; col_to?: string;
              order?: string; page?: number; size?: number }) =>
    http.get<LawsResponse>("/laws", { params: p }).then((r) => r.data),
  law: (id: string) => http.get<LawDetail>(`/laws/${id}`).then((r) => r.data),
  runs: (limit = 30) => http.get<Run[]>("/runs", { params: { limit } }).then((r) => r.data),
  syncHistory: (limit = 50) => http.get<SyncHistoryItem[]>("/sync-history", { params: { limit } }).then((r) => r.data),
  failures: () => http.get<Failure[]>("/failures").then((r) => r.data),
  schedule: () => http.get<Schedule>("/schedule").then((r) => r.data),
  // 운영
  discover: (all = false) => http.post("/discover", { all }).then((r) => r.data),
  backfill: (limit?: number) => http.post("/backfill", { limit: limit ?? null }).then((r) => r.data),
  sync: () => http.post("/sync").then((r) => r.data),
  terminate: (wfId: string) => http.post(`/runs/${wfId}/terminate`).then((r) => r.data),
  setSchedule: (cron: string) => http.put("/schedule", { cron }).then((r) => r.data),
  delSchedule: () => http.delete("/schedule").then((r) => r.data),
  verify: (body: { mode?: string; n?: number; names?: string[] }) => http.post("/verify", body).then((r) => r.data),
};
