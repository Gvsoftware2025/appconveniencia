-- Habilitar RLS nas tabelas se não estiver habilitado
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;

-- Criar política permissiva para todas as operações na tabela mesas
DROP POLICY IF EXISTS "Allow all operations on mesas" ON mesas;
CREATE POLICY "Allow all operations on mesas" ON mesas
FOR ALL 
TO public
USING (true)
WITH CHECK (true);

-- Verificar se a política foi criada
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'mesas';
