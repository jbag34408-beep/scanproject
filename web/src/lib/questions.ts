// 진단 질문. key는 백엔드 DiagnosisRequest 필드명과 같다.

type Choice = { value: string | boolean; label: string };

export type Question = { key: string; title: string; help?: string } & (
  | { type: "single"; options: Choice[] }
  | { type: "multi"; options: Choice[] }
  | { type: "date" }
);

const yesNo: Choice[] = [
  { value: true, label: "네" },
  { value: false, label: "아니요" },
];
const yesNoUnsure: Choice[] = [
  { value: "YES", label: "네" },
  { value: "NO", label: "아니요" },
  { value: "UNSURE", label: "잘 모르겠어요" },
];

export const QUESTIONS: Question[] = [
  {
    key: "knowsDepositor",
    title: "이 돈을 보낸 사람을 아시나요?",
    help: "입금자명에 적힌 아이디(텔레그램 등)로는 연락하지 마세요. 연락하면 협박이 시작되는 경우가 많아요.",
    type: "single",
    options: [
      { value: "NO", label: "모르는 사람이에요" },
      { value: "YES", label: "아는 사람이에요" },
      { value: "UNSURE", label: "잘 모르겠어요" },
    ],
  },
  {
    key: "depositReason",
    title: "왜 들어온 돈인가요?",
    type: "single",
    options: [
      { value: "UNKNOWN", label: "이유를 모르는 돈이에요" },
      { value: "TRADE", label: "물건을 팔거나 거래하고 받은 돈이에요" },
      { value: "EXCHANGE", label: "코인·상품권·환전 거래 대금이에요" },
      { value: "OTHER", label: "기타" },
    ],
  },
  {
    key: "transferStage",
    title: "피해자에게서 바로 들어온 돈인가요?",
    help: "은행에서 '몇 차' 계좌인지 알려주기도 해요.",
    type: "single",
    options: [
      { value: "FIRST", label: "네, 바로 들어왔어요(1차)" },
      { value: "LATER", label: "다른 계좌를 거쳐 왔다고 들었어요(n차)" },
      { value: "UNSURE", label: "잘 모르겠어요" },
    ],
  },
  { key: "bankNoticeReceived", title: "은행에서 지급정지 통지를 받았나요?", type: "single", options: yesNo },
  {
    key: "writtenClaimFiled",
    title: "피해자가 서면 피해구제 신청까지 했나요?",
    help: "은행에 '서면 접수됐는지' 물어보면 알 수 있어요.",
    type: "single",
    options: yesNoUnsure,
  },
  {
    key: "claimNoticeDate",
    title: "채권소멸 공고일을 아시나요?",
    help: "은행에서 알려준 날짜를 입력하세요. 모르면 비워 두고 다음으로 넘어가세요.",
    type: "date",
  },
  { key: "priorFreeze", title: "예전에 지급정지된 적이 있나요?", type: "single", options: yesNoUnsure },
  {
    key: "accountUsage",
    title: "이 계좌는 주로 어디에 쓰나요?",
    type: "single",
    options: [
      { value: "SALARY", label: "급여를 받는 계좌" },
      { value: "BUSINESS", label: "사업·매출 계좌" },
      { value: "SECONDHAND", label: "중고거래용 계좌" },
      { value: "LIVING", label: "생활비 계좌(공과금·카드대금)" },
      { value: "OTHER", label: "기타" },
    ],
  },
  {
    key: "paidToThreatener",
    title: "계좌를 풀어주겠다며 돈을 요구받았나요?",
    type: "single",
    options: [
      { value: "NONE", label: "아니요" },
      { value: "ASKED", label: "요구받았지만 보내지 않았어요" },
      { value: "PAID", label: "돈을 보냈어요" },
    ],
  },
  { key: "policeReported", title: "경찰에 신고했나요?", type: "single", options: yesNo },
  { key: "policeSummoned", title: "경찰에서 출석 요구를 받았나요?", type: "single", options: yesNo },
  { key: "otherRestrictions", title: "다른 계좌나 모바일뱅킹도 막혔나요?", type: "single", options: yesNoUnsure },
  {
    key: "accountHandedOver",
    title: "계좌나 카드를 남에게 빌려주거나 판 적이 있나요?",
    help: "구인광고 등에 속아 넘긴 경우도 포함돼요. 사실대로 답해야 맞는 안내를 받을 수 있어요.",
    type: "single",
    options: yesNo,
  },
  {
    key: "evidence",
    title: "가지고 있는 자료를 모두 골라 주세요",
    help: "없으면 선택하지 않고 넘어가세요.",
    type: "multi",
    options: [
      { value: "TRANSACTION_HISTORY", label: "입금 전후 거래내역서" },
      { value: "BANK_CONTACT_RECORD", label: "입금 직후 은행에 알린 기록" },
      { value: "THREAT_MESSAGES", label: "협박 문자·메신저 캡처, 통화 녹음" },
      { value: "POLICE_REPORT", label: "112 신고내역·사건번호" },
      { value: "EMPLOYMENT_PROOF", label: "건강보험자격득실확인서·재직증명서" },
      { value: "SALARY_HISTORY", label: "급여 입금내역" },
      { value: "BUSINESS_REGISTRATION", label: "사업자등록증" },
      { value: "TRADE_PROOF", label: "거래 증빙(대화·게시글·송장)" },
      { value: "AUTO_PAYMENT_HISTORY", label: "자동이체 내역" },
    ],
  },
];
