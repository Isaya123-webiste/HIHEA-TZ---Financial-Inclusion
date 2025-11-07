-- Fix existing concatenated values in branch_reports table
-- This script will convert concatenated numeric values to proper sums

DO $$
DECLARE
    report_record RECORD;
    new_value TEXT;
    parts TEXT[];
    part TEXT;
    sum_value NUMERIC := 0;
    is_numeric BOOLEAN;
BEGIN
    -- Process each record in branch_reports
    FOR report_record IN 
        SELECT id, trust_erosion, documentation_delay, loan_cost_high, 
               explain_barriers, created_at, updated_at
        FROM branch_reports 
    LOOP
        RAISE NOTICE 'Processing branch report ID: %', report_record.id;
        
        -- Fix trust_erosion field
        IF report_record.trust_erosion IS NOT NULL AND report_record.trust_erosion LIKE '%;%' THEN
            parts := string_to_array(report_record.trust_erosion, ';');
            sum_value := 0;
            is_numeric := TRUE;
            
            FOREACH part IN ARRAY parts LOOP
                part := trim(part);
                IF part ~ '^[0-9]+\.?[0-9]*$' THEN
                    sum_value := sum_value + part::NUMERIC;
                ELSE
                    is_numeric := FALSE;
                    EXIT;
                END IF;
            END LOOP;
            
            IF is_numeric THEN
                new_value := sum_value::TEXT;
                UPDATE branch_reports 
                SET trust_erosion = new_value 
                WHERE id = report_record.id;
                RAISE NOTICE 'Updated trust_erosion from "%" to "%"', report_record.trust_erosion, new_value;
            END IF;
        END IF;
        
        -- Fix documentation_delay field
        IF report_record.documentation_delay IS NOT NULL AND report_record.documentation_delay LIKE '%;%' THEN
            parts := string_to_array(report_record.documentation_delay, ';');
            sum_value := 0;
            is_numeric := TRUE;
            
            FOREACH part IN ARRAY parts LOOP
                part := trim(part);
                IF part ~ '^[0-9]+\.?[0-9]*$' THEN
                    sum_value := sum_value + part::NUMERIC;
                ELSE
                    is_numeric := FALSE;
                    EXIT;
                END IF;
            END LOOP;
            
            IF is_numeric THEN
                new_value := sum_value::TEXT;
                UPDATE branch_reports 
                SET documentation_delay = new_value 
                WHERE id = report_record.id;
                RAISE NOTICE 'Updated documentation_delay from "%" to "%"', report_record.documentation_delay, new_value;
            END IF;
        END IF;
        
        -- Fix loan_cost_high field
        IF report_record.loan_cost_high IS NOT NULL AND report_record.loan_cost_high LIKE '%;%' THEN
            parts := string_to_array(report_record.loan_cost_high, ';');
            sum_value := 0;
            is_numeric := TRUE;
            
            FOREACH part IN ARRAY parts LOOP
                part := trim(part);
                IF part ~ '^[0-9]+\.?[0-9]*$' THEN
                    sum_value := sum_value + part::NUMERIC;
                ELSE
                    is_numeric := FALSE;
                    EXIT;
                END IF;
            END LOOP;
            
            IF is_numeric THEN
                new_value := sum_value::TEXT;
                UPDATE branch_reports 
                SET loan_cost_high = new_value 
                WHERE id = report_record.id;
                RAISE NOTICE 'Updated loan_cost_high from "%" to "%"', report_record.loan_cost_high, new_value;
            END IF;
        END IF;
        
    END LOOP;
    
    RAISE NOTICE 'Completed processing all branch reports';
END $$;

-- Verify the results
SELECT 
    id,
    trust_erosion,
    documentation_delay,
    loan_cost_high,
    explain_barriers
FROM branch_reports
ORDER BY created_at DESC
LIMIT 10;
