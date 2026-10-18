package com.unfreeze.cases.dto;

import com.unfreeze.cases.CaseStatus;
import com.unfreeze.cases.CaseType;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/**
 * 모든 필드 선택. null이면 변경하지 않는다.
 */
public record CaseUpdateRequest(
        CaseType caseType,
        CaseStatus status,
        @Size(max = 10) String bankCode,
        @Pattern(regexp = "\\d{10,16}", message = "계좌번호는 하이픈 없이 숫자 10~16자리로 입력해 주세요.") String accountNo,
        @PositiveOrZero Long depositAmount,
        @PositiveOrZero Long frozenAmount,
        Instant depositAt,
        Instant frozenAt,
        Boolean threatReceived
) {

    @Override
    public String toString() {
        return "CaseUpdateRequest[caseType=" + caseType + ", status=" + status + ", bankCode=" + bankCode + "]";
    }
}
