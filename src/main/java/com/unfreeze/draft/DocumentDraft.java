package com.unfreeze.draft;

import com.unfreeze.cases.Case;
import com.unfreeze.global.config.BaseTimeEntity;
import com.unfreeze.global.crypto.EncryptedStringConverter;
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
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "document_drafts")
@Getter
@ToString
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DocumentDraft extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "case_id", nullable = false)
    private Case targetCase;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DraftKind kind;

    // 화면 입력값 JSON. 서버는 내용을 해석하지 않고 암호화해 보관만 한다
    @ToString.Exclude
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "content_enc", nullable = false)
    private String content;

    public DocumentDraft(Case targetCase, DraftKind kind) {
        this.targetCase = targetCase;
        this.kind = kind;
    }

    public void change(String content) {
        this.content = content;
    }
}
