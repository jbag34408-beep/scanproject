package com.unfreeze.diagnosis;

import com.unfreeze.cases.Case;
import com.unfreeze.diagnosis.dto.DiagnosisRequest;
import com.unfreeze.diagnosis.dto.DiagnosisRequest.AccountUsage;
import com.unfreeze.diagnosis.dto.DiagnosisRequest.Answer;
import com.unfreeze.diagnosis.dto.DiagnosisRequest.DepositReason;
import com.unfreeze.diagnosis.dto.DiagnosisRequest.Evidence;
import com.unfreeze.diagnosis.dto.DiagnosisRequest.ThreatPayment;
import com.unfreeze.diagnosis.dto.DiagnosisRequest.TransferStage;
import com.unfreeze.diagnosis.dto.DiagnosisResult;
import com.unfreeze.diagnosis.dto.DiagnosisResult.Alert;
import com.unfreeze.diagnosis.dto.DiagnosisResult.Amounts;
import com.unfreeze.diagnosis.dto.DiagnosisResult.Document;
import com.unfreeze.diagnosis.dto.DiagnosisResult.Pathway;
import com.unfreeze.diagnosis.dto.DiagnosisResult.Step;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 진단 규칙. 판정("해제 가능/불가")이 아니라 해당될 수 있는 절차·준비물·주의사항만 안내한다.
 * 같은 입력이면 항상 같은 결과. 규칙을 바꾸면 VERSION도 올린다.
 * 근거: 핑돈 해결법 정리(2026-10-18 기준, 공식 안내 + 커뮤니티 경험담). 공식 근거가 없는 커뮤니티 정보는 단정하지 않고 "은행에 확인"으로만 안내한다.
 */
// TODO: 출시 전 법률 전문가 검토 후 문구 확정
public final class DiagnosisRules {

    public static final String VERSION = "2026-10-v2";

    static final String DISCLAIMER = "이 결과는 입력하신 내용을 바탕으로 한 일반 정보이며 법률 자문이 아닙니다. "
            + "실제 처리는 금융회사와 수사기관의 판단에 따릅니다. "
            + "문의: 금융감독원 1332, 경찰 112, 대한법률구조공단 132(무료 법률상담).";

    static final Pathway CHECK_BANK_NOTICE = new Pathway("CHECK_BANK_NOTICE", "은행 지급정지 통지 확인",
            "지급정지 통지를 아직 받지 못했다면 정지 사유와 금액, 채권소멸 공고일을 은행에서 먼저 확인해야 합니다.");
    static final Pathway REPORT_THREAT = new Pathway("REPORT_THREAT", "협박 신고",
            "사기범에게는 지급정지 해제 권한이 없습니다. 돈을 요구하는 것은 공갈·협박으로 고소할 수 있습니다.");
    static final Pathway OBJECTION_PARTIAL_RELEASE = new Pathway("OBJECTION_PARTIAL_RELEASE",
            "내 계좌 은행에 이의제기(일부 지급정지 요청)",
            "모르는 돈이 입금된 뒤 계좌가 묶였다면, 협박 여부와 관계없이 내 계좌 은행에 이의제기하는 것이 정식 경로입니다. "
                    + "받아들여지면 입금된 돈만 묶이고 나머지 잔액은 풀리는 것이 원칙입니다.");
    static final Pathway OBJECTION_WITH_TRADE_PROOF = new Pathway("OBJECTION_WITH_TRADE_PROOF",
            "정상 거래 증빙을 첨부한 이의제기",
            "판매·중고거래 등 거래 대가로 받은 돈이라면 거래 사실을 보여주는 자료가 핵심입니다.");
    static final Pathway SETTLE_VIA_BANK = new Pathway("SETTLE_VIA_BANK", "은행 중재로 피해자와 합의(병행)",
            "실제 피해자가 은행에 해제를 요청하면 빨리 풀릴 수 있습니다. 연락은 반드시 은행을 통해서만 합니다.");
    static final Pathway CONSULT_EXPERT = new Pathway("CONSULT_EXPERT", "전문가 상담",
            "입력하신 상황은 스스로 진행하기보다 변호사 등 전문가와 상담한 뒤 진행하는 것이 안전합니다.");

