package com.unfreeze.draft;

import com.unfreeze.draft.dto.DraftRequest;
import com.unfreeze.draft.dto.DraftResponse;
import com.unfreeze.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cases/{caseId}/drafts/{kind}")
@RequiredArgsConstructor
public class DraftController {

    private final DraftService draftService;

    @GetMapping
    public ApiResponse<DraftResponse> get(Authentication auth, @PathVariable Long caseId, @PathVariable DraftKind kind) {
        return ApiResponse.ok(draftService.get(userId(auth), caseId, kind));
    }

    @PutMapping
    public ApiResponse<DraftResponse> save(Authentication auth, @PathVariable Long caseId, @PathVariable DraftKind kind,
                                           @Valid @RequestBody DraftRequest req) {
        return ApiResponse.ok(draftService.save(userId(auth), caseId, kind, req.content()));
    }

    @DeleteMapping
    public ApiResponse<Void> delete(Authentication auth, @PathVariable Long caseId, @PathVariable DraftKind kind) {
        draftService.delete(userId(auth), caseId, kind);
        return ApiResponse.ok(null);
    }

    // principal 이름 = 사용자 id (AuthService.login 참고)
    private static Long userId(Authentication auth) {
        return Long.valueOf(auth.getName());
    }
}
