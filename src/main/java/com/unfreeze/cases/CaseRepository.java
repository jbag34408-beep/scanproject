package com.unfreeze.cases;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CaseRepository extends JpaRepository<Case, Long> {

    Optional<Case> findByIdAndUserId(Long id, Long userId);

    List<Case> findAllByUserIdOrderByIdDesc(Long userId);
}
