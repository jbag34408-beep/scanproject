package com.unfreeze.diagnosis;

import com.unfreeze.cases.Case;
import com.unfreeze.diagnosis.dto.DiagnosisRequest;
import com.unfreeze.diagnosis.dto.DiagnosisResult;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * 진단 이력. 사건이 바뀌면 다시 진단하고, 최신 건을 보여준다.
 */
@Entity
@Table(name = "diagnoses")
@Getter
@ToString
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Diagnosis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "case_id", nullable = false)
    private Case targetCase;

    @Column(nullable = false)
    private String ruleVersion;

    @ToString.Exclude
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private DiagnosisRequest answers;

    @ToString.Exclude
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private DiagnosisResult result;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    public Diagnosis(Case targetCase, String ruleVersion, DiagnosisRequest answers, DiagnosisResult result) {
        this.targetCase = targetCase;
        this.ruleVersion = ruleVersion;
        this.answers = answers;
        this.result = result;
    }
}
