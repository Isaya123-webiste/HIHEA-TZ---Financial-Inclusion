-- Insert first missing form
INSERT INTO branch_reports (branch_id, project_id, status, created_at, updated_at)
VALUES ('ecb14230-3fbb-4686-ab42-dc5a35458c3f'::uuid, 'e82f8060-350b-4d0b-88c8-53421a1ea878'::uuid, 'active', NOW(), NOW());
