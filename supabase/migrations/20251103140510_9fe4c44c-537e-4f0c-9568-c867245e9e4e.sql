-- Add feature_id column to edge_function_config
ALTER TABLE edge_function_config 
ADD COLUMN IF NOT EXISTS feature_id TEXT;

-- Update existing records to associate with busca-processual-cpf-cnpj feature
UPDATE edge_function_config 
SET feature_id = 'busca-processual-cpf-cnpj' 
WHERE function_name IN (
  'escavador_consulta_CPF_CNPJ',
  'judit-search-document',
  'judit_consulta_hot_storage'
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_edge_function_config_feature_status 
ON edge_function_config(feature_id, status);