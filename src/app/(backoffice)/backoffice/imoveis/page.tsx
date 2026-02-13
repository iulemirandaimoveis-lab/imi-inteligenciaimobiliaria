'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/backoffice/PageHeader';
import DevelopmentFilters from '@/components/backoffice/imoveis/DevelopmentFilters';
import DevelopmentList from '@/components/backoffice/imoveis/DevelopmentList';
import PropertyKPIs from '@/components/backoffice/imoveis/PropertyKPIs';
import BulkActions from '@/components/backoffice/imoveis/BulkActions';
import { useDevelopments, deleteDevelopment } from '@/hooks/use-developments';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import { Plus } from 'lucide-react';

export default function ImoveisPage() {
    const router = useRouter();
    const [filters, setFilters] = useState<any>({});
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const { developments, isLoading, mutate, total } = useDevelopments(filters);

    function handleNew() {
        router.push('/backoffice/imoveis/novo');
    }

    function handleEdit(id: string) {
        router.push(`/backoffice/imoveis/${id}`);
    }

    async function handleDelete(id: string) {
        if (!confirm('Tem certeza que deseja excluir permanentemente este empreendimento?')) return;

        try {
            await deleteDevelopment(id);
            toast.success('Empreendimento excluído com sucesso');
            mutate();
        } catch (err: any) {
            toast.error(err.message || 'Erro ao excluir');
        }
    }

    function handleSelect(id: string) {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    }

    function handleSelectAll() {
        if (developments) {
            setSelectedIds(developments.map(d => d.id));
        }
    }

    function handleClearSelection() {
        setSelectedIds([]);
    }

    return (
        <div className="animate-fade-in space-y-8 pb-40">
            <PageHeader
                title="Gestão de Imóveis"
                description="Controle estratégico de empreendimentos e unidades."
                breadcrumbs={[
                    { label: 'Imóveis' }
                ]}
                action={<Button onClick={handleNew} icon={<Plus size={18} />}>Novo Imóvel</Button>}
            />

            {/* KPIs */}
            <PropertyKPIs />

            {/* Filters & Bulk Actions */}
            <div className="sticky top-20 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md py-4 -mx-4 px-4 space-y-4 rounded-b-2xl shadow-soft">
                <DevelopmentFilters
                    onFilterChange={setFilters}
                    onNew={handleNew}
                />

                {selectedIds.length > 0 && (
                    <BulkActions
                        selectedIds={selectedIds}
                        onSelectAll={handleSelectAll}
                        onClearSelection={handleClearSelection}
                        totalCount={total}
                        onActionComplete={() => {
                            mutate();
                            handleClearSelection();
                        }}
                    />
                )}
            </div>

            {/* List */}
            <DevelopmentList
                developments={developments}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onNew={handleNew}
                selectedIds={selectedIds}
                onSelect={handleSelect}
            />
        </div>
    );
}
