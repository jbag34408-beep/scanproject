-- 이의제기 신청서·소장 작성 중 내용. 주소·전체 계좌번호가 들어가므로 통째로 AES-GCM 암호화해 저장한다.
-- 보관기간: 마지막 수정 후 90일이 지나면 DraftService가 매일 지운다.
CREATE TABLE document_drafts (
    id          BIGSERIAL PRIMARY KEY,
    case_id     BIGINT      NOT NULL REFERENCES cases (id),
    kind        VARCHAR(20) NOT NULL,
    content_enc TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL,
    UNIQUE (case_id, kind)
);

CREATE INDEX idx_document_drafts_updated_at ON document_drafts (updated_at);
