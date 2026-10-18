package com.unfreeze.lawsuit;

import com.unfreeze.cases.Case;
import com.unfreeze.cases.CaseService;
import com.unfreeze.lawsuit.dto.LawsuitRequest;
import com.unfreeze.lawsuit.dto.LawsuitResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LawsuitService {

    private final CaseService caseService;
    private final LawsuitRepository lawsuitRepository;

    // 아직 기록이 없으면 null
    public LawsuitResponse get(Long userId, Long caseId) {
        caseService.getOwned(userId, caseId);
        return lawsuitRepository.findByTargetCaseId(caseId).map(LawsuitResponse::from).orElse(null);
    }

    @Transactional
    public LawsuitResponse save(Long userId, Long caseId, LawsuitRequest req) {
        Case c = caseService.getOwned(userId, caseId);
        Lawsuit l = lawsuitRepository.findByTargetCaseId(caseId).orElseGet(() -> new Lawsuit(c));
        l.replace(req);
        if (req.filedAt() != null) {
            c.markLawsuit();
        }
        lawsuitRepository.saveAndFlush(l); // updatedAt을 응답에 반영
        return LawsuitResponse.from(l);
    }
}
