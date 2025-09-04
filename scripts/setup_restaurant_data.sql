-- Script único para configurar dados básicos do restaurante
-- Remove dados existentes e insere dados limpos

-- Limpar dados existentes (mantém estrutura das tabelas)
DELETE FROM comanda_mesas;
DELETE FROM pedidos;
DELETE FROM comandas;
DELETE FROM produtos;
DELETE FROM categorias;
DELETE FROM mesas;

-- Inserir mesas (1 a 10)
INSERT INTO mesas (numero, capacidade, status) VALUES
(1, 4, 'livre'),
(2, 4, 'livre'),
(3, 4, 'livre'),
(4, 6, 'livre'),
(5, 6, 'livre'),
(6, 2, 'livre'),
(7, 2, 'livre'),
(8, 8, 'livre'),
(9, 4, 'livre'),
(10, 4, 'livre');

-- Inserir categorias
INSERT INTO categorias (id, nome, descricao) VALUES
(gen_random_uuid(), 'Bebidas', 'Bebidas em geral'),
(gen_random_uuid(), 'Porções', 'Porções e petiscos'),
(gen_random_uuid(), 'Geral', 'Todos os produtos');

-- Inserir produtos básicos
DO $$
DECLARE
    cat_bebidas_id uuid;
    cat_porcoes_id uuid;
    cat_geral_id uuid;
BEGIN
    -- Buscar IDs das categorias
    SELECT id INTO cat_bebidas_id FROM categorias WHERE nome = 'Bebidas';
    SELECT id INTO cat_porcoes_id FROM categorias WHERE nome = 'Porções';
    SELECT id INTO cat_geral_id FROM categorias WHERE nome = 'Geral';
    
    -- Inserir produtos
    INSERT INTO produtos (nome, descricao, preco, categoria_id, tempo_preparo, disponivel) VALUES
    ('Caipirinha', 'Caipirinha tradicional com cachaça', 12.00, cat_bebidas_id, 5, true),
    ('Refrigerante', 'Refrigerante gelado 350ml', 5.00, cat_bebidas_id, 1, true),
    ('Cerveja', 'Cerveja gelada long neck', 8.00, cat_bebidas_id, 1, true),
    ('Água', 'Água mineral 500ml', 3.00, cat_bebidas_id, 1, true),
    ('Batata Frita', 'Porção de batata frita crocante', 15.00, cat_porcoes_id, 10, true),
    ('Frango à Passarinho', 'Porção de frango frito temperado', 22.00, cat_porcoes_id, 15, true),
    ('Pastéis', 'Porção de pastéis variados', 18.00, cat_porcoes_id, 12, true),
    ('Coxinha', 'Porção de coxinhas (6 unidades)', 16.00, cat_porcoes_id, 8, true);
END $$;

-- Verificar se os dados foram inseridos
SELECT 'Mesas inseridas:' as info, COUNT(*) as total FROM mesas;
SELECT 'Categorias inseridas:' as info, COUNT(*) as total FROM categorias;
SELECT 'Produtos inseridos:' as info, COUNT(*) as total FROM produtos;
