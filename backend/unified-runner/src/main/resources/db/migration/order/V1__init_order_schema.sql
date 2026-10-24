-- ==============================================================================
-- V1: Initialize Order Service Schema
-- Includes orders, order_items, coupons, coupon_redemptions, and outbox_events
-- ==============================================================================

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(36) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    restaurant_id BIGINT NOT NULL,
    restaurant_name VARCHAR(255) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 6.00,
    grand_total NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PAYMENT_PENDING',
    delivery_address_json TEXT NOT NULL,
    delivery_instructions VARCHAR(255),
    payment_id VARCHAR(100),
    idempotency_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id BIGINT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

CREATE TABLE IF NOT EXISTS coupons (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_percentage INT NOT NULL,
    max_discount_amount NUMERIC(10, 2) NOT NULL,
    min_order_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    max_usage_limit INT NOT NULL DEFAULT 1000,
    current_usage_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id BIGSERIAL PRIMARY KEY,
    coupon_id BIGINT NOT NULL REFERENCES coupons(id),
    customer_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL REFERENCES orders(id),
    discount_applied NUMERIC(10, 2) NOT NULL,
    redeemed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_customer_coupon_redemption UNIQUE (coupon_id, customer_id)
);

CREATE TABLE IF NOT EXISTS outbox_events (
    id BIGSERIAL PRIMARY KEY,
    aggregate_type VARCHAR(50) NOT NULL,
    aggregate_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP
);

CREATE INDEX idx_outbox_events_status_created ON outbox_events(status, created_at);
