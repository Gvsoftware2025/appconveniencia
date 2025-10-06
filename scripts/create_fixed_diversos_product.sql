-- Criar produto fixo "Diversos" para personalização
INSERT INTO produtos (id, nome, preco, categoria_id, tempo_preparo, disponivel, ingredientes, descricao, imagem_url) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Diversos',
  0.00,
  '4d0750f2-1bbd-5104-bf37-d0bd51b89bc3',
  0,
  true,
  '[]',
  'Produto personalizável - defina nome, descrição e preço na hora do pedido',
  '/placeholder.svg?height=200&width=200'
) ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  preco = EXCLUDED.preco,
  categoria_id = EXCLUDED.categoria_id,
  tempo_preparo = EXCLUDED.tempo_preparo,
  disponivel = EXCLUDED.disponivel,
  ingredientes = EXCLUDED.ingredientes,
  descricao = EXCLUDED.descricao,
  imagem_url = EXCLUDED.imagem_url;
