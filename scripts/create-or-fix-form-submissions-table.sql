-- First, let's check if the table exists and what columns it has
DO $$
BEGIN
    -- Check if form_submissions table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'form_submissions') THEN
        -- Create the table if it doesn't exist
        CREATE TABLE form_submissions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL,
            submitted_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
            form_type VARCHAR(50) DEFAULT 'branch_report',
            form_data JSONB DEFAULT '{}',
            status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'sent_back')),
            submitted_at TIMESTAMPTZ,
            reviewed_at TIMESTAMPTZ,
            reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            review_notes TEXT,
            notes TEXT,
            title TEXT,
            group_name TEXT,
            location TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created form_submissions table';
    ELSE
        -- Table exists, let's check and add missing columns
        
        -- Add user_id column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'form_submissions' AND column_name = 'user_id') THEN
            -- Check if submitted_by exists and use it as user_id
            IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'form_submissions' AND column_name = 'submitted_by') THEN
                ALTER TABLE form_submissions ADD COLUMN user_id UUID;
                UPDATE form_submissions SET user_id = submitted_by WHERE submitted_by IS NOT NULL;
                ALTER TABLE form_submissions ALTER COLUMN user_id SET NOT NULL;
            ELSE
                ALTER TABLE form_submissions ADD COLUMN user_id UUID NOT NULL DEFAULT gen_random_uuid();
            END IF;
            RAISE NOTICE 'Added user_id column';
        END IF;
        
        -- Add submitted_by column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'form_submissions' AND column_name = 'submitted_by') THEN
            ALTER TABLE form_submissions ADD COLUMN submitted_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            UPDATE form_submissions SET submitted_by = user_id WHERE user_id IS NOT NULL;
            RAISE NOTICE 'Added submitted_by column';
        END IF;
        
        -- Add other missing columns
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'form_submissions' AND column_name = 'branch_id') THEN
            ALTER TABLE form_submissions ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added branch_id column';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'form_submissions' AND column_name = 'form_type') THEN
            ALTER TABLE form_submissions ADD COLUMN form_type VARCHAR(50) DEFAULT 'branch_report';
            RAISE NOTICE 'Added form_type column';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'form_submissions' AND column_name = 'form_data') THEN
            ALTER TABLE form_submissions ADD COLUMN form_data JSONB DEFAULT '{}';
            RAISE NOTICE 'Added form_data column';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'form_submissions' AND column_name = 'status') THEN
            ALTER TABLE form_submissions ADD COLUMN status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'sent_back'));
            RAISE NOTICE 'Added status column';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'form_submissions' AND column_name = 'submitted_at') THEN
            ALTER TABLE form_submissions ADD COLUMN submitted_at TIMESTAMPTZ;
            RAISE NOTICE 'Added submitted_at column';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'form_submissions' AND column_name = 'reviewed_at') THEN
            ALTER TABLE form_submissions ADD COLUMN reviewed_at TIMESTAMPTZ;
            RAISE NOTICE 'Added reviewed_at column';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'form_submissions' AND column_name = 'reviewed_by') THEN
            ALTER TABLE form_submissions ADD COLUMN reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added reviewed_by column';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'form_submissions' AND column_name = 'review_notes') THEN
            ALTER TABLE form_submissions ADD COLUMN review_notes TEXT;
            RAISE NOTICE 'Added review_notes column';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'form_submissions' AND column_name = 'notes') THEN
            ALTER TABLE form_submissions ADD COLUMN notes TEXT;
            RAISE NOTICE 'Added notes column';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'form_submissions' AND column_name = 'title') THEN
            ALTER TABLE form_submissions ADD COLUMN title TEXT;
            RAISE NOTICE 'Added title column';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'form_submissions' AND column_name = 'group_name') THEN
            ALTER TABLE form_submissions ADD COLUMN group_name TEXT;
            RAISE NOTICE 'Added group_name column';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'form_submissions' AND column_name = 'location') THEN
            ALTER TABLE form_submissions ADD COLUMN location TEXT;
            RAISE NOTICE 'Added location column';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'form_submissions' AND column_name = 'created_at') THEN
            ALTER TABLE form_submissions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Added created_at column';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'form_submissions' AND column_name = 'updated_at') THEN
            ALTER TABLE form_submissions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column';
        END IF;
        
        RAISE NOTICE 'Checked and updated form_submissions table structure';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_user_id ON form_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_by ON form_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_form_submissions_branch_id ON form_submissions(branch_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at);

-- Enable RLS
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their own form submissions" ON form_submissions;
DROP POLICY IF EXISTS "Users can insert their own form submissions" ON form_submissions;
DROP POLICY IF EXISTS "Users can update their own form submissions" ON form_submissions;
DROP POLICY IF EXISTS "Users can delete their own draft form submissions" ON form_submissions;
DROP POLICY IF EXISTS "Admins and program officers can view all form submissions" ON form_submissions;
DROP POLICY IF EXISTS "Admins and program officers can update all form submissions" ON form_submissions;
DROP POLICY IF EXISTS "Branch managers can view their branch form submissions" ON form_submissions;

-- Create RLS policies
CREATE POLICY "Users can view their own form submissions" ON form_submissions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = submitted_by OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'program_officer', 'branch_manager')
        )
    );

CREATE POLICY "Users can insert their own form submissions" ON form_submissions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.uid() = submitted_by
    );

CREATE POLICY "Users can update their own form submissions" ON form_submissions
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.uid() = submitted_by OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'program_officer')
        )
    );

CREATE POLICY "Users can delete their own draft form submissions" ON form_submissions
    FOR DELETE USING (
        (auth.uid() = user_id OR auth.uid() = submitted_by) 
        AND status = 'draft'
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_form_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_form_submissions_updated_at ON form_submissions;
CREATE TRIGGER trigger_update_form_submissions_updated_at
    BEFORE UPDATE ON form_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_form_submissions_updated_at();

-- Sync user_id and submitted_by if they're different
UPDATE form_submissions 
SET user_id = submitted_by 
WHERE user_id IS NULL AND submitted_by IS NOT NULL;

UPDATE form_submissions 
SET submitted_by = user_id 
WHERE submitted_by IS NULL AND user_id IS NOT NULL;

COMMIT;
