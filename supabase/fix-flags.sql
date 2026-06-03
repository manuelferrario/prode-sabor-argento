-- Fix banderas incorrectas en la tabla matches
-- Causado por códigos mal mapeados en el seed original

-- Cabo Verde: CA (Canadá) → CV (Cape Verde)
UPDATE matches SET team_home_flag = 'CV' WHERE team_home IN ('Cape Verde Islands', 'Cabo Verde');
UPDATE matches SET team_away_flag = 'CV' WHERE team_away IN ('Cape Verde Islands', 'Cabo Verde');

-- Congo DR: CO (Colombia) → CD (Congo Rep. Democrática)
UPDATE matches SET team_home_flag = 'CD' WHERE team_home IN ('Congo DR', 'DR Congo', 'Congo RD');
UPDATE matches SET team_away_flag = 'CD' WHERE team_away IN ('Congo DR', 'DR Congo', 'Congo RD');

-- Suecia: SW (no existe) → SE
UPDATE matches SET team_home_flag = 'SE' WHERE team_home = 'Sweden';
UPDATE matches SET team_away_flag = 'SE' WHERE team_away = 'Sweden';

-- Curaçao: CU → CW (código ISO correcto)
UPDATE matches SET team_home_flag = 'CW' WHERE team_home ILIKE '%cura%';
UPDATE matches SET team_away_flag = 'CW' WHERE team_away ILIKE '%cura%';

-- Verificar
SELECT team_home, team_home_flag, team_away, team_away_flag
FROM matches
WHERE team_home_flag IN ('CA','CO','SW','CU')
   OR team_away_flag IN ('CA','CO','SW','CU')
ORDER BY match_date;
