package com.unfreeze.diagnosis;

import com.unfreeze.cases.Case;
import com.unfreeze.cases.CaseService;
import com.unfreeze.diagnosis.dto.DiagnosisRequest;
import com.unfreeze.diagnosis.dto.DiagnosisResponse;
import com.unfreeze.global.error.BusinessException;
import com.unfreeze.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiagnosisService {

    private final CaseService caseService;
    private final DiagnosisRepository diagnosisRepository;

    @Transactional
    public DiagnosisResponse diagnose(Long userId, Long caseId, DiagnosisRequest req) {
        Case c = caseService.getOwned(userId, caseId);
        Diagnosis d = diagnosisRepository.save(
                new Diagnosis(c, DiagnosisRules.VERSION, req, DiagnosisRules.evaluate(c, req)));
        c.markDiagnosed();
        return DiagnosisResponse.from(d);
    }

    public DiagnosisResponse latest(Long userId, Long caseId) {
        caseService.getOwned(userId, caseId);
        return diagnosisRepository.findFirstByTargetCaseIdOrderByIdDesc(caseId)
                .map(DiagnosisResponse::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.DIAGNOSIS_NOT_FOUND));
    }
}
