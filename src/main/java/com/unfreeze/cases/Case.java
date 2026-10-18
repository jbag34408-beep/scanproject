package com.unfreeze.cases;

import com.unfreeze.bank.Bank;
import com.unfreeze.global.config.BaseTimeEntity;
import com.unfreeze.global.crypto.EncryptedStringConverter;
import com.unfreeze.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

@Entity
@Table(name = "cases")
@Getter
@ToString
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Case extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CaseType caseType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CaseStatus status;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_code")
    private Bank bank;

    @ToString.Exclude
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "account_no_enc")
    private String accountNo;

    @Column(name = "account_last4")
    private String accountLast4;

    private Long depositAmount;

    private Long frozenAmount;

    private Instant depositAt;

    private Instant frozenAt;

    @Column(nullable = false)
    private boolean threatReceived;

    public Case(User user, CaseType caseType) {
        this.user = user;
        this.caseType = caseType;
        this.status = CaseStatus.DRAFT;
    }

    /**
     * null인 값은 변경하지 않는다(PATCH 의미).
     */
    public void update(CaseType caseType, CaseStatus status, Bank bank, Long depositAmount, Long frozenAmount,
                       Instant depositAt, Instant frozenAt, Boolean threatReceived) {
        if (caseType != null) this.caseType = caseType;
        if (status != null) this.status = status;
        if (bank != null) this.bank = bank;
        if (depositAmount != null) this.depositAmount = depositAmount;
        if (frozenAmount != null) this.frozenAmount = frozenAmount;
        if (depositAt != null) this.depositAt = depositAt;
        if (frozenAt != null) this.frozenAt = frozenAt;
        if (threatReceived != null) this.threatReceived = threatReceived;
    }

    // 이미 다음 단계로 진행한 사건은 되돌리지 않는다
    public void markDiagnosed() {
        if (status == CaseStatus.DRAFT) {
            status = CaseStatus.DIAGNOSED;
        }
    }

    public void markPreparing() {
        if (status == CaseStatus.DIAGNOSED) {
            status = CaseStatus.PREPARING;
        }
    }

    public void changeAccount(String accountNo, String accountLast4) {
        this.accountNo = accountNo;
        this.accountLast4 = accountLast4;
    }
}
