import os
import psycopg2
from psycopg2 import sql

# Get database URL from environment
database_url = os.environ.get('POSTGRES_URL')

if not database_url:
    print("Error: POSTGRES_URL environment variable not set")
    exit(1)

try:
    # Connect to database
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    print("[v0] Connected to Supabase database")
    
    # Create projects table
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS public.projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );
    """
    
    cursor.execute(create_table_sql)
    print("[v0] Projects table created successfully")
    
    # Insert NGO projects
    projects_data = [
        ('Empower Young Generations', 'Empowering youth through education and skills development'),
        ('Bridging the Gender Gap', 'Promoting gender equality and women empowerment'),
        ('Chemchem', 'Clean water and sanitation initiatives'),
        ('Enterprise Scaling Up', 'Supporting small business growth and entrepreneurship'),
        ('INUA', 'Community development and livelihood improvement'),
        ('Working Together for Change', 'Collaborative community transformation programs'),
        ('TAD', 'Tanzania Agriculture Development program')
    ]
    
    insert_sql = """
    INSERT INTO public.projects (name, description, status)
    VALUES (%s, %s, 'active')
    ON CONFLICT (name) DO NOTHING;
    """
    
    for project_name, project_desc in projects_data:
        cursor.execute(insert_sql, (project_name, project_desc))
    
    print(f"[v0] Inserted {len(projects_data)} NGO projects")
    
    # Add project_id column to form_submissions if it doesn't exist
    add_column_sql = """
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
    """
    
    cursor.execute(add_column_sql)
    print("[v0] Added project_id column to form_submissions table")
    
    # Enable RLS on projects table
    rls_sql = """
    ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view active projects" ON public.projects;
    
    CREATE POLICY "Users can view active projects"
    ON public.projects
    FOR SELECT
    TO authenticated
    USING (status = 'active');
    """
    
    cursor.execute(rls_sql)
    print("[v0] Enabled RLS policies on projects table")
    
    # Commit all changes
    conn.commit()
    print("[v0] All changes committed successfully")
    
    # Verify the data
    cursor.execute("SELECT COUNT(*) FROM public.projects WHERE status = 'active';")
    count = cursor.fetchone()[0]
    print(f"[v0] Verification: {count} active projects in database")
    
    # Close connection
    cursor.close()
    conn.close()
    
    print("[v0] ✅ Projects table setup complete!")
    
except Exception as e:
    print(f"[v0] ❌ Error: {str(e)}")
    if conn:
        conn.rollback()
    exit(1)
