CREATE TABLE diagnoses (
    id           BIGSERIAL PRIMARY KEY,
    case_id      BIGINT      NOT NULL REFERENCES cases (id),
    rule_version VARCHAR(20) NOT NULL,
    answers      JSONB       NOT NULL,
    result       JSONB       NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_diagnoses_case_id ON diagnoses (case_id, id DESC);
