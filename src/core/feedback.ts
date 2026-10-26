export type FeedbackCategory = 'message' | 'game' | 'feature' | 'complaint' | 'other';
export type FeedbackStatus = 'new' | 'read' | 'planned' | 'done';
export type FeedbackInput = { category: FeedbackCategory; title: string; body: string };
export type FeedbackEntry = FeedbackInput & { id: string; status: FeedbackStatus; createdAt: string };
export type FeedbackBoard = { entries: FeedbackEntry[]; canAcknowledge: boolean; siteUserId: string };
export type LegacyFeedbackImport = FeedbackInput & { legacySourceId: string; status: FeedbackStatus; createdAt: string };
export type FeedbackImportResult = { id: string; legacySourceId: string; imported: boolean };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: 'same-origin', cache: 'no-store', ...init });
  if (!response.ok) throw new Error(`feedback_http_${response.status}`);
  return response.json() as Promise<T>;
}

export const feedback = {
  list: () => request<FeedbackBoard>('/api/feedback'),
  create: (input: FeedbackInput, requestId: string) => request<FeedbackEntry>('/api/feedback', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, id: requestId }),
  }),
  updateStatus: (id: string, status: FeedbackStatus) => request<void>(`/api/feedback/${encodeURIComponent(id)}/status`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
  }),
  importLegacy: (entry: LegacyFeedbackImport) => request<FeedbackImportResult>('/api/feedback/import', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry),
  }),
};
