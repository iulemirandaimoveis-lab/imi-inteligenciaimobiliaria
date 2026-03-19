import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getAllFiles(dir, exts) {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
            results = results.concat(getAllFiles(fullPath, exts));
        } else if (exts.some(ext => entry.name.endsWith(ext)) && !entry.name.includes('.test.')) {
            results.push(fullPath);
        }
    }
    return results;
}

function fixFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf-8');
    const original = content;

    // 1. useState<any[]>([]) -> useState<Record<string, unknown>[]>([])
    content = content.replace(/useState<any\[\]>\(\[\]\)/g, 'useState<Record<string, unknown>[]>([])');

    // 2. useState<any>(null) -> useState<Record<string, unknown> | null>(null)
    content = content.replace(/useState<any>\(null\)/g, 'useState<Record<string, unknown> | null>(null)');

    // 3. icon: any -> icon: React.ElementType
    content = content.replace(/\bicon: any\b/g, 'icon: React.ElementType');
    content = content.replace(/\bIcon: any\b/g, 'Icon: React.ElementType');
    content = content.replace(/\btriggerIcon: any\b/g, 'triggerIcon: React.ElementType');
    content = content.replace(/\bactionIcon: any\b/g, 'actionIcon: React.ElementType');

    // 4. (x: any) => in .map/.filter/.reduce/.find callbacks
    content = content.replace(/\((\w): any\) =>/g, '($1: Record<string, unknown>) =>');
    content = content.replace(/\((\w): any, (\w): number\) =>/g, '($1: Record<string, unknown>, $2: number) =>');

    // 5. (form as any)[...] -> (form as Record<string, unknown>)[...]
    content = content.replace(/\((\w+) as any\)\[/g, '($1 as Record<string, unknown>)[');

    // 6. (data as any).xxx -> (data as Record<string, unknown>).xxx
    content = content.replace(/\((\w+) as any\)\./g, '($1 as Record<string, unknown>).');

    // 7. as any) -> as string) for things like setActiveTab(x as any)
    content = content.replace(/as any\)/g, 'as string)');

    // 8. Record<string, any[]> -> Record<string, Record<string, unknown>[]>
    content = content.replace(/Record<string, any\[\]>/g, 'Record<string, Record<string, unknown>[]>');

    // 9. : any[] -> : Record<string, unknown>[] for simple type annotations
    // Be careful: only replace after specific patterns like setState<, not function params
    content = content.replace(/useState<any\[\]>/g, 'useState<Record<string, unknown>[]>');

    // 10. value: any in handleChange functions
    content = content.replace(/(handleChange|handleInputChange) = \(field: keyof \w+, value: any\)/g,
        '$1 = (field: keyof FormData, value: string | number | boolean | null)');

    // 11. onSubmit: (data: any) -> onSubmit: (data: Record<string, unknown>)
    content = content.replace(/onSubmit: \(data: any\)/g, 'onSubmit: (data: Record<string, unknown>)');

    // 12. const updates: any = -> const updates: Record<string, unknown> =
    content = content.replace(/const updates: any =/g, 'const updates: Record<string, unknown> =');

    // 13. const payload: any = -> const payload: Record<string, unknown> =
    content = content.replace(/const payload: any =/g, 'const payload: Record<string, unknown> =');

    // 14. .then((d: any) -> .then((d: Record<string, unknown>)
    content = content.replace(/\.then\(\((\w+): any\)/g, '.then(($1: Record<string, unknown>)');

    // 15. const [formData, setFormData] = useState<any>({})
    content = content.replace(/useState<any>\(\{/g, 'useState<Record<string, unknown>>({');

    // 16. FormData, value: any) -> FormData, value: string | number | boolean | null)
    content = content.replace(/value: any\)/g, 'value: string | number | boolean | null)');

    // 17. { data, onChange, onSave, onCancel }: any) -> with proper props type
    content = content.replace(
        /function UnitRowForm\(\{ data, onChange, onSave, onCancel \}: any\)/g,
        'function UnitRowForm({ data, onChange, onSave, onCancel }: { data: Record<string, unknown>; onChange: (field: string, value: string | number | boolean | null) => void; onSave: () => void; onCancel: () => void })'
    );

    // 18. property: any in component props
    content = content.replace(/property: any\b/g, 'property: Record<string, unknown>');

    // 19. lead: any in function params (not catch)
    content = content.replace(/\blead: any\b/g, 'lead: Record<string, unknown>');

    // 20. new_data: any / old_data: any
    content = content.replace(/new_data: any\b/g, 'new_data: Record<string, unknown>');
    content = content.replace(/old_data: any\b/g, 'old_data: Record<string, unknown>');

    // 21. ButtonLoading props: any -> proper type
    content = content.replace(
        /export function ButtonLoading\(\{ children, loading, \.\.\.props \}: any\)/g,
        'export function ButtonLoading({ children, loading, ...props }: { children: React.ReactNode; loading?: boolean; [key: string]: unknown })'
    );

    // 22. CustomTooltip = ({ active, payload, label }: any)
    content = content.replace(
        /CustomTooltip = \(\{ active, payload, label \}: any\)/g,
        'CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<Record<string, unknown>>; label?: string })'
    );

    // 23. renderCustomizedLabel = ({ cx, cy, midAngle, ...}: any)
    content = content.replace(
        /renderCustomizedLabel = \(\{ cx, cy, midAngle, innerRadius, outerRadius, percent, index \}: any\)/g,
        'renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number; index: number })'
    );

    // 24. resolver: zodResolver(xxx) as any -> as unknown as Resolver<FormData>
    content = content.replace(
        /resolver: zodResolver\((\w+)\) as any/g,
        'resolver: zodResolver($1) as unknown as Parameters<typeof useForm>[0][\'resolver\']'
    );

    // 25. component={X as any} in Remotion
    content = content.replace(/component=\{(\w+) as any\}/g, 'component={$1 as React.ComponentType<Record<string, unknown>>}');

    // 26. id: any in interface -> id: string
    // Only for specific case in leads/page.tsx
    content = content.replace(/^\s+id: any$/m, '  id: string');

    // 27. (configs as any)[type]
    // Already covered by pattern 6

    // 28. formatter={(v: any, -> formatter={(v: string | number,
    content = content.replace(/\(v: any, name\?: string\)/g, '(v: string | number, name?: string)');

    // 29. startEditing = (unit: any) -> startEditing = (unit: Record<string, unknown>)
    content = content.replace(/startEditing = \(unit: any\)/g, 'startEditing = (unit: Record<string, unknown>)');

    // 30. {units.map((unit: any) -> {units.map((unit: Record<string, unknown>)
    content = content.replace(/\(unit: any\) =>/g, '(unit: Record<string, unknown>) =>');
    content = content.replace(/\(event: any, index: number\)/g, '(event: Record<string, unknown>, index: number)');
    content = content.replace(/\(event: any\)/g, '(event: Record<string, unknown>)');

    // 31. developments: any[], leads: any[], metrics: any
    content = content.replace(/developments: any\[\]/g, 'developments: Record<string, unknown>[]');
    content = content.replace(/leads: any\[\]/g, 'leads: Record<string, unknown>[]');
    content = content.replace(/metrics: any\b(?!\[)/g, 'metrics: Record<string, unknown>');
    content = content.replace(/recentLeads: any\[\]/g, 'recentLeads: Record<string, unknown>[]');
    content = content.replace(/recentAvaliacoes: any\[\]/g, 'recentAvaliacoes: Record<string, unknown>[]');

    // 32. summary: any -> summary: Record<string, unknown>
    content = content.replace(/useState<any>\(null\)/g, 'useState<Record<string, unknown> | null>(null)');

    // 33. Fix err.message / error.message access on unknown types
    // Replace patterns like: setError(err.message) after catch (err: unknown)
    content = content.replace(/setError\(err\.message\)/g, 'setError(err instanceof Error ? err.message : \'Erro desconhecido\')');
    content = content.replace(/setError\(error\.message\)/g, 'setError(error instanceof Error ? error.message : \'Erro desconhecido\')');
    content = content.replace(/setError\(e\.message\)/g, 'setError(e instanceof Error ? e.message : \'Erro desconhecido\')');

    // error: err.message / error: error.message
    content = content.replace(/error: err\.message\b/g, 'error: err instanceof Error ? err.message : \'Erro desconhecido\'');
    content = content.replace(/error: error\.message\b/g, 'error: error instanceof Error ? error.message : \'Erro desconhecido\'');
    content = content.replace(/error: e\.message\b/g, 'error: e instanceof Error ? e.message : \'Erro desconhecido\'');

    // alert(err.message) etc
    content = content.replace(/alert\(err\.message\)/g, 'alert(err instanceof Error ? err.message : \'Erro desconhecido\')');
    content = content.replace(/alert\(error\.message\)/g, 'alert(error instanceof Error ? error.message : \'Erro desconhecido\')');
    content = content.replace(/alert\(e\.message\)/g, 'alert(e instanceof Error ? e.message : \'Erro desconhecido\')');

    // console.error('...', err.message)
    content = content.replace(/console\.error\(([^,]+),\s*err\.message\)/g, 'console.error($1, err instanceof Error ? err.message : err)');
    content = content.replace(/console\.error\(([^,]+),\s*error\.message\)/g, 'console.error($1, error instanceof Error ? error.message : error)');

    // toast or setMsg patterns with err.message
    content = content.replace(/\berr\.message\b(?!\s*:)/g, '(err instanceof Error ? err.message : \'Erro desconhecido\')');
    // Avoid double-wrapping patterns we already fixed
    content = content.replace(/\(err instanceof Error \? \(err instanceof Error/g, '(err instanceof Error');

    if (content !== original) {
        fs.writeFileSync(filepath, content, 'utf-8');
        return true;
    }
    return false;
}

const srcDir = path.join(__dirname, 'src');
const files = getAllFiles(srcDir, ['.ts', '.tsx']);
let changed = 0;

for (const f of files) {
    if (fixFile(f)) {
        changed++;
        console.log('Fixed:', path.relative(__dirname, f));
    }
}

console.log(`\nTotal files changed: ${changed}`);
