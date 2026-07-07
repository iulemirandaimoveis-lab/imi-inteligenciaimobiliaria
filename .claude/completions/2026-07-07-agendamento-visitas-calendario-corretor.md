# Agendamento de Visitas — Calendário do Corretor

**Data**: 2026-07-07
**Branch**: `claude/broker-calendar-visit-booking-uxhjtc`
**Tipo**: Feature (funil de captação · aditiva)

## Pedido

O botão "Agendar Visita" (card do corretor na página do imóvel) deve abrir um
calendário completo do corretor para o cliente marcar a visita, enviar um
documento com foto e preencher um formulário simples (nome, e-mail, telefone)
para garantir o compromisso. Deve conectar a agenda do corretor. O agendamento
também pode acontecer durante a vídeo chamada.

## Entregue

Calendário de agendamento completo, mobile-first, no visual do sistema (glass
navy + dourado), com:

- **Escolha de quando**: modo presencial/vídeo + dia + horário, lidos da agenda
  real do corretor (`GET /api/visits/availability`) — horários ocupados somem.
- **Dados + documento com foto**: nome*, telefone*, e-mail + upload de RG/CNH
  (foto ou PDF), reaproveitando `POST /api/lots/proposal/documents`.
- **Confirmação** (`POST /api/visits/book`): valida o horário, cria sala de vídeo
  quando o modo é vídeo, gera convite **.ics**, persiste em `visit_bookings`
  (best-effort), cria evento no **Google Calendar** do corretor (quando
  configurado) e notifica cliente + corretor por WhatsApp com convite e documento.
- **Durante a vídeo chamada**: ação "Agendar visita" no rodapé da sala.

Tudo **best-effort**: sem banco/Google/WhatsApp, o cliente ainda recebe
confirmação em tela + fallback `wa.me`.

## Arquivos

**Novos**
- `supabase/migrations/20260707_visit_bookings.sql` (⚠️ não aplicada)
- `src/lib/scheduling/{types,availability,ics,google-calendar}.ts`
- `src/lib/notifications/visit-notifications.ts`
- `src/app/api/visits/availability/route.ts`, `src/app/api/visits/book/route.ts`
- `src/app/[lang]/(website)/imoveis/components/{VisitBookingModal,ScheduleVisitButton}.tsx`
- `src/__tests__/lib/scheduling/{availability,ics}.test.ts`, `src/__tests__/api/visits-book.test.ts`
- `docs/AGENDAMENTO_VISITAS.md`

**Alterados**
- `.../components/RealtorCard.tsx` (troca o link wa.me pelo `ScheduleVisitButton`; +props dev id/slug)
- `.../components/VideoCallButton.tsx` (ação "Agendar visita" na sala; +props broker/dev)
- `src/app/[lang]/(website)/imoveis/[slug]/page.tsx` (passa dev id/slug ao card)
- `.env.local.example`, `supabase/MIGRATIONS_MAP.md`

## Qualidade

- `tsc --noEmit`: limpo (0 erros).
- `next lint --quiet`: limpo nos arquivos alterados.
- `jest`: **966 passed / 5 skipped / 75 suítes** (11 testes novos), zero regressão.

## Decisões

- **Fuso fixo America/Recife (UTC-3)**: motor de disponibilidade puro e testável,
  sem depender de Intl com timezone.
- **"Conectar a agenda" em duas camadas**: convite **.ics** universal (funciona
  hoje, qualquer calendário) + Google Calendar via Service Account (RS256 com
  `node:crypto`, sem dependência nova), env-gated e best-effort.
- **Migration versionada mas NÃO aplicada** (invariante: mudança de banco exige
  aprovação). A API funciona antes de aplicar; persistência/anti-conflito ligam
  depois.

## Pendências do dono

1. Aplicar `supabase/migrations/20260707_visit_bookings.sql` em produção.
2. (Opcional) Configurar a Service Account do Google Calendar (ver doc).

## Verificação recomendada pós-merge

Exercitar o fluxo contra um preview do Vercel (escolher horário → anexar foto →
confirmar) — o envio real de WhatsApp/Google depende de credenciais de produção.
