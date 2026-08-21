import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  X, 
  Plus, 
  Minus, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Scissors, 
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Appointment, Stylist, Service } from '../types';
import { SERVICES, STYLISTS } from '../constants';
import { 
  formatTimeTo12h, 
  normalizeTimeTo24h, 
  timeToMinutes, 
  minutesToTime24, 
  minutesToTime12, 
  formatDurationText,
  doIntervalsOverlap,
  isSameStylist
} from '../utils/timeUtils';
import { getStoredAppointments } from '../utils/storage';

interface ExpandDurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExpand: (appointmentId: string, newDurationMinutes: number) => void;
  appointment: Appointment | null;
}

const PRESET_DURATIONS = [
  { minutes: 30, label: '30m' },
  { minutes: 45, label: '45m' },
  { minutes: 60, label: '1h' },
  { minutes: 75, label: '1h 15m' },
  { minutes: 90, label: '1h 30m' },
  { minutes: 120, label: '2h' },
  { minutes: 150, label: '2h 30m' },
  { minutes: 180, label: '3h' },
  { minutes: 240, label: '4h' },
];

export const ExpandDurationModal: React.FC<ExpandDurationModalProps> = ({
  isOpen,
  onClose,
  onConfirmExpand,
  appointment
}) => {
  const [durationMinutes, setDurationMinutes] = useState<number>(60);

  // Initialize duration when opening for this appointment
  useEffect(() => {
    if (appointment && isOpen) {
      const defaultDur = appointment.durationMinutes || 
        SERVICES.find(s => s.id === appointment.serviceId)?.durationMinutes || 
        60;
      setDurationMinutes(defaultDur);
    }
  }, [appointment, isOpen]);

  const originalDuration = useMemo(() => {
    if (!appointment) return 60;
    return appointment.durationMinutes || 
      SERVICES.find(s => s.id === appointment.serviceId)?.durationMinutes || 
      60;
  }, [appointment]);

  // Calculate times
  const timeCalculations = useMemo(() => {
    if (!appointment) return null;
    const start24 = normalizeTimeTo24h(appointment.time);
    const startMin = timeToMinutes(start24);
    
    const origEndMin = startMin + originalDuration;
    const origEnd12 = minutesToTime12(origEndMin);
    
    const newEndMin = startMin + durationMinutes;
    const newEnd12 = minutesToTime12(newEndMin);
    
    const diffMinutes = durationMinutes - originalDuration;

    return {
      start12: formatTimeTo12h(start24),
      origEnd12,
      newEnd12,
      startMin,
      newEndMin,
      origEndMin,
      diffMinutes,
      isExpanded: diffMinutes > 0,
      isReduced: diffMinutes < 0,
      formattedDuration: formatDurationText(durationMinutes)
    };
  }, [appointment, originalDuration, durationMinutes]);

  // Conflict overlap check for the stylist on this date
  const conflictCheck = useMemo(() => {
    if (!appointment || !timeCalculations) return { hasConflict: false, conflictingApp: null };

    const allApps = getStoredAppointments();
    const otherApps = allApps.filter(a => 
      a.id !== appointment.id && 
      a.date === appointment.date && 
      a.status !== 'Cancelada' &&
      isSameStylist(a.stylistId, a.stylistName, appointment.stylistId, appointment.stylistName)
    );

    for (const other of otherApps) {
      const otherStart24 = normalizeTimeTo24h(other.time);
      const otherStartMin = timeToMinutes(otherStart24);
      const otherDur = other.durationMinutes || 60;
      const otherEndMin = otherStartMin + otherDur;

      if (doIntervalsOverlap(timeCalculations.startMin, timeCalculations.newEndMin, otherStartMin, otherEndMin)) {
        return {
          hasConflict: true,
          conflictingApp: other,
          conflictTime: `${formatTimeTo12h(otherStart24)} (${other.clientName})`
        };
      }
    }

    return { hasConflict: false, conflictingApp: null };
  }, [appointment, timeCalculations]);

  if (!isOpen || !appointment || !timeCalculations) return null;

  const handleAddMinutes = (mins: number) => {
    setDurationMinutes(prev => Math.max(15, Math.min(480, prev + mins)));
  };

  const handleSetPreset = (mins: number) => {
    setDurationMinutes(mins);
  };

  const handleSave = () => {
    onConfirmExpand(appointment.id, durationMinutes);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.18 }}
          className="w-full max-w-md bg-white border border-[#D8CEB8] shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-[#FAF8F5] border-b border-[#EAE3DC] p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#8C6B4D]/10 border border-[#8C6B4D]/30 flex items-center justify-center text-[#8C6B4D]">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider font-serif-luxury">
                  Expandir / Ajustar Duración
                </h3>
                <p className="text-[10px] text-[#8C6B4D] uppercase tracking-widest font-bold font-mono">
                  Gestión de Tiempo de Cita
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
            
            {/* Appointment Summary Box */}
            <div className="bg-[#FAF8F5] border border-[#E8E0D5] p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between gap-2 border-b border-[#E8E0D5] pb-2">
                <div className="flex items-center gap-1.5 font-bold text-neutral-900 truncate">
                  <User className="w-3.5 h-3.5 text-[#8C6B4D] shrink-0" />
                  <span className="truncate">{appointment.clientName}</span>
                </div>
                <span className="text-[10px] font-mono bg-white border border-[#D8CEB8] px-2 py-0.5 rounded text-neutral-700 font-bold shrink-0">
                  {appointment.date}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-600">
                <div className="flex items-center gap-1 truncate">
                  <Scissors className="w-3 h-3 text-[#8C6B4D] shrink-0" />
                  <span className="truncate">{appointment.serviceName}</span>
                </div>
                <div className="flex items-center gap-1 truncate font-medium text-neutral-800">
                  <span>Especialista:</span>
                  <span className="font-bold truncate">{appointment.stylistName}</span>
                </div>
              </div>
            </div>

            {/* Time Comparison & Live Timeline */}
            <div className="p-3.5 bg-[#2C221C] text-white rounded-lg space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between text-[11px] text-neutral-300">
                <span>Horario Original:</span>
                <span className="font-mono text-neutral-300">
                  {timeCalculations.start12} - {timeCalculations.origEnd12} ({formatDurationText(originalDuration)})
                </span>
              </div>

              <div className="pt-2 border-t border-neutral-700/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gold-champagne font-bold block">
                    Nuevo Horario Agendado:
                  </span>
                  <div className="flex items-center gap-1.5 text-base sm:text-lg font-bold font-mono text-white mt-0.5">
                    <span>{timeCalculations.start12}</span>
                    <ArrowRight className="w-4 h-4 text-gold-champagne shrink-0" />
                    <span className="text-gold-champagne">{timeCalculations.newEnd12}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase text-neutral-400 font-mono block">Duración Total</span>
                  <span className="text-sm sm:text-base font-mono font-bold text-white">
                    {timeCalculations.formattedDuration}
                  </span>
                  {timeCalculations.diffMinutes !== 0 && (
                    <span className={`block text-[10px] font-mono font-bold ${
                      timeCalculations.isExpanded ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {timeCalculations.isExpanded ? `+${timeCalculations.diffMinutes} min adicionales` : `${timeCalculations.diffMinutes} min`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Extension Buttons */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#8C6B4D] font-bold mb-1.5">
                ⚡ Extender Rápido:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: '+15 min', mins: 15 },
                  { label: '+30 min', mins: 30 },
                  { label: '+45 min', mins: 45 },
                  { label: '+1 hora', mins: 60 }
                ].map(ext => (
                  <button
                    key={ext.mins}
                    type="button"
                    onClick={() => handleAddMinutes(ext.mins)}
                    className="py-2 px-1 text-center bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-300 text-emerald-950 rounded font-mono font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-emerald-700" />
                    <span>{ext.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stepper + Custom Duration Slider / Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#8C6B4D] font-bold">
                <span>Ajuste Preciso de Minutos:</span>
                <span className="font-mono text-neutral-900 font-bold">{durationMinutes} minutos ({timeCalculations.formattedDuration})</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddMinutes(-15)}
                  disabled={durationMinutes <= 15}
                  className="w-10 h-10 rounded border border-[#D8CEB8] bg-[#FAF8F5] hover:bg-[#F2ECE5] active:bg-[#EAE3DC] disabled:opacity-40 text-neutral-800 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                  title="Reducir 15 minutos"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <input
                  type="range"
                  min="15"
                  max="360"
                  step="15"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="flex-1 accent-[#8C6B4D] cursor-pointer"
                />

                <button
                  type="button"
                  onClick={() => handleAddMinutes(15)}
                  disabled={durationMinutes >= 480}
                  className="w-10 h-10 rounded border border-[#D8CEB8] bg-[#FAF8F5] hover:bg-[#F2ECE5] active:bg-[#EAE3DC] disabled:opacity-40 text-neutral-800 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                  title="Aumentar 15 minutos"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Presets Grid */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">
                O elegir duración predefinida:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_DURATIONS.map(p => (
                  <button
                    key={p.minutes}
                    type="button"
                    onClick={() => handleSetPreset(p.minutes)}
                    className={`py-1.5 px-2.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                      durationMinutes === p.minutes
                        ? 'bg-[#8C6B4D] text-white border border-[#8C6B4D] shadow-xs'
                        : 'bg-white border border-[#E2D9CE] text-neutral-700 hover:border-[#8C6B4D]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Overlap / Conflict Alert */}
            {conflictCheck.hasConflict ? (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-950 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-xs text-amber-900">
                    Aviso de Solapamiento en Agenda
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Al extender a las <strong>{timeCalculations.newEnd12}</strong>, coincide parcialmente con la cita de <strong>{conflictCheck.conflictTime}</strong>. Como administrador puedes confirmarlo si se atenderán simultáneamente o reprogramar la otra cita.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] text-emerald-900 font-medium">
                  Espacio disponible en la agenda del especialista hasta las <strong>{timeCalculations.newEnd12}</strong>.
                </span>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="bg-[#FAF8F5] border-t border-[#EAE3DC] p-3.5 sm:p-4 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-neutral-700 hover:text-neutral-900 uppercase tracking-wider cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-[#2C221C] hover:bg-[#8C6B4D] text-white rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-gold-champagne" />
              <span>Guardar Nueva Duración ({timeCalculations.formattedDuration})</span>
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
