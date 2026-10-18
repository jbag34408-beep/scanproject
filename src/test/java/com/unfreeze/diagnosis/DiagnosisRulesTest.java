package com.unfreeze.diagnosis;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.groups.Tuple.tuple;

import com.unfreeze.cases.Case;
import com.unfreeze.cases.CaseType;
import com.unfreeze.diagnosis.dto.DiagnosisRequest;
import com.unfreeze.diagnosis.dto.DiagnosisRequest.AccountUsage;
import com.unfreeze.diagnosis.dto.DiagnosisRequest.Answer;
import com.unfreeze.diagnosis.dto.DiagnosisRequest.DepositReason;
import com.unfreeze.diagnosis.dto.DiagnosisRequest.Evidence;
import com.unfreeze.diagnosis.dto.DiagnosisRequest.ObjectionStatus;
import com.unfreeze.diagnosis.dto.DiagnosisRequest.ThreatPayment;
import com.unfreeze.diagnosis.dto.DiagnosisRequest.TransferStage;
import com.unfreeze.diagnosis.dto.DiagnosisResult;
import com.unfreeze.diagnosis.dto.DiagnosisResult.Alert;
import com.unfreeze.diagnosis.dto.DiagnosisResult.Document;
import com.unfreeze.diagnosis.dto.DiagnosisResult.Pathway;
import com.unfreeze.diagnosis.dto.DiagnosisResult.Step;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import org.junit.jupiter.api.Test;

class DiagnosisRulesTest {

    private static Case pingMoneyCase(boolean threat) {
        Case c = new Case(null, CaseType.PING_MONEY);
        c.update(null, null, null, 300_000L, 5_000_000L, Instant.parse("2026-10-01T10:00:00Z"), null, threat);
        return c;
    }

    // 기본값: 모르는 돈, 1차, 통지 받음, 서면 접수 확인, 이력 없음, 생활비 계좌, 협박 없음, 신고함
    private static DiagnosisRequest answers(DepositReason reason, AccountUsage usage, Evidence... evidence) {
        return new DiagnosisRequest(Answer.NO, reason, TransferStage.FIRST, true, Answer.YES, null, Answer.NO, usage,
                ThreatPayment.NONE, true, false, Answer.NO, false, Set.of(evidence), ObjectionStatus.NOT_FILED);
    }

    private static DiagnosisRequest pingMoney() {
        return answers(DepositReason.UNKNOWN, AccountUsage.LIVING);
    }

    @Test
    void pingMoneyWithoutThreatStillGetsObjectionAndSettlement() {
        DiagnosisResult r = DiagnosisRules.evaluate(pingMoneyCase(false), pingMoney());

        assertThat(r.pathways()).extracting(Pathway::code)
                .containsExactly("OBJECTION_PARTIAL_RELEASE", "SETTLE_VIA_BANK");
        assertThat(r.steps()).extracting(Step::title).containsExactly(
                "은행에 지급정지 내용 확인", "이의제기 서류 준비", "내 계좌 은행에 이의제기 제출",
                "은행 중재로 피해자와 합의(선택)", "재발 방지");
        assertThat(r.steps()).extracting(Step::order).containsExactly(1, 2, 3, 4, 5);
        assertThat(r.alerts()).extracting(Alert::code).containsExactly(
                "SIMPLIFIED_REVIEW_POSSIBLE", "DO_NOT_USE_FUNDS", "NO_DIRECT_RETURN", "BEWARE_FIXERS");
        assertThat(r.amounts().referenceDifference()).isEqualTo(4_700_000L);
        assertThat(r.missingInputs()).containsExactly("bankCode", "accountNo", "frozenAt");
        assertThat(r.disclaimer()).contains("법률 자문이 아닙니다");
    }

