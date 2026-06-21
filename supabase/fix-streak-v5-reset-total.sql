-- Fix v5: reset total + recalculo limpio.
--
-- Por qué hace falta esto: max_streak nunca se resetea solo (usa GREATEST,
-- que solo sube), así que quedó pegado en valores viejos (ej. 12) de antes
-- de cualquiera de los fixes anteriores. Y total_chimichurros / streak
-- pueden seguir reflejando una versión vieja de la función si en algún
-- momento se ejecutó update_chimichurros_for_match con una versión
-- desactualizada (por ejemplo al tocar SYNC RESULTADOS, que la vuelve a
-- llamar para todos los partidos terminados).
--
-- Esto pone todo en 0 primero, así no hay ningún resto de cálculos viejos
-- flotando, y recién después recalcula todo de cero con la función
-- corregida (idéntica a fix-streak-v4.sql).

-- 1. Recrear la función con la lógica correcta (igual a v4)
CREATE OR REPLACE FUNCTION update_chimichurros_for_match(match_id_param uuid)
RETURNS void AS $$
DECLARE
  match_record matches%rowtype;
  pred record;
  base_earned integer;
  total_earned integer;
  new_streak integer;
  streak_row record;
BEGIN
  SELECT * INTO match_record FROM matches WHERE id = match_id_param;

  IF match_record.home_score IS NULL OR match_record.away_score IS NULL THEN
    RETURN;
  END IF;

  FOR pred IN
    SELECT * FROM predictions WHERE match_id = match_id_param
  LOOP
    base_earned := calculate_chimichurros(
      pred.predicted_home,
      pred.predicted_away,
      match_record.home_score,
      match_record.away_score,
      match_record.went_to_penalties
    );

    new_streak := 0;
    FOR streak_row IN (
      SELECT
        CASE
          WHEN p.predicted_home IS NULL THEN 0
          ELSE calculate_chimichurros(p.predicted_home, p.predicted_away, m.home_score, m.away_score, m.went_to_penalties)
        END AS base
      FROM matches m
      LEFT JOIN predictions p
        ON p.match_id = m.id AND p.participant_id = pred.participant_id
      WHERE m.status = 'finished'
        AND m.home_score IS NOT NULL AND m.away_score IS NOT NULL
        AND m.match_date <= match_record.match_date
      ORDER BY m.match_date DESC
    ) LOOP
      IF streak_row.base > 0 THEN
        new_streak := new_streak + 1;
      ELSE
        EXIT;
      END IF;
    END LOOP;

    total_earned := base_earned;
    IF new_streak > 0 AND new_streak % 5 = 0 THEN
      total_earned := total_earned + 3;
    END IF;

    UPDATE predictions
    SET chimichurros_earned = total_earned
    WHERE id = pred.id;

    UPDATE participants
    SET
      total_chimichurros = (
        SELECT COALESCE(SUM(chimichurros_earned), 0) FROM predictions WHERE participant_id = pred.participant_id
      ),
      streak = new_streak,
      max_streak = GREATEST(max_streak, new_streak)
    WHERE id = pred.participant_id;
  END LOOP;

  UPDATE participants
  SET streak = 0
  WHERE streak > 0
    AND id NOT IN (
      SELECT participant_id FROM predictions WHERE match_id = match_id_param
    );
END;
$$ LANGUAGE plpgsql;

-- 2. Reset total: pone todo en 0 antes de recalcular, así no queda
--    ningún resto de versiones anteriores de la función.
UPDATE predictions SET chimichurros_earned = 0;
UPDATE participants SET total_chimichurros = 0, streak = 0, max_streak = 0;

-- 3. Recalcula TODO desde cero, en orden cronológico, con la función limpia.
DO $$
DECLARE
  m record;
BEGIN
  FOR m IN (SELECT id FROM matches WHERE status = 'finished' ORDER BY match_date ASC) LOOP
    PERFORM update_chimichurros_for_match(m.id);
  END LOOP;
END;
$$;
