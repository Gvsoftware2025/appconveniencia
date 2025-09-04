-- Script to fix comandas that should be open but are marked as closed
-- This will reopen comandas that have recent activity and should still be active

UPDATE comandas 
SET status = 'aberta', 
    updated_at = NOW()
WHERE status = 'fechada' 
  AND created_at > NOW() - INTERVAL '24 hours'  -- Only recent comandas
  AND EXISTS (
    SELECT 1 FROM pedidos 
    WHERE pedidos.comanda_id = comandas.id
  ); -- Only comandas that have pedidos

-- Update mesa status for comandas that are now open
UPDATE mesas 
SET status = 'ocupada'
WHERE id IN (
  SELECT DISTINCT cm.mesa_id 
  FROM comanda_mesas cm
  JOIN comandas c ON c.id = cm.comanda_id
  WHERE c.status = 'aberta'
);
