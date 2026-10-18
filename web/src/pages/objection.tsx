import { useEffect, useState, type ReactNode } from "react";
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

const EMPTY = { name: "", birth: "", address: "", tel: "", mobile: "", email: "", branch: "", depositType: "보통예금", accountNo: "", holder: "" };

// 서식 표의 한 칸: 작은 제목 + 입력값
function Cell({ label, children, className = "" }: { label: string; children?: ReactNode; className?: string }) {
  return (
    <td className={"border-b border-l border-foreground/40 px-2 py-1.5 align-top first:border-l-0 " + className}>
      <span className="block text-[11px] text-muted-foreground print:text-black">{label}</span>
      <span className="block min-h-5 break-all">{children}</span>
    </td>
  );
}

// 통신사기피해환급법 시행령 [별지 제4호서식] 이의제기신청서. 은행 창구 양식도 같은 서식이고 수신 금융회사만 다르다.
// 사용자가 쓴 내용만 옮기고 법적 판단 문구는 넣지 않는다.
// shortcut: 서버에 저장하지 않고 브라우저 인쇄로 PDF를 만든다, 저장·재편집이 필요해지면 암호화 저장 + 서버 PDF로
export function Objection({ caseId }: { caseId: string }) {
  const [c, setC] = useState<CaseResponse | null>(null);
  const [bankName, setBankName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState(EMPTY);
  const [events, setEvents] = useState([{ at: "", text: "" }]);
  const [request, setRequest] = useState("");
  const [today] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  });
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

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
        ["모르는 입금 일시", when(c.depositAt)],
        ["모르는 입금액", won(c.depositAmount)],
        ["지급정지일", when(c.frozenAt)],
        ["지급정지된 금액", won(c.frozenAmount)],
      ].filter(([, v]) => v)
    : [];
  const filled = events.filter((e) => e.at || e.text.trim());

  return (
    <div className="mx-auto max-w-md md:max-w-5xl print:max-w-none">
      <div className="print:hidden">
        <TopBar title="이의제기 신청서" />
      </div>
      {error && <p role="alert" className="p-6 text-sm text-destructive">{error}</p>}
      {!c && !error && <p className="p-6 text-sm text-muted-foreground">불러오는 중…</p>}
      {c && (
        <div className="md:grid md:grid-cols-2 md:items-start print:block">
          <form className="space-y-4 p-6 print:hidden" onSubmit={(e) => e.preventDefault()}>
            <h2 className="text-2xl font-bold">이의제기 신청서를 채워 주세요</h2>
            <p className="text-sm text-muted-foreground">
              {bankName || "은행"} 창구에서 받는 것과 같은 법정 서식(통신사기피해환급법 시행령 별지 제4호서식)이에요. 입력한 내용은 저장되지 않으니
              화면을 나가기 전에 PDF로 저장하세요.
            </p>

            <fieldset className="space-y-4">
              <legend className="mb-2 text-lg font-bold">신청인</legend>
              <Field label="성명" autoComplete="name" value={f.name} onChange={set("name")} />
              <Field label="생년월일" placeholder="예: 1990. 1. 1." value={f.birth} onChange={set("birth")} />
              <Field label="주소" autoComplete="street-address" value={f.address} onChange={set("address")} />
              <Field label="휴대전화번호" type="tel" autoComplete="tel" value={f.mobile} onChange={set("mobile")} />
              <Field label="전화번호 (선택)" type="tel" value={f.tel} onChange={set("tel")} />
              <Field label="전자우편주소 (선택)" type="email" autoComplete="email" value={f.email} onChange={set("email")} />
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="mb-2 text-lg font-bold">지급정지 계좌</legend>
              <p className="text-sm text-muted-foreground">금융회사: {bankName || "사건에 은행이 등록되지 않았어요"}</p>
              <Field label="개설점포" placeholder="예: ○○지점 (모르면 비워 두세요)" value={f.branch} onChange={set("branch")} />
              <Field label="예금종별" value={f.depositType} onChange={set("depositType")} />
              <Field
                label="계좌번호"
                inputMode="numeric"
                autoComplete="off"
                value={f.accountNo}
                onChange={set("accountNo")}
                hint={c.accountLast4 ? `등록한 계좌 끝자리: ${c.accountLast4}. 서식에는 전체 번호가 필요해요.` : undefined}
              />
              <Field label="명의인" placeholder="비우면 신청인 성명" value={f.holder} onChange={set("holder")} />
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="mb-2 text-lg font-bold">이의제기 사유</legend>
              <p className="text-sm text-muted-foreground">
                언제, 얼마가, 누구 이름으로 들어왔고 언제 누구에게 알렸는지 시간순으로 사실만 적어 주세요. 사건에 등록한 입금·지급정지 정보는 자동으로 들어가요.
              </p>
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
              <Label htmlFor="request">요청 사항</Label>
              <textarea id="request" rows={3} className={textarea} placeholder="은행에 요청하고 싶은 내용을 직접 적어 주세요." value={request} onChange={(e) => setRequest(e.target.value)} />
            </fieldset>

            <div className="space-y-1 rounded-xl bg-muted p-4 text-sm">
              <p className="font-medium">함께 낼 서류 (서식 첨부서류)</p>
              <p>1. 사기이용계좌가 아니라는 사실을 증명하는 자료 — 서류 준비 화면의 체크리스트를 참고하세요.</p>
              <p>2. 신분증 사본</p>
              <p className="text-xs text-muted-foreground">은행에 따라 자체 양식이나 추가 서류를 요구할 수 있어요. 제출 전에 은행에 확인하세요.</p>
            </div>
            <Button type="button" className="h-12 w-full rounded-xl text-base" onClick={() => window.print()}>
              인쇄 · PDF로 저장
            </Button>
            <p className="text-xs text-muted-foreground">인쇄 창에서 대상을 'PDF로 저장'으로 고르세요. 출력한 뒤 성명 옆에 서명하거나 도장을 찍어 내세요.</p>
          </form>

          <article
            aria-label="이의제기 신청서 미리보기"
            className="mx-6 mb-12 space-y-4 rounded-xl border bg-background p-6 text-sm md:sticky md:top-6 md:mt-6 print:m-0 print:rounded-none print:border-0 print:p-0 print:text-black"
          >
            <p className="text-[11px]">■ 전기통신금융사기 피해 방지 및 피해금 환급에 관한 특별법 시행령 [별지 제4호서식]</p>
            <h2 className="text-center text-2xl font-bold">이의제기신청서</h2>
            <p className="text-[11px]">※ 색상이 어두운 란은 신청인이 적지 않습니다.</p>
            <table className="w-full border-collapse border-t-2 border-foreground/70 bg-muted text-sm [print-color-adjust:exact] print:bg-neutral-200">
              <tbody>
                <tr>
                  <Cell label="접수번호" className="w-1/3" />
                  <Cell label="접수일자" />
                </tr>
              </tbody>
            </table>
            <table className="w-full border-collapse border-y-2 border-foreground/70 text-sm">
              <tbody>
                <tr>
                  <th rowSpan={3} className="w-16 border-r border-b border-foreground/40 font-normal">신청인</th>
                  <Cell label="성 명">{f.name}</Cell>
                  <Cell label="생년월일">{f.birth}</Cell>
                </tr>
                <tr>
                  <Cell label="주 소">{f.address}</Cell>
                  <Cell label="휴대전화번호">{f.mobile}</Cell>
                </tr>
                <tr>
                  <Cell label="전화번호">{f.tel}</Cell>
                  <Cell label="전자우편주소">{f.email}</Cell>
                </tr>
                <tr>
                  <th rowSpan={2} className="border-r border-b border-foreground/40 font-normal">지급정지 계좌</th>
                  <Cell label="금융회사">{bankName}</Cell>
                  <Cell label="개설점포 / 예금종별">{[f.branch, f.depositType].filter(Boolean).join(" / ")}</Cell>
                </tr>
                <tr>
                  <Cell label="계좌번호">{f.accountNo}</Cell>
                  <Cell label="명의인">{f.holder || f.name}</Cell>
                </tr>
              </tbody>
            </table>

            <section className="min-h-48 space-y-2 border-b-2 border-foreground/70 pb-4">
              <h3>이의제기 사유(구체적으로 기재합니다)</h3>
              {facts.length > 0 && (
                <ul className="space-y-0.5">
                  {facts.map(([k, v]) => (
                    <li key={k}>· {k}: {v}</li>
                  ))}
                </ul>
              )}
              {filled.length > 0 && (
                <ol className="space-y-1">
                  {filled.map((e, i) => (
                    <li key={i}>
                      {i + 1}. {e.at && <span className="font-medium">{new Date(e.at).toLocaleString("ko-KR")} </span>}
                      <span className="whitespace-pre-wrap">{e.text}</span>
                    </li>
                  ))}
                </ol>
              )}
              {request.trim() && <p className="whitespace-pre-wrap">{request}</p>}
            </section>

            <p className="leading-relaxed">
              「전기통신금융사기 피해 방지 및 피해금 환급에 관한 특별법」 제7조제1항 및 같은 법 시행령 제7조에 따라 본인의 계좌에 대한 지급정지,
              전자금융거래 제한 또는 채권소멸절차에 대하여 위와 같이 이의제기를 신청합니다.
            </p>
            <p className="text-right">{today}</p>
            <p className="text-right">
              신청인 성 명 <span className="inline-block min-w-24 text-center">{f.name}</span> (서명 또는 인)
            </p>
            <p className="text-lg font-bold">{bankName || "○○○ 금융회사"} 귀하</p>
            <table className="w-full border-collapse border-y border-foreground/70 text-xs">
              <tbody>
                <tr>
                  <th className="w-16 border-r border-foreground/40 font-normal">첨부서류</th>
                  <td className="px-2 py-1.5">
                    1. 사기이용계좌가 아니라는 사실을 증명하는 자료 1부
                    <br />
                    2. 사기이용계좌 명의인의 신분증 사본 1부
                  </td>
                  <td className="w-14 border-l border-foreground/40 text-center">수수료 없음</td>
                </tr>
              </tbody>
            </table>
          </article>
        </div>
      )}
    </div>
  );
}
