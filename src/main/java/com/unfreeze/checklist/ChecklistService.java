package com.unfreeze.checklist;

import com.unfreeze.cases.Case;
import com.unfreeze.cases.CaseService;
import com.unfreeze.checklist.dto.CheckRequest;
import com.unfreeze.checklist.dto.ChecklistResponse;
import com.unfreeze.checklist.dto.ChecklistResponse.Item;
import com.unfreeze.diagnosis.Diagnosis;
import com.unfreeze.diagnosis.DiagnosisRepository;
import com.unfreeze.diagnosis.dto.DiagnosisResult;
import com.unfreeze.global.error.BusinessException;
import com.unfreeze.global.error.ErrorCode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 체크리스트 = 최신 진단 결과의 할 일(steps) + 준비 서류(documents).
 * 사용자가 바꾼 체크 상태만 저장하고, 서류는 진단 때 "갖고 있다"고 답한 것을 기본 체크로 둔다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChecklistService {

    private final CaseService caseService;
    private final DiagnosisRepository diagnosisRepository;
    private final ChecklistCheckRepository checkRepository;

    public ChecklistResponse get(Long userId, Long caseId) {
        return build(caseService.getOwned(userId, caseId));
    }

    @Transactional
    public ChecklistResponse check(Long userId, Long caseId, CheckRequest req) {
        Case c = caseService.getOwned(userId, caseId);
        boolean known = items(latest(c).getResult(), Map.of()).stream().anyMatch(i -> i.key().equals(req.key()));
        if (!known) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        checkRepository.findByTargetCaseIdAndItemKey(caseId, req.key())
                .orElseGet(() -> checkRepository.save(new ChecklistCheck(c, req.key())))
                .check(req.checked());
        c.markPreparing();
        return build(c);
    }

    private ChecklistResponse build(Case c) {
        Diagnosis d = latest(c);
        Map<String, Boolean> saved = checkRepository.findAllByTargetCaseId(c.getId()).stream()
                .collect(Collectors.toMap(ChecklistCheck::getItemKey, ChecklistCheck::isChecked));
        List<Item> items = items(d.getResult(), saved);
        return new ChecklistResponse(c.getId(), d.getRuleVersion(), items,
                items.stream().filter(Item::checked).count(), items.size());
    }

    private Diagnosis latest(Case c) {
        return diagnosisRepository.findFirstByTargetCaseIdOrderByIdDesc(c.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.DIAGNOSIS_NOT_FOUND));
    }

    // 할 일은 고정 코드가 없어 제목을 키로 쓴다. 규칙 문구가 바뀌면 예전 체크는 이어지지 않는다.
    private static List<Item> items(DiagnosisResult r, Map<String, Boolean> saved) {
        List<Item> items = new ArrayList<>();
        for (DiagnosisResult.Step s : r.steps()) {
            String key = "STEP:" + s.title();
            items.add(new Item(key, "STEP", s.title(), s.detail(), null, saved.getOrDefault(key, false)));
        }
        for (DiagnosisResult.Document doc : r.documents()) {
            String key = "DOC:" + doc.code();
            items.add(new Item(key, "DOCUMENT", doc.name(), null, doc.need(),
                    saved.getOrDefault(key, Boolean.TRUE.equals(doc.ready()))));
        }
        return items;
    }
}
