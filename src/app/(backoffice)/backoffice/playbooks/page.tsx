'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { Book, Plus, Edit, History, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Link from 'next/link';

const supabase = createClient();

export default function PlaybooksPage() {
    const { data: playbooks, isLoading, mutate } = useSWR(['playbooks'], async () => {
        const { data, error } = await supabase
            .from('niche_playbooks')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) throw error;
        return data || [];
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-imi-900 font-display">
                        Playbooks por Nicho
                    </h1>
                    <p className="text-imi-500 mt-1">
                        Templates parametrizáveis que definem linguagem, públicos e estratégias por mercado
                    </p>
                </div>

                <Link href="/backoffice/playbooks/new">
                    <Button className="bg-accent-600 hover:bg-accent-700">
                        <Plus size={16} className="mr-2" />
                        Novo Playbook
                    </Button>
                </Link>
            </div>

            {/* Playbooks Grid */}
            {isLoading ? (
                <div className="text-center py-12">
                    <Loader2 className="animate-spin mx-auto text-imi-400 mb-4" size={40} />
                    <p className="text-imi-500">Carregando playbooks...</p>
                </div>
            ) : playbooks && playbooks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {playbooks.map((playbook, i) => (
                        <motion.div
                            key={playbook.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-2xl p-6 shadow-soft border border-imi-100 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center">
                                    <Book className="text-accent-600" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-imi-900 text-lg">
                                        {playbook.name}
                                    </h3>
                                    <p className="text-sm text-imi-500">{playbook.niche}</p>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-imi-600">Versão:</span>
                                    <span className="font-bold text-imi-900">v{playbook.version}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-imi-600">Públicos:</span>
                                    <span className="font-bold text-imi-900">
                                        {playbook.typical_audiences?.length || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-imi-600">Templates:</span>
                                    <span className="font-bold text-imi-900">
                                        {playbook.campaign_templates?.length || 0}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Link href={`/backoffice/playbooks/${playbook.id}`} className="flex-1">
                                    <Button variant="outline" size="sm" className="w-full">
                                        <Edit size={14} className="mr-2" />
                                        Editar
                                    </Button>
                                </Link>
                                <Link href={`/backoffice/playbooks/${playbook.id}/versions`}>
                                    <Button variant="outline" size="sm">
                                        <History size={14} />
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl p-12 text-center shadow-soft border border-imi-100">
                    <Book className="mx-auto text-imi-300 mb-4" size={64} />
                    <h3 className="text-xl font-bold text-imi-900 mb-2">
                        Nenhum playbook encontrado
                    </h3>
                    <p className="text-imi-600 mb-6">
                        Crie seu primeiro playbook para parametrizar o sistema por nicho
                    </p>
                    <Link href="/backoffice/playbooks/new">
                        <Button className="bg-accent-600 hover:bg-accent-700">
                            <Plus size={16} className="mr-2" />
                            Criar Primeiro Playbook
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
