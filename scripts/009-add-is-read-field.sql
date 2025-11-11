-- Add is_read functionality to form_submissions table
-- This enables the "Mark as Read" feature for Assistance Program Officers

DO $$ 
BEGIN
    -- Add is_read column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_submissions' 
        AND column_name = 'is_read'
    ) THEN
        ALTER TABLE form_submissions
        ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Added is_read column to form_submissions';
    END IF;

    -- Add read_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_submissions' 
        AND column_name = 'read_by'
    ) THEN
        ALTER TABLE form_submissions
        ADD COLUMN read_by UUID REFERENCES profiles(id);
        
        RAISE NOTICE 'Added read_by column to form_submissions';
    END IF;

    -- Add read_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_submissions' 
        AND column_name = 'read_at'
    ) THEN
        ALTER TABLE form_submissions
        ADD COLUMN read_at TIMESTAMPTZ;
        
        RAISE NOTICE 'Added read_at column to form_submissions';
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_is_read 
ON form_submissions(is_read) WHERE is_read = TRUE;

-- Add comments
COMMENT ON COLUMN form_submissions.is_read IS 'Whether the form has been reviewed by assistance program officer';
COMMENT ON COLUMN form_submissions.read_by IS 'User ID of who marked the form as read';
COMMENT ON COLUMN form_submissions.read_at IS 'Timestamp when the form was marked as read';
