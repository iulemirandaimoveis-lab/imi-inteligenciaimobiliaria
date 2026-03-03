-- Teste 1: Verificar estrutura da tabela developments
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'developments' 
ORDER BY ordinal_position;

-- Teste 2: Contar registros
SELECT COUNT(*) as total_developments FROM developments;

-- Teste 3: Ver primeiros 3 empreendimentos
SELECT id, name, slug, status, developer 
FROM developments 
LIMIT 3;

-- Teste 4: Verificar se developer_id existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'developments' 
AND column_name = 'developer_id';
