-- Fix branch report fields that should be numeric but are concatenated as text
-- This script will update existing branch reports to sum up numeric values properly

-- Function to extract and sum numbers from text fields
CREATE OR REPLACE FUNCTION extract_and_sum_numbers(input_text TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    numbers NUMERIC[];
    num_match TEXT;
    total NUMERIC := 0;
BEGIN
    -- Return 0 if input is null or empty
    IF input_text IS NULL OR input_text = '' THEN
        RETURN 0;
    END IF;
    
    -- Extract all numbers (including decimals) from the text
    FOR num_match IN 
        SELECT regexp_split_to_table(input_text, '[^0-9.]+')
        WHERE regexp_split_to_table(input_text, '[^0-9.]+') ~ '^[0-9]+\.?[0-9]*$'
    LOOP
        IF num_match != '' THEN
            total := total + num_match::NUMERIC;
        END IF;
    END LOOP;
    
    RETURN total;
END;
$$;

-- Update existing branch reports to fix concatenated numeric fields
UPDATE branch_reports 
SET 
    loan_uses = extract_and_sum_numbers(loan_uses)::TEXT,
    trust_erosion = extract_and_sum_numbers(trust_erosion)::TEXT,
    documentation_delay = extract_and_sum_numbers(documentation_delay)::TEXT,
    loan_cost_high = extract_and_sum_numbers(loan_cost_high)::TEXT,
    updated_at = NOW()
WHERE 
    -- Only update records that have concatenated values (contain semicolons or multiple numbers)
    (loan_uses ~ '[0-9]+[^0-9]+[0-9]+' OR loan_uses ~ ';') OR
    (trust_erosion ~ '[0-9]+[^0-9]+[0-9]+' OR trust_erosion ~ ';') OR
    (documentation_delay ~ '[0-9]+[^0-9]+[0-9]+' OR documentation_delay ~ ';') OR
    (loan_cost_high ~ '[0-9]+[^0-9]+[0-9]+' OR loan_cost_high ~ ';');

-- Show the results
SELECT 
    id,
    title,
    loan_uses,
    trust_erosion,
    documentation_delay,
    loan_cost_high,
    total_approved_forms,
    updated_at
FROM branch_reports
ORDER BY updated_at DESC;

-- Clean up the temporary function
DROP FUNCTION IF EXISTS extract_and_sum_numbers(TEXT);

-- Show success message
DO $$
BEGIN
    RAISE NOTICE 'Branch report numeric fields have been fixed!';
    RAISE NOTICE 'Fields updated:';
    RAISE NOTICE '  - loan_uses: Now shows sum of all numeric values';
    RAISE NOTICE '  - trust_erosion: Now shows sum of all numeric values';
    RAISE NOTICE '  - documentation_delay: Now shows sum of all numeric values';
    RAISE NOTICE '  - loan_cost_high: Now shows sum of all numeric values';
    RAISE NOTICE '';
    RAISE NOTICE 'Example: "3; 2" is now "5"';
    RAISE NOTICE 'Example: "12; 7" is now "19"';
END $$;
