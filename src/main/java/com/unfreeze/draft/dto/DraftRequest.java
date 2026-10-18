package com.unfreeze.draft.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// 내용(주소·계좌번호 포함)은 toString·로그에 남기지 않는다
public record DraftRequest(@NotNull @Size(max = 20_000) String content) {

    @Override
    public String toString() {
        return "DraftRequest[length=" + (content == null ? 0 : content.length()) + "]";
    }
}
