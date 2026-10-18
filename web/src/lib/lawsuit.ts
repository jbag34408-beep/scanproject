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
