-- Script para adicionar produtos diversos de exemplo
-- Primeiro garante que a categoria existe, depois adiciona produtos

-- Inserir categoria Diversos se não existir
INSERT INTO categorias (id, nome, descricao, created_at, updated_at) 
VALUES (
  '4d0750f2-1bbd-5104-bf37-d0bd51b89bc3',
  'Diversos',
  'Produtos diversos e personalizados com preços flexíveis',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Inserir alguns produtos diversos de exemplo
INSERT INTO produtos (nome, descricao, preco, categoria_id, tempo_preparo, disponivel, ingredientes, imagem_url) VALUES
('Produto Personalizado', 'Item personalizado conforme solicitação do cliente', 25.00, '4d0750f2-1bbd-5104-bf37-d0bd51b89bc3', 0, true, '[]', '/placeholder.svg?height=200&width=200'),
('Serviço Especial', 'Serviço adicional ou produto sob demanda', 15.00, '4d0750f2-1bbd-5104-bf37-d0bd51b89bc3', 0, true, '[]', '/placeholder.svg?height=200&width=200'),
('Item Diverso', 'Produto diverso com preço flexível', 10.00, '4d0750f2-1bbd-5104-bf37-d0bd51b89bc3', 0, true, '[]', '/placeholder.svg?height=200&width=200')
ON CONFLICT (nome) DO NOTHING;

-- Verificar se os produtos foram inseridos
SELECT 'Produtos Diversos inseridos:' as info, COUNT(*) as total 
FROM produtos 
WHERE categoria_id = '4d0750f2-1bbd-5104-bf37-d0bd51b89bc3';
