// 채무부존재확인 소송 비용 예상. 근거: 민사소송 등 인지법 제2조, 송달료규칙(1심 민사 단독 = 당사자 수 × 15회분)
// 채무부존재확인은 '지급'이 아니라 '확인'을 구하는 소라 소액사건(3천만 원 이하 지급청구)이 아니다.

// shortcut: 송달료 1회분은 법원이 바꾸는 값이라 상수로 둔다, 바뀌면 이 값만 고친다
export const SERVICE_FEE_PER_ROUND = 5500;
const ROUNDS_PER_PARTY = 15;

/** 1심 소장 인지액. 100원 미만 버림, 최소 1,000원. */
export function stampFee(amount: number): number {
  let fee: number;
  if (amount < 10_000_000) fee = amount * 0.005;
  else if (amount < 100_000_000) fee = amount * 0.0045 + 5_000;
  else if (amount < 1_000_000_000) fee = amount * 0.004 + 55_000;
  else fee = amount * 0.0035 + 555_000;
  return Math.max(1_000, Math.floor(fee / 100) * 100);
}

/** 송달료 예납액. 원고·피고 각 1명이면 parties = 2. */
export const serviceFee = (parties = 2) => parties * ROUNDS_PER_PARTY * SERVICE_FEE_PER_ROUND;

// 입증방법 후보. 고른 순서대로 갑 제1호증, 제2호증… 번호를 붙인다
export const EVIDENCE = [
  "거래내역서(문제 입금 전후)",
  "지급정지 통지서 또는 은행 안내 기록",
  "입금 직후 은행에 알린 기록(상담 일시, 통화 캡처)",
  "협박 문자·메신저 캡처, 통화 녹음",
  "112 신고내역·사건번호",
  "재직증명서·급여 입금내역 등 계좌 원래 용도 자료",
  "거래 대금이라면 계약서·주문내역·운송장",
];

export type LawsuitRecord = {
  court: string | null;
  caseNumber: string | null;
  filedAt: string | null; // YYYY-MM-DD
  proofSubmittedAt: string | null;
  hearingAt: string | null; // YYYY-MM-DDTHH:mm(:ss)
  judgmentServedAt: string | null;
  result: "WON" | "PARTIAL" | "LOST" | null;
  finalizedAt: string | null;
};

export type ProgressStep = { key: string; title: string; done: boolean; todo: string; due?: string; dday?: number; urgent?: boolean };

const DAY = 86_400_000;
const utc = (ymd: string) => Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10));
const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (date: string, days: number) => ymd(utc(date) + days * DAY);
export const daysBetween = (from: string, to: string) => Math.round((utc(to) - utc(from)) / DAY);

// 항소는 판결정본 송달일 다음 날부터 2주 안(민사소송법 제396조). 말일이 공휴일이면 다음 날(민법 제161조)은 화면 문구로만 안내
export const appealDeadline = (servedAt: string) => addDays(servedAt, 14);

/** 소송 단계별 할 일과 기한. today = YYYY-MM-DD */
export function lawsuitSteps(l: LawsuitRecord, today: string): ProgressStep[] {
  const due = (date: string | null | undefined) => (date ? { due: date.slice(0, 10), dday: daysBetween(today, date.slice(0, 10)) } : {});
  const appeal = l.judgmentServedAt ? appealDeadline(l.judgmentServedAt) : null;
  return [
    {
      key: "FILE",
      title: "소장 제출",
      done: !!l.filedAt,
      todo: "전자소송(ecfs.scourt.go.kr)이나 법원 민원실에 소장을 내고 인지액·송달료를 내세요. 접수되면 사건번호(예: 2026가단12345)를 적어 두세요.",
    },
    {
      key: "PROOF",
      title: "소제기증명원 은행 제출",
      done: !!l.proofSubmittedAt,
      urgent: !!l.filedAt && !l.proofSubmittedAt,
      todo: "법원(전자소송)에서 소제기증명원을 발급받아 지급정지한 은행에 내세요. 은행이 소송 중인 걸 알아야 채권소멸 공고가 멈추고, 피해금이 아닌 돈의 해제를 요청할 수 있어요.",
    },
    {
      key: "HEARING",
      title: "변론기일 출석",
      done: !!l.judgmentServedAt,
      ...due(l.hearingAt),
      todo: "법원 우편과 전자소송 알림을 꼭 확인하세요. 기일에는 신분증과 증거 원본을 가져가요. 피고가 낸 서면에는 사실로만 답하세요.",
    },
    {
      key: "JUDGMENT",
      title: "판결과 항소 기한",
      done: !!l.finalizedAt,
      ...due(appeal),
      urgent: !!appeal && !l.finalizedAt && daysBetween(today, appeal) >= 0 && daysBetween(today, appeal) <= 7,
      todo:
        "판결정본을 받은 날부터 2주 안에 항소할 수 있어요(기한 마지막 날이 공휴일이면 다음 날까지). 양쪽 모두 항소하지 않으면 판결이 확정돼요." +
        (l.result && l.result !== "WON" ? " 결과가 불리하다면 기한 전에 132에 상담하세요." : ""),
    },
    {
      key: "BANK",
      title: "판결 확정 후 은행에 해제 요청",
      done: false,
      todo: "법원에서 판결정본과 확정증명원을 받아 은행에 내고 지급정지 해제를 요청하세요. 풀리면 내 사건에서 '일부 해제됐어요'로 기록하세요.",
    },
  ];
}
