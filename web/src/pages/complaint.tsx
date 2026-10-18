import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, CircleX } from "lucide-react";
import { DraftBar } from "@/components/draft-bar";
import { Field } from "@/components/field";
import { Option } from "@/components/option";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api, ApiFailure } from "@/lib/api";
import { useDraft } from "@/lib/draft";
import { EVIDENCE, serviceFee, stampFee } from "@/lib/lawsuit";
import { go } from "@/lib/router";
import type { Bank, CaseResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

const won = (n: number) => n.toLocaleString("ko-KR") + "원";
const num = (v: string) => Number(v.replace(/\D/g, "")) || 0;
const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("ko-KR") : "");
const textarea =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const INTEREST =
  "위 피해구제 신청에 따라 원고 명의 계좌가 지급정지되어 원고는 계좌를 사용하지 못하고 있습니다. 이에 「전기통신금융사기 피해 방지 및 피해금 환급에 관한 특별법」 제4조의2제2항에 따라 채무가 존재하지 아니함의 확인을 구합니다.";

const EMPTY_F = { name: "", address: "", phone: "", dName: "", dAddress: "", court: "", accountNo: "", amount: "", part: "", extra: "" };
const BLANK = {
  f: EMPTY_F,
  scope: "ALL" as "ALL" | "PART",
  events: [{ at: "", text: "" }],
  reason: "",
  interest: INTEREST,
  evidence: [] as string[],
  refundChecked: false,
  consulted: false,
};

type Check = { label: string; state: "ok" | "missing" | "warn"; note?: string };

