package com.unfreeze.checklist;

import com.unfreeze.checklist.dto.CheckRequest;
import com.unfreeze.checklist.dto.ChecklistResponse;
import com.unfreeze.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cases/{caseId}/checklist")
@RequiredArgsConstructor
public class ChecklistController {

    private final ChecklistService checklistService;

    @GetMapping
    public ApiResponse<ChecklistResponse> get(Authentication auth, @PathVariable Long caseId) {
        return ApiResponse.ok(checklistService.get(userId(auth), caseId));
    }

    // 항목 키에 제목이 들어가 경로 대신 본문으로 받는다
    @PutMapping
    public ApiResponse<ChecklistResponse> check(Authentication auth, @PathVariable Long caseId,
                                                @Valid @RequestBody CheckRequest req) {
        return ApiResponse.ok(checklistService.check(userId(auth), caseId, req));
    }

    // principal 이름 = 사용자 id (AuthService.login 참고)
    private static Long userId(Authentication auth) {
        return Long.valueOf(auth.getName());
    }
}
