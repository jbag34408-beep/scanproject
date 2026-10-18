package com.unfreeze.lawsuit;

import com.unfreeze.cases.Case;
import com.unfreeze.global.config.BaseTimeEntity;
import com.unfreeze.lawsuit.dto.LawsuitRequest;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "lawsuits")
@Getter
@ToString
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Lawsuit extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ToString.Exclude
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "case_id", nullable = false, unique = true)
    private Case targetCase;

    private String court;

    private String caseNumber;

    private LocalDate filedAt;

    // 소제기증명원을 은행에 낸 날
    private LocalDate proofSubmittedAt;

    // 다음 변론기일
    private LocalDateTime hearingAt;

    // 판결정본을 송달받은 날. 항소 기한(2주)의 기준
    private LocalDate judgmentServedAt;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private LawsuitResult result;

    private LocalDate finalizedAt;

    public Lawsuit(Case targetCase) {
        this.targetCase = targetCase;
    }

    /**
     * 화면의 진행 기록을 통째로 바꾼다(PUT). null이면 비운다.
     */
    public void replace(LawsuitRequest r) {
        this.court = r.court();
        this.caseNumber = r.caseNumber();
        this.filedAt = r.filedAt();
        this.proofSubmittedAt = r.proofSubmittedAt();
        this.hearingAt = r.hearingAt();
        this.judgmentServedAt = r.judgmentServedAt();
        this.result = r.result();
        this.finalizedAt = r.finalizedAt();
    }
}
