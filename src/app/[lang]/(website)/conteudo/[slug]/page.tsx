
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLatestPosts, getPostBySlug } from '@/lib/website-data';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

interface Props {
    params: {
        lang: string;
        slug: string;
    };
}

export const revalidate = 3600;

export async function generateMetadata({ params: { slug } }: Props): Promise<Metadata> {
    const post = await getPostBySlug(slug);
    if (!post) {
        return {
            title: 'Post não encontrado',
        };
    }

    return {
        title: `${post.title} | IMI Inteligência Imobiliária`,
        description: post.excerpt,
        openGraph: {
            images: [post.coverImage],
        },
    };
}

export async function generateStaticParams() {
    // Gerar params para os posts mais recentes
    const posts = await getLatestPosts(20);
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export default async function BlogPostPage({ params: { lang, slug } }: Props) {
    const post = await getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const locale = lang === 'pt' ? ptBR : enUS;
    const formattedDate = format(new Date(post.publishedAt), "d 'de' MMMM, yyyy", { locale });

    return (
        <article className="bg-white min-h-screen">
            {/* Header / Hero */}
            <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
                <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 lg:p-24 text-white">
                    <div className="container-custom">
                        <div className="max-w-4xl">
                            {post.category && (
                                <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest text-white uppercase bg-accent-600 rounded-sm">
                                    {post.category}
                                </span>
                            )}
                            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                                {post.title}
                            </h1>
                            <div className="flex items-center gap-4 text-sm md:text-base text-gray-200">
                                <span>{formattedDate}</span>
                                <span>•</span>
                                <span>{post.author}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container-custom py-16 md:py-24">
                <div className="max-w-3xl mx-auto">
                    <div className="prose prose-lg prose-slate prose-headings:font-display prose-headings:font-bold prose-headings:text-imi-900 prose-p:text-imi-700 prose-a:text-accent-600 hover:prose-a:text-accent-700 prose-img:rounded-xl prose-img:shadow-lg">
                        {/* Sanitize content: strip all script/event handler tags for XSS prevention */}
                        <div dangerouslySetInnerHTML={{
                            __html: post.content
                                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                                .replace(/on\w+="[^"]*"/gi, '')
                                .replace(/on\w+='[^']*'/gi, '')
                                .replace(/javascript:/gi, '')
                                .replace(/\n/g, '<br/>')
                        }} />
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="mt-16 pt-8 border-t border-gray-100">
                            <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Tópicos Relacionados</h4>
                            <div className="flex flex-wrap gap-2">
                                {post.tags.map((tag) => (
                                    <span key={tag} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-sm hover:bg-gray-100 transition-colors cursor-pointer">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}
