import { redirect } from 'next/navigation'

// Pipeline é alias do kanban visual
export default function PipelineRedirect() {
  redirect('/backoffice/leads/kanban')
}
