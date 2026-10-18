package com.unfreeze.cases.dto;

import com.unfreeze.cases.CaseType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record CaseCreateRequest(
        @NotNull CaseType caseType,
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
        return "CaseCreateRequest[caseType=" + caseType + ", bankCode=" + bankCode + "]";
    }
}
