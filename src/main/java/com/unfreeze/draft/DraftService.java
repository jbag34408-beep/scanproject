package com.unfreeze.draft;

import com.unfreeze.cases.Case;
import com.unfreeze.cases.CaseService;
import com.unfreeze.draft.dto.DraftResponse;
import java.time.Duration;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 서류 작성 중 내용 임시저장. 사건 소유자만 읽고 쓴다.
 * 보관기간: 마지막 수정 후 90일. 사용자는 언제든 직접 지울 수 있다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DraftService {

    static final Duration RETENTION = Duration.ofDays(90);

    private final CaseService caseService;
    private final DocumentDraftRepository draftRepository;

    // 아직 저장한 적이 없으면 null
    public DraftResponse get(Long userId, Long caseId, DraftKind kind) {
        caseService.getOwned(userId, caseId);
        return draftRepository.findByTargetCaseIdAndKind(caseId, kind).map(DraftResponse::from).orElse(null);
    }

    @Transactional
    public DraftResponse save(Long userId, Long caseId, DraftKind kind, String content) {
        Case c = caseService.getOwned(userId, caseId);
        DocumentDraft d = draftRepository.findByTargetCaseIdAndKind(caseId, kind)
                .orElseGet(() -> new DocumentDraft(c, kind));
        d.change(content);
        draftRepository.saveAndFlush(d); // updatedAt을 응답에 반영
        return DraftResponse.from(d);
    }

    @Transactional
    public void delete(Long userId, Long caseId, DraftKind kind) {
        caseService.getOwned(userId, caseId);
        draftRepository.findByTargetCaseIdAndKind(caseId, kind).ifPresent(draftRepository::delete);
    }

    @Scheduled(cron = "0 0 4 * * *")
    @Transactional
    public void purgeExpired() {
        int deleted = purgeUpdatedBefore(Instant.now().minus(RETENTION));
        log.info("expired drafts deleted: {}", deleted);
    }

    @Transactional
    public int purgeUpdatedBefore(Instant cutoff) {
        return draftRepository.deleteUpdatedBefore(cutoff);
    }
}
