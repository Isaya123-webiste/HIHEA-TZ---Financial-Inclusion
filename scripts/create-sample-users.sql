-- Insert sample users with different roles (only if they don't exist)
INSERT INTO profiles (id, email, full_name, role, status, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'admin@hih.com', 'Admin User', 'admin', 'active', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'manager@hih.com', 'Branch Manager', 'branch_manager', 'active', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'officer@hih.com', 'Program Officer', 'program_officer', 'active', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'report@hih.com', 'Report Officer', 'branch_report_officer', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Note: You'll need to create these users in Supabase Auth as well with the same emails
-- The passwords can be set through the Supabase dashboard
