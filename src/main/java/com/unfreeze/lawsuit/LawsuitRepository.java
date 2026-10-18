package com.unfreeze.lawsuit;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LawsuitRepository extends JpaRepository<Lawsuit, Long> {

    Optional<Lawsuit> findByTargetCaseId(Long caseId);
}
