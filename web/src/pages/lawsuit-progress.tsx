import { useEffect, useState, type FormEvent } from "react";
import { CircleCheck, CircleDot, Circle } from "lucide-react";
import { Field } from "@/components/field";
import { Option } from "@/components/option";
import { TopBar } from "@/components/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, ApiFailure } from "@/lib/api";
import { lawsuitSteps, type LawsuitRecord } from "@/lib/lawsuit";
import { go } from "@/lib/router";
import { cn } from "@/lib/utils";

const EMPTY: LawsuitRecord = {
  court: null,
  caseNumber: null,
  filedAt: null,
  proofSubmittedAt: null,
  hearingAt: null,
  judgmentServedAt: null,
  result: null,
  finalizedAt: null,
};
const RESULT = [
  ["WON", "이겼어요(전부 승소)"],
  ["PARTIAL", "일부만 이겼어요"],
  ["LOST", "졌어요(패소)"],
] as const;

const dday = (n: number) => (n === 0 ? "D-day" : n > 0 ? `D-${n}` : `${-n}일 지남`);

// 채무부존재확인 소송 진행 관리: 날짜를 기록하면 단계별 할 일과 기한을 보여 준다
export function LawsuitProgress({ caseId }: { caseId: string }) {
  const [form, setForm] = useState<LawsuitRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [today] = useState(() => new Date().toLocaleDateString("sv-SE")); // YYYY-MM-DD(로컬)

  useEffect(() => {
    api<LawsuitRecord | null>(`/cases/${caseId}/lawsuit`)
      .then((l) => setForm(l ? { ...EMPTY, ...l, hearingAt: l.hearingAt?.slice(0, 16) ?? null } : EMPTY))
      .catch((err) => {
        if (err instanceof ApiFailure && err.status === 401) return go("/login");
        setError(err instanceof ApiFailure ? err.message : "소송 기록을 불러오지 못했어요.");
      });
  }, [caseId]);

  const set = (k: keyof LawsuitRecord) => (e: { target: { value: string } }) =>
    form && setForm({ ...form, [k]: e.target.value || null });

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    try {
      const l = await api<LawsuitRecord & { updatedAt: string }>(`/cases/${caseId}/lawsuit`, { method: "PUT", body: form });
      setForm({ ...EMPTY, ...l, hearingAt: l.hearingAt?.slice(0, 16) ?? null });
      setSaved(new Date(l.updatedAt).toLocaleString("ko-KR"));
      setError(null);
    } catch (err) {
      if (err instanceof ApiFailure && err.status === 401) return go("/login");
      setError(err instanceof ApiFailure ? err.message : "저장하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  const steps = form ? lawsuitSteps(form, today) : [];
  const current = steps.findIndex((s) => !s.done);

  return (
    <div className="mx-auto max-w-md md:max-w-3xl">
      <TopBar title="소송 진행 관리" />
      <div className="space-y-8 p-6">
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {!form && !error && <p className="text-sm text-muted-foreground">불러오는 중…</p>}
        {form && (
          <>
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">지금 할 일</h2>
              <ol className="space-y-3">
                {steps.map((s, i) => {
                  const Icon = s.done ? CircleCheck : i === current ? CircleDot : Circle;
                  return (
                    <li key={s.key} className={cn("flex gap-3 rounded-xl border p-4", i === current && "border-foreground")}>
                      <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", s.done ? "text-success" : i === current ? "text-foreground" : "text-muted-foreground")} />
                      <div className="flex-1 space-y-1">
                        <p className="flex flex-wrap items-center gap-2 font-medium">
                          {s.title}
                          <span className="sr-only">{s.done ? "(완료)" : i === current ? "(진행 중)" : ""}</span>
                          {s.due && (
                            <Badge className={s.urgent ? "bg-urgent-bg text-urgent" : "bg-muted text-muted-foreground"}>
                              {s.due} · {dday(s.dday!)}
                            </Badge>
                          )}
                          {s.urgent && !s.due && <Badge className="bg-urgent-bg text-urgent">빨리 해야 해요</Badge>}
                        </p>
                        {!s.done && <p className="text-sm text-muted-foreground">{s.todo}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            <form onSubmit={save} className="space-y-4" noValidate>
              <h2 className="text-lg font-bold">진행 기록</h2>
              <p className="text-sm text-muted-foreground">날짜를 적으면 위 할 일과 기한이 바뀌어요. 모르는 칸은 비워 두세요.</p>
              <Field label="법원" placeholder="예: 서울중앙지방법원" value={form.court ?? ""} onChange={set("court")} />
              <Field label="사건번호" placeholder="예: 2026가단12345" value={form.caseNumber ?? ""} onChange={set("caseNumber")} />
              <Field label="소장 낸 날" type="date" value={form.filedAt ?? ""} onChange={set("filedAt")} />
              <Field label="소제기증명원을 은행에 낸 날" type="date" value={form.proofSubmittedAt ?? ""} onChange={set("proofSubmittedAt")} />
              <Field label="다음 변론기일" type="datetime-local" value={form.hearingAt ?? ""} onChange={set("hearingAt")} />
              <Field label="판결정본 받은 날" type="date" value={form.judgmentServedAt ?? ""} onChange={set("judgmentServedAt")} hint="항소 기한(2주)은 이 날짜로 계산해요." />
              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium">판결 결과</legend>
                {RESULT.map(([value, label]) => (
                  <Option key={value} name="result" checked={form.result === value} onChange={() => setForm({ ...form, result: value })}>
                    {label}
                  </Option>
                ))}
                {form.result && (
                  <Button type="button" variant="ghost" onClick={() => setForm({ ...form, result: null })}>
                    결과 지우기
                  </Button>
                )}
              </fieldset>
              <Field label="판결 확정된 날" type="date" value={form.finalizedAt ?? ""} onChange={set("finalizedAt")} />
              <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl text-base">
                저장
              </Button>
              {saved && <p role="status" className="text-center text-xs text-muted-foreground">{saved} 저장됨</p>}
            </form>

            <div className="space-y-2 text-center text-sm">
              <a href={`#/cases/${caseId}/complaint`} className="block underline">소장 다시 보기</a>
              <a href="#/lawsuit" className="block underline">소송 안내</a>
              <a href="#/cases" className="block text-muted-foreground underline">내 사건 목록으로</a>
            </div>
            <p className="text-xs text-muted-foreground">기한은 참고용이에요. 법원에서 받은 서류의 날짜가 기준이고, 궁금하면 132(대한법률구조공단)에 물어보세요.</p>
          </>
        )}
      </div>
    </div>
  );
}
