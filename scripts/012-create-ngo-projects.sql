-- Create NGO projects table and seed with 7 projects
-- Required for project selection in Branch Report Officer forms

-- Drop existing table if it exists (for clean slate)
DROP TABLE IF EXISTS public.projects CASCADE;

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read projects (needed for Branch Report Officers)
CREATE POLICY "projects_select_policy"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage projects
CREATE POLICY "projects_admin_policy"
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

-- Seed the 7 NGO projects
INSERT INTO public.projects (name, description, status) VALUES
  ('Empower Young Generations', 'Empowering youth through education and skill development programs', 'active'),
  ('Bridging the Gender Gap', 'Promoting gender equality and women empowerment initiatives', 'active'),
  ('Chemchem', 'Community health and environmental conservation program', 'active'),
  ('Enterprise Scaling Up', 'Supporting small businesses and entrepreneurship development', 'active'),
  ('INUA', 'Infrastructure and community development initiative', 'active'),
  ('Working Together for Change', 'Collaborative community transformation program', 'active'),
  ('TAD', 'Technology adoption and digital literacy program', 'active');

-- Add project_id to form_submissions table
ALTER TABLE public.form_submissions
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_project_id
ON public.form_submissions(project_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at_trigger
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();
