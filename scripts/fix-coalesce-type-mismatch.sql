-- Direct insert with explicit column values, excluding any problematic columns
INSERT INTO branch_reports (id, branch_id, project_id, status, created_at, updated_at)
SELECT gen_random_uuid(), 'ecb14230-3fbb-4686-ab42-dc5a35458c3f'::uuid, 'e82f8060-350b-4d0b-88c8-53421a1ea878'::uuid, 'active'::text, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM branch_reports 
  WHERE branch_id = 'ecb14230-3fbb-4686-ab42-dc5a35458c3f'::uuid 
  AND project_id = 'e82f8060-350b-4d0b-88c8-53421a1ea878'::uuid
)

UNION ALL

SELECT gen_random_uuid(), '7620d82a-95d7-49ee-8383-cb462f0f0413'::uuid, '42295fc3-a717-4da6-999e-f4b238852be4'::uuid, 'active'::text, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM branch_reports 
  WHERE branch_id = '7620d82a-95d7-49ee-8383-cb462f0f0413'::uuid 
  AND project_id = '42295fc3-a717-4da6-999e-f4b238852be4'::uuid
);
