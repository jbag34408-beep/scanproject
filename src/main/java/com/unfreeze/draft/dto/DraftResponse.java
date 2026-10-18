package com.unfreeze.draft.dto;

import com.unfreeze.draft.DocumentDraft;
import com.unfreeze.draft.DraftKind;
import java.time.Instant;

public record DraftResponse(DraftKind kind, String content, Instant updatedAt) {

    public static DraftResponse from(DocumentDraft d) {
        return new DraftResponse(d.getKind(), d.getContent(), d.getUpdatedAt());
    }

    @Override
    public String toString() {
        return "DraftResponse[kind=" + kind + ", updatedAt=" + updatedAt + "]";
    }
}
