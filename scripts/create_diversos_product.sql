-- Create a generic "Diversos" product for custom items
-- Fixed column names to match produtos table schema
INSERT INTO produtos (id, nome, categoria_id, preco, disponivel, descricao, tempo_preparo, ingredientes, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Diversos',
  '4d0750f2-1bbd-5104-bf37-d0bd51b89bc3',
  0.00,
  true,
  'Produto genérico para itens diversos adicionados manualmente',
  0,
  '[]',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria_id = EXCLUDED.categoria_id,
  descricao = EXCLUDED.descricao,
  updated_at = NOW();
