import { useEffect, useState } from "react";
import { Option } from "@/components/option";
import { TopBar } from "@/components/top-bar";
import { Badge } from "@/components/ui/badge";
import { api, ApiFailure } from "@/lib/api";
import { go } from "@/lib/router";
import type { Checklist as ChecklistData } from "@/lib/types";

// 진단 결과의 할 일·준비 서류를 체크해 가며 준비한다
export function Checklist({ caseId }: { caseId: string }) {
  const [data, setData] = useState<ChecklistData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<ChecklistData>(`/cases/${caseId}/checklist`)
      .then(setData)
      .catch((err) => {
        if (err instanceof ApiFailure && err.status === 401) return go("/login");
        setError(err instanceof ApiFailure ? err.message : "체크리스트를 불러오지 못했어요.");
      });
  }, [caseId]);

  async function toggle(key: string, checked: boolean) {
    if (!data) return;
    const before = data;
    // 바로 반영하고, 저장에 실패하면 되돌린다
    setData({ ...data, items: data.items.map((i) => (i.key === key ? { ...i, checked } : i)) });
    try {
      setData(await api<ChecklistData>(`/cases/${caseId}/checklist`, { method: "PUT", body: { key, checked } }));
      setError(null);
    } catch {
      setData(before);
      setError("저장하지 못했어요. 다시 시도해 주세요.");
    }
  }

  const steps = data?.items.filter((i) => i.kind === "STEP") ?? [];
  const docs = data?.items.filter((i) => i.kind === "DOCUMENT") ?? [];
  const done = data?.items.filter((i) => i.checked).length ?? 0;

  return (
    <div className="mx-auto max-w-md">
      <TopBar title="서류 준비" progress={data ? `${done} / ${data.total}` : undefined} />
      {data && (
        <div className="h-1 bg-muted" role="progressbar" aria-label="준비 진행률" aria-valuemin={0} aria-valuemax={data.total} aria-valuenow={done}>
          <div className="h-full bg-primary transition-all" style={{ width: `${(done / Math.max(data.total, 1)) * 100}%` }} />
        </div>
      )}
      <div className="space-y-8 p-6">
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {!data && !error && <p className="text-sm text-muted-foreground">불러오는 중…</p>}

        {steps.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="mb-3 text-lg font-bold">할 일</legend>
            {steps.map((i) => (
              <Option key={i.key} type="checkbox" name={i.key} checked={i.checked} onChange={(e) => toggle(i.key, e.target.checked)}>
                <span className="block font-medium">{i.title}</span>
                <span className="block text-sm text-muted-foreground">{i.detail}</span>
              </Option>
            ))}
          </fieldset>
        )}

        {docs.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="mb-3 text-lg font-bold">준비할 서류</legend>
            {docs.map((i) => (
              <Option key={i.key} type="checkbox" name={i.key} checked={i.checked} onChange={(e) => toggle(i.key, e.target.checked)}>
                <span className="flex items-center gap-2">
                  <span className="flex-1">{i.title}</span>
                  <Badge className={i.need === "REQUIRED" ? "bg-urgent-bg text-urgent" : "bg-muted text-muted-foreground"}>
                    {i.need === "REQUIRED" ? "필수" : "권장"}
                  </Badge>
                </span>
              </Option>
            ))}
          </fieldset>
        )}

        {data && (
          <a href="#/cases" className="block text-center text-sm text-muted-foreground underline">
            내 사건 목록으로
          </a>
        )}
      </div>
    </div>
  );
}
