'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency as formatBRL } from '@/lib/utils';
import { MessageCircle, Info, Loader2, Filter, ChevronDown, ChevronUp, BookmarkPlus } from 'lucide-react';
import LeadCaptureModal from './LeadCaptureModal';

const GOLD = '#C8A44A';
const NAVY = '#0B1928';

interface DevelopmentUnitsProps {
    propertyId: string;
    propertyName: string;
}

type UnitStatus = 'available' | 'reserved' | 'sold';

interface Unit {
    id: string;
    unit_name: string;
    unit_type: string;
    area: number | null;
    price: number | null;
    status: UnitStatus | null;
    floor?: number | null;
    tower?: string | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    parking?: number | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    available: { label: 'Disponível', color: '#065F46', bg: '#ECFDF5', dot: '#10B981' },
    reserved: { label: 'Reservado', color: '#92400E', bg: '#FFFBEB', dot: '#F59E0B' },
    sold: { label: 'Vendido', color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' },
};

const TYPE_LABELS: Record<string, string> = {
    studio: 'Studio',
    apartment: 'Apto',
    apartamento: 'Apto',
    loft: 'Loft',
    sala: 'Sala',
    loja: 'Loja',
    cobertura: 'Cobertura',
    duplex: 'Duplex',
    penthouse: 'Penthouse',
};

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
    studio:     { bg: 'rgba(0,197,181,0.08)',  color: '#0A7B73', border: 'rgba(0,197,181,0.25)' },
    apartment:  { bg: 'rgba(11,25,40,0.06)',   color: '#0B1928', border: 'rgba(11,25,40,0.15)' },
    apartamento:{ bg: 'rgba(11,25,40,0.06)',   color: '#0B1928', border: 'rgba(11,25,40,0.15)' },
    loft:       { bg: 'rgba(200,164,74,0.08)', color: '#8B6914', border: 'rgba(200,164,74,0.25)' },
    sala:       { bg: 'rgba(99,102,241,0.08)', color: '#4338CA', border: 'rgba(99,102,241,0.2)' },
    loja:       { bg: 'rgba(239,68,68,0.06)',  color: '#B91C1C', border: 'rgba(239,68,68,0.15)' },
    cobertura:  { bg: 'rgba(200,164,74,0.12)', color: '#78590F', border: 'rgba(200,164,74,0.3)' },
};

function normalizeType(raw: string): string {
    return (raw || '').toLowerCase().trim();
}

function getTypeLabel(raw: string): string {
    const key = normalizeType(raw);
    return TYPE_LABELS[key] || raw;
}

function getTypeStyle(raw: string) {
    const key = normalizeType(raw);
    return TYPE_COLORS[key] || { bg: 'rgba(11,25,40,0.05)', color: '#374151', border: 'rgba(11,25,40,0.12)' };
}

