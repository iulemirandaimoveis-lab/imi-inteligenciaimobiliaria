import { Playfair_Display, Inter } from 'next/font/google';
// DEPLOY_VERSION: v1.6.4 - RESTORE APPROVED STATE
import './globals.css';

const playfair = Playfair_Display({
    subsets: ['latin'],
    weight: ['400', '600', '700'],
    variable: '--font-playfair',
    display: 'swap',
});

const inter = Inter({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-inter',
    display: 'swap',
});

export const metadata = {
    title: 'IMI – Inteligência Imobiliária',
    description: 'Avaliações técnicas NBR 14653, consultoria estratégica e corretagem premium',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR" className={`${playfair.variable} ${inter.variable}`}>
            <body className={`${inter.className} min-h-screen bg-slate-50 relative`}>
                {children}
            </body>
        </html>
    )
}
