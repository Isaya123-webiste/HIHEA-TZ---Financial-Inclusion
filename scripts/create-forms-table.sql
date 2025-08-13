-- Create forms table for program officers
CREATE TABLE IF NOT EXISTS public.forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- survey, application, feedback, assessment
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, active, archived
  branch_id UUID REFERENCES public.branches(id),
  created_by UUID REFERENCES auth.users(id),
  responses INTEGER DEFAULT 0,
  form_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- Allow users to view forms in their branch
CREATE POLICY forms_view_policy ON public.forms
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT p.id FROM public.profiles p
      WHERE p.branch_id = forms.branch_id
    )
  );

-- Allow program officers and branch managers to create forms for their branch
CREATE POLICY forms_insert_policy ON public.forms
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT p.id FROM public.profiles p
      WHERE p.branch_id = forms.branch_id
      AND p.role IN ('program_officer', 'branch_manager')
    )
  );

-- Allow program officers and branch managers to update their own forms
CREATE POLICY forms_update_policy ON public.forms
  FOR UPDATE
  USING (
    auth.uid() = created_by
    AND auth.uid() IN (
      SELECT p.id FROM public.profiles p
      WHERE p.role IN ('program_officer', 'branch_manager')
    )
  );

-- Allow branch managers to update any form in their branch
CREATE POLICY forms_branch_manager_update_policy ON public.forms
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT p.id FROM public.profiles p
      WHERE p.branch_id = forms.branch_id
      AND p.role = 'branch_manager'
    )
  );

-- Allow admins to do anything with forms
CREATE POLICY forms_admin_policy ON public.forms
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT p.id FROM public.profiles p
      WHERE p.role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX forms_branch_id_idx ON public.forms(branch_id);
CREATE INDEX forms_created_by_idx ON public.forms(created_by);
CREATE INDEX forms_status_idx ON public.forms(status);
