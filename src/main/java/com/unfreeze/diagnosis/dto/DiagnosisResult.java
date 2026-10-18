package com.unfreeze.diagnosis.dto;

import java.util.List;

public record DiagnosisResult(
        List<Alert> alerts,
        List<Pathway> pathways,
        List<Step> steps,
        List<Document> documents,
        Amounts amounts,
        List<String> missingInputs,
        String disclaimer
) {

    public record Alert(String level, String code, String message) {
    }

    public record Pathway(String code, String title, String reason) {
    }

    public record Step(int order, String title, String detail, String bankCode) {
    }

    // ready: 사용자가 갖고 있다고 답한 자료인지. 은행 양식처럼 미리 가질 수 없는 서류는 null
    public record Document(String code, String name, String need, Boolean ready) {
    }

    public record Amounts(Long frozenAmount, Long depositAmount, Long referenceDifference, String note) {
    }
}
