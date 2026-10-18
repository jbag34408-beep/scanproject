-- 체크리스트 항목은 최신 진단 결과에서 만들고, 사용자가 바꾼 체크 상태만 저장한다
CREATE TABLE checklist_checks (
    id         BIGSERIAL PRIMARY KEY,
    case_id    BIGINT       NOT NULL REFERENCES cases (id),
    item_key   VARCHAR(200) NOT NULL,
    checked    BOOLEAN      NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL,
    updated_at TIMESTAMPTZ  NOT NULL,
    UNIQUE (case_id, item_key)
);
