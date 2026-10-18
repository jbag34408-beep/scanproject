package com.unfreeze.lawsuit;

import com.unfreeze.global.response.ApiResponse;
import com.unfreeze.lawsuit.dto.LawsuitRequest;
import com.unfreeze.lawsuit.dto.LawsuitResponse;
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
@RequestMapping("/api/v1/cases/{caseId}/lawsuit")
@RequiredArgsConstructor
public class LawsuitController {

    private final LawsuitService lawsuitService;

    @GetMapping
    public ApiResponse<LawsuitResponse> get(Authentication auth, @PathVariable Long caseId) {
        return ApiResponse.ok(lawsuitService.get(userId(auth), caseId));
    }

    @PutMapping
    public ApiResponse<LawsuitResponse> save(Authentication auth, @PathVariable Long caseId,
                                             @Valid @RequestBody LawsuitRequest req) {
        return ApiResponse.ok(lawsuitService.save(userId(auth), caseId, req));
    }

    // principal 이름 = 사용자 id (AuthService.login 참고)
    private static Long userId(Authentication auth) {
        return Long.valueOf(auth.getName());
    }
}
