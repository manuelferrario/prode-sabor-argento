-- Fix v2 de racha — corrige dos bugs del fix anterior (fix-streak-idempotent.sql):
--
-- 1) La racha no se rompía si el jugador NO cargaba predicción para un partido.
--    El recálculo usaba JOIN (inner) entre predictions y matches, así que un
--    partido sin predicción quedaba afuera del conteo en vez de cortar la racha.
--    Ahora usa LEFT JOIN: un partido sin predicción cuenta como 0 puntos y corta.
--
-- 2) El bonus de +3 por cada 5 aciertos consecutivos se calculaba pero nunca
--    se guardaba en chimichurros_earned (el UPDATE a predictions pasaba ANTES
--    de sumar el bonus). Ahora se guarda correctamente.

CREATE OR REPLACE FUNCTION update_chimichurros_for_match(match_id_param uuid)
RETURNS void AS $$
DECLARE
  match_record matches%rowtype;
  pred record;
  earned integer;
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
    earned := calculate_chimichurros(
      pred.predicted_home,
      pred.predicted_away,
      match_record.home_score,
      match_record.away_score,
      match_record.went_to_penalties
    );

    -- Recalcular streak desde cero: recorre TODOS los partidos terminados
    -- (no solo los que predijo) y cuenta consecutivos con puntos > 0.
    -- Un partido sin predicción cuenta como 0 puntos y rompe la racha.
    new_streak := 0;
    FOR streak_row IN (
      SELECT COALESCE(p.chimichurros_earned, 0) AS earned
      FROM matches m
      LEFT JOIN predictions p
        ON p.match_id = m.id AND p.participant_id = pred.participant_id
      WHERE m.status = 'finished'
      ORDER BY m.match_date DESC
    ) LOOP
      IF streak_row.earned > 0 THEN
        new_streak := new_streak + 1;
      ELSE
        EXIT;
      END IF;
    END LOOP;

    -- Bonus de racha: cada 5 aciertos consecutivos (se guarda en la predicción)
    IF new_streak > 0 AND new_streak % 5 = 0 THEN
      earned := earned + 3;
    END IF;

    UPDATE predictions
    SET chimichurros_earned = earned
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

  -- Romper la racha de quienes NO cargaron predicción para este partido
  -- (no aparecen en el loop de arriba porque no tienen fila en predictions)
  UPDATE participants
  SET streak = 0
  WHERE streak > 0
    AND id NOT IN (
      SELECT participant_id FROM predictions WHERE match_id = match_id_param
    );
END;
$$ LANGUAGE plpgsql;

-- Recalcula todo lo ya jugado con la lógica corregida
DO $$
DECLARE
  m record;
BEGIN
  FOR m IN (SELECT id FROM matches WHERE status = 'finished' ORDER BY match_date ASC) LOOP
    PERFORM update_chimichurros_for_match(m.id);
  END LOOP;
END;
$$;
