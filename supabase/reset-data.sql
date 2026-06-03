-- =============================================
-- RESET COMPLETO DE DATOS (mantiene las tablas)
-- Correr en Supabase SQL Editor
-- =============================================

-- Limpiar en orden (por las foreign keys)
DELETE FROM bonus_predictions;
DELETE FROM predictions;
DELETE FROM participants;

-- Opcional: limpiar matches para re-seedear el fixture real
-- DELETE FROM matches;

-- Verificar que quedó limpio
SELECT 'participants' as tabla, count(*) as filas FROM participants
UNION ALL
SELECT 'predictions', count(*) FROM predictions
UNION ALL
SELECT 'bonus_predictions', count(*) FROM bonus_predictions;
