package com.unfreeze.lawsuit.dto;

import com.unfreeze.lawsuit.Lawsuit;
import com.unfreeze.lawsuit.LawsuitResult;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record LawsuitResponse(
        String court,
        String caseNumber,
        LocalDate filedAt,
        LocalDate proofSubmittedAt,
        LocalDateTime hearingAt,
        LocalDate judgmentServedAt,
        LawsuitResult result,
        LocalDate finalizedAt,
        Instant updatedAt
) {

    public static LawsuitResponse from(Lawsuit l) {
        return new LawsuitResponse(l.getCourt(), l.getCaseNumber(), l.getFiledAt(), l.getProofSubmittedAt(),
                l.getHearingAt(), l.getJudgmentServedAt(), l.getResult(), l.getFinalizedAt(), l.getUpdatedAt());
    }
}
