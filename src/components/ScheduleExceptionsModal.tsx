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
  Plus, 
  Trash2, 
  CheckCircle, 
  X, 
  ArrowRight, 
  UserCheck, 
  Stethoscope, 
  ArrowLeftRight,
  Sparkles,
  RefreshCw,
  Sun,
  Ban,
  Check
} from 'lucide-react';

interface ScheduleExceptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stylists: Stylist[];
  exceptions?: StylistScheduleException[];
  selectedDate?: string;
  initialStylistId?: string;
  initialMode?: 'swap' | 'close' | 'open';
}

const DAY_NAMES_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTH_NAMES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const ScheduleExceptionsModal: React.FC<ScheduleExceptionsModalProps> = ({
  isOpen,
  onClose,
  stylists,
  exceptions: propExceptions,
  selectedDate,
  initialStylistId,
  initialMode = 'swap'
}) => {
  const [internalExceptions, setInternalExceptions] = useState<StylistScheduleException[]>(() => getStoredScheduleExceptions());
  const [actionTab, setActionTab] = useState<'swap' | 'close' | 'open'>(initialMode);
  const [selectedStylistId, setSelectedStylistId] = useState(initialStylistId || stylists.find(s => s.id !== 'cualquiera')?.id || 'yorleny');
  
  // Dates state
  const [closeDate, setCloseDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [openDate, setOpenDate] = useState('');
  const [reason, setReason] = useState('Cita médica');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Synchronize when opening or when props change
  useEffect(() => {
    if (selectedDate) {
      setCloseDate(selectedDate);
    }
    if (initialStylistId) {
      setSelectedStylistId(initialStylistId);
    }
    if (initialMode) {
      setActionTab(initialMode);
    }
  }, [selectedDate, initialStylistId, initialMode, isOpen]);

  // Subscribe to storage changes for real-time reactivity across devices
  useEffect(() => {
    const unsub = subscribeToScheduleExceptions((list) => {
      setInternalExceptions(list);
    });
    return () => unsub();
  }, []);

  const currentStylist = useMemo(() => {
    return stylists.find(s => s.id === selectedStylistId) || stylists[0];
  }, [stylists, selectedStylistId]);

  // Calculate regular off days for current stylist
  const stylistOffDaysText = useMemo(() => {
    if (!currentStylist?.offDays || currentStylist.offDays.length === 0) return 'Ninguno fijo';
    return currentStylist.offDays.map(d => DAY_NAMES_ES[d]).join(', ');
  }, [currentStylist]);

  // Compute next-week suggestions for day off (when stylist normally does NOT work)
  const nextWeekOffDaySuggestions = useMemo(() => {
    if (!currentStylist?.offDays || currentStylist.offDays.length === 0 || !closeDate) return [];
    const [y, m, d] = closeDate.split('-').map(Number);
    const refDate = new Date(y, m - 1, d);

    const suggestions: { date: string; formatted: string; dayName: string }[] = [];
    // Scan 5 to 13 days ahead to cover the next week window
    for (let offset = 5; offset <= 13; offset++) {
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
          dayName: DAY_NAMES_ES[dow],
          formatted: `${DAY_NAMES_ES[dow]} ${target.getDate()} de ${MONTH_NAMES_ES[target.getMonth()]}`
        });
      }
    }
    return suggestions;
  }, [currentStylist, closeDate]);

  // Auto-fill openDate with the first suggestion if empty and in swap mode
  useEffect(() => {
    if (actionTab === 'swap' && nextWeekOffDaySuggestions.length > 0 && !openDate) {
      setOpenDate(nextWeekOffDaySuggestions[0].date);
    }
  }, [actionTab, nextWeekOffDaySuggestions, openDate]);

  if (!isOpen) return null;

  const currentExceptions = Array.isArray(propExceptions) ? propExceptions : (Array.isArray(internalExceptions) ? internalExceptions : []);

  // Format date helper
  const formatDateFriendly = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return `${DAY_NAMES_ES[dt.getDay()]} ${dt.getDate()} de ${MONTH_NAMES_ES[dt.getMonth()]}`;
    } catch {
      return dateStr;
    }
  };

  const handleSaveSwap = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedStylistId || !closeDate || !openDate) {
      setErrorMsg('Por favor seleccione la fecha a cerrar y la fecha a abrir.');
      return;
    }

    if (closeDate === openDate) {
      setErrorMsg('La fecha a cerrar y la fecha a abrir deben ser diferentes.');
      return;
    }

    const stylist = stylists.find(s => s.id === selectedStylistId);
    const stylistName = stylist?.name || selectedStylistId;

    saveScheduleSwap({
      stylistId: selectedStylistId,
      stylistName,
      closeDate,
      openDate,
      reason: reason.trim() || 'Permuta de turno con la próxima semana'
    });

    setSuccessMsg(`✓ Permuta registrada con éxito: ${stylistName} no laborará el ${formatDateFriendly(closeDate)} y laborará en compensación el ${formatDateFriendly(openDate)}.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleSaveSingle = (e: React.FormEvent, type: 'off' | 'working') => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedStylistId || !closeDate || !reason.trim()) {
      setErrorMsg('Por favor complete todos los campos.');
      return;
    }

    const stylist = stylists.find(s => s.id === selectedStylistId);
    const stylistName = stylist?.name || selectedStylistId;

    saveScheduleException({
      stylistId: selectedStylistId,
      stylistName,
      date: closeDate,
      type,
      reason: reason.trim()
    });

    setSuccessMsg(
      type === 'off'
        ? `✓ Día cerrado: ${stylistName} no atenderá citas el ${formatDateFriendly(closeDate)} (${reason}).`
        : `✓ Día abierto: ${stylistName} estará disponible para atender citas el ${formatDateFriendly(closeDate)}.`
    );
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeleteSingle = (id: string, stylistName: string) => {
    deleteScheduleException(id);
    setSuccessMsg(`Registro eliminado. Se restablece el horario habitual para ${stylistName}.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeletePair = (id: string, stylistName: string) => {
    deleteScheduleExceptionPair(id);
    setSuccessMsg(`✓ Permuta eliminada para ${stylistName}. Ambos días vuelven a su horario regular.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Group exceptions into pairs (swaps) and singles
  const { swapPairs, singleExceptions } = useMemo(() => {
    const pairs: { closed: StylistScheduleException; open?: StylistScheduleException }[] = [];
    const singles: StylistScheduleException[] = [];
    const processedIds = new Set<string>();

    const sorted = [...currentExceptions].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    for (const exc of sorted) {
      if (processedIds.has(exc.id)) continue;

      if (exc.replacesDate && exc.type === 'off') {
        // Look for corresponding 'working' exception for the same stylist
        const partner = sorted.find(
          other =>
            other.id !== exc.id &&
            other.stylistId.toLowerCase() === exc.stylistId.toLowerCase() &&
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
        // Look for partner if not already processed
        const partner = sorted.find(
          other =>
            other.id !== exc.id &&
            other.stylistId.toLowerCase() === exc.stylistId.toLowerCase() &&
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-[#D9CEC2] w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#2C221C] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-[#4A3B32]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#8C6B4D]/30 border border-[#8C6B4D]/60 flex items-center justify-center text-[#E5D5C5] shrink-0">
              <ArrowLeftRight className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif-luxury uppercase tracking-wider font-bold text-[#F5EFEB]">
                Permutas y Cierre de Días
              </h2>
              <p className="text-xs text-[#C2B2A3] font-mono">
                Cierra días de ausencia y abre días de descanso la próxima semana
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-300 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-[#FAF8F5]">
          
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-lg flex items-center gap-2 animate-in fade-in font-medium">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Tabs Selector */}
          <div className="bg-white p-1 rounded-lg border border-[#D9CEC2] flex gap-1 shadow-xs">
            <button
              type="button"
              onClick={() => setActionTab('swap')}
              className={`flex-1 py-2 px-2.5 rounded-md text-xs font-serif-luxury uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                actionTab === 'swap'
                  ? 'bg-[#2C221C] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <ArrowLeftRight className={`w-3.5 h-3.5 ${actionTab === 'swap' ? 'text-amber-300' : 'text-[#8C6B4D]'}`} />
              <span>Intercambiar / Permutar Día</span>
            </button>

            <button
              type="button"
              onClick={() => setActionTab('close')}
              className={`flex-1 py-2 px-2 rounded-md text-xs font-serif-luxury uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                actionTab === 'close'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-rose-700 hover:bg-rose-50/60'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Solo Cerrar Día</span>
            </button>

            <button
              type="button"
              onClick={() => setActionTab('open')}
              className={`flex-1 py-2 px-2 rounded-md text-xs font-serif-luxury uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                actionTab === 'open'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-emerald-700 hover:bg-emerald-50/60'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Solo Abrir Día</span>
            </button>
          </div>

          {/* Stylist Selector (Shared across modes) */}
          <div className="bg-white p-4 rounded-xl border border-[#D9CEC2] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-[#F2ECE5]">
              <div>
                <label className="block text-xs uppercase font-bold text-[#5C4A38] font-mono">
                  Profesional del Salón
                </label>
                <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                  Descanso regular: <strong className="text-[#8C6B4D]">{stylistOffDaysText}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {stylists.filter(s => s.id !== 'cualquiera').map(st => {
                const isSelected = selectedStylistId === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setSelectedStylistId(st.id);
                      setOpenDate('');
                    }}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF6F0] border-[#8C6B4D] text-[#2C221C] ring-2 ring-[#8C6B4D]/30 shadow-xs'
                        : 'bg-white border-[#E2D8CC] text-neutral-700 hover:border-[#8C6B4D]/60 hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-serif-luxury shrink-0 ${
                      isSelected ? 'bg-[#2C221C] text-gold-champagne' : 'bg-[#EFEAE2] text-neutral-700'
                    }`}>
                      {st.avatarLetter}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-bold font-serif-luxury uppercase truncate">
                        {st.name}
                      </div>
                      <div className="text-[10px] text-neutral-500 truncate font-mono">
                        {st.offDays && st.offDays.length > 0 ? `Desc: ${st.offDays.map(d => DAY_NAMES_ES[d].substring(0, 3)).join(',')}` : 'Sin fijos'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ======================================================== */}
          {/* TAB 1: SWAP DAYS (CERRAR UN DÍA Y ABRIR EL DE LA OTRA SEMANA) */}
          {/* ======================================================== */}
          {actionTab === 'swap' && (
            <form onSubmit={handleSaveSwap} className="bg-white p-4 sm:p-5 rounded-xl border-2 border-[#8C6B4D]/40 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[#F2ECE5] pb-2.5">
                <ArrowLeftRight className="w-4 h-4 text-[#8C6B4D]" />
                <h3 className="text-xs sm:text-sm font-serif-luxury uppercase font-bold text-[#2C221C] tracking-wider">
                  Permuta de Turno: Cerrar Día & Abrir Día de la Próxima Semana
                </h3>
              </div>

              <div className="text-xs text-neutral-600 leading-relaxed bg-[#FAF8F5] p-3 rounded-lg border border-[#E2D8CC]">
                Esta opción cierra el día de ausencia para <strong>{currentStylist?.name}</strong> y habilita automáticamente para atender citas en su día de descanso de la siguiente semana.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Date to CLOSE */}
                <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] uppercase font-bold text-rose-900 font-mono flex items-center gap-1">
                      <Ban className="w-3.5 h-3.5 text-rose-600" />
                      <span>1. Día a CERRAR</span>
                    </label>
                    {selectedDate && closeDate !== selectedDate && (
                      <button
                        type="button"
                        onClick={() => setCloseDate(selectedDate)}
                        className="text-[10px] text-rose-700 hover:underline font-mono"
                      >
                        Usar fecha vista
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={closeDate}
                    onChange={(e) => setCloseDate(e.target.value)}
                    className="w-full bg-white border border-rose-300 rounded-md px-3 py-1.5 text-xs font-mono text-neutral-800 focus:ring-1 focus:ring-rose-500 outline-hidden"
                    required
                  />
                  <p className="text-[10px] text-rose-700 font-mono">
                    {formatDateFriendly(closeDate)} (No atenderá citas)
                  </p>
                </div>

                {/* 2. Date to OPEN */}
                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200 space-y-2">
                  <label className="text-[11px] uppercase font-bold text-emerald-900 font-mono flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-emerald-600" />
                    <span>2. Día a ABRIR (La otra semana)</span>
                  </label>
                  <input
                    type="date"
                    value={openDate}
                    onChange={(e) => setOpenDate(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-md px-3 py-1.5 text-xs font-mono text-neutral-800 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                    required
                  />
                  <p className="text-[10px] text-emerald-700 font-mono">
                    {openDate ? `${formatDateFriendly(openDate)} (Estará disponible)` : 'Seleccione una fecha'}
                  </p>
                </div>
              </div>

              {/* Automatic Suggestion Chips for Next Week */}
              {nextWeekOffDaySuggestions.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-[#5C4A38] font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Sugerencias automáticas (Días libres habituales de la próxima semana):</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {nextWeekOffDaySuggestions.map(sug => {
                      const isSelected = openDate === sug.date;
                      return (
                        <button
                          key={sug.date}
                          type="button"
                          onClick={() => setOpenDate(sug.date)}
                          className={`px-2.5 py-1 rounded text-xs font-mono transition-all flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-700 text-white font-bold shadow-xs'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
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
              <div>
                <label className="block text-[11px] uppercase font-bold text-[#5C4A38] font-mono mb-1">
                  Motivo de la permuta
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['Cita médica', 'Permuta de turno', 'Compensación de día libre', 'Asunto personal'].map((r) => (
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
                  placeholder="Ej: Cita médica en San José, cambio de guardia..."
                  className="w-full bg-[#FAF8F5] border border-[#D9CEC2] rounded-md px-3 py-1.5 text-xs font-sans text-neutral-800 focus:ring-1 focus:ring-[#8C6B4D] outline-hidden"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 border-t border-[#F2ECE5] flex items-center justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#2C221C] hover:bg-[#4A3B32] text-white rounded-lg text-xs font-serif-luxury uppercase tracking-wider font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <ArrowLeftRight className="w-4 h-4 text-amber-300" />
                  <span>Aplicar Permuta (Cerrar {formatDateFriendly(closeDate)} y Abrir {openDate ? formatDateFriendly(openDate) : '...'})</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 2: SOLO CERRAR DÍA                                  */}
          {/* ======================================================== */}
          {actionTab === 'close' && (
            <form onSubmit={(e) => handleSaveSingle(e, 'off')} className="bg-white p-4 sm:p-5 rounded-xl border-2 border-rose-300 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-rose-100 pb-2.5">
                <Ban className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs sm:text-sm font-serif-luxury uppercase font-bold text-rose-950 tracking-wider">
                  Cerrar Día para {currentStylist?.name} (Ausencia / Libre Puntual)
                </h3>
              </div>

              <div className="text-xs text-neutral-600 bg-rose-50/40 p-3 rounded-lg border border-rose-200">
                Usa esta opción si el profesional necesita ausentarse en una fecha específica (por cita médica, incapacidad o descanso) sin abrir otro día de compensación.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#5C4A38] font-mono mb-1">
                    Fecha a Cerrar
                  </label>
                  <input
                    type="date"
                    value={closeDate}
                    onChange={(e) => setCloseDate(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#D9CEC2] rounded-md px-3 py-2 text-xs font-mono text-neutral-800 focus:ring-1 focus:ring-rose-500 outline-hidden"
                    required
                  />
                  <p className="text-[10px] text-neutral-500 font-mono mt-1">
                    {formatDateFriendly(closeDate)}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#5C4A38] font-mono mb-1">
                    Motivo de la ausencia
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej: Cita médica, Asunto familiar, Vacaciones..."
                    className="w-full bg-[#FAF8F5] border border-[#D9CEC2] rounded-md px-3 py-2 text-xs font-sans text-neutral-800 focus:ring-1 focus:ring-rose-500 outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-serif-luxury uppercase tracking-wider font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                  <span>Confirmar Cierre de Día ({formatDateFriendly(closeDate)})</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 3: SOLO ABRIR DÍA                                   */}
          {/* ======================================================== */}
          {actionTab === 'open' && (
            <form onSubmit={(e) => handleSaveSingle(e, 'working')} className="bg-white p-4 sm:p-5 rounded-xl border-2 border-emerald-300 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-emerald-100 pb-2.5">
                <Sun className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs sm:text-sm font-serif-luxury uppercase font-bold text-emerald-950 tracking-wider">
                  Abrir Día de Trabajo para {currentStylist?.name} (Horario Extra / Especial)
                </h3>
              </div>

              <div className="text-xs text-neutral-600 bg-emerald-50/40 p-3 rounded-lg border border-emerald-200">
                Usa esta opción si el profesional desea estar disponible para atender citas en una fecha que normalmente tiene libre (día feriado, guardia especial o día adicional).
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#5C4A38] font-mono mb-1">
                    Fecha a Habilitar / Abrir
                  </label>
                  <input
                    type="date"
                    value={closeDate}
                    onChange={(e) => setCloseDate(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#D9CEC2] rounded-md px-3 py-2 text-xs font-mono text-neutral-800 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                    required
                  />
                  <p className="text-[10px] text-neutral-500 font-mono mt-1">
                    {formatDateFriendly(closeDate)}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#5C4A38] font-mono mb-1">
                    Descripción / Motivo
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej: Día adicional de trabajo, guardia especial..."
                    className="w-full bg-[#FAF8F5] border border-[#D9CEC2] rounded-md px-3 py-2 text-xs font-sans text-neutral-800 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-serif-luxury uppercase tracking-wider font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Sun className="w-4 h-4" />
                  <span>Confirmar Apertura de Día ({formatDateFriendly(closeDate)})</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* LIST OF REGISTERED SWAPS & EXCEPTIONS                    */}
          {/* ======================================================== */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs uppercase font-bold tracking-wider text-[#5C4A38] font-mono flex items-center justify-between">
              <span>Cambios y Permutas Activas ({swapPairs.length + singleExceptions.length})</span>
            </h3>

            {swapPairs.length === 0 && singleExceptions.length === 0 ? (
              <div className="bg-white border border-[#E2D8CC] rounded-lg p-6 text-center text-neutral-500">
                <Calendar className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs font-medium">No hay permutas ni excepciones registradas actualmente</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Todos los estilistas operan con su horario de descanso semanal regular.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* 1. Render Swap Pairs */}
                {swapPairs.map(({ closed, open }) => (
                  <div
                    key={`swap_${closed.id}`}
                    className="bg-white border-2 border-amber-300/80 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-50/40 via-white to-emerald-50/40"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif-luxury font-bold text-sm text-[#2C221C] uppercase">
                          {closed.stylistName}
                        </span>
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                          <ArrowLeftRight className="w-3 h-3 text-amber-700" />
                          <span>Permuta de Turno</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                        <div className="p-2 bg-rose-50 border border-rose-200 rounded flex items-center gap-2 text-rose-900">
                          <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <div>
                            <span className="font-bold block text-[10px] uppercase text-rose-700">Día Cerrado:</span>
                            <span className="font-semibold">{formatDateFriendly(closed.date)}</span>
                          </div>
                        </div>

                        {open && (
                          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded flex items-center gap-2 text-emerald-900">
                            <Sun className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <div>
                              <span className="font-bold block text-[10px] uppercase text-emerald-700">Día Abierto (Compensación):</span>
                              <span className="font-semibold">{formatDateFriendly(open.date)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-neutral-600 italic font-sans pl-1">
                        Motivo: {closed.reason}
                      </p>
                    </div>

                    <div className="flex items-center justify-end sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-200">
                      <button
                        type="button"
                        onClick={() => handleDeletePair(closed.id, closed.stylistName)}
                        className="px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-100/80 border border-rose-200 rounded-md transition-colors flex items-center gap-1 font-mono font-medium cursor-pointer"
                        title="Deshacer permuta completa y volver al horario habitual de ambos días"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Deshacer Permuta</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* 2. Render Single Exceptions */}
                {singleExceptions.map((exc) => {
                  const isOff = exc.type === 'off';
                  const isMedical = exc.reason.toLowerCase().includes('cita m');

                  return (
                    <div
                      key={exc.id}
                      className={`bg-white border rounded-lg p-3 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isOff 
                          ? 'border-rose-200 bg-rose-50/20' 
                          : 'border-emerald-200 bg-emerald-50/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
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

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-serif-luxury font-bold text-xs text-[#2C221C] uppercase">
                              {exc.stylistName}
                            </span>
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                              isOff ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {isOff ? (isMedical ? '🏥 Cita Médica (Cerrado)' : 'Día Cerrado') : '✓ Día Abierto (Especial)'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-xs text-neutral-600 font-mono">
                            <span className="font-semibold text-neutral-900 bg-neutral-100 px-1.5 py-0.2 rounded">
                              {formatDateFriendly(exc.date)}
                            </span>
                            <span>•</span>
                            <span className="text-neutral-700 italic font-sans">{exc.reason}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteSingle(exc.id, exc.stylistName)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Eliminar excepción y restaurar horario normal"
                        >
                          <Trash2 className="w-4 h-4" />
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
        <div className="bg-[#EFE7DC] px-5 py-3 border-t border-[#D9CEC2] flex items-center justify-between text-xs text-[#5C4A38]">
          <span className="font-mono text-[11px]">
            CF Portadas · Control de Horarios y Permutas
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2C221C] hover:bg-[#4A3B32] text-white rounded-md text-xs font-serif-luxury uppercase tracking-wider font-bold transition-colors cursor-pointer"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
