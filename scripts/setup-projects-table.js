import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupProjectsTable() {
  console.log('[v0] Starting projects table setup...')

  // Create the projects table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Enable RLS
    ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    CREATE POLICY IF NOT EXISTS "Enable read access for authenticated users" ON public.projects
      FOR SELECT USING (auth.role() = 'authenticated');

    -- Add project_id to form_submissions if it doesn't exist
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_submissions' AND column_name = 'project_id'
      ) THEN
        ALTER TABLE public.form_submissions 
        ADD COLUMN project_id UUID REFERENCES public.projects(id);
      END IF;
    END $$;
  `

  try {
    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    if (tableError) {
      console.log('[v0] Note: exec_sql RPC not available, projects table needs manual creation')
      console.log('[v0] Please run the SQL in scripts/create-ngo-projects-table.sql manually in Supabase SQL Editor')
    } else {
      console.log('[v0] Projects table created successfully')
    }
  } catch (err) {
    console.log('[v0] Using direct insert approach...')
  }

  // Insert the 7 NGO projects
  const projects = [
    { name: 'Empower Young Generations', description: 'Youth empowerment and development program' },
    { name: 'Bridging the Gender Gap', description: 'Gender equality and women empowerment initiative' },
    { name: 'Chemchem', description: 'Community development and sustainability project' },
    { name: 'Enterprise Scaling Up', description: 'Business growth and entrepreneurship support' },
    { name: 'INUA', description: 'Community support and welfare program' },
    { name: 'Working Together for Change', description: 'Collaborative community transformation initiative' },
    { name: 'TAD', description: 'Technology and development program' }
  ]

  console.log('[v0] Inserting NGO projects...')

  for (const project of projects) {
    const { data, error } = await supabase
      .from('projects')
      .upsert(project, { onConflict: 'name', ignoreDuplicates: false })
      .select()

    if (error) {
      console.error(`[v0] Error inserting ${project.name}:`, error.message)
    } else {
      console.log(`[v0] ✓ Inserted: ${project.name}`)
    }
  }

  // Verify
  const { data: allProjects, error: fetchError } = await supabase
    .from('projects')
    .select('*')
    .order('name')

  if (fetchError) {
    console.error('[v0] Error fetching projects:', fetchError.message)
  } else {
    console.log('[v0] Total projects in database:', allProjects.length)
    console.log('[v0] Projects:', allProjects.map(p => p.name))
  }

  console.log('[v0] Setup complete!')
}

setupProjectsTable().catch(console.error)
