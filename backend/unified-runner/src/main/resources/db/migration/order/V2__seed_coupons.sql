-- ==============================================================================
-- V2: Seed promotional coupon codes
-- ==============================================================================

INSERT INTO coupons (code, discount_percentage, max_discount_amount, min_order_value, max_usage_limit, current_usage_count, is_active, expires_at)
VALUES 
    ('WELCOME50', 50, 150.00, 249.00, 10000, 0, true, NOW() + INTERVAL '90 days'),
    ('FEAST100', 20, 120.00, 399.00, 5000, 0, true, NOW() + INTERVAL '60 days'),
    ('ZOMATWOGOLD', 25, 200.00, 499.00, 2000, 0, true, NOW() + INTERVAL '120 days')
ON CONFLICT (code) DO NOTHING;