    static final List<Alert> COMMON_WARNINGS = List.of(
            new Alert("WARNING", "DO_NOT_USE_FUNDS",
                    "입금된 돈은 인출하거나 쓰지 마세요. 원인 없이 들어온 돈을 쓰면 횡령죄가 될 수 있습니다(대법원 2017도17494)."),
            new Alert("WARNING", "NO_DIRECT_RETURN",
                    "상대가 알려준 계좌로 직접 돌려보내지 말고 은행을 통해서만 반환하세요. 입금자명에 적힌 아이디(텔레그램 등)로 연락하지 마세요."),
            new Alert("WARNING", "BEWARE_FIXERS",
                    "'지급정지 풀어준다'는 업체·개인은 불법이거나 2차 사기일 수 있습니다. 공식 창구는 은행, 금감원 1332, 경찰 112입니다."));

    // 간소화 심사의 "생계와 관련된 거래" 조건에 해당할 수 있는 계좌 용도
    private static final Set<AccountUsage> LIVELIHOOD = Set.of(AccountUsage.SALARY, AccountUsage.BUSINESS, AccountUsage.LIVING);

    private DiagnosisRules() {
    }

    public static DiagnosisResult evaluate(Case c, DiagnosisRequest a) {
        String bankCode = c.getBank() == null ? null : c.getBank().getCode();
        boolean threat = c.isThreatReceived() || a.paidToThreatener() != ThreatPayment.NONE;

        List<Alert> alerts = new ArrayList<>();
        if (threat) {
            alerts.add(new Alert("URGENT", "THREAT_DO_NOT_PAY",
                    "돈을 보내도 풀리지 않습니다. 협박 대화는 지우지 말고 캡처·녹음해 두고 경찰(112)에 신고하세요."));
        }
        if (a.claimNoticeDate() != null) {
            alerts.add(new Alert("DEADLINE", "OBJECTION_DEADLINE",
                    "채권소멸 공고일(" + a.claimNoticeDate() + ")로부터 2개월 안, 참고 기한 " + a.claimNoticeDate().plusMonths(2)
                            + " 전에 이의제기해야 합니다. 정확한 기한은 은행에 확인하세요."));
        }

        List<Pathway> pathways = new ArrayList<>();
        List<Step> steps = new ArrayList<>();
        Map<String, Document> documents = new LinkedHashMap<>();

        if (a.accountHandedOver() || a.depositReason() == DepositReason.EXCHANGE) {
            // 계좌를 넘겼거나 코인·환전 대금이면 핑돈 피해와 법적 성격이 달라 셀프 진행 단계는 안내하지 않는다
            pathways.add(CONSULT_EXPERT);
            addConsultStep(steps);
        } else {
            boolean trade = a.depositReason() == DepositReason.TRADE;
            boolean pingMoney = a.knowsDepositor() != Answer.YES && a.depositReason() == DepositReason.UNKNOWN;
            boolean objection = trade || pingMoney;

            if (!a.bankNoticeReceived()) {
                pathways.add(CHECK_BANK_NOTICE);
            }
            addStep(steps, "은행에 지급정지 내용 확인", bankCheckDetail(a), bankCode);

            if (threat) {
                pathways.add(REPORT_THREAT);
                if (!a.policeReported()) {
                    addStep(steps, "경찰 신고",
                            "112 신고 또는 경찰서 고소를 하고, 접수증·사건번호를 받아 이의제기 자료로 함께 내세요.", null);
                }
            }
            if (a.policeSummoned()) {
                addStep(steps, "경찰 출석 준비",
                        "입금을 몰랐고, 돈을 쓰지 않았고, 바로 은행에 알렸다는 기록을 정리해 가세요. "
                                + "피의자 신분이면 변호사 상담을 권합니다(대한법률구조공단 132).", null);
            }
            if (a.otherRestrictions() != Answer.NO) {
                addStep(steps, "전자금융거래 제한 확인",
                        "다른 은행 계좌의 앱 이체 등 비대면 거래도 막힐 수 있습니다. 생활비가 급하면 다른 은행 영업점에 "
                                + "방문 거래가 되는지 먼저 전화로 확인하세요. 이의제기가 받아들여지면 제한도 함께 끝납니다.", bankCode);
            }

            if (trade) {
                pathways.add(OBJECTION_WITH_TRADE_PROOF);
            } else if (pingMoney) {
                pathways.add(OBJECTION_PARTIAL_RELEASE);
            } else {
                // 규칙에 맞는 유형이 없으면 단정하지 않고 상담으로 안내한다
                pathways.add(CONSULT_EXPERT);
            }

            if (objection) {
                pathways.add(SETTLE_VIA_BANK);
                addStep(steps, "이의제기 서류 준비",
                        "진술서에는 언제, 얼마가, 누구 이름으로 들어왔고 언제 누구에게 알렸는지를 시간순으로 쓰고, "
                                + "계좌의 원래 용도를 한 줄로 밝히세요. 자료는 원본 그대로 내고, 캡처에는 날짜·시간이 보이게 하세요. "
                                + "사실과 다른 내용은 쓰지 마세요.", null);
                addStep(steps, "내 계좌 은행에 이의제기 제출",
                        "\"통장묶기 피해로 통신사기피해환급법 제7조에 따른 이의제기를 하겠다\"고 말하면 빠릅니다. "
                                + "접수일·접수번호를 기록하고, 보완 요청은 기한 안에 내세요. 자료를 갖추면 원칙적으로 5영업일 안에 "
                                + "결과가 나오지만 실제로는 더 걸릴 수 있고, 신청하지 않으면 저절로 풀리지 않습니다. "
                                + "받아들여지지 않으면 변호사 상담을 받으세요.", bankCode);
                addStep(steps, "은행 중재로 피해자와 합의(선택)",
                        "은행에 피해자와의 합의 중재를 요청할 수 있습니다. 돈을 돌려줄 때는 은행이 확인한 계좌로만 보내세요.",
                        bankCode);
                if (a.priorFreeze() == Answer.NO && LIVELIHOOD.contains(a.accountUsage())) {
                    alerts.add(new Alert("INFO", "SIMPLIFIED_REVIEW_POSSIBLE",
                            "입금액이 소액이고, 과거 지급정지 이력이 없고, 다른 거래가 생계와 관련된 것이 분명하면 간소화 심사 "
                                    + "대상일 수 있습니다. 이의제기할 때 은행에 간소화 심사 대상인지 물어보세요."));
                }
            } else {
                addConsultStep(steps);
            }
            if (a.policeSummoned() && !pathways.contains(CONSULT_EXPERT)) {
                pathways.add(CONSULT_EXPERT);
            }
            addStep(steps, "재발 방지",
                    "한 번 풀려도 다시 묶일 수 있습니다. 계좌번호가 노출된 곳(가게 안내문, SNS, 후원 계좌, 중고거래)을 정리하고 "
                            + "노출용 계좌와 생활 계좌를 분리하세요.", null);

            addDocuments(documents, a, objection, trade, threat);
        }

        alerts.addAll(COMMON_WARNINGS);
        return new DiagnosisResult(alerts, pathways, steps, List.copyOf(documents.values()), amounts(c),
                missingInputs(c), DISCLAIMER);
    }

