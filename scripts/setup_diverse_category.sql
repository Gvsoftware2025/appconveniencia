-- Create script to add Diversos category
-- Add the "Diversos" category to support flexible products
INSERT INTO categorias (id, nome, descricao, created_at, updated_at) 
VALUES (
  '4d0750f2-1bbd-5104-bf37-d0bd51b89bc3',
  'Diversos',
  'Produtos diversos e personalizados com preços flexíveis',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Update existing categories if needed
UPDATE categorias SET 
  nome = 'Bebidas',
  descricao = 'Bebidas em geral - refrigerantes, sucos, águas, etc.'
WHERE id = '2b8538f0-9ffc-4982-bd15-b8fb49f67fa1';

UPDATE categorias SET 
  nome = 'Porções',
  descricao = 'Porções e pratos principais'
WHERE id = '3c9649f1-0aad-4093-ae26-c9ac50a78ab2';
