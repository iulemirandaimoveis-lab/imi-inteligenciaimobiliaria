-- View para Estatísticas Diárias de Vendas
CREATE OR REPLACE VIEW daily_sales_stats AS
SELECT 
    date_trunc('day', created_at) as date,
    COUNT(*) as count,
    SUM(capital) as total_value
FROM leads
WHERE status = 'won'
GROUP BY date_trunc('day', created_at)
ORDER BY date DESC;

-- Função para Melhores Corretores
CREATE OR REPLACE FUNCTION get_top_brokers(limit_count int)
RETURNS TABLE (
    broker_name text,
    deals_count bigint,
    total_value numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(u.raw_user_meta_data->>'name', u.email) as broker_name,
        COUNT(l.id) as deals_count,
        COALESCE(SUM(l.capital), 0) as total_value
    FROM leads l
    LEFT JOIN auth.users u ON l.assigned_to = u.id
    WHERE l.status = 'won'
    GROUP BY u.id, u.raw_user_meta_data, u.email
    ORDER BY total_value DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (if needed for public/authenticated access to views/functions)
GRANT SELECT ON daily_sales_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_brokers(int) TO authenticated;
