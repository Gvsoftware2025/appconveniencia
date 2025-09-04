-- Inserir categoria Bebidas que está faltando no banco
INSERT INTO categorias (id, nome, descricao, created_at, updated_at) 
VALUES (
  '2b8538f0-9ffc-4982-bd15-b8fb49f67fa1',
  'Bebidas',
  'Categoria para bebidas em geral',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verificar se a categoria foi inserida
SELECT id, nome FROM categorias WHERE id = '2b8538f0-9ffc-4982-bd15-b8fb49f67fa1';
