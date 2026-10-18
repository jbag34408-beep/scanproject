import { useEffect, useState } from "react";
import { AlertBox } from "@/components/alert-box";
import { TopBar } from "@/components/top-bar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { api, ApiFailure } from "@/lib/api";
import { go } from "@/lib/router";
import type { Diagnosis } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Step } from "@/pages/landing";

// 백엔드 alert은 message만 있어 화면 제목은 코드로 붙인다
const ALERT_TITLE: Record<string, string> = {
  THREAT_DO_NOT_PAY: "협박범에게 돈을 보내지 마세요",
  OBJECTION_DEADLINE: "이의제기 기한",
  SIMPLIFIED_REVIEW_POSSIBLE: "간소화 심사 대상일 수 있어요",
  DO_NOT_USE_FUNDS: "입금된 돈은 쓰지 마세요",
  NO_DIRECT_RETURN: "직접 돌려보내지 마세요",
  BEWARE_FIXERS: "'풀어준다'는 업체를 조심하세요",
};
const LEVEL_TITLE = { URGENT: "긴급", DEADLINE: "기한", INFO: "참고", WARNING: "주의" } as const;

const won = (n: number | null) => (n === null ? "-" : n.toLocaleString("ko-KR") + "원");

// Figma 06 Diagnosis Result / Mobile
export function Result({ caseId }: { caseId: string }) {
  const [d, setD] = useState<Diagnosis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Diagnosis>(`/cases/${caseId}/diagnoses/latest`)
      .then(setD)
      .catch((err) => {
        if (err instanceof ApiFailure && err.status === 401) return go("/login");
        setError(err instanceof ApiFailure ? err.message : "결과를 불러오지 못했어요.");
      });
  }, [caseId]);

  return (
    <div className="mx-auto max-w-md md:max-w-3xl">
      <TopBar title="진단 결과" />
      {error && <p role="alert" className="p-6 text-sm text-destructive">{error}</p>}
      {!d && !error && <p className="p-6 text-sm text-muted-foreground">불러오는 중…</p>}
      {d && (
        <div className="space-y-8 p-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">내 상황에 해당될 수 있는 절차예요</h2>
            <p className="text-xs text-muted-foreground">입력한 내용 기준 · 규칙 버전 {d.ruleVersion}</p>
          </div>

          <div className="space-y-2">
            {d.alerts.map((a) => (
              <AlertBox key={a.code} level={a.level} title={ALERT_TITLE[a.code] ?? LEVEL_TITLE[a.level]}>
                {a.message}
              </AlertBox>
            ))}
          </div>

          <section className="space-y-3">
            <h3 className="text-lg font-bold">해당될 수 있는 절차</h3>
            {d.pathways.map((p) => (
              <div key={p.code} className="space-y-1 rounded-xl border p-4">
                <p className="font-medium">{p.title}</p>
                <p className="text-sm text-muted-foreground">{p.reason}</p>
              </div>
            ))}
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-bold">할 일</h3>
            <ol className="space-y-4">
              {d.steps.map((s) => (
                <Step key={s.order} no={s.order} title={s.title} detail={s.detail} />
              ))}
            </ol>
          </section>

          {d.documents.length > 0 && (
            <section>
              <h3 className="mb-2 text-lg font-bold">준비할 서류</h3>
              <ul>
                {d.documents.map((doc) => (
                  <li key={doc.code} className="flex items-center gap-2 border-b py-3 text-sm">
                    <span className="flex-1">{doc.name}</span>
                    <Badge className={doc.need === "REQUIRED" ? "bg-urgent-bg text-urgent" : "bg-muted text-muted-foreground"}>
                      {doc.need === "REQUIRED" ? "필수" : "권장"}
                    </Badge>
                    {doc.ready !== null && (
                      <Badge className={cn(doc.ready ? "bg-success-bg text-success" : "bg-warning-bg text-warning")}>
                        {doc.ready ? "준비됨" : "필요"}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {d.amounts.referenceDifference !== null && (
            <section className="space-y-2">
              <h3 className="text-lg font-bold">금액 참고</h3>
              <dl className="space-y-2 rounded-xl bg-muted p-4 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">묶인 금액</dt><dd>{won(d.amounts.frozenAmount)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">모르는 입금액</dt><dd>{won(d.amounts.depositAmount)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">참고 차액</dt><dd className="text-base font-medium">{won(d.amounts.referenceDifference)}</dd></div>
                <p className="text-xs text-muted-foreground">{d.amounts.note}</p>
              </dl>
            </section>
          )}

          <p className="text-xs text-muted-foreground">{d.disclaimer}</p>
          <a href={`#/cases/${caseId}/checklist`} className={cn(buttonVariants(), "h-12 w-full rounded-xl text-base")}>
            서류 준비 시작하기
          </a>
        </div>
      )}
    </div>
  );
}
