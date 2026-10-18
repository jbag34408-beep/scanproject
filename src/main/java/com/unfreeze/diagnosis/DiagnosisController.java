package com.unfreeze.diagnosis;

import com.unfreeze.diagnosis.dto.DiagnosisRequest;
import com.unfreeze.diagnosis.dto.DiagnosisResponse;
import com.unfreeze.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cases/{caseId}/diagnoses")
@RequiredArgsConstructor
public class DiagnosisController {

    private final DiagnosisService diagnosisService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DiagnosisResponse> diagnose(Authentication auth, @PathVariable Long caseId,
                                                   @Valid @RequestBody DiagnosisRequest req) {
        return ApiResponse.ok(diagnosisService.diagnose(userId(auth), caseId, req));
    }

    @GetMapping("/latest")
    public ApiResponse<DiagnosisResponse> latest(Authentication auth, @PathVariable Long caseId) {
        return ApiResponse.ok(diagnosisService.latest(userId(auth), caseId));
    }

    // principal 이름 = 사용자 id (AuthService.login 참고)
    private static Long userId(Authentication auth) {
        return Long.valueOf(auth.getName());
    }
}
