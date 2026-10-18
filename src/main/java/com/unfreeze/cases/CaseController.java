package com.unfreeze.cases;

import com.unfreeze.cases.dto.CaseCreateRequest;
import com.unfreeze.cases.dto.CaseResponse;
import com.unfreeze.cases.dto.CaseUpdateRequest;
import com.unfreeze.global.response.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cases")
@RequiredArgsConstructor
public class CaseController {

    private final CaseService caseService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CaseResponse> create(Authentication auth, @Valid @RequestBody CaseCreateRequest req) {
        return ApiResponse.ok(caseService.create(userId(auth), req));
    }

    @GetMapping
    public ApiResponse<List<CaseResponse>> list(Authentication auth) {
        return ApiResponse.ok(caseService.list(userId(auth)));
    }

    @GetMapping("/{id}")
    public ApiResponse<CaseResponse> get(Authentication auth, @PathVariable Long id) {
        return ApiResponse.ok(caseService.get(userId(auth), id));
    }

    @PatchMapping("/{id}")
    public ApiResponse<CaseResponse> update(Authentication auth, @PathVariable Long id,
                                            @Valid @RequestBody CaseUpdateRequest req) {
        return ApiResponse.ok(caseService.update(userId(auth), id, req));
    }

    // principal 이름 = 사용자 id (AuthService.login 참고)
    private static Long userId(Authentication auth) {
        return Long.valueOf(auth.getName());
    }
}
