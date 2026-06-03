-- Agregar campo apodo y device_id a participants
ALTER TABLE participants ADD COLUMN IF NOT EXISTS apodo text;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS device_id text;

-- Índice para buscar por device_id rápido
CREATE INDEX IF NOT EXISTS idx_participants_device ON participants(device_id);
