-- IMI — Cleanup test data from production
-- Run manually after verifying the accounts to remove

-- Identify test accounts (DO NOT auto-delete — review first)
-- SELECT id, email, name FROM profiles WHERE email LIKE '%teste%' OR email LIKE '%testando%';

-- To deactivate (not delete):
-- UPDATE auth.users SET banned_until = '2099-01-01' WHERE email IN ('teste@imi.com', 'testando@imi.com');
-- DELETE FROM profiles WHERE email IN ('teste@imi.com', 'testando@imi.com');
