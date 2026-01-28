DO $$ 
DECLARE
  v_count INT := 0;
BEGIN
  INSERT INTO branch_reports (branch_id, project_id, title, status, created_at, updated_at)
  SELECT 
    fs.branch_id,
    fs.project_id,
    'Branch Report',
    'active',
    NOW(),
    NOW()
  FROM form_submissions fs
  WHERE fs.status = 'approved'
    AND fs.branch_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM branch_reports br 
      WHERE br.branch_id = fs.branch_id 
      AND br.project_id IS NOT DISTINCT FROM fs.project_id
    )
  ON CONFLICT (branch_id, project_id) DO NOTHING;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Inserted % new branch_reports', v_count;
END $$;
