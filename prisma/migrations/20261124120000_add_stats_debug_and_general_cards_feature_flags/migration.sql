INSERT INTO "FeatureFlag" (name, description, active)
VALUES
  ('stats-debug', 'Debug button on the stats and games tabs: which games feed each card and stat, and the grimoire check', false),
  ('general-stat-cards', 'General tab on the statistic cards page', false)
ON CONFLICT DO NOTHING;