    private static String bankCheckDetail(DiagnosisRequest a) {
        StringBuilder detail = new StringBuilder(
                "지급정지 사유, 채권소멸 공고일, 대상 금액, 이의제기 신청서 양식과 제출 창구(앱·영업점·우편)를 물어 적어 두세요. "
                        + "이의제기는 공고 후 2개월 안에 해야 합니다.");
        if (a.writtenClaimFiled() != Answer.YES) {
            detail.append(" 피해자가 서면 피해구제 신청까지 했는지도 물어보세요. 전화 신고만 하고 3영업일 안에 서면을 내지 않으면 "
                    + "지급정지가 종료됩니다.");
        }
        if (a.transferStage() != TransferStage.FIRST) {
            detail.append(" 몇 차로 흘러 들어온 돈인지, 해제를 위해 누가 연락해야 하는지도 확인하세요.");
        }
        return detail.toString();
    }

    private static void addDocuments(Map<String, Document> docs, DiagnosisRequest a,
                                     boolean objection, boolean trade, boolean threat) {
        docs.put("APPLICATION_FORM", new Document("APPLICATION_FORM", "이의제기 신청서(은행 양식)·신분증",
                objection ? "REQUIRED" : "RECOMMENDED", null));
        put(docs, a, Evidence.TRANSACTION_HISTORY, "문제 입금 전후 거래내역서(입금 전후 48시간 포함)",
                objection ? "REQUIRED" : "RECOMMENDED");
        put(docs, a, Evidence.BANK_CONTACT_RECORD, "입금 직후 은행에 알린 기록(상담 일시, 통화 캡처)", "RECOMMENDED");
        if (threat) {
            put(docs, a, Evidence.THREAT_MESSAGES, "협박 문자·메신저 캡처, 통화 녹음", "RECOMMENDED");
            put(docs, a, Evidence.POLICE_REPORT, "112 신고내역·고소장 접수증·사건번호", "RECOMMENDED");
        }
        switch (a.accountUsage()) {
            case SALARY -> {
                put(docs, a, Evidence.EMPLOYMENT_PROOF, "건강보험자격득실확인서 또는 재직증명서 중 하나", "RECOMMENDED");
                put(docs, a, Evidence.SALARY_HISTORY, "급여 입금내역", "RECOMMENDED");
            }
            case BUSINESS -> {
                put(docs, a, Evidence.BUSINESS_REGISTRATION, "사업자등록증", "RECOMMENDED");
                put(docs, a, Evidence.TRADE_PROOF,
                        "거래 상대방 대화내역 또는 계약서·세금계산서·거래명세서 중 하나(매출자료·주문서·송장도 도움)", "RECOMMENDED");
            }
            case SECONDHAND -> put(docs, a, Evidence.TRADE_PROOF,
                    "판매 게시글, 대화, 송장·배송 추적 화면, 물품 사진", "RECOMMENDED");
            case LIVING -> put(docs, a, Evidence.AUTO_PAYMENT_HISTORY,
                    "휴대폰 요금·공과금·카드대금 자동이체 내역", "RECOMMENDED");
            case OTHER -> {
            }
        }
        if (trade) {
            // 입금 자체가 거래 대금이면 거래 증빙은 필수로 올린다(용도별로 이미 있으면 이름은 유지)
            Document existing = docs.get(Evidence.TRADE_PROOF.name());
            put(docs, a, Evidence.TRADE_PROOF,
                    existing != null ? existing.name() : "정상 거래 증빙(거래 대화·게시글·송장 등)", "REQUIRED");
        }
    }

