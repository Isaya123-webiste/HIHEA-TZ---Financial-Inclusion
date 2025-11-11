-- Create a separate table for tracking form reviews by assistance program officers
-- This approach is cleaner than modifying the existing form_submissions table

CREATE TABLE IF NOT EXISTS form_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
  reviewed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(form_id, reviewed_by)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_form_reviews_form_id ON form_reviews(form_id);
CREATE INDEX IF NOT EXISTS idx_form_reviews_reviewed_by ON form_reviews(reviewed_by);

-- Enable RLS
ALTER TABLE form_reviews ENABLE ROW LEVEL SECURITY;

-- Allow assistance program officers and program officers to view reviews
CREATE POLICY "Allow viewing form reviews" ON form_reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('assistance_program_officer', 'program_officer')
    )
  );

-- Allow assistance program officers to create reviews
CREATE POLICY "Allow assistance officers to create reviews" ON form_reviews
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'assistance_program_officer'
    )
    AND reviewed_by = auth.uid()
  );

COMMENT ON TABLE form_reviews IS 'Tracks which forms have been reviewed by assistance program officers';
