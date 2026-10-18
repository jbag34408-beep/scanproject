import { useEffect, useState } from "react";
import { Field } from "@/components/field";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api, ApiFailure } from "@/lib/api";
import { go } from "@/lib/router";
import type { Bank, CaseResponse } from "@/lib/types";

const won = (n: number | null) => (n === null ? "" : n.toLocaleString("ko-KR") + "원");
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("ko-KR") : "");
const textarea =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

// 진술서 양식: 사용자가 쓴 내용을 그대로 옮기고, 법적 판단 문구는 넣지 않는다.
// shortcut: 서버에 저장하지 않고 브라우저 인쇄로 PDF를 만든다, 저장·재편집이 필요해지면 암호화 저장 + 서버 PDF로
export function Statement({ caseId }: { caseId: string }) {
  const [c, setC] = useState<CaseResponse | null>(null);
  const [bankName, setBankName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [events, setEvents] = useState([{ at: "", text: "" }]);
  const [request, setRequest] = useState("");
  const [today] = useState(() => new Date().toLocaleDateString("ko-KR"));

  useEffect(() => {
    api<CaseResponse>(`/cases/${caseId}`)
      .then((data) => {
        setC(data);
        if (data.bankCode)
          api<Bank[]>("/banks")
            .then((bs) => setBankName(bs.find((b) => b.code === data.bankCode)?.name ?? ""))
            .catch(() => undefined);
      })
      .catch((err) => {
        if (err instanceof ApiFailure && err.status === 401) return go("/login");
        setError(err instanceof ApiFailure ? err.message : "사건 정보를 불러오지 못했어요.");
      });
  }, [caseId]);

  const setEvent = (i: number, k: "at" | "text", v: string) =>
    setEvents(events.map((e, j) => (j === i ? { ...e, [k]: v } : e)));

  const facts = c
    ? [
        ["은행", bankName],
        ["계좌", c.accountLast4 ? `끝자리 ${c.accountLast4}` : ""],
        ["모르는 입금 일시", when(c.depositAt)],
        ["모르는 입금액", won(c.depositAmount)],
        ["지급정지일", when(c.frozenAt)],
        ["묶인 금액", won(c.frozenAmount)],
      ].filter(([, v]) => v)
    : [];

  return (
    <div className="mx-auto max-w-md md:max-w-5xl print:max-w-none">
      <div className="print:hidden">
        <TopBar title="진술서 작성" />
      </div>
      {error && <p role="alert" className="p-6 text-sm text-destructive">{error}</p>}
      {!c && !error && <p className="p-6 text-sm text-muted-foreground">불러오는 중…</p>}
      {c && (
        <div className="md:grid md:grid-cols-2 md:items-start print:block">
          <form className="space-y-4 p-6 print:hidden" onSubmit={(e) => e.preventDefault()}>
            <h2 className="text-2xl font-bold">겪은 일을 시간순으로 적어 주세요</h2>
            <p className="text-sm text-muted-foreground">
              입력한 내용은 저장되지 않아요. 화면을 나가기 전에 PDF로 저장하세요.
            </p>
            <Field label="이름" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            <Field label="연락처" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />

            <fieldset className="space-y-3">
              <legend className="mb-2 text-sm font-medium">경위</legend>
              {events.map((e, i) => (
                <div key={i} className="space-y-2 rounded-xl border p-3">
                  <Field label={`${i + 1}. 일시`} type="datetime-local" value={e.at} onChange={(ev) => setEvent(i, "at", ev.target.value)} />
                  <Label htmlFor={`event-${i}`}>있었던 일</Label>
                  <textarea id={`event-${i}`} rows={3} className={textarea} value={e.text} onChange={(ev) => setEvent(i, "text", ev.target.value)} />
                  {events.length > 1 && (
                    <Button type="button" variant="ghost" onClick={() => setEvents(events.filter((_, j) => j !== i))}>
                      이 항목 삭제
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" className="h-10 w-full rounded-xl" onClick={() => setEvents([...events, { at: "", text: "" }])}>
                경위 추가
              </Button>
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="request">요청 사항</Label>
              <textarea id="request" rows={3} className={textarea} placeholder="은행에 요청하고 싶은 내용을 직접 적어 주세요." value={request} onChange={(e) => setRequest(e.target.value)} />
            </div>
            <Button type="button" className="h-12 w-full rounded-xl text-base" onClick={() => window.print()}>
              인쇄 · PDF로 저장
            </Button>
            <p className="text-xs text-muted-foreground">인쇄 창에서 대상을 'PDF로 저장'으로 고르세요. 미리보기가 인쇄될 모습이에요.</p>
          </form>

          <article aria-label="진술서 미리보기" className="mx-6 mb-12 space-y-6 rounded-xl border p-6 text-sm md:sticky md:top-6 md:mt-6 print:m-0 print:border-0 print:p-0">
            <h2 className="text-center text-2xl font-bold tracking-[0.5em]">진술서</h2>
            <dl className="grid grid-cols-[7rem_1fr] gap-y-1">
              <dt className="text-muted-foreground">성명</dt>
              <dd>{name}</dd>
              <dt className="text-muted-foreground">연락처</dt>
              <dd>{phone}</dd>
              {facts.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <section className="space-y-2">
              <h3 className="font-bold">경위</h3>
              <ol className="space-y-2">
                {events
                  .filter((e) => e.at || e.text.trim())
                  .map((e, i) => (
                    <li key={i}>
                      <span className="font-medium">{e.at && new Date(e.at).toLocaleString("ko-KR")}</span>
                      <p className="whitespace-pre-wrap">{e.text}</p>
                    </li>
                  ))}
              </ol>
            </section>
            {request.trim() && (
              <section className="space-y-2">
                <h3 className="font-bold">요청 사항</h3>
                <p className="whitespace-pre-wrap">{request}</p>
              </section>
            )}
            <p>위 내용은 사실과 다름없습니다.</p>
            <div className="space-y-1 text-right">
              <p>{today}</p>
              <p>작성자 {name} (서명)</p>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