    private static void put(Map<String, Document> docs, DiagnosisRequest a, Evidence code, String name, String need) {
        docs.put(code.name(), new Document(code.name(), name, need, a.evidence().contains(code)));
    }

    private static void addStep(List<Step> steps, String title, String detail, String bankCode) {
        steps.add(new Step(steps.size() + 1, title, detail, bankCode));
    }

    private static void addConsultStep(List<Step> steps) {
        addStep(steps, "전문가 상담", "대한법률구조공단(132) 등에서 상황을 설명하고 상담을 받으세요.", null);
    }

    private static Amounts amounts(Case c) {
        Long frozen = c.getFrozenAmount();
        Long deposit = c.getDepositAmount();
        boolean hasDifference = frozen != null && deposit != null && frozen > deposit;
        return new Amounts(frozen, deposit, hasDifference ? frozen - deposit : null,
                hasDifference ? "이의제기가 받아들여지면 입금된 돈만 묶이고 나머지가 풀리는 것이 원칙입니다. "
                        + "단순 차액 참고값이며, 실제 해제 범위는 금융회사가 결정합니다." : null);
    }

    private static List<String> missingInputs(Case c) {
        List<String> missing = new ArrayList<>();
        if (c.getBank() == null) missing.add("bankCode");
        if (c.getAccountLast4() == null) missing.add("accountNo");
        if (c.getDepositAmount() == null) missing.add("depositAmount");
        if (c.getFrozenAmount() == null) missing.add("frozenAmount");
        if (c.getDepositAt() == null) missing.add("depositAt");
        if (c.getFrozenAt() == null) missing.add("frozenAt");
        return missing;
    }
}
