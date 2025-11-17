'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'inactive' | 'completed'
  start_date?: string
  end_date?: string
  budget?: number
  created_at: string
  updated_at: string
}

export async function getAllProjects() {
  try {
    console.log('[v0] Fetching all projects...')
    
    // First, ensure the table exists
    const { data: existingData, error: selectError } = await supabase
      .from('projects')
      .select('*')
      .order('name', { ascending: true })

    if (selectError) {
      // If table doesn't exist, create it
      if (selectError.code === '42P01') {
        console.log('[v0] Projects table does not exist, creating it...')
        await createProjectsTable()
        
        // Try fetching again
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('name', { ascending: true })
          
        if (error) {
          console.error('[v0] Error after creating table:', error)
          return { success: false, error: error.message, data: [] }
        }
        
        return { success: true, data: data || [] }
      }
      
      console.error('[v0] Error fetching projects:', selectError)
      return { success: false, error: selectError.message, data: [] }
    }

    console.log('[v0] Projects fetched successfully:', existingData?.length)
    return { success: true, data: existingData || [] }
  } catch (error: any) {
    console.error('[v0] Exception fetching projects:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export async function createProject(projectName: string, description?: string) {
  try {
    console.log('[v0] Creating project:', projectName)

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: projectName,
        description: description || '',
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating project:', error)
      return { success: false, error: error.message }
    }

    console.log('[v0] Project created successfully:', data)
    revalidatePath('/admin/projects')
    revalidatePath('/branch-report-officer/forms')
    
    return { success: true, project: data }
  } catch (error: any) {
    console.error('[v0] Exception creating project:', error)
    return { success: false, error: error.message }
  }
}

export async function updateProject(projectId: string, updates: Partial<Project>) {
  try {
    console.log('[v0] Updating project:', projectId, updates)

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating project:', error)
      return { success: false, error: error.message }
    }

    console.log('[v0] Project updated successfully:', data)
    revalidatePath('/admin/projects')
    revalidatePath('/branch-report-officer/forms')
    
    return { success: true, project: data }
  } catch (error: any) {
    console.error('[v0] Exception updating project:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteProject(projectId: string) {
  try {
    console.log('[v0] Deleting project:', projectId)

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error('[v0] Error deleting project:', error)
      return { success: false, error: error.message }
    }

    console.log('[v0] Project deleted successfully')
    revalidatePath('/admin/projects')
    revalidatePath('/branch-report-officer/forms')
    
    return { success: true }
  } catch (error: any) {
    console.error('[v0] Exception deleting project:', error)
    return { success: false, error: error.message }
  }
}

async function createProjectsTable() {
  console.log('[v0] Creating projects table with seed data...')
  
  const createTableSQL = `
    -- Create projects table
    CREATE TABLE IF NOT EXISTS public.projects (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
      start_date DATE,
      end_date DATE,
      budget NUMERIC(15, 2),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Enable RLS
    ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

    -- Create policy for authenticated users
    CREATE POLICY "Allow authenticated users to read projects"
      ON public.projects
      FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Allow authenticated users to insert projects"
      ON public.projects
      FOR INSERT
      TO authenticated
      WITH CHECK (true);

    CREATE POLICY "Allow authenticated users to update projects"
      ON public.projects
      FOR UPDATE
      TO authenticated
      USING (true);

    CREATE POLICY "Allow authenticated users to delete projects"
      ON public.projects
      FOR DELETE
      TO authenticated
      USING (true);

    -- Insert seed data (7 NGO projects)
    INSERT INTO public.projects (name, description, status) VALUES
      ('Empower Young Generations', 'Empowering youth with skills and opportunities', 'active'),
      ('Bridging the Gender Gap', 'Promoting gender equality and women empowerment', 'active'),
      ('Chemchem', 'Water and sanitation project', 'active'),
      ('Enterprise Scaling Up', 'Supporting small business growth', 'active'),
      ('INUA', 'Community development initiative', 'active'),
      ('Working Together for Change', 'Collaborative community transformation', 'active'),
      ('TAD', 'Technical assistance and development', 'active')
    ON CONFLICT DO NOTHING;

    -- Add project_id to form_submissions if not exists
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'form_submissions' AND column_name = 'project_id'
      ) THEN
        ALTER TABLE public.form_submissions ADD COLUMN project_id UUID REFERENCES public.projects(id);
        CREATE INDEX IF NOT EXISTS idx_form_submissions_project ON public.form_submissions(project_id);
      END IF;
    END $$;

    -- Create trigger for updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `

  const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL })
  
  if (error) {
    console.error('[v0] Error creating projects table:', error)
  } else {
    console.log('[v0] Projects table created successfully with seed data')
  }
}
