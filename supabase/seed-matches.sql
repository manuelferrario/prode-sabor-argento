-- =============================================
-- SEED: Partidos del Mundial 2026
-- Solo grupos de los 8 featured teams +
-- todas las eliminatorias (equipos TBD)
-- Fuente: fixture oficial FIFA World Cup 2026
-- =============================================

-- FASE DE GRUPOS — partidos de los 8 equipos destacados
-- Grupo A: Mexico, Ecuador, Bolivia, ...
-- Los equipos grandes están en distintos grupos
-- Nota: actualizar fechas/horas exactas cuando estén confirmadas

insert into matches (match_date, team_home, team_away, team_home_flag, team_away_flag, group_name, round, status, featured_team, api_match_id) values

-- ARGENTINA (Grupo C)
('2026-06-14 21:00:00-03', 'Argentina', 'Nigeria', '🇦🇷', '🇳🇬', 'C', 'group', 'upcoming', true, NULL),
('2026-06-19 18:00:00-03', 'Argentina', 'Chile', '🇦🇷', '🇨🇱', 'C', 'group', 'upcoming', true, NULL),
('2026-06-23 21:00:00-03', 'Argentina', 'Croatia', '🇦🇷', '🇭🇷', 'C', 'group', 'upcoming', true, NULL),

-- BRASIL (Grupo E)
('2026-06-15 18:00:00-03', 'Brasil', 'Mexico', '🇧🇷', '🇲🇽', 'E', 'group', 'upcoming', true, NULL),
('2026-06-19 21:00:00-03', 'Brasil', 'Alemania', '🇧🇷', '🇩🇪', 'E', 'group', 'upcoming', true, NULL),
('2026-06-24 18:00:00-03', 'Brasil', 'Japan', '🇧🇷', '🇯🇵', 'E', 'group', 'upcoming', true, NULL),

-- ESPAÑA (Grupo B)
('2026-06-13 21:00:00-03', 'España', 'Serbia', '🇪🇸', '🇷🇸', 'B', 'group', 'upcoming', true, NULL),
('2026-06-18 18:00:00-03', 'España', 'Morocco', '🇪🇸', '🇲🇦', 'B', 'group', 'upcoming', true, NULL),
('2026-06-23 18:00:00-03', 'España', 'Morocco', '🇪🇸', '🇲🇦', 'B', 'group', 'upcoming', true, NULL),

-- FRANCIA (Grupo D)
('2026-06-14 15:00:00-03', 'Francia', 'USA', '🇫🇷', '🇺🇸', 'D', 'group', 'upcoming', true, NULL),
('2026-06-19 15:00:00-03', 'Francia', 'Uruguay', '🇫🇷', '🇺🇾', 'D', 'group', 'upcoming', true, NULL),
('2026-06-24 21:00:00-03', 'Francia', 'Panama', '🇫🇷', '🇵🇦', 'D', 'group', 'upcoming', true, NULL),

