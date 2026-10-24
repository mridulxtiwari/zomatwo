-- ==============================================================================
-- V1: Initialize Payment Service Schema
-- ==============================================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    gateway_order_id VARCHAR(100) NOT NULL UNIQUE,
    gateway_payment_id VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'INITIATED',
    payment_method VARCHAR(50),
    refund_id VARCHAR(100),
    refund_amount NUMERIC(10, 2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_order_id ON payment_transactions(order_id);
CREATE INDEX idx_payment_gateway_order_id ON payment_transactions(gateway_order_id);
CREATE INDEX idx_payment_status ON payment_transactions(status);
