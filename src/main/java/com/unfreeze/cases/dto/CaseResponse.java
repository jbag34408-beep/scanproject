package com.unfreeze.cases.dto;

import com.unfreeze.cases.Case;
import com.unfreeze.cases.CaseStatus;
import com.unfreeze.cases.CaseType;
import java.time.Instant;

// 계좌번호 원문은 절대 포함하지 않는다
public record CaseResponse(
        Long id,
        CaseType caseType,
        CaseStatus status,
        String bankCode,
        String accountLast4,
        Long depositAmount,
        Long frozenAmount,
        Instant depositAt,
        Instant frozenAt,
        boolean threatReceived,
        Instant createdAt,
        Instant updatedAt
) {

    public static CaseResponse from(Case c) {
        return new CaseResponse(
                c.getId(), c.getCaseType(), c.getStatus(),
                c.getBank() == null ? null : c.getBank().getCode(),
                c.getAccountLast4(), c.getDepositAmount(), c.getFrozenAmount(),
                c.getDepositAt(), c.getFrozenAt(), c.isThreatReceived(),
                c.getCreatedAt(), c.getUpdatedAt());
    }
}
