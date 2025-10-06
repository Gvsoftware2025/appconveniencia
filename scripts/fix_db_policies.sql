-- Ajustar políticas de Row Level Security para permitir operações CRUD

-- Desabilitar RLS temporariamente para tabelas que precisam de acesso público
ALTER TABLE mesas DISABLE ROW LEVEL SECURITY;
ALTER TABLE produtos DISABLE ROW LEVEL SECURITY;
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE comandas DISABLE ROW LEVEL SECURITY;
ALTER TABLE comanda_mesas DISABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE divisao_conta DISABLE ROW LEVEL SECURITY;

-- Ou alternativamente, criar políticas permissivas (descomente se preferir manter RLS ativo)
/*
-- Política para permitir todas as operações na tabela mesas
DROP POLICY IF EXISTS "Allow all operations on mesas" ON mesas;
CREATE POLICY "Allow all operations on mesas" ON mesas
FOR ALL USING (true) WITH CHECK (true);

-- Política para permitir todas as operações na tabela produtos
DROP POLICY IF EXISTS "Allow all operations on produtos" ON produtos;
CREATE POLICY "Allow all operations on produtos" ON produtos
FOR ALL USING (true) WITH CHECK (true);

-- Política para permitir todas as operações na tabela categorias
DROP POLICY IF EXISTS "Allow all operations on categorias" ON categorias;
CREATE POLICY "Allow all operations on categorias" ON categorias
FOR ALL USING (true) WITH CHECK (true);

-- Política para permitir todas as operações na tabela comandas
DROP POLICY IF EXISTS "Allow all operations on comandas" ON comandas;
CREATE POLICY "Allow all operations on comandas" ON comandas
FOR ALL USING (true) WITH CHECK (true);

-- Política para permitir todas as operações na tabela comanda_mesas
DROP POLICY IF EXISTS "Allow all operations on comanda_mesas" ON comanda_mesas;
CREATE POLICY "Allow all operations on comanda_mesas" ON comanda_mesas
FOR ALL USING (true) WITH CHECK (true);

-- Política para permitir todas as operações na tabela pedidos
DROP POLICY IF EXISTS "Allow all operations on pedidos" ON pedidos;
CREATE POLICY "Allow all operations on pedidos" ON pedidos
FOR ALL USING (true) WITH CHECK (true);

-- Política para permitir todas as operações na tabela pagamentos
DROP POLICY IF EXISTS "Allow all operations on pagamentos" ON pagamentos;
CREATE POLICY "Allow all operations on pagamentos" ON pagamentos
FOR ALL USING (true) WITH CHECK (true);

-- Política para permitir todas as operações na tabela divisao_conta
DROP POLICY IF EXISTS "Allow all operations on divisao_conta" ON divisao_conta;
CREATE POLICY "Allow all operations on divisao_conta" ON divisao_conta
FOR ALL USING (true) WITH CHECK (true);
*/

-- Verificar se as políticas foram aplicadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
