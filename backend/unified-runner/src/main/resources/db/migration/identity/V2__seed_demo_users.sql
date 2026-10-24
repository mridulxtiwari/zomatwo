-- ==============================================================================
-- V2: Seed demo accounts for Customer and Restaurant Partner
-- Passwords:
-- Customer: rahul.sharma@example.com / Password123!
-- Partner:  partner@biryaniblues.com / PartnerPass123!
-- ==============================================================================

INSERT INTO users (id, name, email, password_hash, phone, role, is_active, created_at, updated_at)
VALUES
(1, 'Rahul Sharma', 'rahul.sharma@example.com', '$2a$10$xq3qBXZC7vf4bYcGT1g7Y.vPybCT.D93ImAuew3zk/NcVbCaGjoju', '+91 98234 56789', 'ROLE_CUSTOMER', TRUE, NOW(), NOW()),
(2, 'Chef Vikram', 'partner@biryaniblues.com', '$2a$10$N3hNg3UwhgmYFuB1VsCT3OuJfZksLp.oDKR9YIA.7faOKQcPI6Q.W', '+91 98451 12340', 'ROLE_RESTAURANT_OWNER', TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for users table
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));

-- Seed default delivery address for customer
INSERT INTO customer_addresses (user_id, label, full_address, landmark, latitude, longitude, is_default, created_at)
VALUES
(1, 'Home', 'Flat 402, Marvel Cerise, Kharadi Central', 'Opposite EON IT Park', 18.5514, 73.9352, TRUE, NOW())
ON CONFLICT DO NOTHING;
