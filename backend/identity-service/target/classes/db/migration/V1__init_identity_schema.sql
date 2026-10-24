-- 1. Users Table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    role VARCHAR(30) NOT NULL CHECK (role IN ('ROLE_CUSTOMER', 'ROLE_RESTAURANT_OWNER', 'ROLE_ADMIN')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_phone ON users(phone);

-- 2. Customer Delivery Addresses
CREATE TABLE customer_addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(30) NOT NULL,
    full_address VARCHAR(300) NOT NULL,
    landmark VARCHAR(150),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_addresses_user_id ON customer_addresses(user_id);
-- Partial unique index guarantees at most one default address per customer
CREATE UNIQUE INDEX idx_user_single_default_address 
ON customer_addresses(user_id) 
WHERE is_default = TRUE;

-- 3. Refresh Tokens (Cryptographic SHA-256 Hashing with Family Reuse Detection)
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id UUID NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    replaced_by_hash VARCHAR(64),
    expiry_date TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(family_id);
