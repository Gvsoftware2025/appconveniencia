-- Script para corrigir status das mesas baseado nas comandas reais
UPDATE mesas 
SET status = CASE 
  WHEN id IN (
    SELECT DISTINCT m.id 
    FROM mesas m
    JOIN comanda_mesas cm ON m.id = cm.mesa_id
    JOIN comandas c ON cm.comanda_id = c.id
    WHERE c.status = 'aberta'
  ) THEN 'ocupada'
  ELSE 'livre'
END;

-- Verificar resultado
SELECT 
  m.numero as mesa,
  m.status as status_mesa,
  COUNT(c.id) as comandas_abertas
FROM mesas m
LEFT JOIN comanda_mesas cm ON m.id = cm.mesa_id
LEFT JOIN comandas c ON cm.comanda_id = c.id AND c.status = 'aberta'
GROUP BY m.id, m.numero, m.status
ORDER BY m.numero;
