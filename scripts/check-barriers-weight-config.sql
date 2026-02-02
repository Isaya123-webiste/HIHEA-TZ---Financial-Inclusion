SELECT metric_key, weight_value, category FROM barriers_weights_config WHERE metric_key = 'BARRIERS' OR metric_key ILIKE '%BARRIERS%' ORDER BY metric_key;
