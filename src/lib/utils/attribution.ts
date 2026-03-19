export function getAttribution() {
    if (typeof document === 'undefined') return null;
    // 1. Tentar ler do Cookie (setado pelo encurtador de link)
    const cookies = document.cookie.split('; ');
    const attrCookie = cookies.find(row => row.startsWith('imi_attribution='));
    if (attrCookie) {
        try {
            return JSON.parse(decodeURIComponent(attrCookie.split('=')[1]));
        } catch (e) {
        }
    }
    // 2. Fallback: Ler UTMs da URL se existirem no momento
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('utm_source')) {
        return {
            source: searchParams.get('utm_source'),
            medium: searchParams.get('utm_medium'),
            campaign: searchParams.get('utm_campaign'),
            content: searchParams.get('utm_content')
        };
    }
    return null;
}
export function clearAttribution() {
    if (typeof document === 'undefined') return;
    document.cookie = "imi_attribution=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}
