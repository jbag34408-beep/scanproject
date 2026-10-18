package com.unfreeze.diagnosis.dto;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.unfreeze.diagnosis.Diagnosis;
import java.time.Instant;

public record DiagnosisResponse(
        Long diagnosisId,
        Long caseId,
        String ruleVersion,
        Instant createdAt,
        @JsonUnwrapped DiagnosisResult result
) {

    public static DiagnosisResponse from(Diagnosis d) {
        return new DiagnosisResponse(d.getId(), d.getTargetCase().getId(), d.getRuleVersion(), d.getCreatedAt(),
                d.getResult());
    }
}
