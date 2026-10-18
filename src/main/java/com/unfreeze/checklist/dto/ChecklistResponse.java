package com.unfreeze.checklist.dto;

import java.util.List;

public record ChecklistResponse(Long caseId, String ruleVersion, List<Item> items, long done, int total) {

    /**
     * kind: STEP(할 일) / DOCUMENT(준비 서류). need는 DOCUMENT만(REQUIRED/RECOMMENDED), detail은 STEP만.
     */
    public record Item(String key, String kind, String title, String detail, String need, boolean checked) {
    }
}
