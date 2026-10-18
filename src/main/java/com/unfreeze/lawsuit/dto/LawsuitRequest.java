package com.unfreeze.lawsuit.dto;

import com.unfreeze.lawsuit.LawsuitResult;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 모든 필드 선택. 보낸 값으로 통째로 바꾼다(null이면 비움).
 */
public record LawsuitRequest(
        @Size(max = 50) String court,
        @Size(max = 30) String caseNumber,
        LocalDate filedAt,
        LocalDate proofSubmittedAt,
        LocalDateTime hearingAt,
        LocalDate judgmentServedAt,
        LawsuitResult result,
        LocalDate finalizedAt
) {
}
