'use client';

import { useMemo, useState } from 'react';
import { Calculator, TrendingDown, Wallet } from 'lucide-react';
import type { LotMapEntry, PaymentPlan } from './useLotMap';

const GOLD = '#C8A44A';

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

interface Plan {
  id: string;
  label: string;
  months: number;
  total: number;
  /** parcela oficial da tabela (quando há) */
  officialParcela?: number;
}

/**
 * Parte 2.2 — Simulador financeiro.
 *
 * Modelo real do empreendimento: desconto por prazo (não há juros embutidos).
 * À vista = maior desconto; 120x = preço de tabela. Cada lote traz os totais
 * oficiais por plano no JSON. O cliente pode aumentar a entrada e a parcela é
 * recalculada linearmente: parcela = (total_do_plano − entrada) / meses.
 */
export default function LotFinancingSimulator({ lot }: { lot: LotMapEntry }) {
  const plans = useMemo<Plan[]>(() => {
    const out: Plan[] = [];
    if (lot.valorVista) out.push({ id: 'vista', label: 'À vista', months: 0, total: lot.valorVista });
    const add = (id: string, months: number, p?: PaymentPlan) => {
      if (p?.total) out.push({ id, label: `${months}x`, months, total: p.total, officialParcela: p.parcela });
    };
    add('p12', 12, lot.p12);
    add('p36', 36, lot.p36);
    add('p60', 60, lot.p60);
    add('p120', 120, lot.p120);
    return out;
  }, [lot]);

  const tablePrice = lot.valor ?? lot.price ?? 0;
  const defaultEntrada = lot.entrada ?? Math.round(tablePrice * 0.1);

  const [planId, setPlanId] = useState<string>(plans.find(p => p.months > 0)?.id ?? plans[0]?.id ?? 'vista');
  const [entrada, setEntrada] = useState<number>(defaultEntrada);

  const plan = plans.find(p => p.id === planId) ?? plans[0];

  if (!plan) {
    return (
      <div className="p-4 text-sm text-gray-500 bg-gray-50 rounded-xl">
        Simulação indisponível para este lote. Fale com um especialista.
      </div>
    );
  }

  const isCash = plan.months === 0;
  const maxEntrada = Math.round(plan.total * 0.6);
  const minEntrada = isCash ? 0 : Math.round(plan.total * 0.05);
  const clampedEntrada = isCash ? plan.total : Math.min(Math.max(entrada, minEntrada), maxEntrada);
  const financed = Math.max(plan.total - clampedEntrada, 0);
  const parcela = isCash ? 0 : financed / plan.months;
  const economia = Math.max(tablePrice - plan.total, 0);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-4 h-4" style={{ color: GOLD }} />
        <h3 className="text-sm font-bold text-gray-800 tracking-tight">
          Simulador financeiro · Quadra {lot.quadra} · Lote {lot.lote}
        </h3>
      </div>

      {/* Seleção de plano */}
      <div className="flex flex-wrap gap-2 mb-5">
        {plans.map(p => (
          <button
            key={p.id}
            onClick={() => setPlanId(p.id)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
              p.id === plan.id
                ? 'text-white border-transparent'
                : 'text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
            style={p.id === plan.id ? { background: GOLD } : undefined}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Entrada slider (planos parcelados) */}
      {!isCash && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-1">
              <Wallet className="w-3 h-3" /> Entrada
            </label>
            <span className="text-[13px] font-bold text-gray-800">{fmt(clampedEntrada)}</span>
          </div>
          <input
            type="range"
            min={minEntrada}
            max={maxEntrada}
            step={500}
            value={clampedEntrada}
            onChange={e => setEntrada(Number(e.target.value))}
            className="w-full accent-[color:var(--gold,#C8A44A)]"
            style={{ accentColor: GOLD }}
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>{fmt(minEntrada)}</span>
            <span>{fmt(maxEntrada)}</span>
          </div>
        </div>
      )}

      {/* Resultado */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">
            {isCash ? 'Pagamento à vista' : `Parcela (${plan.months}x)`}
          </p>
          <p className="text-xl font-black" style={{ color: '#16a34a' }}>
            {isCash ? fmt(plan.total) : `${fmt(parcela)}`}
          </p>
          {!isCash && <p className="text-[11px] text-gray-500">por mês, sem juros</p>}
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Total do plano</p>
          <p className="text-xl font-black text-gray-800">{fmt(plan.total)}</p>
          {economia > 0 && (
            <p className="text-[11px] font-semibold text-green-600 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> economia de {fmt(economia)}
            </p>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-1.5 text-[12px]">
        <Row label="Preço de tabela" value={fmt(tablePrice)} muted />
        {!isCash && <Row label="Entrada" value={fmt(clampedEntrada)} />}
        {!isCash && <Row label={`${plan.months} parcelas de`} value={fmt(parcela)} />}
        <div className="h-px bg-gray-100 my-1" />
        <Row label="Total a pagar" value={fmt(isCash ? plan.total : clampedEntrada + financed)} bold />
      </div>

      <p className="mt-4 text-[10px] text-gray-400 leading-relaxed">
        Valores de referência baseados na tabela oficial vigente. Sujeitos a confirmação e
        análise de crédito. Não constitui proposta comercial.
      </p>
    </div>
  );
}

function Row({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? 'text-gray-400' : 'text-gray-600'}>{label}</span>
      <span className={bold ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}>{value}</span>
    </div>
  );
}
