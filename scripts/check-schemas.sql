-- Check form_submissions columns
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'form_submissions' ORDER BY ordinal_position;

-- Check branch_reports columns
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'branch_reports' ORDER BY ordinal_position;
