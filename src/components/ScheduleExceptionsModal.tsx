import React, { useState, useEffect, useMemo } from 'react';
import { Stylist, StylistScheduleException } from '../types';
import { 
  saveScheduleException, 
  deleteScheduleException, 
  getStoredScheduleExceptions, 
  subscribeToScheduleExceptions,
  saveScheduleSwap,
  deleteScheduleExceptionPair
} from '../utils/storage';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  Trash2, 
  CheckCircle, 
  X, 
  Stethoscope, 
  ArrowLeftRight,
  Sparkles,
  Sun,
  Ban,
  Check,
  Users,
  CalendarCheck,
  RotateCcw
} from 'lucide-react';

interface ScheduleExceptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stylists: Stylist[];
  exceptions?: StylistScheduleException[];
  selectedDate?: string;
  initialStylistId?: string;
  initialMode?: 'swap' | 'close' | 'open' | 'team';
}

const DAY_NAMES_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTH_NAMES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Safe helper to get day name
const getSafeDayName = (dayIndex: any): string => {
  const num = Number(dayIndex);
  if (!isNaN(num) && num >= 0 && num <= 6) {
    return DAY_NAMES_ES[num] || `Día ${num}`;
  }
  return String(dayIndex || '');
};

// Safe helper to format YYYY-MM-DD
const formatDateFriendly = (dateStr?: string | null): string => {
  if (!dateStr || typeof dateStr !== 'string') return '';
  try {
    const parts = dateStr.split('-').map(Number);
    if (parts.length < 3 || parts.some(isNaN)) return dateStr;
    const [y, m, d] = parts;
    const dt = new Date(y, m - 1, d);
    if (isNaN(dt.getTime())) return dateStr;
    const dayName = DAY_NAMES_ES[dt.getDay()] || '';
    const monthName = MONTH_NAMES_ES[dt.getMonth()] || '';
    return `${dayName} ${dt.getDate()} de ${monthName}`;
  } catch {
    return dateStr || '';
  }
};

