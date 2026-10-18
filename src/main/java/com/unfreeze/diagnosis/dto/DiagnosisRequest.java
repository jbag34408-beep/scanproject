package com.unfreeze.diagnosis.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.Set;

// jsonb로 저장되므로 필드를 빼도 예전 진단 이력을 읽을 수 있게 모르는 필드는 무시한다. enum 값은 추가만 한다.
@JsonIgnoreProperties(ignoreUnknown = true)
public record DiagnosisRequest(
        @NotNull Answer knowsDepositor,
        @NotNull DepositReason depositReason,
        // 피해금이 피해자→1차→2차 계좌로 흘러 들어온 경우(n차)
        @NotNull TransferStage transferStage,
        @NotNull Boolean bankNoticeReceived,
        // 피해자가 전화 신고 후 서면 피해구제 신청서까지 냈는지(은행에 확인)
        @NotNull Answer writtenClaimFiled,
        // 채권소멸 공고일. 모르면 null
        LocalDate claimNoticeDate,
        @NotNull Answer priorFreeze,
        @NotNull AccountUsage accountUsage,
        @NotNull ThreatPayment paidToThreatener,
        @NotNull Boolean policeReported,
        @NotNull Boolean policeSummoned,
        @NotNull Answer otherRestrictions,
        @NotNull Boolean accountHandedOver,
        @NotNull Set<Evidence> evidence,
        // 이미 은행에 이의제기를 했는지. REJECTED = 받아들여지지 않았거나 기다려도 풀리지 않음
        @NotNull ObjectionStatus objectionStatus
) {

    public enum Answer { YES, NO, UNSURE }
    public enum ObjectionStatus { NOT_FILED, PENDING, REJECTED }

    // EXCHANGE: 코인·상품권·환전 거래 대금(환핑·몰핑)
    public enum DepositReason { UNKNOWN, TRADE, EXCHANGE, OTHER }

    public enum TransferStage { FIRST, LATER, UNSURE }

    public enum AccountUsage { SALARY, BUSINESS, SECONDHAND, LIVING, OTHER }

    public enum ThreatPayment { NONE, ASKED, PAID }

    public enum Evidence {
        TRANSACTION_HISTORY, BANK_CONTACT_RECORD, THREAT_MESSAGES, POLICE_REPORT,
        EMPLOYMENT_PROOF, SALARY_HISTORY, BUSINESS_REGISTRATION, TRADE_PROOF, AUTO_PAYMENT_HISTORY, NONE
    }

    // 계좌 양도 여부 등 민감한 자기 진술은 toString에 남기지 않는다
    @Override
    public String toString() {
        return "DiagnosisRequest[depositReason=" + depositReason + "]";
    }
}
