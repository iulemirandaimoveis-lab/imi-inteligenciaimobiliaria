import { redirect } from 'next/navigation'

// /equipe foi consolidado em /organizacao (660L com fetch real)
export default function EquipePage() {
    redirect('/backoffice/organizacao')
}
