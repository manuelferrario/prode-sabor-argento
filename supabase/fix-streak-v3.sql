-- Fix v3 de racha — corrige el bug que causó puntos duplicados/inflados.
--
-- Causa real: el cálculo de racha (v1 y v2) determinaba "cuántos aciertos
-- consecutivos" leyendo el valor YA GUARDADO en predictions.chimichurros_earned.
-- Ese campo había quedado contaminado por corridas previas (cada vez que se
-- sumaba un bonus de racha, ese bonus quedaba mezclado en la misma columna
-- que después se usaba para decidir si correspondía OTRO bonus). Resultado:
-- partidos directamente errados (ej. predijiste 2-1 y fue 2-2) terminaban
-- con +3 puntos de bonus de racha, en cadena, para casi todos los participantes.
--
-- Fix: la racha ahora se recalcula SIEMPRE comparando predicción vs resultado
-- real con calculate_chimichurros() en el momento — nunca lee un valor ya
-- guardado. Esto hace que el cálculo sea 100% idempotente: no importa cuántas
-- veces se vuelva a correr, ni qué tan contaminada esté la data actual.

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

    -- Racha: recorre TODOS los partidos terminados y recalcula el puntaje
    -- BASE (sin bonus) de cada uno al vuelo, comparando predicción vs
    -- resultado real. Nunca confía en chimichurros_earned ya guardado.
    -- Un partido sin predicción o un partido errado cuentan como 0 y cortan.
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
      ORDER BY m.match_date DESC
    ) LOOP
      IF streak_row.base > 0 THEN
        new_streak := new_streak + 1;
      ELSE
        EXIT;
      END IF;
    END LOOP;

    -- Bonus de racha: cada 5 aciertos consecutivos
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

  -- Romper la racha de quienes NO cargaron predicción para este partido
  UPDATE participants
  SET streak = 0
  WHERE streak > 0
    AND id NOT IN (
      SELECT participant_id FROM predictions WHERE match_id = match_id_param
    );
END;
$$ LANGUAGE plpgsql;

-- Recalcula TODO lo ya jugado con la lógica corregida.
-- Como el cálculo ya no depende de valores previos contaminados, esto
-- corrige automáticamente todos los puntos inflados de hoy.
DO $$
DECLARE
  m record;
BEGIN
  FOR m IN (SELECT id FROM matches WHERE status = 'finished' ORDER BY match_date ASC) LOOP
    PERFORM update_chimichurros_for_match(m.id);
  END LOOP;
END;
$$;