    @Test
    void threatWithoutPoliceReportAddsReportStepAndDocuments() {
        DiagnosisRequest a = new DiagnosisRequest(Answer.NO, DepositReason.UNKNOWN, TransferStage.FIRST, false,
                Answer.UNSURE, null, Answer.NO, AccountUsage.SALARY, ThreatPayment.ASKED, false, false, Answer.UNSURE,
                false, Set.of(Evidence.TRANSACTION_HISTORY, Evidence.THREAT_MESSAGES), ObjectionStatus.NOT_FILED);
        DiagnosisResult r = DiagnosisRules.evaluate(pingMoneyCase(false), a);

        assertThat(r.alerts().get(0).code()).isEqualTo("THREAT_DO_NOT_PAY");
        assertThat(r.pathways()).extracting(Pathway::code).containsExactly(
                "CHECK_BANK_NOTICE", "REPORT_THREAT", "OBJECTION_PARTIAL_RELEASE", "SETTLE_VIA_BANK");
        assertThat(r.steps()).extracting(Step::title)
                .containsSubsequence("은행에 지급정지 내용 확인", "경찰 신고", "전자금융거래 제한 확인", "이의제기 서류 준비");
        // 서면 접수를 모르면 확인하라고 안내한다
        assertThat(r.steps().get(0).detail()).contains("서면 피해구제 신청");
        assertThat(r.documents()).extracting(Document::code, Document::need, Document::ready).containsExactly(
                tuple("APPLICATION_FORM", "REQUIRED", null),
                tuple("TRANSACTION_HISTORY", "REQUIRED", true),
                tuple("BANK_CONTACT_RECORD", "RECOMMENDED", false),
                tuple("THREAT_MESSAGES", "RECOMMENDED", true),
                tuple("POLICE_REPORT", "RECOMMENDED", false),
                tuple("EMPLOYMENT_PROOF", "RECOMMENDED", false),
                tuple("SALARY_HISTORY", "RECOMMENDED", false));
    }

    @Test
    void handedOverOrExchangeOnlyConsultsExpert() {
        DiagnosisRequest handedOver = new DiagnosisRequest(Answer.NO, DepositReason.UNKNOWN, TransferStage.FIRST, true,
                Answer.YES, null, Answer.NO, AccountUsage.LIVING, ThreatPayment.NONE, true, false, Answer.NO, true,
                Set.of(), ObjectionStatus.NOT_FILED);
        for (DiagnosisRequest a : new DiagnosisRequest[]{handedOver, answers(DepositReason.EXCHANGE, AccountUsage.OTHER)}) {
            DiagnosisResult r = DiagnosisRules.evaluate(pingMoneyCase(true), a);

            assertThat(r.alerts()).extracting(Alert::code).contains("THREAT_DO_NOT_PAY", "DO_NOT_USE_FUNDS");
            assertThat(r.pathways()).extracting(Pathway::code).containsExactly("CONSULT_EXPERT");
            assertThat(r.steps()).hasSize(1);
            assertThat(r.documents()).isEmpty();
        }
    }

    @Test
    void tradeRequiresTradeProofEvenWhenUsageAddedIt() {
        DiagnosisResult r = DiagnosisRules.evaluate(pingMoneyCase(false),
                answers(DepositReason.TRADE, AccountUsage.SECONDHAND, Evidence.TRADE_PROOF));

        assertThat(r.pathways()).extracting(Pathway::code).containsExactly("OBJECTION_WITH_TRADE_PROOF", "SETTLE_VIA_BANK");
        assertThat(r.documents()).filteredOn(d -> d.code().equals("TRADE_PROOF"))
                .extracting(Document::name, Document::need, Document::ready)
                .containsExactly(tuple("판매 게시글, 대화, 송장·배송 추적 화면, 물품 사진", "REQUIRED", true));
    }

