# SESSION_MEMORY (sobrescrita por sessão)

**Sessão**: 2026-07-07 · Agendamento de Visitas — calendário do corretor

## Contexto vivo
- Dono pediu (com print do card do corretor "AGENDAR VISITA"): botão deve abrir um calendário
  completo do corretor para o cliente marcar a visita, enviar documento com foto, preencher form
  simples (nome/e-mail/telefone) para garantir o compromisso, conectar a agenda do corretor, e
  poder acontecer também durante a vídeo chamada.
- Entregue tudo na branch `claude/broker-calendar-visit-booking-uxhjtc` (PR draft).

## Arquitetura escolhida
- Motor de disponibilidade PURO: `src/lib/scheduling/availability.ts` (fuso fixo Recife, sem Intl-tz).
- "Conectar agenda" em 2 camadas: convite .ics universal (`ics.ts`) + Google Calendar via Service
  Account (`google-calendar.ts`, RS256 com node:crypto, SEM dep nova, env-gated, best-effort).
- Rotas: `GET /api/visits/availability` (grade, exclui ocupados de visit_bookings) e
  `POST /api/visits/book` (best-effort: vídeo room, .ics no bucket visit-invites, insert, Google,
  WhatsApp). Notificações em `src/lib/notifications/visit-notifications.ts`.
- UI: `VisitBookingModal.tsx` (3 passos, glass navy+dourado) + `ScheduleVisitButton.tsx`. Integrado
  em RealtorCard (troca o link wa.me) e VideoCallButton (ação na sala). Página passa dev id/slug.

## Invariantes respeitadas
- Migration `20260707_visit_bookings.sql` versionada mas NÃO aplicada (aprovação do dono).
- RLS managers-only na tabela (PII: telefone/documento). Inserção pública só via service role.
- Upload de documento reaproveita o bucket privado `proposal-documents` (já existente).

## Se retomar
- Pós-merge: exercitar contra preview Vercel (WhatsApp/Google exigem credenciais de produção).
- Evolução natural: config de disponibilidade POR corretor (hoje é global em DEFAULT_AVAILABILITY);
  tela no console para o corretor ver/gerir as visitas de visit_bookings.
- LotDetailContent (mapa de lotes) ainda usa link wa.me para "Agendar Visita" — candidato a migrar
  para o mesmo modal quando tiver broker id/email no fluxo do mapa.
