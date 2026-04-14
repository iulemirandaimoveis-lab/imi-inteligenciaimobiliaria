-- =============================================================================
-- IMI CUSTOM ANALYTICS PLATFORM
-- =============================================================================
-- Substitui: GA4, GTM, Stape, CDPs, Meta Pixel, Google Tag Manager
-- Captura: page_view, click, cta_click, form_submit, scroll, engagement,
--          external_link, lead, backoffice_action, custom
--
-- Design:
--   • analytics_events: event bus unificado (single source of truth)
--   • Sem dados brutos de IP (LGPD: apenas hash SHA-256)
--   • Enriquecimento 100% server-side (geo via Vercel headers, UA parse)
--   • Realtime via Supabase Realtime (substituindo webhooks de terceiros)
-- =============================================================================

-- ── 1. Tabela Principal ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Identidade do Evento
    event_type      TEXT        NOT NULL,   -- page_view | click | cta_click | form_submit |
                                            -- scroll | engagement | external_link | lead |
                                            -- backoffice_action | custom
    event_name      TEXT,                   -- subcategoria: 'hero_cta_click', 'contact_form_submit', etc.

    -- Visitante & Sessão
    session_id      TEXT        NOT NULL,   -- por aba (sessionStorage, regenerado a cada sessão)
    visitor_id      TEXT,                   -- persistente cross-session (localStorage, 1 ano)
    user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,  -- usuários autenticados (backoffice)

    -- Contexto de Página
    page_url        TEXT,
    page_path       TEXT,
    page_title      TEXT,
    referrer        TEXT,

    -- Atribuição UTM (multi-touch)
    utm_source      TEXT,
    utm_medium      TEXT,
    utm_campaign    TEXT,
    utm_content     TEXT,
    utm_term        TEXT,

    -- Dispositivo (parser 100% server-side — sem fingerprinting invasivo)
    device_type     TEXT,       -- mobile | tablet | desktop
    browser         TEXT,
    os              TEXT,
    screen_width    INT,

    -- Geo (Vercel headers gratuitos — sem API externa)
    country         TEXT,
    region          TEXT,
    city            TEXT,
    ip_hash         TEXT,       -- SHA-256(salt + IP) — LGPD compliant, sem IP raw

    -- Engajamento
    duration_seconds INT,       -- tempo na página / duração do evento
    scroll_depth     INT,       -- 0–100%

    -- Rastreamento de Links
    tracked_link_id  UUID       REFERENCES public.tracked_links(id) ON DELETE SET NULL,
    development_slug TEXT,

    -- Propriedades Flexíveis (dados específicos por evento)
    properties      JSONB       DEFAULT '{}',

    -- Bot Detection
    is_bot          BOOLEAN     DEFAULT FALSE,

    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.analytics_events IS
    'Plataforma de analytics própria da IMI. Substitui GA4, GTM, Stape, CDPs. '
    'Coleta todos os eventos do website público e do backoffice.';

-- ── 2. Índices Otimizados ─────────────────────────────────────────────────────

-- Queries por sessão/visitante (jornada do usuário)
CREATE INDEX IF NOT EXISTS idx_ae_session     ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_ae_visitor     ON analytics_events(visitor_id) WHERE visitor_id IS NOT NULL;

-- Queries por tipo de evento + tempo (dashboard principal)
CREATE INDEX IF NOT EXISTS idx_ae_event_type  ON analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_created_at  ON analytics_events(created_at DESC);

-- Queries por página (top pages, funil)
CREATE INDEX IF NOT EXISTS idx_ae_page_path   ON analytics_events(page_path) WHERE page_path IS NOT NULL;