    @Test
    void deadlineAlertFromNoticeDate() {
        DiagnosisRequest a = new DiagnosisRequest(Answer.NO, DepositReason.UNKNOWN, TransferStage.LATER, true,
                Answer.YES, LocalDate.of(2026, 10, 5), Answer.YES, AccountUsage.LIVING, ThreatPayment.NONE, true,
                true, Answer.NO, false, Set.of(), ObjectionStatus.NOT_FILED);
        DiagnosisResult r = DiagnosisRules.evaluate(pingMoneyCase(false), a);

        assertThat(r.alerts()).filteredOn(al -> al.code().equals("OBJECTION_DEADLINE"))
                .singleElement().extracting(Alert::message).asString().contains("2026-12-05");
        // 과거 지급정지 이력이 있으면 간소화 심사 안내를 하지 않는다
        assertThat(r.alerts()).extracting(Alert::code).doesNotContain("SIMPLIFIED_REVIEW_POSSIBLE");
        // n차면 은행 확인 단계에 안내가 붙고, 경찰 출석 요구면 전문가 상담도 함께 안내한다
        assertThat(r.steps().get(0).detail()).contains("몇 차");
        assertThat(r.steps()).extracting(Step::title).contains("경찰 출석 준비");
        assertThat(r.pathways()).extracting(Pathway::code).contains("OBJECTION_PARTIAL_RELEASE", "CONSULT_EXPERT");
    }

    @Test
    void unmatchedTypeFallsBackToExpert() {
        DiagnosisResult r = DiagnosisRules.evaluate(pingMoneyCase(false), answers(DepositReason.OTHER, AccountUsage.OTHER));

        assertThat(r.pathways()).extracting(Pathway::code).containsExactly("CONSULT_EXPERT");
        assertThat(r.documents()).extracting(Document::need).containsOnly("RECOMMENDED");
    }

    @Test
    void noDifferenceWhenFrozenNotGreater() {
        Case c = new Case(null, CaseType.OTHER);
        c.update(null, null, null, 300_000L, 300_000L, null, null, null);
        DiagnosisResult r = DiagnosisRules.evaluate(c, pingMoney());

        assertThat(r.amounts().referenceDifference()).isNull();
        assertThat(r.amounts().note()).isNull();
    }

    private static DiagnosisRequest pingMoney(ObjectionStatus status) {
        return new DiagnosisRequest(Answer.NO, DepositReason.UNKNOWN, TransferStage.FIRST, true, Answer.YES, null, Answer.NO,
                AccountUsage.LIVING, ThreatPayment.NONE, true, false, Answer.NO, false, Set.of(), status);
    }

    @Test
    void rejectedObjectionSuggestsLawsuitReview() {
        DiagnosisResult r = DiagnosisRules.evaluate(pingMoneyCase(false), pingMoney(ObjectionStatus.REJECTED));

        assertThat(r.pathways()).extracting(Pathway::code)
                .containsExactly("OBJECTION_PARTIAL_RELEASE", "SETTLE_VIA_BANK", "LAWSUIT_REVIEW");
        assertThat(r.steps()).extracting(Step::title)
                .containsSubsequence("은행 중재로 피해자와 합의(선택)", "채무부존재확인 소송 검토", "재발 방지");
    }

    @Test
    void pendingObjectionSuggestsLawsuitOnlyWhenOwnMoneyIsFrozen() {
        // 묶인 금액(500만) > 입금액(30만)이면 내 돈까지 묶인 것
        assertThat(DiagnosisRules.evaluate(pingMoneyCase(false), pingMoney(ObjectionStatus.PENDING)).pathways())
                .extracting(Pathway::code).contains("LAWSUIT_REVIEW");

        Case onlyDeposit = new Case(null, CaseType.PING_MONEY);
        onlyDeposit.update(null, null, null, 300_000L, 300_000L, null, null, false);
        assertThat(DiagnosisRules.evaluate(onlyDeposit, pingMoney(ObjectionStatus.PENDING)).pathways())
                .extracting(Pathway::code).doesNotContain("LAWSUIT_REVIEW");
        assertThat(DiagnosisRules.evaluate(pingMoneyCase(false), pingMoney(ObjectionStatus.NOT_FILED)).pathways())
                .extracting(Pathway::code).doesNotContain("LAWSUIT_REVIEW");
    }
}
