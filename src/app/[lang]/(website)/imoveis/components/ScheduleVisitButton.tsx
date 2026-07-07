'use client';

/**
 * ScheduleVisitButton — CTA "Agendar Visita" que abre o calendário do corretor
 * (VisitBookingModal). Substitui o antigo link direto pro WhatsApp: agora o
 * cliente escolhe data/hora na agenda real do corretor, preenche os dados e
 * anexa o documento com foto. O WhatsApp continua como fallback dentro do modal.
 */

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Calendar } from 'lucide-react';
import VisitBookingModal from './VisitBookingModal';

interface BrokerInfo {
  id?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
}

interface Props {
  broker: BrokerInfo;
  developmentId?: string | null;
  developmentName?: string | null;
  developmentSlug?: string | null;
  whatsappPhone?: string | null;
  compact?: boolean;
  source?: 'property_page' | 'video_call' | 'lot_map' | 'other';
  defaultMode?: 'presencial' | 'video';
}

export default function ScheduleVisitButton({
  broker, developmentId, developmentName, developmentSlug, whatsappPhone, compact, source, defaultMode,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center justify-center gap-1.5 w-full ${compact ? 'h-9 rounded-lg text-[10px]' : 'h-12 rounded-xl text-[11px]'} font-bold uppercase tracking-wider transition-all duration-200 hover:bg-[#F8F6F2] active:scale-[0.98]`}
        style={{
          background: '#FFFFFF',
          color: '#0B1928',
          border: '2px solid #0B1928',
          fontFamily: "var(--fu, 'Outfit', sans-serif)",
          cursor: 'pointer',
        }}
      >
        <Calendar className="w-3.5 h-3.5" />
        {compact ? 'Visita' : 'Agendar Visita'}
      </button>

      <AnimatePresence>
        {open && (
          <VisitBookingModal
            broker={broker}
            developmentId={developmentId}
            developmentName={developmentName}
            developmentSlug={developmentSlug}
            whatsappPhone={whatsappPhone}
            source={source ?? 'property_page'}
            defaultMode={defaultMode ?? 'presencial'}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
