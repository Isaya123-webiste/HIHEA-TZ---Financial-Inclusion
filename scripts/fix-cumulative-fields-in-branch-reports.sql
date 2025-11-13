-- Fix existing concatenated data in branch_reports table
-- Convert "22; 10" format to cumulative sums like "32"

-- Add helper function to sum semicolon-separated values
CREATE OR REPLACE FUNCTION sum_semicolon_separated_values(text_value TEXT)
RETURNS TEXT AS $$
DECLARE
    parts TEXT[];
    part TEXT;
    total INTEGER := 0;
    num INTEGER;
BEGIN
    -- Return '0' if null or empty
    IF text_value IS NULL OR text_value = '' THEN
        RETURN '0';
    END IF;
    
    -- Split by semicolon and sum all numeric values
    parts := string_to_array(text_value, ';');
    
    FOREACH part IN ARRAY parts
    LOOP
        -- Trim whitespace and convert to integer
        part := trim(part);
        IF part ~ '^\d+$' THEN
            num := part::INTEGER;
            total := total + num;
        END IF;
    END LOOP;
    
    RETURN total::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Update existing branch_reports data to sum the values
UPDATE branch_reports
SET 
    credit_sources = sum_semicolon_separated_values(credit_sources),
    trust_erosion = sum_semicolon_separated_values(trust_erosion),
    documentation_delay = sum_semicolon_separated_values(documentation_delay)
WHERE 
    credit_sources LIKE '%;%' 
    OR trust_erosion LIKE '%;%' 
    OR documentation_delay LIKE '%;%';

-- Drop the helper function after use
DROP FUNCTION IF EXISTS sum_semicolon_separated_values(TEXT);

-- Verify the fix
SELECT 
    id,
    credit_sources,
    trust_erosion,
    documentation_delay
FROM branch_reports
LIMIT 5;
