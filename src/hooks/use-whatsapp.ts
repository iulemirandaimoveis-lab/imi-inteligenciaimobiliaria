// src/hooks/use-whatsapp.ts
// IMI - Hooks para WhatsApp + CRM Realtime
"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type {
  Lead,
  WhatsAppMessage,
  WhatsAppInstance,
  LeadActivity,
  PipelineView,
  LeadPipelineStage,
} from "@/types/crm"

const supabase = createClient()

// ============================================================
// Hook: Instância WhatsApp (conexão, QR Code, status)
// ============================================================
export function useWhatsAppInstance() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/instance")
      const data = await res.json()
      setInstances(data.instances || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createInstance = useCallback(
    async (config: {
      instance_name: string
      evolution_api_url: string
      evolution_api_key: string
    }) => {
      const res = await fetch("/api/whatsapp/instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (data.success) {
        await fetchInstances()
      }
      return data
    },
    [fetchInstances]
  )

  useEffect(() => {
    fetchInstances()

    // Escutar atualizações de status em tempo real
    const channel = supabase
      .channel("whatsapp_instances_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_instances" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setInstances((prev) =>
              prev.map((inst) =>
                inst.id === payload.new.id
                  ? { ...inst, ...payload.new }
                  : inst
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchInstances])

  const defaultInstance = instances.find((i) => i.is_default) || instances[0]

  return {
    instances,
    defaultInstance,
    loading,
    error,
    createInstance,
    refresh: fetchInstances,
  }
}

// ============================================================
// Hook: Mensagens WhatsApp em tempo real
// ============================================================
export function useWhatsAppMessages(leadId: string | null) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!leadId) {
      setMessages([])
      setLoading(false)
      return
    }

    // Fetch inicial
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true })
        .limit(100)

      setMessages(data || [])
      setLoading(false)
    }

    fetchMessages()

    // Realtime
    const channel = supabase
      .channel(`messages_${leadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "whatsapp_messages",
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as WhatsAppMessage])
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "whatsapp_messages",
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.new.id ? { ...m, ...payload.new } : m
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [leadId])

  const sendMessage = useCallback(
    async (message: string, instanceId?: string) => {
      if (!leadId) return null

      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          message,
          instance_id: instanceId,
        }),
      })

      return res.json()
    },
    [leadId]
  )

  return { messages, loading, sendMessage }
}

// ============================================================
// Hook: Lista de Conversas (sidebar do WhatsApp)
// ============================================================
export function useWhatsAppConversations() {
  const [conversations, setConversations] = useState<
    (Lead & { last_message?: WhatsAppMessage; unread_count?: number })[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConversations = async () => {
      // Buscar leads com última mensagem
      const { data: leads } = await supabase
        .from("leads")
        .select("*")
        .not("whatsapp_jid", "is", null)
        .eq("is_archived", false)
        .order("last_message_at", { ascending: false })
        .limit(50)

      if (leads && leads.length > 0) {
        // Para cada lead, buscar última mensagem
        const conversationsWithMsg = await Promise.all(
          leads.map(async (lead) => {
            const { data: lastMsg } = await supabase
              .from("whatsapp_messages")
              .select("*")
              .eq("lead_id", lead.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single()

            return {
              ...lead,
              last_message: lastMsg || undefined,
            }
          })
        )

        setConversations(conversationsWithMsg)
      }

      setLoading(false)
    }

    fetchConversations()

    // Realtime: escutar novas mensagens para atualizar lista
    const channel = supabase
      .channel("conversations_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "whatsapp_messages",
        },
        () => {
          // Refetch ao receber qualquer nova mensagem
          fetchConversations()
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
        },
        () => {
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { conversations, loading }
}

// ============================================================
// Hook: Pipeline Kanban
// ============================================================
export function usePipeline(filters?: {
  assigned_to?: string
  temperature?: string
}) {
  const [pipeline, setPipeline] = useState<PipelineView | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPipeline = useCallback(async () => {
    const params = new URLSearchParams()
    if (filters?.assigned_to) params.set("assigned_to", filters.assigned_to)
    if (filters?.temperature) params.set("temperature", filters.temperature)

    const res = await fetch(`/api/leads/pipeline?${params}`)
    const data = await res.json()
    setPipeline(data)
    setLoading(false)
  }, [filters?.assigned_to, filters?.temperature])

  const moveLead = useCallback(
    async (leadId: string, newStage: LeadPipelineStage, reason?: string) => {
      const res = await fetch("/api/leads/pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          new_stage: newStage,
          reason,
        }),
      })

      if (res.ok) {
        await fetchPipeline()
      }

      return res.json()
    },
    [fetchPipeline]
  )

  useEffect(() => {
    fetchPipeline()

    // Realtime
    const channel = supabase
      .channel("pipeline_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => {
          fetchPipeline()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchPipeline])

  return { pipeline, loading, moveLead, refresh: fetchPipeline }
}

// ============================================================
// Hook: Lead Detail (dados completos + atividades)
// ============================================================
export function useLeadDetail(leadId: string | null) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [scoreHistory, setScoreHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!leadId) {
      setLead(null)
      setActivities([])
      setLoading(false)
      return
    }

    const fetchData = async () => {
      const [leadRes, activitiesRes, scoreRes] = await Promise.all([
        supabase.from("leads").select("*").eq("id", leadId).single(),
        supabase
          .from("lead_activities")
          .select("*")
          .eq("lead_id", leadId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("lead_score_history")
          .select("*")
          .eq("lead_id", leadId)
          .order("created_at", { ascending: false })
          .limit(20),
      ])

      setLead(leadRes.data)
      setActivities(activitiesRes.data || [])
      setScoreHistory(scoreRes.data || [])
      setLoading(false)
    }

    fetchData()

    // Realtime para o lead específico
    const channel = supabase
      .channel(`lead_detail_${leadId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "leads",
          filter: `id=eq.${leadId}`,
        },
        (payload) => {
          setLead((prev) => (prev ? { ...prev, ...payload.new } : null))
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "lead_activities",
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => {
          setActivities((prev) => [payload.new as LeadActivity, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [leadId])

  const updateLead = useCallback(
    async (updates: Partial<Lead>) => {
      if (!leadId) return
      await supabase.from("leads").update(updates).eq("id", leadId)
    },
    [leadId]
  )

  const rescoreLead = useCallback(async () => {
    if (!leadId) return
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/qualify-lead`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          lead_id: leadId,
          trigger: "manual_rescore",
        }),
      }
    )
    return res.json()
  }, [leadId])

  return {
    lead,
    activities,
    scoreHistory,
    loading,
    updateLead,
    rescoreLead,
  }
}

// ============================================================
// Hook: Dashboard de Conversão
// ============================================================
export function useConversionDashboard() {
  const [metrics, setMetrics] = useState({
    total_leads: 0,
    leads_today: 0,
    leads_this_month: 0,
    conversion_rate: 0,
    avg_score: 0,
    avg_days_in_pipeline: 0,
    by_stage: {} as Record<string, number>,
    by_temperature: {} as Record<string, number>,
    by_source: {} as Record<string, number>,
    hot_leads: [] as Lead[],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      const today = new Date().toISOString().split("T")[0]
      const monthStart = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      ).toISOString()

      const [allLeads, todayLeads, monthLeads, hotLeads] = await Promise.all([
        supabase
          .from("leads")
          .select("pipeline_stage, temperature, source, score, days_in_pipeline")
          .eq("is_archived", false),
        supabase
          .from("leads")
          .select("id", { count: "exact" })
          .gte("created_at", today),
        supabase
          .from("leads")
          .select("id", { count: "exact" })
          .gte("created_at", monthStart),
        supabase
          .from("leads")
          .select("*")
          .gte("score", 70)
          .eq("is_archived", false)
          .order("score", { ascending: false })
          .limit(10),
      ])

      const leads = allLeads.data || []

      const byStage = leads.reduce(
        (acc, l) => {
          acc[l.pipeline_stage] = (acc[l.pipeline_stage] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      const byTemp = leads.reduce(
        (acc, l) => {
          acc[l.temperature] = (acc[l.temperature] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      const bySource = leads.reduce(
        (acc, l) => {
          acc[l.source] = (acc[l.source] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      const closed = leads.filter(
        (l) => l.pipeline_stage === "fechado_ganho"
      ).length

      setMetrics({
        total_leads: leads.length,
        leads_today: todayLeads.count || 0,
        leads_this_month: monthLeads.count || 0,
        conversion_rate:
          leads.length > 0 ? (closed / leads.length) * 100 : 0,
        avg_score:
          leads.length > 0
            ? leads.reduce((s, l) => s + (l.score || 0), 0) / leads.length
            : 0,
        avg_days_in_pipeline:
          leads.length > 0
            ? leads.reduce((s, l) => s + (l.days_in_pipeline || 0), 0) /
              leads.length
            : 0,
        by_stage: byStage,
        by_temperature: byTemp,
        by_source: bySource,
        hot_leads: (hotLeads.data || []) as Lead[],
      })

      setLoading(false)
    }

    fetchMetrics()

    // Refresh a cada 30 segundos
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  return { metrics, loading }
}
