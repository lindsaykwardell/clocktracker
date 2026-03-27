INSERT INTO "FeatureFlag" (name, description, active)
VALUES ('forum', 'Enable the Discussions forum', false)
ON CONFLICT DO NOTHING;
