-- Agrega flag para proteger partidos editados a mano del sync automático.
-- Sin esto, el cron diario (o cualquier SYNC RESULTADOS) vuelve a pisar
-- la corrección manual con el dato viejo si la API externa sigue laggeada.
ALTER TABLE matches ADD COLUMN IF NOT EXISTS manual_override boolean DEFAULT false;
