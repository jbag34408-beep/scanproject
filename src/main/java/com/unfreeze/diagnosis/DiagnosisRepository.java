package com.unfreeze.diagnosis;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiagnosisRepository extends JpaRepository<Diagnosis, Long> {

    Optional<Diagnosis> findFirstByTargetCaseIdOrderByIdDesc(Long caseId);
}
