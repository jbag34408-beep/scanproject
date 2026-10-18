import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { api, ApiFailure } from "@/lib/api";
import { go } from "@/lib/router";
import type { CaseResponse, CaseStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<CaseStatus, string> = {
  DRAFT: "진단 전",
  DIAGNOSED: "진단 완료",
  PREPARING: "서류 준비 중",
  SUBMITTED: "제출함",
  PARTIAL_RELEASED: "일부 해제됨",
  CLOSED: "종료",
};

const linkButton = (variant: "default" | "outline") =>
  cn(buttonVariants({ variant }), "h-10 flex-1 rounded-xl");

// 사용자가 직접 기록하는 다음 상태. 서버는 받은 상태를 그대로 저장한다.
const NEXT: Partial<Record<CaseStatus, { to: CaseStatus; label: string; confirm: string }[]>> = {
  DIAGNOSED: [{ to: "SUBMITTED", label: "은행에 제출했어요", confirm: "이의제기 서류를 은행에 제출했나요?" }],
  PREPARING: [{ to: "SUBMITTED", label: "은행에 제출했어요", confirm: "이의제기 서류를 은행에 제출했나요?" }],
  SUBMITTED: [
    { to: "PARTIAL_RELEASED", label: "일부 해제됐어요", confirm: "지급정지가 일부 해제됐나요?" },
    { to: "CLOSED", label: "사건 종료", confirm: "이 사건을 종료로 기록할까요?" },
  ],
  PARTIAL_RELEASED: [{ to: "CLOSED", label: "사건 종료", confirm: "이 사건을 종료로 기록할까요?" }],
};

// 내 사건 목록 (이어서 하기). 로그인 후 첫 화면.
export function Cases() {
  const [cases, setCases] = useState<CaseResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<CaseResponse[]>("/cases")
      .then(setCases)
      .catch((err) => {
        if (err instanceof ApiFailure && err.status === 401) return go("/login");
        setError("사건 목록을 불러오지 못했어요.");
      });
  }, []);

  async function changeStatus(id: number, next: { to: CaseStatus; confirm: string }) {
    if (!window.confirm(next.confirm)) return;
    try {
      const updated = await api<CaseResponse>(`/cases/${id}`, { method: "PATCH", body: { status: next.to } });
      setCases((cs) => cs?.map((c) => (c.id === id ? updated : c)) ?? null);
      setError(null);
    } catch (err) {
      if (err instanceof ApiFailure && err.status === 401) return go("/login");
      setError("상태를 저장하지 못했어요. 다시 시도해 주세요.");
    }
  }

  async function logout() {
    // 실패해도 화면은 나간다. 세션은 서버 만료 시간(30분)에 정리된다.
    await api("/auth/logout", { method: "POST" }).catch(() => undefined);
    go("/");
  }

  return (
    <div className="mx-auto max-w-md md:max-w-3xl">
      <header className="flex items-center justify-between px-6 py-4">
        <h1 className="text-lg font-bold">내 사건</h1>
        <Button variant="ghost" onClick={logout}>
          로그아웃
        </Button>
      </header>

      <div className="grid gap-3 px-6 pb-12 md:grid-cols-2">
        {error && <p role="alert" className="text-sm text-destructive md:col-span-2">{error}</p>}
        {cases?.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground md:col-span-2">아직 등록한 사건이 없어요.</p>
        )}
        {cases?.map((c) => (
          <article key={c.id} className="space-y-3 rounded-xl border p-4">
            <div className="flex items-center gap-2">
              <h2 className="flex-1 font-medium">
                사건 #{c.id}
                {c.accountLast4 && <span className="ml-2 text-sm text-muted-foreground">계좌 끝자리 {c.accountLast4}</span>}
              </h2>
              <Badge variant="secondary">{STATUS_LABEL[c.status]}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("ko-KR")} 등록</p>
            <div className="flex gap-2">
              {c.status === "DRAFT" ? (
                <a href={`#/cases/${c.id}/diagnosis`} className={linkButton("default")}>
                  진단하기
                </a>
              ) : (
                <>
                  <a href={`#/cases/${c.id}/result`} className={linkButton("outline")}>
                    진단 결과
                  </a>
                  <a href={`#/cases/${c.id}/checklist`} className={linkButton("default")}>
                    서류 준비
                  </a>
                </>
              )}
            </div>
            {c.status !== "DRAFT" && (
              <a href={`#/cases/${c.id}/objection`} className={cn(linkButton("outline"), "w-full")}>
                이의제기 신청서 작성
              </a>
            )}
            {NEXT[c.status] && (
              <div className="flex gap-2">
                {NEXT[c.status]!.map((n) => (
                  <Button key={n.to} variant="secondary" className="h-10 flex-1 rounded-xl" onClick={() => changeStatus(c.id, n)}>
                    {n.label}
                  </Button>
                ))}
              </div>
            )}
          </article>
        ))}
        <a href="#/cases/new" className={cn(buttonVariants({ variant: "outline" }), "h-12 w-full rounded-xl text-base md:col-span-2")}>
          새 사건 등록
        </a>
      </div>
    </div>
  );
}
