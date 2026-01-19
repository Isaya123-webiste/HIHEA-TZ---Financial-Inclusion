-- Delete orphaned rows from Access table where branch_report no longer exists
DELETE FROM "Access"
WHERE "Project ID" NOT IN (
  SELECT id FROM projects
) OR "Branch ID" NOT IN (
  SELECT id FROM branches
);

-- Delete orphaned rows from Usage table where branch_report no longer exists
DELETE FROM "Usage"
WHERE "Project ID" NOT IN (
  SELECT id FROM projects
) OR "Branch ID" NOT IN (
  SELECT id FROM branches
);

-- Alternatively, if you want to delete specific project/branch combination:
-- DELETE FROM "Access"
-- WHERE "Project ID" = '86dbd529-0815-4bb2-a72e-996bf44e7832'
--   AND "Branch ID" = 'e3bc4f6d-2e21-4899-bd09-5d8393de1377';

-- DELETE FROM "Usage"
-- WHERE "Project ID" = '86dbd529-0815-4bb2-a72e-996bf44e7832'
--   AND "Branch ID" = 'e3bc4f6d-2e21-4899-bd09-5d8393de1377';

COMMIT;
