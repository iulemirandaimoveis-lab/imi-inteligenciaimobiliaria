import { redirect } from 'next/navigation'

const T = {
    surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)',
    gold: 'var(--bo-accent)',
}

// Pipeline é alias do kanban visual
export default function PipelineRedirect() {
  redirect('/backoffice/leads/kanban')
}
