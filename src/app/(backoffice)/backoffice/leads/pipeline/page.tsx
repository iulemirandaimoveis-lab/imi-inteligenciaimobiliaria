import { redirect } from 'next/navigation'
import { T } from '@/app/(backoffice)/lib/theme'

// Pipeline é alias do kanban visual
export default function PipelineRedirect() {
  redirect('/backoffice/leads/kanban')
}
