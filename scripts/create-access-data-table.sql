-- Create Access table for storing ACCESS measurement data
CREATE TABLE IF NOT EXISTS "Access" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "Project ID" UUID NOT NULL REFERENCES projects(id),
  "Branch ID" UUID NOT NULL REFERENCES branches(id),
  
  -- MAIN FACTOR
  "ACCESS_Value" NUMERIC(10, 2),
  "ACCESS_Weight" NUMERIC(10, 2),
  
  -- ACCESS_Actual_Data = ACCESS_Value × ACCESS_Weight
  "Access_Actual_Data" NUMERIC(10, 2),
  
  -- KRI: Service Downtime Rate (BANK BRANCHES)
  "KRI: Service Downtime Rate (BANK BRANCHES)_Value" NUMERIC(10, 2) DEFAULT 0,
  "KRI: Service Downtime Rate (BANK BRANCHES)_Weight" NUMERIC(10, 2),
  
  -- KRI: Service Downtime Rate (AGENTS)
  "KRI: Service Downtime Rate (AGENTS)_Value" NUMERIC(10, 2) DEFAULT 0,
  "KRI: Service Downtime Rate (AGENTS)_Weight" NUMERIC(10, 2),
  
  -- KRI: Service Downtime Rate (ATMs AND ONLINE SERVICES)
  "KRI: Service Downtime Rate (ATMs AND ONLINE SERVICES)_Value" NUMERIC(10, 2) DEFAULT 0,
  "KRI: Service Downtime Rate (ATMs AND ONLINE SERVICES)_Weight" NUMERIC(10, 2),
  
  -- SUB-FACTOR: BANK BRANCHES
  "SUB-FACTOR: BANK BRANCHES_Value" NUMERIC(10, 2),
  "SUB-FACTOR: BANK BRANCHES_Weight" NUMERIC(10, 2),
  
  -- SUB-FACTOR: AGENTS
  "SUB-FACTOR: AGENTS_Value" NUMERIC(10, 2),
  "SUB-FACTOR: AGENTS_Weight" NUMERIC(10, 2),
  
  -- SUB-FACTOR: ATMs AND ONLINE SERVICES
  "SUB-FACTOR: ATMs AND ONLINE SERVICES_Value" NUMERIC(10, 2),
  "SUB-FACTOR: ATMs AND ONLINE SERVICES_Weight" NUMERIC(10, 2),
  
  -- SUB-FACTOR: INSURERS AND AGENTS
  "SUB-FACTOR: INSURERS AND AGENTS_Value" NUMERIC(10, 2),
  "SUB-FACTOR: INSURERS AND AGENTS_Weight" NUMERIC(10, 2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE ("Project ID", "Branch ID")
);

-- Enable Row Level Security
ALTER TABLE "Access" ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can manage all access data
CREATE POLICY "Admins can manage all access data" ON "Access"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policy: Users can view access data for their branch
CREATE POLICY "Users can view access for their branch" ON "Access"
  FOR SELECT USING (
    "Branch ID" IN (
      SELECT branch_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_access_project_id ON "Access"("Project ID");
CREATE INDEX IF NOT EXISTS idx_access_branch_id ON "Access"("Branch ID");
CREATE INDEX IF NOT EXISTS idx_access_project_branch ON "Access"("Project ID", "Branch ID");
CREATE INDEX IF NOT EXISTS idx_access_created_at ON "Access"(created_at);
