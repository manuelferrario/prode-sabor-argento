-- Bloquea INSERT y UPDATE en predictions si el partido arranca en menos de 30 minutos
-- Debe ejecutarse en el SQL Editor de Supabase

CREATE POLICY "No insertar prediccion despues del lock"
ON predictions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = match_id
    AND matches.match_date > now() + interval '30 minutes'
  )
);

CREATE POLICY "No modificar prediccion despues del lock"
ON predictions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = match_id
    AND matches.match_date > now() + interval '30 minutes'
  )
);
