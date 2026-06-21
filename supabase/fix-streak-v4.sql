-- Fix v4 de racha — corrige el bug que empeoró los puntos en v3.
--
-- Causa: el cálculo de racha en v3 recorría TODOS los partidos terminados
-- sin filtrar por fecha. Eso significa que al procesar el partido #1
-- (el más antiguo), el cálculo igual miraba la racha "final" usando los
-- 12 partidos completos — no la racha que el jugador tenía EN ESE MOMENTO.
-- Resultado: el bonus de racha (+3 cada 5 aciertos) se terminaba aplicando
-- a casi todos los partidos del historial en vez de aplicarse una sola vez,
-- en el partido exacto donde se cumplía la racha de 5.
--
-- Fix: el recorrido de racha ahora filtra "m.match_date <= match_record.match_date",
-- es decir, solo considera los partidos hasta la fecha del partido que se
-- está procesando. Así cada partido ve la racha que el jugador tenía
-- realmente en ese punto del tiempo, no la racha final del torneo completo.

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

    -- Racha: recorre los partidos terminados HASTA la fecha de este partido
    -- (no todo el historial completo), recalculando el puntaje base al vuelo.
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

-- Recalcula TODO lo ya jugado con la lógica corregida (auto-corrige lo inflado)
DO $$
DECLARE
  m record;
BEGIN
  FOR m IN (SELECT id FROM matches WHERE status = 'finished' ORDER BY match_date ASC) LOOP
    PERFORM update_chimichurros_for_match(m.id);
  END LOOP;
END;
$$;
