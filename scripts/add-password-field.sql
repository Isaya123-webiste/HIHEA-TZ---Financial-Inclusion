-- Add temp_password column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'temp_password') THEN
        ALTER TABLE profiles ADD COLUMN temp_password TEXT;
    END IF;
END $$;

-- Create user_management table for logging if it doesn't exist
CREATE TABLE IF NOT EXISTS user_management (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_user_id UUID REFERENCES auth.users(id),
    target_user_email TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_management_admin_id ON user_management(admin_id);
CREATE INDEX IF NOT EXISTS idx_user_management_target_user_id ON user_management(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_management_created_at ON user_management(created_at);

-- Ensure profiles table has all required columns
DO $$ 
BEGIN
    -- Add invitation_sent column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'invitation_sent') THEN
        ALTER TABLE profiles ADD COLUMN invitation_sent BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add invitation_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'invitation_status') THEN
        ALTER TABLE profiles ADD COLUMN invitation_status TEXT DEFAULT 'pending';
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;
