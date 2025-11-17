-- Create projects table for NGO project tracking
-- This table stores all NGO projects that forms can be assigned to

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies for projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read projects
CREATE POLICY "Allow authenticated users to read projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage projects
CREATE POLICY "Allow admins to manage projects"
  ON public.projects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert the 7 NGO projects
INSERT INTO public.projects (name, description, status) VALUES
  ('Empower Young Generations', 'Empowering youth through education and skill development', 'active'),
  ('Bridging the Gender Gap', 'Promoting gender equality and women empowerment', 'active'),
  ('Chemchem', 'Community health and environmental conservation program', 'active'),
  ('Enterprise Scaling Up', 'Supporting small businesses and entrepreneurship', 'active'),
  ('INUA', 'Infrastructure and community development initiative', 'active'),
  ('Working Together for Change', 'Collaborative community transformation program', 'active'),
  ('TAD', 'Technology adoption and digital literacy program', 'active')
ON CONFLICT DO NOTHING;

-- Add project_id column to form_submissions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'form_submissions'
    AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.form_submissions
    ADD COLUMN project_id UUID REFERENCES public.projects(id);
    
    CREATE INDEX IF NOT EXISTS idx_form_submissions_project_id
    ON public.form_submissions(project_id);
  END IF;
END $$;

-- Create updated_at trigger for projects
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_projects_updated_at_trigger ON public.projects;
CREATE TRIGGER update_projects_updated_at_trigger
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.projects IS 'Stores NGO projects that forms can be assigned to for tracking and analytics';
COMMENT ON COLUMN public.projects.name IS 'Project name';
COMMENT ON COLUMN public.projects.description IS 'Project description and details';
COMMENT ON COLUMN public.projects.status IS 'Project status: active, inactive, or completed';
