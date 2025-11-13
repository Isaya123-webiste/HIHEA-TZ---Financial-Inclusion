-- Fix existing credit_sources data in branch_reports table to be cumulative
-- Converts concatenated values like "22; 10" to summed values like "32"

-- Create a helper function to parse and sum semicolon-separated numbers
CREATE OR REPLACE FUNCTION sum_semicolon_separated_numbers(text_value TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    parts TEXT[];
    part TEXT;
    total INTEGER := 0;
    num INTEGER;
BEGIN
    -- Return 0 if input is null or empty
    IF text_value IS NULL OR text_value = '' THEN
        RETURN 0;
    END IF;
    
    -- Split by semicolon and sum all numeric parts
    parts := string_to_array(text_value, ';');
    
    FOREACH part IN ARRAY parts
    LOOP
        -- Trim whitespace and try to convert to integer
        BEGIN
            num := NULLIF(trim(part), '')::INTEGER;
            IF num IS NOT NULL THEN
                total := total + num;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Skip non-numeric values
                CONTINUE;
        END;
    END LOOP;
    
    RETURN total;
END;
$$;

-- Update existing branch_reports to fix credit_sources
UPDATE branch_reports
SET credit_sources = sum_semicolon_separated_numbers(credit_sources)::TEXT
WHERE credit_sources IS NOT NULL 
  AND credit_sources != ''
  AND credit_sources LIKE '%;%';

-- Drop the helper function after use
DROP FUNCTION IF EXISTS sum_semicolon_separated_numbers(TEXT);

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully fixed credit_sources field in branch_reports table';
    RAISE NOTICE 'All semicolon-separated values have been converted to cumulative sums';
END $$;
