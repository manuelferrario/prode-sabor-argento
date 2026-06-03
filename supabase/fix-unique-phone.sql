-- Agregar índice único en teléfono para evitar duplicados
-- (email ya tiene UNIQUE desde el schema original)
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_phone_unique
ON participants(phone);
