-- Check what KPI metric_key values exist in barriers_weights_config
SELECT DISTINCT metric_key, metric_name, weight_value, category 
FROM barriers_weights_config 
WHERE category = 'KPI' OR metric_name LIKE '%KPI%' OR metric_key LIKE '%KPI%'
ORDER BY metric_key;