export const ScheduleExceptionsModal: React.FC<ScheduleExceptionsModalProps> = ({
  isOpen,
  onClose,
  stylists = [],
  exceptions: propExceptions,
  selectedDate,
  initialStylistId,
  initialMode = 'close'
}) => {
  // Only real stylists (filter out 'cualquiera' or invalid entries)
  const validStylists = useMemo(() => {
    return (stylists || []).filter(s => s && s.id && s.id !== 'cualquiera');
  }, [stylists]);

  const [internalExceptions, setInternalExceptions] = useState<StylistScheduleException[]>(() => {
    try {
      return getStoredScheduleExceptions();
    } catch {
      return [];
    }
  });

  const [actionTab, setActionTab] = useState<'close' | 'open' | 'swap' | 'team'>('close');
  
  // Pick safe initial stylist
  const [selectedStylistId, setSelectedStylistId] = useState<string>(() => {
    if (initialStylistId && initialStylistId !== 'cualquiera') {
      const match = validStylists.find(s => s.id === initialStylistId);
      if (match) return match.id;
    }
    return validStylists[0]?.id || 'carlos';
  });

  // Dates state
  const [targetDate, setTargetDate] = useState<string>(() => {
    return selectedDate || new Date().toISOString().split('T')[0];
  });
  const [openCompensationDate, setOpenCompensationDate] = useState<string>('');
  const [reason, setReason] = useState<string>('Cita médica');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [stylistListFilter, setStylistListFilter] = useState<string>('all');

  // Synchronize when opened with new props
  useEffect(() => {
    if (!isOpen) return;

    if (selectedDate) {
      setTargetDate(selectedDate);
    }
    if (initialStylistId && initialStylistId !== 'cualquiera') {
      const match = validStylists.find(s => s.id === initialStylistId);
      if (match) setSelectedStylistId(match.id);
    } else if (!validStylists.some(s => s.id === selectedStylistId)) {
      if (validStylists.length > 0) {
        setSelectedStylistId(validStylists[0].id);
      }
    }
    if (initialMode) {
      setActionTab(initialMode);
    }
    setErrorMsg('');
    setSuccessMsg('');
  }, [isOpen, selectedDate, initialStylistId, initialMode, validStylists]);

  // Real-time synchronization
  useEffect(() => {
    try {
      const unsub = subscribeToScheduleExceptions((list) => {
        if (Array.isArray(list)) {
          setInternalExceptions(list);
        }
      });
      return () => unsub();
    } catch (e) {
      console.error('Subscription error:', e);
    }
  }, []);

  // Currently selected stylist object
  const currentStylist = useMemo(() => {
    return validStylists.find(s => s.id === selectedStylistId) || validStylists[0] || null;
  }, [validStylists, selectedStylistId]);

  // Safe text for regular off days
  const stylistOffDaysText = useMemo(() => {
    if (!currentStylist || !Array.isArray(currentStylist.offDays) || currentStylist.offDays.length === 0) {
      return 'Labora todos los días (Sin descanso fijo)';
    }
    return currentStylist.offDays.map(d => getSafeDayName(d)).filter(Boolean).join(', ');
  }, [currentStylist]);

  // Suggestions for compensation day (next week off-day)
  const nextWeekOffDaySuggestions = useMemo(() => {
    if (!currentStylist || !Array.isArray(currentStylist.offDays) || currentStylist.offDays.length === 0 || !targetDate) {
      return [];
    }

    try {
      const parts = targetDate.split('-').map(Number);
      if (parts.length < 3 || parts.some(isNaN)) return [];
      const [y, m, d] = parts;
      const refDate = new Date(y, m - 1, d);
      if (isNaN(refDate.getTime())) return [];

      const suggestions: { date: string; formatted: string; dayName: string }[] = [];
      for (let offset = 4; offset <= 12; offset++) {
        const target = new Date(refDate);
        target.setDate(refDate.getDate() + offset);
        const dow = target.getDay();
        if (currentStylist.offDays.includes(dow)) {
          const yStr = target.getFullYear();
          const mStr = String(target.getMonth() + 1).padStart(2, '0');
          const dStr = String(target.getDate()).padStart(2, '0');
          const dateIso = `${yStr}-${mStr}-${dStr}`;
          suggestions.push({
            date: dateIso,
            dayName: getSafeDayName(dow),
            formatted: `${getSafeDayName(dow)} ${target.getDate()} de ${MONTH_NAMES_ES[target.getMonth()] || ''}`
          });
        }
      }
      return suggestions;
    } catch {
      return [];
    }
  }, [currentStylist, targetDate]);

  // Auto-fill open date when switching to swap mode if empty
  useEffect(() => {
    if (actionTab === 'swap' && nextWeekOffDaySuggestions.length > 0 && !openCompensationDate) {
      setOpenCompensationDate(nextWeekOffDaySuggestions[0].date);
    }
  }, [actionTab, nextWeekOffDaySuggestions, openCompensationDate]);

  const currentExceptions = Array.isArray(propExceptions) ? propExceptions : (Array.isArray(internalExceptions) ? internalExceptions : []);

  // Safe handler: Close Day
  const handleSaveCloseDay = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedStylistId || !targetDate) {
      setErrorMsg('Por favor seleccione el profesional y la fecha a cerrar.');
      return;
    }

    const stylistName = currentStylist?.name || selectedStylistId;
    const finalReason = reason.trim() || 'Ausencia programada';

    try {
      saveScheduleException({
        stylistId: selectedStylistId,
        stylistName,
        date: targetDate,
        type: 'off',
        reason: finalReason
      });

      setSuccessMsg(`✓ Día CERRADO exitosamente: ${stylistName} no atenderá citas el ${formatDateFriendly(targetDate)} (${finalReason}).`);
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err: any) {
      setErrorMsg(`Error al guardar: ${err?.message || 'No se pudo guardar la excepción'}`);
    }
  };

  // Safe handler: Open Day
  const handleSaveOpenDay = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedStylistId || !targetDate) {
      setErrorMsg('Por favor seleccione el profesional y la fecha a abrir.');
      return;
    }

    const stylistName = currentStylist?.name || selectedStylistId;
    const finalReason = reason.trim() || 'Día abierto para atender citas';

    try {
      saveScheduleException({
        stylistId: selectedStylistId,
        stylistName,
        date: targetDate,
        type: 'working',
        reason: finalReason
      });

      setSuccessMsg(`✓ Día ABIERTO exitosamente: ${stylistName} estará disponible para atender citas el ${formatDateFriendly(targetDate)}.`);
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err: any) {
      setErrorMsg(`Error al guardar: ${err?.message || 'No se pudo abrir el día'}`);
    }
  };

  // Safe handler: Swap Days
  const handleSaveSwap = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedStylistId || !targetDate || !openCompensationDate) {
      setErrorMsg('Debe especificar tanto el día a cerrar como el día a abrir en compensación.');
      return;
    }

    if (targetDate === openCompensationDate) {
      setErrorMsg('El día a cerrar y el día a abrir deben ser fechas diferentes.');
      return;
    }

    const stylistName = currentStylist?.name || selectedStylistId;
    const finalReason = reason.trim() || 'Permuta de turno con la siguiente semana';

    try {
      saveScheduleSwap({
        stylistId: selectedStylistId,
        stylistName,
        closeDate: targetDate,
        openDate: openCompensationDate,
        reason: finalReason
      });

      setSuccessMsg(`✓ Permuta registrada: ${stylistName} NO laborará el ${formatDateFriendly(targetDate)} y laborará el ${formatDateFriendly(openCompensationDate)}.`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(`Error al guardar permuta: ${err?.message || 'Ocurrió un error inesperado'}`);
    }
  };

  // Safe handler: Delete single exception
  const handleDeleteSingle = (id: string, stylistName?: string) => {
    try {
      deleteScheduleException(id);
      setSuccessMsg(`✓ Registro eliminado. Se restablece el horario normal de ${stylistName || 'el profesional'}.`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err: any) {
      setErrorMsg(`Error al eliminar: ${err?.message || 'Error desconocido'}`);
    }
  };

  // Safe handler: Delete swap pair
  const handleDeletePair = (id: string, stylistName?: string) => {
    try {
      deleteScheduleExceptionPair(id);
      setSuccessMsg(`✓ Permuta revertida para ${stylistName || 'el profesional'}. Ambos días regresan a su horario habitual.`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err: any) {
      setErrorMsg(`Error al revertir permuta: ${err?.message || 'Error desconocido'}`);
    }
  };

  // Safely group exceptions into pairs and singles
  const { swapPairs, singleExceptions } = useMemo(() => {
    const pairs: { closed: StylistScheduleException; open?: StylistScheduleException }[] = [];
    const singles: StylistScheduleException[] = [];
    const processedIds = new Set<string>();

    const safeList = (currentExceptions || []).filter(e => e && e.id && e.date);
    const sorted = [...safeList].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    for (const exc of sorted) {
      if (processedIds.has(exc.id)) continue;
      const sId = (exc.stylistId || '').toLowerCase();

      if (exc.replacesDate && exc.type === 'off') {
        const partner = sorted.find(
          other =>
            other &&
            other.id !== exc.id &&
            (other.stylistId || '').toLowerCase() === sId &&
            other.date === exc.replacesDate &&
            other.type === 'working'
        );

        if (partner) {
          pairs.push({ closed: exc, open: partner });
          processedIds.add(exc.id);
          processedIds.add(partner.id);
          continue;
        }
      }

      if (exc.replacesDate && exc.type === 'working') {
        const partner = sorted.find(
          other =>
            other &&
            other.id !== exc.id &&
            (other.stylistId || '').toLowerCase() === sId &&
            other.date === exc.replacesDate &&
            other.type === 'off'
        );

        if (partner) {
          pairs.push({ closed: partner, open: exc });
          processedIds.add(exc.id);
          processedIds.add(partner.id);
          continue;
        }
      }

      singles.push(exc);
      processedIds.add(exc.id);
    }

    return { swapPairs: pairs, singleExceptions: singles };
  }, [currentExceptions]);

  // Filtered exceptions for active list
  const filteredSwapPairs = useMemo(() => {
    if (stylistListFilter === 'all') return swapPairs;
    return swapPairs.filter(p => (p.closed.stylistId || '').toLowerCase() === stylistListFilter.toLowerCase());
  }, [swapPairs, stylistListFilter]);

  const filteredSingleExceptions = useMemo(() => {
    if (stylistListFilter === 'all') return singleExceptions;
    return singleExceptions.filter(e => (e.stylistId || '').toLowerCase() === stylistListFilter.toLowerCase());
  }, [singleExceptions, stylistListFilter]);

  const totalActiveChanges = swapPairs.length + singleExceptions.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-[#D9CEC2] w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden text-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#2C221C] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-[#4A3B32] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#8C6B4D]/30 border border-[#8C6B4D]/60 flex items-center justify-center text-amber-300 shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-serif-luxury uppercase tracking-wider font-bold text-[#F5EFEB]">
                Control de Días y Permutas del Salón
              </h2>
              <p className="text-[11px] text-[#C2B2A3] font-mono">
                Cierra ausencias, abre días de descanso y gestiona permutas de turnos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-300 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-[#FAF8F5]">
          
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-lg flex items-center gap-2 animate-in fade-in font-medium">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Master Action Tabs */}
          <div className="bg-white p-1 rounded-lg border border-[#D9CEC2] grid grid-cols-2 sm:grid-cols-4 gap-1 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setActionTab('close');
                setReason('Cita médica');
                setErrorMsg('');
              }}
              className={`py-2 px-2 rounded-md text-[11px] sm:text-xs font-serif-luxury uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                actionTab === 'close'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-rose-700 hover:bg-rose-50'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cerrar Día</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActionTab('open');
                setReason('Turno extra / Guardia');
                setErrorMsg('');
              }}
              className={`py-2 px-2 rounded-md text-[11px] sm:text-xs font-serif-luxury uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                actionTab === 'open'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Abrir Día</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActionTab('swap');
                setReason('Permuta de turno');
                setErrorMsg('');
              }}
              className={`py-2 px-2 rounded-md text-[11px] sm:text-xs font-serif-luxury uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                actionTab === 'swap'
                  ? 'bg-[#2C221C] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-[#2C221C] hover:bg-[#F2ECE5]'
              }`}
            >
              <ArrowLeftRight className={`w-3.5 h-3.5 ${actionTab === 'swap' ? 'text-amber-300' : 'text-[#8C6B4D]'}`} />
              <span>Permutar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActionTab('team');
                setErrorMsg('');
              }}
              className={`py-2 px-2 rounded-md text-[11px] sm:text-xs font-serif-luxury uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                actionTab === 'team'
                  ? 'bg-[#8C6B4D] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-[#8C6B4D] hover:bg-[#FAF8F5]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Equipo</span>
            </button>
          </div>

          {/* ======================================================== */}
          {/* TAB 4: VISTA GENERAL DEL EQUIPO                          */}
          {/* ======================================================== */}
          {actionTab === 'team' && (
            <div className="bg-white p-4 rounded-xl border border-[#D9CEC2] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#F2ECE5]">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#8C6B4D]" />
                  <h3 className="text-xs sm:text-sm font-serif-luxury uppercase font-bold text-[#2C221C]">
                    Horarios y Descansos del Equipo
                  </h3>
                </div>
                <span className="text-[11px] text-neutral-500 font-mono">
                  {validStylists.length} profesionales activos
                </span>
              </div>

              <div className="divide-y divide-[#F2ECE5]">
                {validStylists.map(st => {
                  const offDaysStr = Array.isArray(st.offDays) && st.offDays.length > 0
                    ? st.offDays.map(d => getSafeDayName(d)).join(', ')
                    : 'Sin día fijo de descanso';

                  const stylistExcs = currentExceptions.filter(e => (e.stylistId || '').toLowerCase() === st.id.toLowerCase());

                  return (
                    <div key={st.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#2C221C] text-gold-champagne flex items-center justify-center font-serif-luxury font-bold text-xs shrink-0">
                          {st.avatarLetter || st.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-serif-luxury uppercase text-[#2C221C]">
                              {st.name}
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              ({st.role})
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-600 font-mono mt-0.5">
                            Descanso habitual: <strong className="text-[#8C6B4D]">{offDaysStr}</strong>
                            {stylistExcs.length > 0 && (
                              <span className="ml-2 text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded text-[10px]">
                                {stylistExcs.length} cambio(s)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStylistId(st.id);
                            setActionTab('close');
                            setReason('Cita médica');
                          }}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title={`Cerrar un día para ${st.name}`}
                        >
                          <Ban className="w-3 h-3 text-rose-600" />
                          <span>Cerrar Día</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStylistId(st.id);
                            setActionTab('open');
                            setReason('Turno extra / Guardia');
                          }}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title={`Abrir un día libre para ${st.name}`}
                        >
                          <Sun className="w-3 h-3 text-emerald-600" />
                          <span>Abrir Día</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStylistId(st.id);
                            setActionTab('swap');
                            setReason('Permuta de turno');
                          }}
                          className="px-2 py-1 bg-[#FAF6F0] hover:bg-[#F2ECE5] text-[#2C221C] border border-[#D9CEC2] rounded text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title={`Permutar turno para ${st.name}`}
                        >
                          <ArrowLeftRight className="w-3 h-3 text-[#8C6B4D]" />
                          <span>Permutar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STYLIST SELECTOR (For Close, Open and Swap tabs)         */}
          {/* ======================================================== */}
          {actionTab !== 'team' && (
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#D9CEC2] shadow-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1.5 border-b border-[#F2ECE5]">
                <label className="text-[11px] uppercase font-bold text-[#5C4A38] font-mono flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#8C6B4D]" />
                  <span>1. Seleccione el Profesional del Salón</span>
                </label>
                <span className="text-[11px] text-neutral-500 font-mono">
                  Descanso habitual: <strong className="text-[#8C6B4D]">{stylistOffDaysText}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {validStylists.map(st => {
                  const isSelected = selectedStylistId === st.id;
                  const offDaysDisplay = Array.isArray(st.offDays) && st.offDays.length > 0
                    ? st.offDays.map(d => getSafeDayName(d).substring(0, 3)).join(',')
                    : 'Sin fijos';

                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setSelectedStylistId(st.id);
                        setOpenCompensationDate('');
                      }}
                      className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#FAF6F0] border-[#8C6B4D] text-[#2C221C] ring-2 ring-[#8C6B4D]/30 shadow-xs'
                          : 'bg-white border-[#E2D8CC] text-neutral-700 hover:border-[#8C6B4D]/50 hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-serif-luxury shrink-0 ${
                        isSelected ? 'bg-[#2C221C] text-gold-champagne' : 'bg-[#EFEAE2] text-neutral-700'
                      }`}>
                        {st.avatarLetter || st.name.charAt(0)}
                      </span>
                      <div className="truncate min-w-0">
                        <div className="text-xs font-bold font-serif-luxury uppercase truncate">
                          {st.name}
                        </div>
                        <div className="text-[10px] text-neutral-500 truncate font-mono">
                          Desc: {offDaysDisplay}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: CERRAR DÍA (Ausencia / Cita Médica / Vacaciones)  */}
          {/* ======================================================== */}
          {actionTab === 'close' && (
            <form onSubmit={handleSaveCloseDay} className="bg-white p-4 sm:p-5 rounded-xl border-2 border-rose-300 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-rose-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                    <Ban className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-serif-luxury uppercase font-bold text-rose-950 tracking-wider">
                      Cerrar Día para {currentStylist?.name}
                    </h3>
                    <p className="text-[10px] text-rose-700 font-mono">
                      Bloquea la agenda para que no se puedan agendar citas en esa fecha
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date selection */}
                <div className="p-3 bg-rose-50/40 rounded-lg border border-rose-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] uppercase font-bold text-rose-900 font-mono">
                      Fecha a Cerrar *
                    </label>
                    {selectedDate && targetDate !== selectedDate && (
                      <button
                        type="button"
                        onClick={() => setTargetDate(selectedDate)}
                        className="text-[10px] text-rose-700 hover:underline font-mono"
                      >
                        Usar fecha actual ({selectedDate})
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-white border border-rose-300 rounded-md px-3 py-1.5 text-xs font-mono text-neutral-800 focus:ring-1 focus:ring-rose-500 outline-hidden"
                    required
                  />
                  <p className="text-[10px] text-rose-800 font-mono font-medium">
                    {formatDateFriendly(targetDate)}
                  </p>
                </div>

                {/* Reason Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-bold text-[#5C4A38] font-mono">
                    Motivo del Cierre *
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {['Cita médica', 'Incapacidad médica', 'Asunto personal', 'Vacaciones', 'Día libre puntual'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setReason(r)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                          reason === r
                            ? 'bg-rose-700 text-white font-bold'
                            : 'bg-[#F2ECE5] hover:bg-[#E5DCD0] text-neutral-700'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Detalles del motivo..."
                    className="w-full bg-[#FAF8F5] border border-[#D9CEC2] rounded-md px-3 py-1.5 text-xs text-neutral-800 focus:ring-1 focus:ring-rose-500 outline-hidden font-sans"
                    required
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[11px] text-neutral-500 font-mono">
                  {currentStylist?.name} quedará marcado como <strong className="text-rose-700">NO DISPONIBLE</strong>.
                </span>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-serif-luxury uppercase tracking-wider font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Confirmar Cierre de Día</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 2: ABRIR DÍA (Turno Extra / Guardia / Compensación)   */}
          {/* ======================================================== */}
          {actionTab === 'open' && (
            <form onSubmit={handleSaveOpenDay} className="bg-white p-4 sm:p-5 rounded-xl border-2 border-emerald-300 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-serif-luxury uppercase font-bold text-emerald-950 tracking-wider">
                      Abrir Día de Trabajo para {currentStylist?.name}
                    </h3>
                    <p className="text-[10px] text-emerald-800 font-mono">
                      Habilita la agenda para citas en una fecha que normalmente descansa
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date selection */}
                <div className="p-3 bg-emerald-50/40 rounded-lg border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] uppercase font-bold text-emerald-900 font-mono">
                      Fecha a Habilitar / Abrir *
                    </label>
                    {selectedDate && targetDate !== selectedDate && (
                      <button
                        type="button"
                        onClick={() => setTargetDate(selectedDate)}
                        className="text-[10px] text-emerald-700 hover:underline font-mono"
                      >
                        Usar fecha actual ({selectedDate})
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-md px-3 py-1.5 text-xs font-mono text-neutral-800 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                    required
                  />
                  <p className="text-[10px] text-emerald-800 font-mono font-medium">
                    {formatDateFriendly(targetDate)}
                  </p>
                </div>

                {/* Reason Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-bold text-[#5C4A38] font-mono">
                    Motivo / Descripción *
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {['Turno extra / Guardia', 'Compensación de descanso', 'Alta demanda de citas', 'Día adicional voluntario'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setReason(r)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                          reason === r
                            ? 'bg-emerald-700 text-white font-bold'
                            : 'bg-[#F2ECE5] hover:bg-[#E5DCD0] text-neutral-700'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Detalles..."
                    className="w-full bg-[#FAF8F5] border border-[#D9CEC2] rounded-md px-3 py-1.5 text-xs text-neutral-800 focus:ring-1 focus:ring-emerald-500 outline-hidden font-sans"
                    required
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[11px] text-neutral-500 font-mono">
                  {currentStylist?.name} quedará marcado como <strong className="text-emerald-700">DISPONIBLE PARA CITAS</strong>.
                </span>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-serif-luxury uppercase tracking-wider font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Confirmar Apertura de Día</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 3: PERMUTAR DÍAS (Cerrar Día X y Abrir Día Y)        */}
          {/* ======================================================== */}
          {actionTab === 'swap' && (
            <form onSubmit={handleSaveSwap} className="bg-white p-4 sm:p-5 rounded-xl border-2 border-[#8C6B4D]/40 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#F2ECE5] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#2C221C] text-amber-300 flex items-center justify-center">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-serif-luxury uppercase font-bold text-[#2C221C] tracking-wider">
                      Permuta de Turno: Cerrar Día & Abrir Compensación
                    </h3>
                    <p className="text-[10px] text-neutral-500 font-mono">
                      Cierra el día de ausencia para {currentStylist?.name} y habilita su día libre de la otra semana
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Date to CLOSE */}
                <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200 space-y-1.5">
                  <label className="text-[11px] uppercase font-bold text-rose-900 font-mono flex items-center gap-1">
                    <Ban className="w-3.5 h-3.5 text-rose-600" />
                    <span>1. Día a CERRAR (Ausencia)</span>
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-white border border-rose-300 rounded-md px-3 py-1.5 text-xs font-mono text-neutral-800 focus:ring-1 focus:ring-rose-500 outline-hidden"
                    required
                  />
                  <p className="text-[10px] text-rose-800 font-mono font-medium">
                    {formatDateFriendly(targetDate)} (No atenderá)
                  </p>
                </div>

                {/* 2. Date to OPEN */}
                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200 space-y-1.5">
                  <label className="text-[11px] uppercase font-bold text-emerald-900 font-mono flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-emerald-600" />
                    <span>2. Día a ABRIR (Compensación)</span>
                  </label>
                  <input
                    type="date"
                    value={openCompensationDate}
                    onChange={(e) => setOpenCompensationDate(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-md px-3 py-1.5 text-xs font-mono text-neutral-800 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                    required
                  />
                  <p className="text-[10px] text-emerald-800 font-mono font-medium">
                    {openCompensationDate ? `${formatDateFriendly(openCompensationDate)} (Estará activo)` : 'Seleccione una fecha'}
                  </p>
                </div>
              </div>

              {/* Automatic suggestions for next week off days */}
              {nextWeekOffDaySuggestions.length > 0 && (
                <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-amber-900 font-mono flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Sugerencias directas (Días libres habituales de la próxima semana):</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {nextWeekOffDaySuggestions.map(sug => {
                      const isSelected = openCompensationDate === sug.date;
                      return (
                        <button
                          key={sug.date}
                          type="button"
                          onClick={() => setOpenCompensationDate(sug.date)}
                          className={`px-2.5 py-1 rounded text-xs font-mono transition-all flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-700 text-white font-bold shadow-xs'
                              : 'bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>{sug.formatted}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reason Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-[#5C4A38] font-mono">
                  Motivo de la permuta
                </label>
                <div className="flex flex-wrap gap-1">
                  {['Cita médica con compensación', 'Permuta de turno', 'Compensación de día libre', 'Asunto personal'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                        reason === r
                          ? 'bg-[#2C221C] text-white font-bold'
                          : 'bg-[#F2ECE5] hover:bg-[#E5DCD0] text-neutral-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Cita médica en San José, cambio con la siguiente semana..."
                  className="w-full bg-[#FAF8F5] border border-[#D9CEC2] rounded-md px-3 py-1.5 text-xs text-neutral-800 focus:ring-1 focus:ring-[#8C6B4D] outline-hidden font-sans"
                  required
                />
              </div>

              {/* Submit */}
              <div className="pt-2 border-t border-[#F2ECE5] flex items-center justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2C221C] hover:bg-[#4A3B32] text-white rounded-lg text-xs font-serif-luxury uppercase tracking-wider font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <ArrowLeftRight className="w-4 h-4 text-amber-300" />
                  <span>Aplicar Permuta Completa</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* LIST OF REGISTERED SWAPS & EXCEPTIONS                    */}
          {/* ======================================================== */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-[#E2D8CC]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#8C6B4D]" />
                <h3 className="text-xs uppercase font-bold tracking-wider text-[#5C4A38] font-mono">
                  Registros Activos ({totalActiveChanges})
                </h3>
              </div>

              {/* Filter by stylist */}
              {totalActiveChanges > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="text-neutral-500 text-[11px]">Filtrar:</span>
                  <select
                    value={stylistListFilter}
                    onChange={(e) => setStylistListFilter(e.target.value)}
                    className="bg-white border border-[#D9CEC2] rounded px-2 py-0.5 text-xs font-mono text-neutral-800 outline-hidden"
                  >
                    <option value="all">Todos los profesionales</option>
                    {validStylists.map(st => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {totalActiveChanges === 0 ? (
              <div className="bg-white border border-[#E2D8CC] rounded-lg p-6 text-center text-neutral-500">
                <Calendar className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs font-medium">No hay permutas ni días cerrados/abiertos registrados actualmente</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Todos los estilistas operan normalmente según su horario de descanso semanal.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {/* 1. Render Swap Pairs */}
                {filteredSwapPairs.map(({ closed, open }) => (
                  <div
                    key={`swap_${closed.id}`}
                    className="bg-white border-2 border-amber-300/80 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gradient-to-r from-amber-50/40 via-white to-emerald-50/40"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif-luxury font-bold text-xs sm:text-sm text-[#2C221C] uppercase">
                          {closed.stylistName || 'Estilista'}
                        </span>
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                          <ArrowLeftRight className="w-3 h-3 text-amber-700" />
                          <span>Permuta de Turno</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-0.5">
                        <div className="p-1.5 bg-rose-50 border border-rose-200 rounded flex items-center gap-2 text-rose-900">
                          <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <div className="truncate">
                            <span className="font-bold block text-[9.5px] uppercase text-rose-700">Día Cerrado:</span>
                            <span className="font-semibold">{formatDateFriendly(closed.date)}</span>
                          </div>
                        </div>

                        {open && (
                          <div className="p-1.5 bg-emerald-50 border border-emerald-200 rounded flex items-center gap-2 text-emerald-900">
                            <Sun className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <div className="truncate">
                              <span className="font-bold block text-[9.5px] uppercase text-emerald-700">Compensación (Abierto):</span>
                              <span className="font-semibold">{formatDateFriendly(open.date)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-neutral-600 italic font-sans truncate">
                        {closed.reason || 'Permuta de turno'}
                      </p>
                    </div>

                    <div className="flex items-center justify-end sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDeletePair(closed.id, closed.stylistName)}
                        className="px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md transition-colors flex items-center gap-1 font-mono font-medium cursor-pointer"
                        title="Deshacer permuta completa y volver al horario habitual de ambos días"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Deshacer</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* 2. Render Single Exceptions */}
                {filteredSingleExceptions.map((exc) => {
                  const isOff = exc.type === 'off';
                  const isMedical = (exc.reason || '').toLowerCase().includes('cita m') || (exc.reason || '').toLowerCase().includes('incapacidad');

                  return (
                    <div
                      key={exc.id}
                      className={`bg-white border rounded-lg p-2.5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                        isOff 
                          ? 'border-rose-200 bg-rose-50/20' 
                          : 'border-emerald-200 bg-emerald-50/20'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isOff ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isMedical ? (
                            <Stethoscope className="w-3.5 h-3.5" />
                          ) : isOff ? (
                            <Ban className="w-3.5 h-3.5" />
                          ) : (
                            <Sun className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div className="truncate min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-serif-luxury font-bold text-xs text-[#2C221C] uppercase">
                              {exc.stylistName || 'Estilista'}
                            </span>
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                              isOff ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {isOff ? (isMedical ? '🏥 Cita Médica (Cerrado)' : '⛔ Día Cerrado') : '☀️ Día Abierto'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-600 font-mono">
                            <span className="font-semibold text-neutral-900 bg-neutral-100 px-1.5 py-0.2 rounded">
                              {formatDateFriendly(exc.date)}
                            </span>
                            <span>•</span>
                            <span className="text-neutral-700 italic font-sans truncate">{exc.reason || 'Sin motivo'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDeleteSingle(exc.id, exc.stylistName)}
                          className="px-2 py-1 text-xs text-neutral-500 hover:text-rose-700 hover:bg-rose-50 border border-neutral-200 hover:border-rose-200 rounded transition-colors flex items-center gap-1 font-mono cursor-pointer"
                          title="Eliminar excepción y restaurar horario normal"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#EFE7DC] px-4 sm:px-6 py-2.5 border-t border-[#D9CEC2] flex items-center justify-between text-xs text-[#5C4A38] shrink-0">
          <span className="font-mono text-[11px] hidden sm:inline">
            CF Portadas · Control de Horarios, Cierres y Permutas
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#2C221C] hover:bg-[#4A3B32] text-white rounded-md text-xs font-serif-luxury uppercase tracking-wider font-bold transition-colors cursor-pointer"
            >
              Listo / Volver a la Agenda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
