package com.unfreeze.draft;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface DocumentDraftRepository extends JpaRepository<DocumentDraft, Long> {

    Optional<DocumentDraft> findByTargetCaseIdAndKind(Long caseId, DraftKind kind);

    @Modifying
    @Query("delete from DocumentDraft d where d.updatedAt < :cutoff")
    int deleteUpdatedBefore(Instant cutoff);
}
