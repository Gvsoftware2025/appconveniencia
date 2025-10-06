-- Script para corrigir problemas de RLS (Row Level Security)
-- Este script habilita RLS em todas as tabelas e cria políticas básicas

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanda_mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisao_conta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver conflitos
DROP POLICY IF EXISTS "Allow all operations" ON public.categorias;
DROP POLICY IF EXISTS "Allow all operations" ON public.comanda_mesas;
DROP POLICY IF EXISTS "Allow all operations" ON public.comandas;
DROP POLICY IF EXISTS "Allow all operations" ON public.divisao_conta;
DROP POLICY IF EXISTS "Allow all operations" ON public.mesas;
DROP POLICY IF EXISTS "Allow all operations" ON public.pagamentos;
DROP POLICY IF EXISTS "Allow all operations" ON public.pedidos;
DROP POLICY IF EXISTS "Allow all operations" ON public.produtos;

-- Criar políticas permissivas para todas as operações (adequado para sistema interno)
-- Em produção, você pode querer políticas mais restritivas

-- Categorias
CREATE POLICY "Allow all operations" ON public.categorias
FOR ALL USING (true) WITH CHECK (true);

-- Comanda Mesas
CREATE POLICY "Allow all operations" ON public.comanda_mesas
FOR ALL USING (true) WITH CHECK (true);

-- Comandas
CREATE POLICY "Allow all operations" ON public.comandas
FOR ALL USING (true) WITH CHECK (true);

-- Divisão Conta
CREATE POLICY "Allow all operations" ON public.divisao_conta
FOR ALL USING (true) WITH CHECK (true);

-- Mesas
CREATE POLICY "Allow all operations" ON public.mesas
FOR ALL USING (true) WITH CHECK (true);

-- Pagamentos
CREATE POLICY "Allow all operations" ON public.pagamentos
FOR ALL USING (true) WITH CHECK (true);

-- Pedidos
CREATE POLICY "Allow all operations" ON public.pedidos
FOR ALL USING (true) WITH CHECK (true);

-- Produtos
CREATE POLICY "Allow all operations" ON public.produtos
FOR ALL USING (true) WITH CHECK (true);

-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('categorias', 'comanda_mesas', 'comandas', 'divisao_conta', 'mesas', 'pagamentos', 'pedidos', 'produtos');
