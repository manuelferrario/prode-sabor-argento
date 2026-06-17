-- Fix: racha se recalcula desde cero en cada sync (idempotente)
-- Antes: se incrementaba el valor anterior, causando racha incorrecta si se sincronizaba varias veces
-- Ahora: cuenta partidos consecutivos más recientes donde se ganaron chimichurros

CREATE OR REPLACE FUNCTION update_chimichurros_for_match(match_id_param uuid)
RETURNS void AS $$
DECLARE
  match_record matches%rowtype;
  pred record;
  earned integer;
  new_streak integer;
  streak_pred record;
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

    UPDATE predictions
    SET chimichurros_earned = earned
    WHERE id = pred.id;

    -- Recalcular streak desde cero: contar partidos consecutivos más recientes con puntos > 0
    new_streak := 0;
    FOR streak_pred IN (
      SELECT p.chimichurros_earned
      FROM predictions p
      JOIN matches m ON m.id = p.match_id
      WHERE p.participant_id = pred.participant_id
        AND m.status = 'finished'
      ORDER BY m.match_date DESC
    ) LOOP
      IF streak_pred.chimichurros_earned > 0 THEN
        new_streak := new_streak + 1;
      ELSE
        EXIT;
      END IF;
    END LOOP;

    -- Bonus de racha: cada 5 aciertos consecutivos
    IF new_streak > 0 AND new_streak % 5 = 0 THEN
      earned := earned + 3;
    END IF;

    UPDATE participants
    SET
      total_chimichurros = (
        SELECT COALESCE(SUM(chimichurros_earned), 0) FROM predictions WHERE participant_id = pred.participant_id
      ),
      streak = new_streak,
      max_streak = GREATEST(max_streak, new_streak)
    WHERE id = pred.participant_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Resetear rachas incorrectas y recalcular correctamente
-- (recorre todos los partidos terminados en orden cronológico)
DO $$
DECLARE
  m record;
BEGIN
  FOR m IN (SELECT id FROM matches WHERE status = 'finished' ORDER BY match_date ASC) LOOP
    PERFORM update_chimichurros_for_match(m.id);
  END LOOP;
END;
$$;
