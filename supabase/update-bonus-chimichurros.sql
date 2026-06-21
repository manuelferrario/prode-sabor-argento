-- Evaluar bonus de campeón del mundo y goleador argentino
-- Correr DESPUÉS de la final, pasando el campeón real y el goleador real como parámetros

-- Ejemplo de uso:
-- SELECT update_bonus_chimichurros('Argentina', 'Lionel Messi');

CREATE OR REPLACE FUNCTION update_bonus_chimichurros(
  real_winner text,
  real_scorer text
) RETURNS void AS $$
DECLARE
  bp record;
  earned integer;
BEGIN
  FOR bp IN SELECT * FROM bonus_predictions LOOP
    earned := 0;

    IF bp.tournament_winner IS NOT NULL AND lower(bp.tournament_winner) = lower(real_winner) THEN
      earned := earned + 10;
    END IF;

    IF bp.top_scorer IS NOT NULL AND lower(bp.top_scorer) = lower(real_scorer) THEN
      earned := earned + 5;
    END IF;

    UPDATE bonus_predictions
    SET chimichurros_earned = earned
    WHERE id = bp.id;

    -- Sumar al total del participante
    UPDATE participants
    SET total_chimichurros = (
      SELECT COALESCE(SUM(chimichurros_earned), 0) FROM predictions WHERE participant_id = bp.participant_id
    ) + earned
    WHERE id = bp.participant_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
