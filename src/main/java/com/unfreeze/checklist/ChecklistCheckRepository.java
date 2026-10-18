package com.unfreeze.checklist;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChecklistCheckRepository extends JpaRepository<ChecklistCheck, Long> {

    List<ChecklistCheck> findAllByTargetCaseId(Long caseId);

    Optional<ChecklistCheck> findByTargetCaseIdAndItemKey(Long caseId, String itemKey);
}
