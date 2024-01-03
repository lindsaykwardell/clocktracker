INSERT INTO "Chart" (user_id, title, type, data, pivot, width, height)
SELECT u.user_id, 'Win Rate', 'BAR'::"ChartType", 'WIN'::"DataField", 'ROLE'::"DataField", 250, 250
FROM   "UserSettings" u;

INSERT INTO "Chart" (user_id, title, type, data, pivot, width, height)
SELECT u.user_id, 'Role Types', 'PIE'::"ChartType", 'ROLE'::"DataField", NULL, 250, 250
FROM   "UserSettings" u;