export default function DevelopmentUnits({ propertyId, propertyName }: DevelopmentUnitsProps) {
    const [units, setUnits] = useState<Unit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedTower, setSelectedTower] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('available');
    const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [reserveModal, setReserveModal] = useState<Unit | null>(null);

    useEffect(() => {
        const supabase = createClient();
        async function fetchUnits() {
            const { data, error } = await supabase
                .from('development_units')
                .select('*')
                .eq('development_id', propertyId)
                .order('unit_name', { ascending: true });

            if (!error && data) setUnits(data as Unit[]);
            setIsLoading(false);
        }
        fetchUnits();
    }, [propertyId]);

    // Derived filter options
    const types = useMemo(() => {
        const set = new Set(units.map(u => normalizeType(u.unit_type)).filter(Boolean));
        return Array.from(set).sort();
    }, [units]);

    const towers = useMemo(() => {
        const set = new Set(units.map(u => u.tower || '').filter(Boolean));
        return Array.from(set).sort();
    }, [units]);

    const hasTowers = towers.length > 1;

    const filtered = useMemo(() => {
        return units.filter(u => {
            if (selectedStatus !== 'all' && (u.status || 'available') !== selectedStatus) return false;
            if (selectedType !== 'all' && normalizeType(u.unit_type) !== selectedType) return false;
            if (selectedTower !== 'all' && (u.tower || '') !== selectedTower) return false;
            return true;
        });
    }, [units, selectedStatus, selectedType, selectedTower]);

    const displayed = showAll ? filtered : filtered.slice(0, 10);

    // Summary stats
    const stats = useMemo(() => {
        const avail = units.filter(u => !u.status || u.status === 'available');
        const reserved = units.filter(u => u.status === 'reserved');
        const sold = units.filter(u => u.status === 'sold');
        const prices = avail.map(u => u.price).filter(Boolean) as number[];
        return {
            available: avail.length,
            reserved: reserved.length,
            sold: sold.length,
            total: units.length,
            minPrice: prices.length ? Math.min(...prices) : 0,
            maxPrice: prices.length ? Math.max(...prices) : 0,
        };
    }, [units]);

    const handleWhatsApp = (unit: Unit, intent: 'consultar' | 'reservar') => {
        const action = intent === 'reservar' ? 'reservar' : 'obter informações sobre';
        const message = encodeURIComponent(
            `Olá! Gostaria de ${action} a unidade ${unit.unit_name}${unit.tower ? ` (Torre ${unit.tower})` : ''} do ${propertyName}. ${unit.price ? `Valor: ${formatBRL(unit.price)}.` : ''} Podemos conversar?`
        );
        window.open(`https://wa.me/5581997230455?text=${message}`, '_blank');
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', background: '#F8F6F2', borderRadius: 16, border: '1px dashed rgba(184,179,168,0.5)' }}>
                <Loader2 style={{ width: 24, height: 24, color: '#B8B3A8', animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                <p style={{ color: '#B8B3A8', fontWeight: 700, fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                    Carregando unidades...
                </p>
            </div>
        );
    }

    if (units.length === 0) return null;

    return (
        <>
        <div>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 4, height: 24, borderRadius: 2, background: GOLD }} />
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: NAVY, fontFamily: "var(--fu, 'Outfit', sans-serif)", margin: 0 }}>
                        Disponibilidade
                    </h2>
                </div>
                <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 20px', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                    Unidades disponíveis para investimento — tabela atualizada
                </p>

                {/* Summary stats strip */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <StatPill
                        value={stats.available}
                        label="Disponíveis"
                        color="#065F46"
                        bg="#ECFDF5"
                        dot="#10B981"
                        active={selectedStatus === 'available'}
                        onClick={() => setSelectedStatus(selectedStatus === 'available' ? 'all' : 'available')}
                    />
                    {stats.reserved > 0 && (
                        <StatPill
                            value={stats.reserved}
                            label="Reservadas"
                            color="#92400E"
                            bg="#FFFBEB"
                            dot="#F59E0B"
                            active={selectedStatus === 'reserved'}
                            onClick={() => setSelectedStatus(selectedStatus === 'reserved' ? 'all' : 'reserved')}
                        />
                    )}
                    {stats.sold > 0 && (
                        <StatPill
                            value={stats.sold}
                            label="Vendidas"
                            color="#6B7280"
                            bg="#F3F4F6"
                            dot="#9CA3AF"
                            active={selectedStatus === 'sold'}
                            onClick={() => setSelectedStatus(selectedStatus === 'sold' ? 'all' : 'sold')}
                        />
                    )}
                    {stats.minPrice > 0 && (
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(200,164,74,0.06)', border: '1px solid rgba(200,164,74,0.2)' }}>
                            <span style={{ fontSize: 11, color: '#8B6914', fontWeight: 600, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                                {formatBRL(stats.minPrice)} – {formatBRL(stats.maxPrice)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters row */}
            <div style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Tower tabs */}
                {hasTowers && (
                    <div style={{ display: 'flex', gap: 4, padding: '3px', background: '#F3F4F6', borderRadius: 10 }}>
                        <FilterTab label="Todas" active={selectedTower === 'all'} onClick={() => setSelectedTower('all')} />
                        {towers.map((t: string) => (
                            <FilterTab key={t} label={`Torre ${t}`} active={selectedTower === t} onClick={() => setSelectedTower(t)} />
                        ))}
                    </div>
                )}

                {/* Type tabs */}
                {types.length > 1 && (
                    <div style={{ display: 'flex', gap: 4, padding: '3px', background: '#F3F4F6', borderRadius: 10 }}>
                        <FilterTab label="Todas" active={selectedType === 'all'} onClick={() => setSelectedType('all')} />
                        {types.map((t: string) => (
                            <FilterTab key={t} label={getTypeLabel(t)} active={selectedType === t} onClick={() => setSelectedType(t)} />
                        ))}
                    </div>
                )}

                {/* Filter toggle on mobile */}
                <button
                    onClick={() => setShowFilters((v: boolean) => !v)}
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', borderRadius: 8, background: showFilters ? NAVY : '#FFFFFF', color: showFilters ? '#FFFFFF' : '#6B7280', border: `1px solid ${showFilters ? NAVY : 'rgba(184,179,168,0.4)'}`, fontSize: 11, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.5px', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                >
                    <Filter style={{ width: 13, height: 13 }} />
                    Filtros
                </button>
            </div>

            {/* Additional filters panel */}
            {showFilters && (
                <div style={{ marginBottom: 16, padding: '16px', background: '#F8F6F2', borderRadius: 12, border: '1px solid rgba(184,179,168,0.3)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#948F84', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Status</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {(['all', 'available', 'reserved', 'sold'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setSelectedStatus(s)}
                                style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "var(--fu, 'Outfit', sans-serif)", background: selectedStatus === s ? NAVY : '#FFFFFF', color: selectedStatus === s ? '#FFFFFF' : '#6B7280', border: `1px solid ${selectedStatus === s ? NAVY : 'rgba(184,179,168,0.4)'}` }}
                            >
                                {s === 'all' ? 'Todos' : STATUS_CONFIG[s].label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Info style={{ width: 13, height: 13, color: '#948F84' }} />
                <span style={{ fontSize: 12, color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                    {filtered.length} {filtered.length === 1 ? 'unidade' : 'unidades'} encontradas
                    {selectedStatus !== 'all' || selectedType !== 'all' || selectedTower !== 'all' ? ' (filtradas)' : ''}
                </span>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block" style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(184,179,168,0.25)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#F8F6F2', borderBottom: '1px solid rgba(184,179,168,0.3)' }}>
                            <Th>Unidade</Th>
                            {hasTowers && <Th>Torre</Th>}
                            <Th>Tipologia</Th>
                            <Th>Área</Th>
                            <Th align="right">Valor Total</Th>
                            <Th align="center">Status</Th>
                            <Th align="center">Ações</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayed.map((unit, idx) => {
                            const statusCfg = STATUS_CONFIG[unit.status || 'available'] || STATUS_CONFIG.available;
                            const typeStyle = getTypeStyle(unit.unit_type);
                            const isExpanded = expandedUnit === unit.id;
                            const isUnavailable = unit.status === 'sold';

                            return (
                                <>
                                <tr
                                    key={unit.id}
                                    onClick={() => !isUnavailable && setExpandedUnit(isExpanded ? null : unit.id)}
                                    style={{
                                        borderBottom: '1px solid rgba(184,179,168,0.15)',
                                        background: isExpanded ? 'rgba(200,164,74,0.03)' : idx % 2 === 0 ? '#FFFFFF' : '#FAFAF9',
                                        opacity: isUnavailable ? 0.55 : 1,
                                        cursor: isUnavailable ? 'default' : 'pointer',
                                        transition: 'background 0.15s',
                                    }}
                                >
                                    <Td>
                                        <span style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>
                                            {unit.unit_name}
                                        </span>
                                    </Td>
                                    {hasTowers && (
                                        <Td>
                                            {unit.tower && (
                                                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(11,25,40,0.06)', color: NAVY, letterSpacing: '0.5px' }}>
                                                    {unit.tower}
                                                </span>
                                            )}
                                        </Td>
                                    )}
                                    <Td>
                                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.border}`, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                                            {getTypeLabel(unit.unit_type)}
                                        </span>
                                    </Td>
                                    <Td>
                                        <span style={{ fontSize: 14, color: '#374151' }}>
                                            {unit.area ? `${unit.area}m²` : '—'}
                                        </span>
                                    </Td>
                                    <Td align="right">
                                        <span style={{ fontWeight: 700, color: NAVY, fontSize: 15, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                                            {unit.price ? formatBRL(unit.price) : 'Consulte'}
                                        </span>
                                    </Td>
                                    <Td align="center">
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: statusCfg.bg, fontSize: 10, fontWeight: 700, color: statusCfg.color, letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusCfg.dot, flexShrink: 0 }} />
                                            {statusCfg.label}
                                        </span>
                                    </Td>
                                    <Td align="center">
                                        {!isUnavailable && (
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                                <button
                                                    onClick={e => { e.stopPropagation(); setReserveModal(unit); }}
                                                    style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 5, height: 36, padding: '0 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: GOLD, color: '#FFFFFF', border: 'none', cursor: 'pointer', letterSpacing: '0.5px', whiteSpace: 'nowrap', fontFamily: "var(--fu, 'Outfit', sans-serif)", overflow: 'hidden' }}
                                                >
                                                    <BookmarkPlus style={{ width: 12, height: 12 }} />
                                                    Reservar
                                                </button>
                                                <button
                                                    onClick={e => { e.stopPropagation(); handleWhatsApp(unit, 'consultar'); }}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 36, padding: '0 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: NAVY, color: '#FFFFFF', border: 'none', cursor: 'pointer', letterSpacing: '0.5px', whiteSpace: 'nowrap', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                                                >
                                                    <MessageCircle style={{ width: 12, height: 12 }} />
                                                    Consultar
                                                </button>
                                            </div>
                                        )}
                                    </Td>
                                </tr>
                                {isExpanded && (
                                    <tr key={`${unit.id}-expand`} style={{ background: 'rgba(200,164,74,0.02)', borderBottom: '1px solid rgba(184,179,168,0.15)' }}>
                                        <td colSpan={hasTowers ? 7 : 6} style={{ padding: '12px 16px 16px' }}>
                                            <ExpandedUnitDetail unit={unit} onConsult={() => handleWhatsApp(unit, 'consultar')} onReserve={() => setReserveModal(unit)} />
                                        </td>
                                    </tr>
                                )}
                                </>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {displayed.map(unit => {
                    const statusCfg = STATUS_CONFIG[unit.status || 'available'] || STATUS_CONFIG.available;
                    const typeStyle = getTypeStyle(unit.unit_type);
                    const isUnavailable = unit.status === 'sold';

                    return (
                        <div key={unit.id} style={{ background: '#FFFFFF', border: '1px solid rgba(184,179,168,0.25)', borderRadius: 14, padding: 16, opacity: isUnavailable ? 0.6 : 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontWeight: 700, color: NAVY, fontSize: 16 }}>Unidade {unit.unit_name}</span>
                                        {unit.tower && (
                                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: 'rgba(11,25,40,0.06)', color: NAVY }}>
                                                Torre {unit.tower}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.border}` }}>
                                            {getTypeLabel(unit.unit_type)}
                                        </span>
                                        {unit.area && (
                                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: '#F3F4F6', color: '#6B7280' }}>
                                                {unit.area}m²
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: statusCfg.bg, fontSize: 9, fontWeight: 700, color: statusCfg.color, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusCfg.dot }} />
                                    {statusCfg.label}
                                </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontSize: 11, color: '#948F84', margin: '0 0 2px', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Valor total</p>
                                    <p style={{ fontSize: 20, fontWeight: 700, color: NAVY, fontFamily: "var(--fm, 'JetBrains Mono', monospace)", margin: 0 }}>
                                        {unit.price ? formatBRL(unit.price) : 'Consulte'}
                                    </p>
                                </div>
                                {!isUnavailable && (
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                            onClick={() => setReserveModal(unit)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 5, height: 40, padding: '0 14px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: GOLD, color: '#FFFFFF', border: 'none', cursor: 'pointer', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                                        >
                                            <BookmarkPlus style={{ width: 12, height: 12 }} />
                                            Reservar
                                        </button>
                                        <button
                                            onClick={() => handleWhatsApp(unit, 'consultar')}
                                            style={{ height: 40, padding: '0 14px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: NAVY, color: '#FFFFFF', border: 'none', cursor: 'pointer', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                                        >
                                            <MessageCircle style={{ width: 14, height: 14 }} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Show more */}
            {filtered.length > 10 && (
                <div style={{ marginTop: 20, textAlign: 'center' }}>
                    <button
                        onClick={() => setShowAll(v => !v)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 28px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: '#FFFFFF', color: NAVY, border: `1.5px solid rgba(11,25,40,0.2)`, cursor: 'pointer', letterSpacing: '0.5px', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                    >
                        {showAll
                            ? <><ChevronUp style={{ width: 14, height: 14 }} /> Ver menos</>
                            : <><ChevronDown style={{ width: 14, height: 14 }} /> Ver todas as {filtered.length} unidades</>
                        }
                    </button>
                </div>
            )}

            {/* Disclaimer */}
            <p style={{ fontSize: 11, color: '#B8B3A8', marginTop: 16, textAlign: 'center', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                Disponibilidade sujeita a alteração. Preços corrigidos pelo INCC-FGV.
            </p>
        </div>

        {/* Reserve Modal */}
        {reserveModal && (
            <LeadCaptureModal
                propertyName={`${propertyName} — Unidade ${reserveModal.unit_name}`}
                propertyId={propertyId}
                title="Reservar Unidade"
                description={`Preencha seus dados para reservar a unidade ${reserveModal.unit_name}${reserveModal.tower ? ` (Torre ${reserveModal.tower})` : ''}${reserveModal.price ? ` — ${formatBRL(reserveModal.price)}` : ''}. Nossa equipe confirmará a disponibilidade em até 2 horas.`}
                customInterest={`Reserva — Unidade ${reserveModal.unit_name}${reserveModal.tower ? ` Torre ${reserveModal.tower}` : ''} — ${propertyName}`}
                onClose={() => setReserveModal(null)}
                onSuccess={() => {
                    const msg = encodeURIComponent(`Olá! Quero reservar a unidade ${reserveModal.unit_name}${reserveModal.tower ? ` da Torre ${reserveModal.tower}` : ''} do ${propertyName}.${reserveModal.price ? ` Valor: ${formatBRL(reserveModal.price)}.` : ''}`);
                    window.open(`https://wa.me/5581997230455?text=${msg}`, '_blank');
                    setReserveModal(null);
                }}
            />
        )}
        </>
    );
}

// --- Sub-components ---

function StatPill({ value, label, color, bg, dot, active, onClick }: {
    value: number; label: string; color: string; bg: string; dot: string; active: boolean; onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20,
                background: active ? bg : '#F9F8F6',
                border: `1.5px solid ${active ? dot : 'rgba(184,179,168,0.3)'}`,
                cursor: 'pointer', transition: 'all 0.15s', fontFamily: "var(--fu, 'Outfit', sans-serif)",
            }}
        >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: active ? color : '#6B7280' }}>{value}</span>
            <span style={{ fontSize: 11, color: active ? color : '#9CA3AF', fontWeight: 500 }}>{label}</span>
        </button>
    );
}

function FilterTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                background: active ? NAVY : 'transparent',
                color: active ? '#FFFFFF' : '#6B7280',
                border: 'none', transition: 'all 0.15s',
                fontFamily: "var(--fu, 'Outfit', sans-serif)",
                letterSpacing: '0.3px',
            }}
        >
            {label}
        </button>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Th({ children, align = 'left' }: { children: any; align?: 'left' | 'right' | 'center' }) {
    return (
        <th style={{ padding: '12px 16px', textAlign: align, fontWeight: 700, color: '#948F84', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: "var(--fu, 'Outfit', sans-serif)", whiteSpace: 'nowrap' }}>
            {children}
        </th>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Td({ children, align = 'left' }: { children: any; align?: 'left' | 'right' | 'center' }) {
    return (
        <td style={{ padding: '12px 16px', textAlign: align, verticalAlign: 'middle' }}>
            {children}
        </td>
    );
}

function ExpandedUnitDetail({ unit, onConsult, onReserve }: { unit: Unit; onConsult: () => void; onReserve: () => void }) {
    const details = [
        unit.bedrooms != null && { label: 'Quartos', value: `${unit.bedrooms}` },
        unit.bathrooms != null && { label: 'Banheiros', value: `${unit.bathrooms}` },
        unit.parking != null && { label: 'Vagas', value: `${unit.parking}` },
        unit.floor != null && { label: 'Andar', value: `${unit.floor}º` },
    ].filter(Boolean) as { label: string; value: string }[];

    return (
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            {details.length > 0 && (
                <div style={{ display: 'flex', gap: 12 }}>
                    {details.map(d => (
                        <div key={d.label} style={{ textAlign: 'center', padding: '8px 12px', background: '#F8F6F2', borderRadius: 8, border: '1px solid rgba(184,179,168,0.25)' }}>
                            <p style={{ fontSize: 16, fontWeight: 700, color: NAVY, fontFamily: "var(--fm, 'JetBrains Mono', monospace)", margin: '0 0 2px' }}>{d.value}</p>
                            <p style={{ fontSize: 9, color: '#948F84', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', margin: 0, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>{d.label}</p>
                        </div>
                    ))}
                </div>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button
                    onClick={onReserve}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, height: 36, padding: '0 16px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: GOLD, color: '#FFFFFF', border: 'none', cursor: 'pointer', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                >
                    Reservar esta unidade
                </button>
                <button
                    onClick={onConsult}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, height: 36, padding: '0 16px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'transparent', color: '#374151', border: '1px solid rgba(184,179,168,0.4)', cursor: 'pointer', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                >
                    Falar no WhatsApp
                </button>
            </div>
        </div>
    );
}
