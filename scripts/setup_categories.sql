-- Create categories table and insert required categories to fix foreign key constraint
-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the two required categories with exact UUIDs used in admin interface
INSERT INTO categorias (id, nome, descricao) VALUES 
  ('2b8538f0-9ffc-4982-bd15-b8fb49f67fa1', 'Bebidas', 'Bebidas em geral - refrigerantes, sucos, cervejas, etc.'),
  ('3c9649f1-0aad-4093-ae26-c9ac50a78ab2', 'Porções', 'Porções e petiscos variados')
ON CONFLICT (id) DO NOTHING;

-- Verify the categories were created
SELECT id, nome, descricao FROM categorias ORDER BY nome;