// 채무부존재확인 소장 작성 + 제출 전 점검. 사용자가 쓴 사실을 소장 형식에 옮길 뿐, 승패 판단은 하지 않는다.
// shortcut: 서버에 저장하지 않고 브라우저 인쇄로 PDF를 만든다, 저장·재편집이 필요해지면 암호화 저장으로
// TODO: 출시 전 법률 전문가 검토 (청구취지·청구원인 기본 문구)
export function Complaint({ caseId }: { caseId: string }) {
  const [c, setC] = useState<CaseResponse | null>(null);
  const [bankName, setBankName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState(EMPTY_F);
  const [scope, setScope] = useState(BLANK.scope);
  const [events, setEvents] = useState(BLANK.events);
  const [reason, setReason] = useState("");
  const [interest, setInterest] = useState(INTEREST);
  const [evidence, setEvidence] = useState(BLANK.evidence);
  const [refundChecked, setRefundChecked] = useState(false);
  const [consulted, setConsulted] = useState(false);
  const draft = useDraft(caseId, "COMPLAINT", { f, scope, events, reason, interest, evidence, refundChecked, consulted }, (v) => {
    setF({ ...EMPTY_F, ...v.f });
    setScope(v.scope === "PART" ? "PART" : "ALL");
    setEvents(v.events?.length ? v.events : BLANK.events);
    setReason(v.reason ?? "");
    setInterest(v.interest ?? INTEREST);
    setEvidence(v.evidence ?? []);
    setRefundChecked(!!v.refundChecked);
    setConsulted(!!v.consulted);
  });
  const [today] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

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

  // 금액을 안 고쳤으면 사건에 등록한 입금액을 쓴다(저장본에 넣지 않으려고 상태 대신 계산)
  const amountText = f.amount || (c?.depositAmount ? String(c.depositAmount) : "");
  const amount = num(amountText);
  const part = num(f.part);
  const value = scope === "ALL" ? amount : Math.max(amount - part, 0); // 소가 = 다투는 금액
  const items = [...evidence, ...(f.extra.trim() ? [f.extra.trim()] : [])];
  const filled = events.filter((e) => e.at || e.text.trim());
  const setEvent = (i: number, k: "at" | "text", v: string) => setEvents(events.map((e, j) => (j === i ? { ...e, [k]: v } : e)));
  const toggleEvidence = (name: string, on: boolean) =>
    setEvidence(on ? EVIDENCE.filter((x) => x === name || evidence.includes(x)) : evidence.filter((x) => x !== name));

  const account = `${bankName || "○○은행"} 계좌(계좌번호 ${f.accountNo || "○○○"})`;
  const subject = `${date(c?.depositAt ?? null) || "○○○○. ○. ○."} 원고 명의 ${account}에 입금된 ${amount ? won(amount) : "○○○원"}`;
  const claim =
    scope === "ALL"
      ? `원고의 피고에 대한 ${subject}에 관한 채무는 존재하지 아니함을 확인한다.`
      : `원고의 피고에 대한 ${subject}에 관한 채무는 ${part ? won(part) : "○○○원"}을 초과하여서는 존재하지 아니함을 확인한다.`;

  const checks: Check[] = [
    { label: "원고(나) 성명·주소", state: f.name && f.address ? "ok" : "missing" },
    { label: "피고(피해자) 성명", state: f.dName ? "ok" : "missing", note: "은행에 피해구제 신청인 이름을 물어보세요." },
    { label: "피고 주소", state: f.dAddress ? "ok" : "warn", note: "모르면 비워도 접수할 수 있지만 법원이 주소보정을 요구할 수 있어요." },
    { label: "관할 법원", state: f.court ? "ok" : "missing", note: "보통 피고 주소지 법원이에요." },
    { label: "전체 계좌번호", state: f.accountNo ? "ok" : "missing" },
    {
      label: "다투는 금액",
      state: amount > 0 && (scope === "ALL" || (part > 0 && part < amount)) ? "ok" : "missing",
      note: scope === "PART" ? "인정하는 금액은 입금액보다 작아야 해요." : undefined,
    },
    { label: "채무가 없는 사정", state: reason.trim() ? "ok" : "missing" },
    { label: "증거 1개 이상", state: items.length ? "ok" : "missing" },
    { label: "은행에 환급·채권소멸 진행 여부 확인", state: refundChecked ? "ok" : "warn", note: "환급이 끝났으면 각하될 수 있어요." },
    { label: "132 무료 상담", state: consulted ? "ok" : "warn", note: "권장" },
  ];
  const missing = checks.filter((x) => x.state === "missing").length;

  return (
    <div className="mx-auto max-w-md md:max-w-5xl print:max-w-none">
      <div className="print:hidden">
        <TopBar title="채무부존재확인 소장" />
      </div>
      {error && <p role="alert" className="p-6 text-sm text-destructive">{error}</p>}
      {!c && !error && <p className="p-6 text-sm text-muted-foreground">불러오는 중…</p>}
      {c && draft.ready && (
        <div className="md:grid md:grid-cols-2 md:items-start print:block">
          <form className="space-y-6 p-6 print:hidden" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">소장을 채워 주세요</h2>
              <p className="text-sm text-muted-foreground">
                칸을 채우면 오른쪽(휴대폰은 아래)에 소장이 만들어져요. 입력한 내용은 암호화해 자동 저장되고, 마지막 수정 후 90일이 지나면 지워져요.{" "}
                <a href="#/lawsuit" className="underline">소송이 처음이라면 안내부터 보세요</a>
              </p>
            </div>
            <DraftBar draft={draft} empty={BLANK} />

            <fieldset className="space-y-4">
              <legend className="mb-2 text-lg font-bold">원고 (나)</legend>
              <Field label="성명" autoComplete="name" value={f.name} onChange={set("name")} />
              <Field label="주소" autoComplete="street-address" value={f.address} onChange={set("address")} />
              <Field label="연락처" type="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} />
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="mb-2 text-lg font-bold">피고 (피해구제를 신청한 사람)</legend>
              <Field label="성명" value={f.dName} onChange={set("dName")} hint="은행 지급정지 안내나 입금자명으로 확인할 수 있어요." />
              <Field label="주소 (모르면 비워 두세요)" value={f.dAddress} onChange={set("dAddress")} />
              <Field label="법원" placeholder="예: 서울중앙지방법원" value={f.court} onChange={set("court")} hint="대한민국 법원 누리집의 '관할법원 찾기'에서 피고 주소로 찾을 수 있어요." />
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="mb-2 text-lg font-bold">무엇을 확인받을까요?</legend>
              <Field label="입금된 금액 (원)" inputMode="numeric" value={amountText} onChange={set("amount")} />
              <Field
                label="지급정지된 계좌번호 (전체)"
                inputMode="numeric"
                autoComplete="off"
                value={f.accountNo}
                onChange={set("accountNo")}
                hint={c.accountLast4 ? `등록한 계좌 끝자리: ${c.accountLast4}` : undefined}
              />
              <Option name="scope" checked={scope === "ALL"} onChange={() => setScope("ALL")}>
                <span className="block font-medium">입금액 전부에 대해 채무가 없다</span>
                <span className="block text-sm text-muted-foreground">예: 피해금이 아니거나, 거래 대가로 받은 돈인 경우</span>
              </Option>
              <Option name="scope" checked={scope === "PART"} onChange={() => setScope("PART")}>
                <span className="block font-medium">일정 금액을 넘는 부분만 채무가 없다</span>
                <span className="block text-sm text-muted-foreground">일부는 돌려줘야 한다고 인정하는 경우</span>
              </Option>
              {scope === "PART" && <Field label="인정하는 금액 (원)" inputMode="numeric" value={f.part} onChange={set("part")} />}
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="mb-2 text-lg font-bold">있었던 일 (시간순)</legend>
              {events.map((e, i) => (
                <div key={i} className="space-y-2 rounded-xl border p-3">
                  <Field label={`${i + 1}. 일시`} type="datetime-local" value={e.at} onChange={(ev) => setEvent(i, "at", ev.target.value)} />
                  <Label htmlFor={`cevent-${i}`}>있었던 일</Label>
                  <textarea id={`cevent-${i}`} rows={3} className={textarea} value={e.text} onChange={(ev) => setEvent(i, "text", ev.target.value)} />
                  {events.length > 1 && (
                    <Button type="button" variant="ghost" onClick={() => setEvents(events.filter((_, j) => j !== i))}>
                      이 항목 삭제
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" className="h-10 w-full rounded-xl" onClick={() => setEvents([...events, { at: "", text: "" }])}>
                있었던 일 추가
              </Button>
              <Label htmlFor="reason">채무가 없는 사정</Label>
              <textarea
                id="reason"
                rows={4}
                className={textarea}
                placeholder="예: 입금자와 거래하거나 연락한 적이 없습니다. 입금된 돈은 쓰지 않고 그대로 두었고, 입금 당일 은행에 알렸습니다."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Label htmlFor="interest">소를 제기하는 이유 (기본 문구, 고쳐 써도 돼요)</Label>
              <textarea id="interest" rows={4} className={textarea} value={interest} onChange={(e) => setInterest(e.target.value)} />
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="mb-2 text-lg font-bold">낼 증거</legend>
              {EVIDENCE.map((name) => (
                <Option key={name} type="checkbox" name={name} checked={evidence.includes(name)} onChange={(e) => toggleEvidence(name, e.target.checked)}>
                  {name}
                </Option>
              ))}
              <Field label="그 밖의 증거" value={f.extra} onChange={set("extra")} />
            </fieldset>

            <section aria-label="제출 전 점검" className="space-y-3 rounded-xl border p-4">
              <h3 className="font-bold">제출 전 점검 {missing > 0 ? `· ${missing}개 남았어요` : "· 필수 항목을 모두 채웠어요"}</h3>
              <ul className="space-y-2 text-sm">
                {checks.map((x) => {
                  const Icon = x.state === "ok" ? CircleCheck : x.state === "warn" ? CircleAlert : CircleX;
                  return (
                    <li key={x.label} className="flex gap-2">
                      <Icon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", x.state === "ok" ? "text-success" : x.state === "warn" ? "text-warning" : "text-urgent")} />
                      <span>
                        {x.label}
                        <span className="sr-only">: {x.state === "ok" ? "완료" : x.state === "warn" ? "확인 필요" : "미입력"}</span>
                        {x.state !== "ok" && x.note && <span className="block text-xs text-muted-foreground">{x.note}</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <Option type="checkbox" name="refund" checked={refundChecked} onChange={(e) => setRefundChecked(e.target.checked)}>
                은행에 환급·채권소멸 진행 여부를 확인했어요
              </Option>
              <Option type="checkbox" name="consulted" checked={consulted} onChange={(e) => setConsulted(e.target.checked)}>
                132(대한법률구조공단) 상담을 받았어요
              </Option>
              {value > 0 && (
                <p className="text-sm">
                  예상 비용: 인지액 {won(stampFee(value))} + 송달료 {won(serviceFee())} ={" "}
                  <span className="font-medium">{won(stampFee(value) + serviceFee())}</span>
                </p>
              )}
            </section>

            <Button type="button" className="h-12 w-full rounded-xl text-base" onClick={() => window.print()}>
              인쇄 · PDF로 저장
            </Button>
            <p className="text-xs text-muted-foreground">
              전자소송(ecfs.scourt.go.kr)에 올리거나, 출력해 서명한 뒤 법원 민원실에 내세요. 종이로 낼 때는 피고 수만큼 소장 부본을 더 준비해요. 이 도구는 법률
              자문이 아니에요.
            </p>
            <a href={`#/cases/${caseId}/lawsuit`} className="block text-center text-sm underline">
              소장을 냈다면: 소송 진행 관리
            </a>
          </form>

          <article
            aria-label="소장 미리보기"
            className="mx-6 mb-12 space-y-5 rounded-xl border bg-background p-6 text-sm leading-relaxed md:sticky md:top-6 md:mt-6 print:m-0 print:rounded-none print:border-0 print:p-0 print:text-black"
          >
            <h2 className="text-center text-2xl font-bold tracking-[0.5em]">소장</h2>
            <dl className="grid grid-cols-[4rem_1fr] gap-y-1">
              <dt>원 고</dt>
              <dd>
                {f.name || "○○○"}
                <br />
                {f.address || "주소"}
                {f.phone && <><br />연락처 {f.phone}</>}
              </dd>
              <dt>피 고</dt>
              <dd>
                {f.dName || "○○○"}
                <br />
                {f.dAddress || "주소 불명"}
              </dd>
            </dl>
            <p className="text-center text-base font-bold">채무부존재확인의 소</p>
            {value > 0 && (
              <p className="text-xs">
                소송목적의 값 {won(value)} · 인지액 {won(stampFee(value))} · 송달료 {won(serviceFee())}
              </p>
            )}

            <section className="space-y-1">
              <h3 className="text-center font-bold">청 구 취 지</h3>
              <p>1. {claim}</p>
              <p>2. 소송비용은 피고가 부담한다.</p>
              <p>라는 판결을 구합니다.</p>
            </section>

            <section className="space-y-2">
              <h3 className="text-center font-bold">청 구 원 인</h3>
              <p>
                1. 당사자의 관계
                <br />
                원고는 {account}의 명의인이고, 피고는 위 계좌에 관하여 전기통신금융사기 피해구제를 신청한 사람입니다.
              </p>
              <div>
                <p>2. 입금과 지급정지 경위</p>
                {c.depositAt && (
                  <p>
                    가. {date(c.depositAt)} 원고 명의 {account}에 {amount ? won(amount) : "○○○원"}이 입금되었습니다.
                  </p>
                )}
                {c.frozenAt && <p>나. {date(c.frozenAt)} 위 계좌가 지급정지되었습니다{c.frozenAmount ? ` (지급정지된 금액 ${won(c.frozenAmount)})` : ""}.</p>}
                {filled.map((e, i) => (
                  <p key={i} className="whitespace-pre-wrap">
                    - {e.at && `${new Date(e.at).toLocaleString("ko-KR")} `}
                    {e.text}
                  </p>
                ))}
              </div>
              <p className="whitespace-pre-wrap">
                3. 원고에게 채무가 없는 사정
                <br />
                {reason || "(작성해 주세요)"}
              </p>
              <p className="whitespace-pre-wrap">
                4. 이 소를 제기하는 이유
                <br />
                {interest}
              </p>
            </section>

            <section className="space-y-1">
              <h3 className="text-center font-bold">입 증 방 법</h3>
              {items.length ? items.map((x, i) => <p key={x}>{i + 1}. 갑 제{i + 1}호증 {x}</p>) : <p>(증거를 골라 주세요)</p>}
            </section>

            <section className="space-y-1">
              <h3 className="text-center font-bold">첨 부 서 류</h3>
              <p>1. 위 입증방법 각 1통</p>
              <p>2. 소장 부본 1통</p>
              <p>3. 송달료 납부서 1통</p>
            </section>

            <p className="text-center">{today}</p>
            <p className="text-right">원고 {f.name || "○○○"} (서명 또는 날인)</p>
            <p className="text-lg font-bold">{f.court || "○○지방법원"} 귀중</p>
          </article>
        </div>
      )}
    </div>
  );
}
