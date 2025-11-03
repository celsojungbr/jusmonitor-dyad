-- Adicionar colunas para advogados separados na tabela processes
ALTER TABLE processes 
ADD COLUMN IF NOT EXISTS author_lawyers jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS defendant_lawyers jsonb DEFAULT NULL;

COMMENT ON COLUMN processes.author_lawyers IS 'Advogados do autor (array de objetos com name e oab)';
COMMENT ON COLUMN processes.defendant_lawyers IS 'Advogados do réu (array de objetos com name e oab)';