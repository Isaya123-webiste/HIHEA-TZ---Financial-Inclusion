-- Update branch_reports with actual data from form_submissions
UPDATE branch_reports br
SET
  credit_sources = COALESCE(fs.credit_sources, 0),
  num_mfis = COALESCE(fs.num_mfis, 0),
  groups_bank_account = COALESCE(fs.groups_bank_account, 0),
  members_bank_account = COALESCE(fs.members_bank_account, 0),
  inactive_accounts = COALESCE(fs.inactive_accounts, 0),
  num_insurers = COALESCE(fs.num_insurers, 0),
  members_insurance = COALESCE(fs.members_insurance, 0),
  borrowed_groups = COALESCE(fs.borrowed_groups, 0),
  members_applying_loans = COALESCE(fs.members_applying_loans, 0),
  loan_amount_applied = COALESCE(fs.loan_amount_applied, 0),
  date_loan_applied = fs.date_loan_applied,
  loan_amount_approved = COALESCE(fs.loan_amount_approved, 0),
  members_received_loans = COALESCE(fs.members_received_loans, 0),
  date_loan_received = fs.date_loan_received,
  members_complaining_delay = COALESCE(fs.members_complaining_delay, 0),
  loan_uses = COALESCE(fs.loan_uses, 0),
  loan_default = COALESCE(fs.loan_default, 0),
  loan_delinquency = COALESCE(fs.loan_delinquency, 0),
  loan_dropout = COALESCE(fs.loan_dropout, 0),
  money_fraud = COALESCE(fs.money_fraud, 0),
  trust_erosion = COALESCE(fs.trust_erosion, ''),
  documentation_delay = COALESCE(fs.documentation_delay, ''),
  loan_cost_high = COALESCE(fs.loan_cost_high, 0),
  number_of_groups = COALESCE(fs.number_of_groups, 0),
  members_at_start = COALESCE(fs.members_at_start, 0),
  members_at_end = COALESCE(fs.members_at_end, 0),
  bros_at_start = COALESCE(fs.bros_at_start, 0),
  bros_at_end = COALESCE(fs.bros_at_end, 0),
  updated_at = NOW()
FROM form_submissions fs
WHERE br.branch_id = fs.branch_id
  AND br.project_id = fs.project_id
  AND fs.status = 'approved'
  AND (br.credit_sources IS NULL OR br.credit_sources = 0);
