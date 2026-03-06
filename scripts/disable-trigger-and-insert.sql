-- Disable the KRI trigger temporarily to allow INSERT
ALTER TABLE branch_reports DISABLE TRIGGER barriers_kri_auto_update_trigger;

-- Insert the 2 missing forms
INSERT INTO branch_reports (branch_id, project_id, status, created_at, updated_at)
VALUES 
  ('ecb14230-3fbb-4686-ab42-dc5a35458c3f'::uuid, 'e82f8060-350b-4d0b-88c8-53421a1ea878'::uuid, 'active', NOW(), NOW()),
  ('7620d82a-95d7-49ee-8383-cb462f0f0413'::uuid, '42295fc3-a717-4da6-999e-f4b238852be4'::uuid, 'active', NOW(), NOW())
ON CONFLICT (branch_id, project_id) DO NOTHING;

-- Re-enable the trigger
ALTER TABLE branch_reports ENABLE TRIGGER barriers_kri_auto_update_trigger;
