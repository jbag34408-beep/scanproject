-- 채무부존재확인 소송 진행 기록. 사건당 하나. 단계별 할 일·기한은 화면에서 날짜로 계산한다.
CREATE TABLE lawsuits (
    id                 BIGSERIAL PRIMARY KEY,
    case_id            BIGINT      NOT NULL UNIQUE REFERENCES cases (id),
    court              VARCHAR(50),
    case_number        VARCHAR(30),
    filed_at           DATE,
    proof_submitted_at DATE,
    hearing_at         TIMESTAMP,
    judgment_served_at DATE,
    result             VARCHAR(20),
    finalized_at       DATE,
    created_at         TIMESTAMPTZ NOT NULL,
    updated_at         TIMESTAMPTZ NOT NULL
);
