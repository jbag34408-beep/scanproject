CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    name          VARCHAR(50)  NOT NULL,
    phone_enc     VARCHAR(255),
    role          VARCHAR(20)  NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL,
    updated_at    TIMESTAMPTZ  NOT NULL,
    deleted_at    TIMESTAMPTZ
);

CREATE TABLE banks (
    code              VARCHAR(10) PRIMARY KEY,
    name              VARCHAR(50) NOT NULL,
    objection_channel VARCHAR(255),
    phone             VARCHAR(30),
    guide_url         VARCHAR(500),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO banks (code, name) VALUES
    ('004', 'KB국민은행'),
    ('088', '신한은행'),
    ('020', '우리은행'),
    ('081', '하나은행'),
    ('011', 'NH농협은행');

CREATE TABLE cases (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT      NOT NULL REFERENCES users (id),
    case_type       VARCHAR(20) NOT NULL,
    status          VARCHAR(20) NOT NULL,
    bank_code       VARCHAR(10) REFERENCES banks (code),
    account_no_enc  VARCHAR(255),
    account_last4   VARCHAR(4),
    deposit_amount  BIGINT,
    frozen_amount   BIGINT,
    deposit_at      TIMESTAMPTZ,
    frozen_at       TIMESTAMPTZ,
    threat_received BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_cases_user_id ON cases (user_id);
