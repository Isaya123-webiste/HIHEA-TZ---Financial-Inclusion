-- Create the projects table for NGO project tracking
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert the 7 NGO projects
INSERT INTO public.projects (name, description, status) VALUES
    ('Empower Young Generations', 'Youth empowerment and development program', 'active'),
    ('Bridging the Gender Gap', 'Gender equality and women empowerment initiative', 'active'),
    ('Chemchem', 'Community health and education project', 'active'),
    ('Enterprise Scaling Up', 'Business development and entrepreneurship program', 'active'),
    ('INUA', 'Community resilience and infrastructure development', 'active'),
    ('Working Together for Change', 'Collaborative community development initiative', 'active'),
    ('TAD', 'Technical assistance and development program', 'active')
ON CONFLICT (name) DO NOTHING;

-- Add project_id column to form_submissions if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'form_submissions' 
        AND column_name = 'project_id'
    ) THEN
        ALTER TABLE public.form_submissions 
        ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_project_id ON public.form_submissions(project_id);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read projects
DROP POLICY IF EXISTS "Authenticated users can read projects" ON public.projects;
CREATE POLICY "Authenticated users can read projects" 
    ON public.projects FOR SELECT 
    TO authenticated 
    USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.projects TO authenticated;
GRANT SELECT ON public.projects TO anon;
