SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%form%' OR table_name LIKE '%report%';
