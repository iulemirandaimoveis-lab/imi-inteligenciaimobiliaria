# Agendamento de Visitas — Calendário do Corretor

> Última atualização: 2026-07-07

O botão **"Agendar Visita"** no card do corretor (e a ação **"Agendar visita"**
dentro da vídeo chamada) abre um calendário completo onde o cliente escolhe
data e horário na agenda real do corretor, informa nome/e-mail/telefone e anexa
um documento com foto para garantir o compromisso. A visita cai na agenda do
corretor e ambos são avisados por WhatsApp.

## Fluxo

1. **Escolher quando** — modo (presencial ou vídeo chamada) + dia + horário.
   Os horários vêm de `GET /api/visits/availability`, que gera a grade a partir
   das regras de trabalho e **remove os horários já ocupados** (lidos de
   `public.visit_bookings`).
2. **Dados do cliente** — nome*, telefone*, e-mail + upload de documento com foto
   (reutiliza `POST /api/lots/proposal/documents`, bucket privado `proposal-documents`).
3. **Confirmar** — `POST /api/visits/book`:
   - valida o horário (futuro, dentro de 60 dias);
   - se **vídeo**, cria a sala sob demanda (Daily/Jitsi — mesmo motor do CTA de
     vídeo chamada);
   - gera o convite **.ics** e sobe para o bucket `visit-invites` (URL assinada);
   - persiste em `public.visit_bookings` (best-effort);
   - cria o evento no **Google Calendar** do corretor (se configurado);
   - notifica **cliente + corretor** por WhatsApp com o convite e o documento.

Tudo é **best-effort**: mesmo sem banco, sem Google Calendar e sem gateway de
WhatsApp, o cliente sempre recebe a confirmação em tela e o fallback `wa.me`.

## Arquivos

| Camada | Arquivo |
|---|---|
| Migration (⚠️ não aplicada) | `supabase/migrations/20260707_visit_bookings.sql` |
| Motor de disponibilidade (puro) | `src/lib/scheduling/availability.ts` |
| Convite .ics (RFC 5545) | `src/lib/scheduling/ics.ts` |
| Google Calendar (Service Account) | `src/lib/scheduling/google-calendar.ts` |
| Tipos | `src/lib/scheduling/types.ts` |
| Notificações WhatsApp | `src/lib/notifications/visit-notifications.ts` |
| API disponibilidade | `src/app/api/visits/availability/route.ts` |
| API agendamento | `src/app/api/visits/book/route.ts` |
| Modal do calendário | `src/app/[lang]/(website)/imoveis/components/VisitBookingModal.tsx` |
| Botão CTA | `src/app/[lang]/(website)/imoveis/components/ScheduleVisitButton.tsx` |
| Integração no card | `.../components/RealtorCard.tsx` |
| Integração na vídeo chamada | `.../components/VideoCallButton.tsx` |

## Regras de disponibilidade (padrão)

Definidas em `DEFAULT_AVAILABILITY` (`src/lib/scheduling/availability.ts`):

- Fuso: **America/Recife** (UTC-03:00, sem horário de verão).
- Dias: **seg–sáb**.
- Janela: **09:00–18:00**.
- Slot: **45 min**.
- Antecedência mínima: **3h**.
- Horizonte: **21 dias**.

Ajuste passando `cfg` para `generateAvailability`. (Config por corretor no banco
é uma evolução natural — hoje é global.)

## Conectar a agenda do corretor (Google Calendar) — opcional

Sem configuração, o convite **.ics** já garante que a visita entra em qualquer
calendário (Google, Apple, Outlook) com um toque. Para escrever direto no Google
Calendar do corretor:

1. No Google Cloud, crie uma **Service Account** e gere uma chave JSON.
2. Compartilhe a agenda do corretor com o e-mail da Service Account, com
   permissão de **"Fazer alterações nos eventos"**.
3. Defina as variáveis (ver `.env.local.example`):
   - `GOOGLE_CALENDAR_SA_EMAIL`
   - `GOOGLE_CALENDAR_SA_PRIVATE_KEY` (PEM; aceita `\n` literais)
   - `GOOGLE_CALENDAR_ID` (id da agenda compartilhada)
   - `GOOGLE_CALENDAR_SUBJECT` (opcional, delegação domain-wide)

Sem `googleapis`: o token OAuth é assinado localmente (RS256 via `node:crypto`).

## Pendências do dono

- **Aplicar a migration** `supabase/migrations/20260707_visit_bookings.sql` em
  produção (mudança de banco exige aprovação). Antes disso, o agendamento já
  notifica por WhatsApp; a **persistência e o anti-conflito de horário** ligam
  após aplicar.
- (Opcional) Configurar a Service Account do Google Calendar para espelhar as
  visitas na agenda do corretor.
