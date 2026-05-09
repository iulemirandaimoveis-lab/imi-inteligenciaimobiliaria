import IntelligenceDashboard from '../IntelligenceDashboard'

export default function InteligenciaLocationPage({ params }: { params: { lang: string, location: string[] } }) {
  return <IntelligenceDashboard lang={params.lang} initialLocation={params.location} />
}