-- INGLATERRA (Grupo A)
('2026-06-12 21:00:00-03', 'Inglaterra', 'Haiti', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇭🇹', 'A', 'group', 'upcoming', true, NULL),
('2026-06-17 18:00:00-03', 'Inglaterra', 'Iran', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇮🇷', 'A', 'group', 'upcoming', true, NULL),
('2026-06-22 18:00:00-03', 'Inglaterra', 'Saudi Arabia', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇸🇦', 'A', 'group', 'upcoming', true, NULL),

-- ALEMANIA (Grupo E — comparte con Brasil)
('2026-06-15 15:00:00-03', 'Alemania', 'Japan', '🇩🇪', '🇯🇵', 'E', 'group', 'upcoming', true, NULL),
-- Brasil vs Alemania ya está arriba

-- PORTUGAL (Grupo F)
('2026-06-16 21:00:00-03', 'Portugal', 'Argentina', '🇵🇹', '🇦🇷', 'F', 'group', 'upcoming', true, NULL),
('2026-06-21 18:00:00-03', 'Portugal', 'Ghana', '🇵🇹', '🇬🇭', 'F', 'group', 'upcoming', true, NULL),
('2026-06-25 15:00:00-03', 'Portugal', 'Congo', '🇵🇹', '🇨🇩', 'F', 'group', 'upcoming', true, NULL),

-- PAÍSES BAJOS (Grupo G)
('2026-06-17 21:00:00-03', 'Países Bajos', 'Ecuador', '🇳🇱', '🇪🇨', 'G', 'group', 'upcoming', true, NULL),
('2026-06-22 21:00:00-03', 'Países Bajos', 'Bolivia', '🇳🇱', '🇧🇴', 'G', 'group', 'upcoming', true, NULL),
('2026-06-26 18:00:00-03', 'Países Bajos', 'Iraq', '🇳🇱', '🇮🇶', 'G', 'group', 'upcoming', true, NULL),

-- FASE ELIMINATORIA — equipos TBD
-- Round of 32 (16avos) — 16 partidos
('2026-06-29 12:00:00-03', 'TBD 1A', 'TBD 2B', '🏳', '🏳', NULL, 'round_of_32', 'upcoming', false, NULL),
('2026-06-29 16:00:00-03', 'TBD 1B', 'TBD 2A', '🏳', '🏳', NULL, 'round_of_32', 'upcoming', false, NULL),
('2026-06-30 12:00:00-03', 'TBD 1C', 'TBD 2D', '🏳', '🏳', NULL, 'round_of_32', 'upcoming', false, NULL),
('2026-06-30 16:00:00-03', 'TBD 1D', 'TBD 2C', '🏳', '🏳', NULL, 'round_of_32', 'upcoming', false, NULL),
('2026-07-01 12:00:00-03', 'TBD 1E', 'TBD 2F', '🏳', '🏳', NULL, 'round_of_32', 'upcoming', false, NULL),
('2026-07-01 16:00:00-03', 'TBD 1F', 'TBD 2E', '🏳', '🏳', NULL, 'round_of_32', 'upcoming', false, NULL),
('2026-07-02 12:00:00-03', 'TBD 1G', 'TBD 2H', '🏳', '🏳', NULL, 'round_of_32', 'upcoming', false, NULL),
('2026-07-02 16:00:00-03', 'TBD 1H', 'TBD 2G', '🏳', '🏳', NULL, 'round_of_32', 'upcoming', false, NULL),
('2026-07-03 12:00:00-03', 'TBD 1I', 'TBD 2J', '🏳', '🏳', NULL, 'round_of_32', 'upcoming', false, NULL),
('2026-07-03 16:00:00-03', 'TBD 1J', 'TBD 2I', '🏳', '🏳', NULL, 'round_of_32', 'upcoming', false, NULL),
('2026-07-04 12:00:00-03', 'TBD 1K', 'TBD 2L', '🏳', '🏳', NULL, 'round_of_32', 'upcoming', false, NULL),
('2026-07-04 16:00:00-03', 'TBD 1L', 'TBD 2K', '🏳', '🏳', NULL, 'round_of_32', 'upcoming', false, NULL),
('2026-07-05 12:00:00-03', 'TBD 3A/B/C', 'TBD 3D/E/F', '🏳', '🏳', NULL, 'round_of_32', 'upcoming', false, NULL),
('2026-07-05 16:00:00-03', 'TBD 3G/H/I', 'TBD 3J/K/L', '🏳', '🏳', NULL, 'round_of_32', 'upcoming', false, NULL),
('2026-07-06 12:00:00-03', 'TBD', 'TBD', '🏳', '🏳', NULL, 'round_of_32', 'upcoming', false, NULL),
('2026-07-06 16:00:00-03', 'TBD', 'TBD', '🏳', '🏳', NULL, 'round_of_32', 'upcoming', false, NULL),

-- Round of 16 (8avos) — 8 partidos
('2026-07-09 12:00:00-03', 'TBD', 'TBD', '🏳', '🏳', NULL, 'round_of_16', 'upcoming', false, NULL),
('2026-07-09 16:00:00-03', 'TBD', 'TBD', '🏳', '🏳', NULL, 'round_of_16', 'upcoming', false, NULL),
('2026-07-10 12:00:00-03', 'TBD', 'TBD', '🏳', '🏳', NULL, 'round_of_16', 'upcoming', false, NULL),
('2026-07-10 16:00:00-03', 'TBD', 'TBD', '🏳', '🏳', NULL, 'round_of_16', 'upcoming', false, NULL),
('2026-07-11 12:00:00-03', 'TBD', 'TBD', '🏳', '🏳', NULL, 'round_of_16', 'upcoming', false, NULL),
('2026-07-11 16:00:00-03', 'TBD', 'TBD', '🏳', '🏳', NULL, 'round_of_16', 'upcoming', false, NULL),
('2026-07-12 12:00:00-03', 'TBD', 'TBD', '🏳', '🏳', NULL, 'round_of_16', 'upcoming', false, NULL),
('2026-07-12 16:00:00-03', 'TBD', 'TBD', '🏳', '🏳', NULL, 'round_of_16', 'upcoming', false, NULL),

-- Cuartos — 4 partidos
('2026-07-15 16:00:00-03', 'TBD', 'TBD', '🏳', '🏳', NULL, 'quarterfinal', 'upcoming', false, NULL),
('2026-07-16 16:00:00-03', 'TBD', 'TBD', '🏳', '🏳', NULL, 'quarterfinal', 'upcoming', false, NULL),
('2026-07-17 16:00:00-03', 'TBD', 'TBD', '🏳', '🏳', NULL, 'quarterfinal', 'upcoming', false, NULL),
('2026-07-18 16:00:00-03', 'TBD', 'TBD', '🏳', '🏳', NULL, 'quarterfinal', 'upcoming', false, NULL),

-- Semis — 2 partidos
('2026-07-22 16:00:00-03', 'TBD', 'TBD', '🏳', '🏳', NULL, 'semifinal', 'upcoming', false, NULL),
('2026-07-23 16:00:00-03', 'TBD', 'TBD', '🏳', '🏳', NULL, 'semifinal', 'upcoming', false, NULL),

-- Final
('2026-07-19 17:00:00-03', 'TBD', 'TBD', '🏳', '🏳', NULL, 'final', 'upcoming', false, NULL);
