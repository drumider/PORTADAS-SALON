import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Calendar, Clock, User, Scissors, Ban } from 'lucide-react';
import { Appointment } from '../types';
import { formatTimeTo12h } from '../utils/timeUtils';

interface CancelAppointmentModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onConfirmCancel: (appointmentId: string, reason: string) => void;
  isAdmin?: boolean;
}

const COMMON_REASONS = [
  'Asuntos personales',
  'Enfermedad o salud',
  'Cambio de planes / Imprevisto laboral',
  'Inconveniente de transporte o tránsito',
  'Conflicto de horario / Reagendará después',
  'Otro motivo (especificar)'
];

export const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = ({
  isOpen,
  appointment,
  onClose,
  onConfirmCancel,
  isAdmin = false
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('Asuntos personales');
  const [customReasonText, setCustomReasonText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !appointment) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalReason = selectedReason === 'Otro motivo (especificar)'
      ? (customReasonText.trim() || 'Otro motivo no especificado')
      : (customReasonText.trim() ? `${selectedReason} - ${customReasonText.trim()}` : selectedReason);

    try {
      onConfirmCancel(appointment.id, finalReason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-white border border-rose-200 shadow-2xl rounded-t-2xl sm:rounded-xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-rose-50 border-b border-rose-100 p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-950 uppercase tracking-wide font-serif-luxury">
                  Cancelar Cita
                </h3>
                <p className="text-[10px] text-rose-700 font-mono">
                  {isAdmin ? 'Panel de Administración' : 'CF Portadas Escazú'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleConfirm} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
            {/* Appointment Details Summary Card */}
            <div className="bg-[#FAF8F5] border border-[#E8DFD3] p-3.5 rounded-lg space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2D8CC]">
                <div className="flex items-center gap-1.5 text-neutral-900 font-bold truncate">
                  <User className="w-3.5 h-3.5 text-[#8C6B4D] shrink-0" />
                  <span className="truncate">{appointment.clientName}</span>
                </div>
                <span className="font-mono text-[10px] text-neutral-500 bg-white border border-neutral-200 px-1.5 py-0.5 rounded shrink-0">
                  {appointment.id}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-700">
                <div className="flex items-center gap-1.5 truncate">
                  <Scissors className="w-3.5 h-3.5 text-[#8C6B4D] shrink-0" />
                  <span className="truncate">{appointment.serviceName}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#2C221C] text-white flex items-center justify-center text-[8px] font-bold shrink-0">
                    {appointment.stylistName.charAt(0)}
                  </span>
                  <span className="truncate">{appointment.stylistName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#8C6B4D] shrink-0" />
                  <span className="font-mono">{appointment.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#8C6B4D] shrink-0" />
                  <span className="font-mono">{formatTimeTo12h(appointment.time)}</span>
                </div>
              </div>
            </div>

            {/* Motivo Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Selecciona el motivo de cancelación: *
              </label>
              <div className="space-y-1.5">
                {COMMON_REASONS.map((reason) => {
                  const isChecked = selectedReason === reason;
                  return (
                    <label
                      key={reason}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'border-rose-400 bg-rose-50/70 text-rose-950 font-semibold shadow-xs'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white text-neutral-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        value={reason}
                        checked={isChecked}
                        onChange={() => setSelectedReason(reason)}
                        className="text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                      <span>{reason}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Custom Notes / Details */}
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-neutral-700">
                {selectedReason === 'Otro motivo (especificar)' 
                  ? 'Escribe el motivo detallado: *' 
                  : 'Detalle o nota adicional (opcional):'}
              </label>
              <textarea
                value={customReasonText}
                onChange={(e) => setCustomReasonText(e.target.value)}
                placeholder={
                  selectedReason === 'Otro motivo (especificar)'
                    ? 'Escribe aquí la razón de la cancelación...'
                    : 'Ej: Cliente avisó que reprogramará la próxima semana...'
                }
                rows={2}
                required={selectedReason === 'Otro motivo (especificar)'}
                className="w-full bg-[#FAF8F5] border border-neutral-300 focus:border-rose-500 text-neutral-900 text-xs p-2.5 rounded-lg outline-none resize-none"
              />
            </div>

            {/* Calendar slot liberation note */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2">
              <span className="text-sm shrink-0">ℹ️</span>
              <p className="text-[11px] leading-relaxed">
                Al confirmar la cancelación, <strong>el horario quedará libre inmediatamente</strong> en el calendario para que otros clientes puedan reservarlo.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-neutral-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-rose-950/20 transition-all cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Cancelando...' : 'Confirmar Cancelación'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
