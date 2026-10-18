package com.unfreeze.checklist;

import com.unfreeze.cases.Case;
import com.unfreeze.global.config.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "checklist_checks")
@Getter
@ToString
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChecklistCheck extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "case_id", nullable = false)
    private Case targetCase;

    @Column(nullable = false)
    private String itemKey;

    @Column(nullable = false)
    private boolean checked;

    public ChecklistCheck(Case targetCase, String itemKey) {
        this.targetCase = targetCase;
        this.itemKey = itemKey;
    }

    public void check(boolean checked) {
        this.checked = checked;
    }
}
