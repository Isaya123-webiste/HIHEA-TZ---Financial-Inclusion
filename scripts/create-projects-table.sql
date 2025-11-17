-- Create projects table for NGO project selection
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the NGO projects
INSERT INTO public.projects (name, description) VALUES
  ('Empower Young Generations', 'Youth empowerment and skill development initiative'),
  ('Bridging the Gender Gap', 'Gender equality and women empowerment program'),
  ('Chemchem', 'Community-based financial inclusion project'),
  ('Enterprise Scaling Up', 'Business growth and entrepreneurship support'),
  ('INUA', 'Community resilience and economic development'),
  ('Working Together for Change', 'Collaborative community transformation program'),
  ('TAD', 'Technical assistance and development initiative')
ON CONFLICT (name) DO NOTHING;

-- Add project_id column to form_submissions table
ALTER TABLE public.form_submissions
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_project_id ON public.form_submissions(project_id);

-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS policy: All authenticated users can view projects
CREATE POLICY IF NOT EXISTS "Users can view projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS policy: Only admins can insert projects
CREATE POLICY IF NOT EXISTS "Admins can insert projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policy: Only admins can update projects
CREATE POLICY IF NOT EXISTS "Admins can update projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON TABLE public.projects IS 'NGO projects for form categorization and analytics';
COMMENT ON COLUMN public.form_submissions.project_id IS 'Reference to the NGO project this form belongs to';
