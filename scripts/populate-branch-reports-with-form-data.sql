-- Drop the problematic KRI trigger temporarily
DROP TRIGGER IF EXISTS update_barriers_kri_on_branch_report_update ON branch_reports;

-- Direct UPDATE - copy data from form_submissions to branch_reports
UPDATE branch_reports br
SET
  credit_sources = fs.credit_sources,
  num_mfis = fs.num_mfis,
  groups_bank_account = fs.groups_bank_account,
  members_bank_account = fs.members_bank_account,
  inactive_accounts = fs.inactive_accounts,
  num_insurers = fs.num_insurers,
  members_insurance = fs.members_insurance,
  borrowed_groups = fs.borrowed_groups,
  members_applying_loans = fs.members_applying_loans,
  loan_amount_applied = fs.loan_amount_applied,
  loan_amount_approved = fs.loan_amount_approved,
  members_received_loans = fs.members_received_loans,
  members_complaining_delay = fs.members_complaining_delay,
  loan_uses = fs.loan_uses,
  loan_default = fs.loan_default,
  loan_delinquency = fs.loan_delinquency,
  loan_dropout = fs.loan_dropout,
  money_fraud = fs.money_fraud,
  trust_erosion = fs.trust_erosion,
  documentation_delay = fs.documentation_delay,
  number_of_groups = fs.number_of_groups,
  members_at_start = fs.members_at_start,
  members_at_end = fs.members_at_end,
  bros_at_start = fs.bros_at_start,
  bros_at_end = fs.bros_at_end,
  updated_at = NOW()
FROM form_submissions fs
WHERE br.branch_id = fs.branch_id
  AND br.project_id IS NOT DISTINCT FROM fs.project_id
  AND fs.status = 'approved';
