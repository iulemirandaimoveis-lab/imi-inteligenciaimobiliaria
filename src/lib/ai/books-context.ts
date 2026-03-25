import fs from 'fs'
import path from 'path'

interface BookIndex {
    slug: string
    title: string
    subtitle?: string
    category?: string
    chapter_titles?: string[]
}

export async function getRelevantBookContext(topic: string, maxChapters = 3): Promise<string> {
    try {
        const indexPath = path.join(process.cwd(), 'public/books/index.json')
        if (!fs.existsSync(indexPath)) return ''

        const index: BookIndex[] = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
        const topicLower = topic.toLowerCase()

        // Find relevant books by matching topic against title, subtitle, and chapter titles
        const scored = index.map(book => {
            let score = 0
            if (book.title?.toLowerCase().includes(topicLower)) score += 3
            if (book.subtitle?.toLowerCase().includes(topicLower)) score += 2
            if (book.category?.toLowerCase().includes(topicLower)) score += 1
            const chapterMatches = book.chapter_titles?.filter(ch =>
                ch.toLowerCase().includes(topicLower)
            ).length || 0
            score += chapterMatches
            return { ...book, score }
        }).filter(b => b.score > 0).sort((a, b) => b.score - a.score).slice(0, 2)

        if (scored.length === 0) {
            // Fallback: use first 2 books as general context
            scored.push(...index.slice(0, 2).map(b => ({ ...b, score: 0 })))
        }

        let context = ''
        for (const book of scored) {
            const bookPath = path.join(process.cwd(), 'public/books', `${book.slug}.json`)
            try {
                if (!fs.existsSync(bookPath)) continue
                const bookData = JSON.parse(fs.readFileSync(bookPath, 'utf-8'))
                const chapters = (bookData.capitulos || bookData.chapters || []).slice(0, maxChapters)
                context += `\n\n--- Livro: ${book.title} ---\n`
                for (const ch of chapters) {
                    const title = ch.titulo || ch.title || 'Sem título'
                    const content = ch.conteudo || ch.content || ''
                    context += `\n## ${title}\n${content.substring(0, 1500)}\n`
                }
            } catch { /* skip unreadable books */ }
        }
        return context
    } catch {
        return ''
    }
}

export async function getBookTitles(): Promise<Array<{ slug: string; title: string; category?: string }>> {
    try {
        const indexPath = path.join(process.cwd(), 'public/books/index.json')
        if (!fs.existsSync(indexPath)) return []
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
        return index.map((b: BookIndex) => ({ slug: b.slug, title: b.title, category: b.category }))
    } catch {
        return []
    }
}
