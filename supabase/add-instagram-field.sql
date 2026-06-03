-- Agregar campo instagram_user a participants
ALTER TABLE participants ADD COLUMN IF NOT EXISTS instagram_user text;

-- Índice para buscar por usuario de IG
CREATE INDEX IF NOT EXISTS idx_participants_instagram ON participants(instagram_user);
