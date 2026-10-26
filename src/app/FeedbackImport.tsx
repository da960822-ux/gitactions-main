import { useRef, useState } from 'react';
import { feedback, type LegacyFeedbackImport } from '../core/feedback';
import type { Language } from '../core/types';

type Counts = { total: number; imported: number; existing: number; failed: number };

export function FeedbackImport({ language, onImported }: { language: Language; onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [invalidFile, setInvalidFile] = useState(false);
  const running = useRef(false);
  const es = language === 'es';

  async function importFile() {
    if (!file || running.current) return;
    running.current = true;
    setBusy(true);
    setInvalidFile(false);
    setCounts(null);
    try {
      const values: unknown = JSON.parse(await file.text());
      if (!Array.isArray(values)) throw new Error('invalid_import_file');
      const next: Counts = { total: values.length, imported: 0, existing: 0, failed: 0 };
      for (const value of values) {
        try {
          const result = await feedback.importLegacy(value as LegacyFeedbackImport);
          if (result.imported) next.imported += 1;
          else next.existing += 1;
        } catch {
          next.failed += 1;
        }
        setCounts({ ...next });
      }
      onImported();
    } catch {
      setInvalidFile(true);
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  return <details className="wrap feedback-import" data-testid="feedback-import">
    <summary>{es ? 'Importar ideas anteriores' : '이전 글 가져오기'}</summary>
    <div className="feedback-import-content">
      <p>{es ? 'Solo para la persona administradora. Selecciona un archivo JSON revisado. Los originales permanecen donde están.' : '관리자 전용입니다. 검토한 JSON 파일을 선택하세요. 원본 글은 그대로 남습니다.'}</p>
      <label htmlFor="feedback-import-file">{es ? 'Archivo JSON' : 'JSON 파일'}</label>
      <input id="feedback-import-file" type="file" accept=".json,application/json" disabled={busy} onChange={event => { setFile(event.target.files?.[0] ?? null); setCounts(null); setInvalidFile(false); }} />
      <button type="button" className="secondary-action" disabled={!file || busy} onClick={() => void importFile()}>{busy ? (es ? 'Importando…' : '가져오는 중…') : (es ? 'Importar' : '가져오기')}</button>
      {invalidFile && <p role="alert">{es ? 'El archivo debe contener una lista JSON válida.' : '유효한 JSON 배열 파일을 선택해 주세요.'}</p>}
      {counts && <p role="status" data-testid="feedback-import-counts">{es ? `Total: ${counts.total} · Nuevos: ${counts.imported} · Ya existentes: ${counts.existing} · Fallidos: ${counts.failed}` : `전체 ${counts.total}건 · 새로 저장 ${counts.imported}건 · 이미 있음 ${counts.existing}건 · 실패 ${counts.failed}건`}</p>}
    </div>
  </details>;
}