-- Queries de usuários autenticados (ações no backoffice)
CREATE INDEX IF NOT EXISTS idx_ae_user_id     ON analytics_events(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- Queries de atribuição (UTM source)
CREATE INDEX IF NOT EXISTS idx_ae_utm_source  ON analytics_events(utm_source, created_at DESC) WHERE utm_source IS NOT NULL;

-- Índice composto para real-time (últimos 5 minutos, excluindo bots)
CREATE INDEX IF NOT EXISTS idx_ae_realtime    ON analytics_events(created_at DESC, session_id, event_type) WHERE is_bot = FALSE;

-- Índice para funil de conversão
CREATE INDEX IF NOT EXISTS idx_ae_funnel      ON analytics_events(event_type, created_at DESC) WHERE is_bot = FALSE;

-- Índice para event_name (queries de CTAs específicos)
CREATE INDEX IF NOT EXISTS idx_ae_event_name  ON analytics_events(event_name, created_at DESC) WHERE event_name IS NOT NULL;

-- ── 3. RLS (Row Level Security) ───────────────────────────────────────────────

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Leitura: apenas usuários autenticados (backoffice)
CREATE POLICY "analytics_events_select"
    ON public.analytics_events FOR SELECT
    USING (auth.role() = 'authenticated');

-- Escrita: aberto (rate limiting na camada de API)
-- Nota: INSERT é feito via service_role (supabaseAdmin) no servidor
CREATE POLICY "analytics_events_insert"
    ON public.analytics_events FOR INSERT
    WITH CHECK (true);

-- ── 4. Realtime ───────────────────────────────────────────────────────────────

-- Habilita Realtime para o dashboard ao vivo
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND tablename = 'analytics_events'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_events;
    END IF;
END;
$$;

-- ── 5. Funções de Analytics ───────────────────────────────────────────────────

-- 5a. Visitantes Ativos (últimos N minutos)
CREATE OR REPLACE FUNCTION public.analytics_active_visitors(
    minutes_ago INT DEFAULT 5
)
RETURNS TABLE(
    active_sessions  BIGINT,
    active_visitors  BIGINT,
    top_pages        JSONB
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    WITH window_start AS (
        SELECT NOW() - (minutes_ago || ' minutes')::INTERVAL AS ts
    ),
    recent AS (
        SELECT session_id, visitor_id, page_path
        FROM public.analytics_events, window_start
        WHERE created_at >= window_start.ts
          AND is_bot = FALSE
    ),
    pages AS (
        SELECT page_path, COUNT(*) AS views
        FROM recent
        WHERE page_path IS NOT NULL
        GROUP BY page_path
        ORDER BY views DESC
        LIMIT 10
    )
    SELECT
        COUNT(DISTINCT recent.session_id),
        COUNT(DISTINCT recent.visitor_id) FILTER (WHERE recent.visitor_id IS NOT NULL),
        COALESCE(
            (SELECT jsonb_agg(jsonb_build_object('path', page_path, 'views', views) ORDER BY views DESC)
             FROM pages),
            '[]'::jsonb
        )
    FROM recent
$$;

-- 5b. KPIs do Dashboard (período customizável)
CREATE OR REPLACE FUNCTION public.analytics_events_kpis(
    p_start_date TIMESTAMPTZ,
    p_end_date   TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    WITH base AS (
        SELECT event_type, session_id, visitor_id, duration_seconds
        FROM public.analytics_events
        WHERE created_at BETWEEN p_start_date AND p_end_date
          AND is_bot = FALSE
    ),
    pv  AS (SELECT COUNT(*)               AS cnt FROM base WHERE event_type = 'page_view'),
    ses AS (SELECT COUNT(DISTINCT session_id) AS cnt FROM base),
    vis AS (SELECT COUNT(DISTINCT visitor_id) AS cnt FROM base WHERE visitor_id IS NOT NULL),
    clk AS (SELECT COUNT(*)               AS cnt FROM base WHERE event_type IN ('click', 'cta_click')),
    frm AS (SELECT COUNT(*)               AS cnt FROM base WHERE event_type = 'form_submit'),
    dur AS (
        SELECT ROUND(AVG(duration_seconds))::INT AS avg_d
        FROM base WHERE event_type = 'page_view' AND duration_seconds > 0
    ),
    bounce AS (
        SELECT
            COUNT(*) FILTER (WHERE pv_count = 1) AS bounced,
            COUNT(*)                              AS total
        FROM (
            SELECT session_id, COUNT(*) AS pv_count
            FROM base WHERE event_type = 'page_view'
            GROUP BY session_id
        ) s
    )
    SELECT jsonb_build_object(
        'pageViews',         (SELECT cnt FROM pv),
        'sessions',          (SELECT cnt FROM ses),
        'visitors',          (SELECT cnt FROM vis),
        'clicks',            (SELECT cnt FROM clk),
        'formSubmits',       (SELECT cnt FROM frm),
        'avgDurationSeconds',(SELECT COALESCE(avg_d, 0) FROM dur),
        'bounceRate',        CASE
                               WHEN (SELECT total FROM bounce) > 0
                               THEN ROUND(((SELECT bounced FROM bounce)::DECIMAL / (SELECT total FROM bounce)) * 100)
                               ELSE 0
                             END
    )
$$;

-- 5c. Timeline Diário
CREATE OR REPLACE FUNCTION public.analytics_events_timeline(
    p_start_date TIMESTAMPTZ,
    p_num_days   INT DEFAULT 30
)
RETURNS TABLE(
    day          TEXT,
    page_views   BIGINT,
    sessions     BIGINT,
    clicks       BIGINT,
    form_submits BIGINT,
    scroll_75    BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    WITH days AS (
        SELECT generate_series(
            p_start_date::DATE,
            (p_start_date::DATE + (p_num_days - 1) * INTERVAL '1 day')::DATE,
            '1 day'::INTERVAL
        )::DATE AS d
    ),
    events AS (
        SELECT
            created_at::DATE       AS d,
            event_type,
            event_name,
            session_id
        FROM public.analytics_events
        WHERE created_at >= p_start_date
          AND is_bot = FALSE
    )
    SELECT
        days.d::TEXT,
        COUNT(ev.event_type) FILTER (WHERE ev.event_type = 'page_view')                          AS page_views,
        COUNT(DISTINCT ev.session_id) FILTER (WHERE ev.event_type = 'page_view')                 AS sessions,
        COUNT(ev.event_type) FILTER (WHERE ev.event_type IN ('click','cta_click'))                AS clicks,
        COUNT(ev.event_type) FILTER (WHERE ev.event_type = 'form_submit')                        AS form_submits,
        COUNT(ev.event_type) FILTER (WHERE ev.event_type = 'scroll' AND ev.event_name = 'scroll_75') AS scroll_75
    FROM days
    LEFT JOIN events ev ON days.d = ev.d
    GROUP BY days.d
    ORDER BY days.d
$$;

-- 5d. Funil de Conversão
CREATE OR REPLACE FUNCTION public.analytics_conversion_funnel(
    p_start_date TIMESTAMPTZ,
    p_end_date   TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    WITH base AS (
        SELECT event_type, session_id, visitor_id
        FROM public.analytics_events
        WHERE created_at BETWEEN p_start_date AND p_end_date
          AND is_bot = FALSE
    ),
    sessions     AS (SELECT COUNT(DISTINCT session_id) AS cnt FROM base WHERE event_type = 'page_view'),
    engaged      AS (SELECT COUNT(DISTINCT session_id) AS cnt FROM base WHERE event_type = 'engagement'),
    cta_clickers AS (SELECT COUNT(DISTINCT session_id) AS cnt FROM base WHERE event_type IN ('cta_click', 'click')),
    form_started AS (SELECT COUNT(DISTINCT session_id) AS cnt FROM base WHERE event_type = 'form_submit'),
    leads        AS (SELECT COUNT(DISTINCT session_id) AS cnt FROM base WHERE event_type = 'lead')
    SELECT jsonb_build_array(
        jsonb_build_object('stage', 'Sessões',      'count', (SELECT cnt FROM sessions)),
        jsonb_build_object('stage', 'Engajamento',  'count', (SELECT cnt FROM engaged)),
        jsonb_build_object('stage', 'Clicou no CTA','count', (SELECT cnt FROM cta_clickers)),
        jsonb_build_object('stage', 'Formulário',   'count', (SELECT cnt FROM form_started)),
        jsonb_build_object('stage', 'Lead',         'count', (SELECT cnt FROM leads))
    )
$$;

-- 5e. Top Eventos / CTAs
CREATE OR REPLACE FUNCTION public.analytics_top_events(
    p_start_date TIMESTAMPTZ,
    p_limit      INT DEFAULT 20
)
RETURNS TABLE(
    event_name   TEXT,
    event_type   TEXT,
    total_count  BIGINT,
    unique_sessions BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT
        COALESCE(event_name, event_type) AS event_name,
        event_type,
        COUNT(*)                         AS total_count,
        COUNT(DISTINCT session_id)       AS unique_sessions
    FROM public.analytics_events
    WHERE created_at >= p_start_date
      AND is_bot = FALSE
      AND event_name IS NOT NULL
    GROUP BY COALESCE(event_name, event_type), event_type
    ORDER BY total_count DESC
    LIMIT p_limit
$$;

-- 5f. Jornada do Visitante (path analysis)
CREATE OR REPLACE FUNCTION public.analytics_visitor_journeys(
    p_start_date TIMESTAMPTZ,
    p_limit      INT DEFAULT 10
)
RETURNS TABLE(
    session_id      TEXT,
    page_count      BIGINT,
    total_duration  INT,
    path            JSONB,
    started_at      TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    WITH session_pages AS (
        SELECT
            session_id,
            jsonb_agg(
                jsonb_build_object('page', page_path, 'duration', COALESCE(duration_seconds,0))
                ORDER BY created_at
            ) AS path,
            COUNT(*)                    AS page_count,
            SUM(COALESCE(duration_seconds,0))::INT AS total_duration,
            MIN(created_at)             AS started_at
        FROM public.analytics_events
        WHERE created_at >= p_start_date
          AND is_bot = FALSE
          AND event_type = 'page_view'
          AND page_path IS NOT NULL
        GROUP BY session_id
        HAVING COUNT(*) >= 2
    )
    SELECT session_id, page_count, total_duration, path, started_at
    FROM session_pages
    ORDER BY page_count DESC, total_duration DESC
    LIMIT p_limit
$$;

-- ── 6. Tabela de Configuração do Analytics (substituindo settings de GA4) ──────

CREATE TABLE IF NOT EXISTS public.analytics_config (
    id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    key             TEXT        NOT NULL UNIQUE,
    value           JSONB       NOT NULL DEFAULT '{}',
    description     TEXT,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_by      UUID        REFERENCES auth.users(id)
);

COMMENT ON TABLE public.analytics_config IS
    'Configurações da plataforma de analytics própria da IMI. '
    'Ex: domínios ignorados, bot patterns customizados, integrações webhook.';

-- Configurações padrão
INSERT INTO public.analytics_config (key, value, description) VALUES
    ('bot_patterns', '"bot|crawl|spider|headless|phantom|selenium|bytespider|mediapartners"',
     'Regex para detecção de bots (além dos padrões internos)'),
    ('ignored_paths', '["/_next","/_vercel","/api","/favicon"]',
     'Paths que não geram events de page_view'),
    ('session_timeout_minutes', '30',
     'Tempo de inatividade para expirar uma sessão'),
    ('realtime_window_minutes', '5',
     'Janela de tempo para "visitantes ativos agora"'),
    ('attribution_first_touch_days', '180',
     'Duração do cookie de first-touch attribution (dias)'),
    ('attribution_last_touch_days', '30',
     'Duração do cookie de last-touch attribution (dias)')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.analytics_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_config_select"
    ON public.analytics_config FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "analytics_config_all"
    ON public.analytics_config FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin', 'super_admin')
        )
    );

-- ── 7. View: Backoffice Actions Audit ────────────────────────────────────────

CREATE OR REPLACE VIEW public.v_backoffice_audit AS
SELECT
    ae.id,
    ae.event_name,
    ae.page_path,
    ae.properties,
    ae.created_at,
    p.name  AS user_name,
    p.email AS user_email,
    p.role  AS user_role
FROM public.analytics_events ae
LEFT JOIN public.profiles p ON ae.user_id = p.id
WHERE ae.event_type = 'backoffice_action'
ORDER BY ae.created_at DESC;

COMMENT ON VIEW public.v_backoffice_audit IS
    'Auditoria de ações dos usuários no backoffice rastreadas via analytics_events.';
