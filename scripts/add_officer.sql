-- =============================================================================
-- AICTE FlowGuard - PostgreSQL Script: Add Officers to Verify Institutions
-- =============================================================================
-- Reset any previous aborted transaction in your current session:
ROLLBACK;

-- 1. Ensure Required Roles Exist
INSERT INTO roles ("id", "name", "description", "permissions")
VALUES 
  (
    gen_random_uuid()::text,
    'REGIONAL_OFFICER'::"RoleType",
    'Regional Officer - Approves and reviews institutional intake in assigned region',
    '["application:read", "application:review", "application:assign", "institution:verify", "institution:approve", "compliance:read"]'::jsonb
  ),
  (
    gen_random_uuid()::text,
    'SCRUTINY_OFFICER'::"RoleType",
    'Technical Scrutiny Officer - Verifies documents and raises deficiencies',
    '["application:read", "scrutiny:evaluate", "deficiency:raise", "deficiency:resolve", "document:verify"]'::jsonb
  ),
  (
    gen_random_uuid()::text,
    'SYSTEM_ADMINISTRATOR'::"RoleType",
    'System Administrator - Global management of users and institutional approvals',
    '["*"]'::jsonb
  )
ON CONFLICT ("name") DO NOTHING;


-- 2. Add Regional Officer (Northern Region)
-- Password: Password123!
INSERT INTO users (
  "id",
  "email",
  "passwordHash",
  "fullName",
  "designation",
  "assignedRegion",
  "status",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'regional.north@aicte-india.org',
  '$2b$12$h7IhzTYfl3gRtptHhFQ.yujNVrUkypv7mOGpLAxBV6HLx3rfstrfK',
  'Dr. Rajesh Verma',
  'Regional Officer (Northern Region)',
  'NORTH',
  'ACTIVE'::"UserStatus",
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE SET
  "status" = 'ACTIVE'::"UserStatus",
  "assignedRegion" = 'NORTH',
  "passwordHash" = EXCLUDED."passwordHash";

-- Attach REGIONAL_OFFICER role
INSERT INTO user_roles ("id", "userId", "roleId", "scopeType", "scopeValue", "createdAt")
SELECT 
  gen_random_uuid()::text,
  u."id",
  r."id",
  'REGION',
  'NORTH',
  NOW()
FROM users u
CROSS JOIN roles r
WHERE u."email" = 'regional.north@aicte-india.org'
  AND r."name" = 'REGIONAL_OFFICER'::"RoleType"
ON CONFLICT ("userId", "roleId", "scopeType", "scopeValue") DO NOTHING;


-- 3. Add Senior Scrutiny Officer (Technical Desk Verification)
-- Password: Password123!
INSERT INTO users (
  "id",
  "email",
  "passwordHash",
  "fullName",
  "designation",
  "assignedRegion",
  "status",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'scrutiny.officer@aicte-india.org',
  '$2b$12$h7IhzTYfl3gRtptHhFQ.yujNVrUkypv7mOGpLAxBV6HLx3rfstrfK',
  'Dr. Ananya Sharma',
  'Senior Scrutiny Officer',
  'NORTH',
  'ACTIVE'::"UserStatus",
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE SET
  "status" = 'ACTIVE'::"UserStatus",
  "assignedRegion" = 'NORTH',
  "passwordHash" = EXCLUDED."passwordHash";

-- Attach SCRUTINY_OFFICER role
INSERT INTO user_roles ("id", "userId", "roleId", "scopeType", "scopeValue", "createdAt")
SELECT 
  gen_random_uuid()::text,
  u."id",
  r."id",
  'REGION',
  'NORTH',
  NOW()
FROM users u
CROSS JOIN roles r
WHERE u."email" = 'scrutiny.officer@aicte-india.org'
  AND r."name" = 'SCRUTINY_OFFICER'::"RoleType"
ON CONFLICT ("userId", "roleId", "scopeType", "scopeValue") DO NOTHING;


-- 4. Add System Administrator (Global Authority)
-- Password: Password123!
INSERT INTO users (
  "id",
  "email",
  "passwordHash",
  "fullName",
  "designation",
  "assignedRegion",
  "status",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'admin@aicte-india.org',
  '$2b$12$h7IhzTYfl3gRtptHhFQ.yujNVrUkypv7mOGpLAxBV6HLx3rfstrfK',
  'System Administrator',
  'Director (Statutory Governance & IT)',
  'GLOBAL',
  'ACTIVE'::"UserStatus",
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE SET
  "status" = 'ACTIVE'::"UserStatus",
  "passwordHash" = EXCLUDED."passwordHash";

-- Attach SYSTEM_ADMINISTRATOR role
INSERT INTO user_roles ("id", "userId", "roleId", "scopeType", "scopeValue", "createdAt")
SELECT 
  gen_random_uuid()::text,
  u."id",
  r."id",
  'GLOBAL',
  'ALL',
  NOW()
FROM users u
CROSS JOIN roles r
WHERE u."email" = 'admin@aicte-india.org'
  AND r."name" = 'SYSTEM_ADMINISTRATOR'::"RoleType"
ON CONFLICT ("userId", "roleId", "scopeType", "scopeValue") DO NOTHING;
