import { redirect } from 'next/navigation'
import { T } from '@/app/(backoffice)/lib/theme'

export default function ConteudoRedirect() {
    redirect('/backoffice/conteudos')
}
