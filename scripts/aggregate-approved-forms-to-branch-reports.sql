-- Aggregate existing approved forms to branch_reports
-- This script finds all approved forms and creates/updates corresponding branch_reports

BEGIN;

-- Create temporary table to hold form data and check if branch_report exists
WITH approved_forms AS (
  SELECT 
    id, branch_id, project_id, status,
    group_name, location, credit_sources, num_mfis, groups_bank_account,
    members_bank_account, inactive_accounts, num_insurers, members_insurance,
    borrowed_groups, members_applying_loans, loan_amount_applied, date_loan_applied,
    loan_amount_approved, members_received_loans, date_loan_received,
    members_complaining_delay, loan_uses, loan_default, loan_delinquency,
    loan_dropout, money_fraud, trust_erosion, documentation_delay, loan_cost_barriers,
    number_of_groups, members_at_start, members_at_end, bros_at_start, bros_at_end
  FROM form_submissions
  WHERE status = 'approved'
),
existing_reports AS (
  SELECT DISTINCT branch_id, project_id
  FROM branch_reports
)
SELECT af.* 
FROM approved_forms af
LEFT JOIN existing_reports er ON af.branch_id = er.branch_id AND af.project_id = er.project_id
WHERE er.branch_id IS NULL;

-- For each approved form without a branch_report, create one
INSERT INTO branch_reports (
  branch_id, project_id, title, form_type, status,
  group_name, location, credit_sources, num_mfis, groups_bank_account,
  members_bank_account, inactive_accounts, num_insurers, members_insurance,
  borrowed_groups, members_applying_loans, loan_amount_applied, date_loan_applied,
  loan_amount_approved, members_received_loans, date_loan_received,
  members_complaining_delay, loan_uses, loan_default, loan_delinquency,
  loan_dropout, money_fraud, trust_erosion, documentation_delay, loan_cost_barriers,
  number_of_groups, members_at_start, members_at_end, bros_at_start, bros_at_end,
  aggregated_form_ids, total_approved_forms, last_aggregated_form_id,
  created_at, updated_at, form_type
)
SELECT 
  af.branch_id, af.project_id,
  'Financial Inclusion Report - ' || af.group_name,
  'branch_report', 'active',
  af.group_name, af.location, af.credit_sources, af.num_mfis, af.groups_bank_account,
  af.members_bank_account, af.inactive_accounts, af.num_insurers, af.members_insurance,
  af.borrowed_groups, af.members_applying_loans, af.loan_amount_applied, af.date_loan_applied,
  af.loan_amount_approved, af.members_received_loans, af.date_loan_received,
  af.members_complaining_delay, af.loan_uses, af.loan_default, af.loan_delinquency,
  af.loan_dropout, af.money_fraud, af.trust_erosion, af.documentation_delay, af.loan_cost_barriers,
  af.number_of_groups, af.members_at_start, af.members_at_end, af.bros_at_start, af.bros_at_end,
  ARRAY[af.id], 1, af.id,
  NOW(), NOW(), 'branch_report'
FROM approved_forms af
LEFT JOIN (
  SELECT DISTINCT branch_id, project_id FROM branch_reports
) er ON af.branch_id = er.branch_id AND af.project_id = er.project_id
WHERE er.branch_id IS NULL
ON CONFLICT (branch_id, project_id) DO NOTHING;

COMMIT;
