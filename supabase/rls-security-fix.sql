-- Fix de seguridad: RLS policies para evitar sabotaje
-- Correr en Supabase SQL Editor

-- =============================================
-- PREDICTIONS: solo el dueño puede insertar/modificar su predicción
-- =============================================

DROP POLICY IF EXISTS "predictions_insert" ON predictions;
DROP POLICY IF EXISTS "predictions_update" ON predictions;

CREATE POLICY "predictions_insert" ON predictions
FOR INSERT WITH CHECK (
  participant_id IN (
    SELECT id FROM participants WHERE email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "predictions_update" ON predictions
FOR UPDATE USING (
  participant_id IN (
    SELECT id FROM participants WHERE email = auth.jwt() ->> 'email'
  )
);

-- =============================================
-- BONUS PREDICTIONS: solo el dueño puede insertar/modificar
-- =============================================

DROP POLICY IF EXISTS "bonus_insert" ON bonus_predictions;
DROP POLICY IF EXISTS "bonus_update" ON bonus_predictions;

CREATE POLICY "bonus_insert" ON bonus_predictions
FOR INSERT WITH CHECK (
  participant_id IN (
    SELECT id FROM participants WHERE email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "bonus_update" ON bonus_predictions
FOR UPDATE USING (
  participant_id IN (
    SELECT id FROM participants WHERE email = auth.jwt() ->> 'email'
  )
);

-- =============================================
-- PARTICIPANTS: nadie puede modificar datos de otro (chimichurros, etc.)
-- El recalculo de chimichurros lo hace la función RPC con service_role,
-- que bypasea RLS por diseño de Supabase.
-- =============================================

CREATE POLICY "participants_update_own" ON participants
FOR UPDATE USING (
  email = auth.jwt() ->> 'email'
);

-- =============================================
-- MATCHES: ningún usuario puede modificar partidos
-- Solo el service_role (sync cron) puede hacerlo.
-- =============================================

-- No se agrega policy de UPDATE/DELETE en matches,
-- lo que significa que solo service_role puede modificarlos.
