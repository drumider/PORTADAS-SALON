import React, { useState, useEffect } from 'react';
import { Stylist, StylistScheduleException } from '../types';
import { saveScheduleException, deleteScheduleException, getStoredScheduleExceptions, subscribeToScheduleExceptions } from '../utils/storage';
import { Calendar, Clock, AlertCircle, Plus, Trash2, CheckCircle, X, ArrowRight, UserCheck, Stethoscope } from 'lucide-react';

interface ScheduleExceptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stylists: Stylist[];
  exceptions?: StylistScheduleException[];
  selectedDate?: string;
}

export const ScheduleExceptionsModal: React.FC<ScheduleExceptionsModalProps> = ({
  isOpen,
  onClose,
  stylists,
  exceptions: propExceptions,
  selectedDate
}) => {
  const [internalExceptions, setInternalExceptions] = useState<StylistScheduleException[]>(() => getStoredScheduleExceptions());
  const [isAdding, setIsAdding] = useState(false);
  const [selectedStylistId, setSelectedStylistId] = useState(stylists[0]?.id || 'yorleny');
  const [date, setDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'off' | 'working'>('off');
  const [reason, setReason] = useState('Cita médica');
  const [replacesDate, setReplacesDate] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Update date if selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate, isOpen]);

  // Subscribe to storage changes if prop not provided or for real-time updates
  useEffect(() => {
    const unsub = subscribeToScheduleExceptions((list) => {
      setInternalExceptions(list);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const currentExceptions = Array.isArray(propExceptions) ? propExceptions : (Array.isArray(internalExceptions) ? internalExceptions : []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStylistId || !date || !reason.trim()) {
      setErrorMsg('Por favor complete todos los campos requeridos.');
      return;
    }

    const stylist = stylists.find(s => s.id === selectedStylistId);
    saveScheduleException({
      stylistId: selectedStylistId,
      stylistName: stylist?.name || selectedStylistId,
      date,
      type,
      reason: reason.trim(),
      replacesDate: replacesDate.trim() || undefined
    });

    setIsAdding(false);
    setReason('Cita médica');
    setReplacesDate('');
    setErrorMsg('');
  };

  const handleDelete = (id: string, stylistName: string) => {
    if (window.confirm(`¿Desea eliminar este cambio temporal para ${stylistName}? Se restablecerá su horario habitual.`)) {
      deleteScheduleException(id);
    }
  };

  const sortedExceptions = [...currentExceptions].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-[#D9CEC2] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#2C221C] text-white px-6 py-4 flex items-center justify-between border-b border-[#4A3B32]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#8C6B4D]/30 border border-[#8C6B4D]/60 flex items-center justify-center text-[#E5D5C5]">
              <Clock className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif-luxury uppercase tracking-wider font-bold text-[#F5EFEB]">
                Horarios Especiales y Cambios Temporales
              </h2>
              <p className="text-xs text-[#C2B2A3] font-mono">
                Permutas de días, citas médicas y ausencias programadas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-300 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-[#FAF8F5]">
          {/* Active Exceptions Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="font-semibold block mb-0.5">Gestión de Cambios de Turno y Citas Médicas</strong>
              Los cambios registrados aquí reemplazan temporalmente el horario habitual de cada profesional para las fechas indicadas, sin afectar sus días fijos del resto del año.
            </div>
          </div>

          {/* List of active exceptions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase font-bold tracking-wider text-[#5C4A38] font-mono">
                Cambios Activos Registrados ({sortedExceptions.length})
              </h3>
              {!isAdding && (
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="px-3 py-1.5 bg-[#2C221C] text-white rounded-md text-xs font-serif-luxury uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#4A3B32] transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-300" />
                  Nuevo Cambio
                </button>
              )}
            </div>

            {sortedExceptions.length === 0 ? (
              <div className="bg-white border border-[#E2D8CC] rounded-lg p-8 text-center text-neutral-500">
                <Calendar className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm font-medium">No hay cambios temporales registrados</p>
                <p className="text-xs text-neutral-400 mt-1">
                  Todos los profesionales operan bajo su horario semanal regular.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sortedExceptions.map((exc) => {
                  const isOff = exc.type === 'off';
                  const isMedical = exc.reason.toLowerCase().includes('cita m');

                  return (
                    <div
                      key={exc.id}
                      className={`bg-white border rounded-lg p-3.5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isOff 
                          ? 'border-rose-200 hover:border-rose-300 bg-rose-50/20' 
                          : 'border-emerald-200 hover:border-emerald-300 bg-emerald-50/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isOff ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isMedical ? (
                            <Stethoscope className="w-4 h-4" />
                          ) : isOff ? (
                            <Calendar className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-serif-luxury font-bold text-sm text-[#2C221C] uppercase">
                              {exc.stylistName}
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                              isOff ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {isOff ? (isMedical ? '🏥 Cita Médica (Libre)' : 'Día Libre') : '✓ Labora (Especial)'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-xs text-neutral-600 font-mono">
                            <span className="font-semibold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded">
                              {exc.date}
                            </span>
                            <span>•</span>
                            <span className="text-neutral-700 italic">{exc.reason}</span>
                          </div>

                          {exc.replacesDate && (
                            <div className="text-[11px] text-[#8C6B4D] flex items-center gap-1.5 mt-1 font-mono">
                              <ArrowRight className="w-3 h-3 text-[#8C6B4D]" />
                              <span>Permuta con: <strong>{exc.replacesDate}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end sm:justify-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(exc.id, exc.stylistName)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Eliminar cambio y restaurar horario normal"
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

          {/* Add form */}
          {isAdding && (
            <form onSubmit={handleSave} className="bg-white border-2 border-[#8C6B4D]/40 rounded-xl p-5 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <h4 className="text-xs font-serif-luxury uppercase font-bold text-[#2C221C] tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#8C6B4D]" />
                  Registrar Cambio Temporal
                </h4>
                <button
                  type="button"
                  onClick={() => { setIsAdding(false); setErrorMsg(''); }}
                  className="text-xs text-neutral-400 hover:text-neutral-700 font-mono"
                >
                  Cancelar
                </button>
              </div>

              {errorMsg && (
                <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Stylist */}
                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#5C4A38] font-mono mb-1">
                    Profesional
                  </label>
                  <select
                    value={selectedStylistId}
                    onChange={(e) => setSelectedStylistId(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#D9CEC2] rounded-md px-3 py-2 text-xs font-serif-luxury text-neutral-800 focus:ring-1 focus:ring-[#8C6B4D] outline-hidden"
                  >
                    {stylists.filter(s => s.id !== 'cualquiera').map(st => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#5C4A38] font-mono mb-1">
                    Fecha del cambio
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#D9CEC2] rounded-md px-3 py-1.5 text-xs font-mono text-neutral-800 focus:ring-1 focus:ring-[#8C6B4D] outline-hidden"
                    required
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#5C4A38] font-mono mb-1">
                    Estado en esa fecha
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setType('off')}
                      className={`flex-1 py-1.5 px-2 rounded-md text-xs font-mono font-bold uppercase transition-all border ${
                        type === 'off'
                          ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-xs'
                          : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      Día Libre / Ausente
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('working')}
                      className={`flex-1 py-1.5 px-2 rounded-md text-xs font-mono font-bold uppercase transition-all border ${
                        type === 'working'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                          : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      Laborará (Disponible)
                    </button>
                  </div>
                </div>

                {/* Replaces Date */}
                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#5C4A38] font-mono mb-1">
                    Fecha que compensa / permuta (Opcional)
                  </label>
                  <input
                    type="date"
                    value={replacesDate}
                    onChange={(e) => setReplacesDate(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#D9CEC2] rounded-md px-3 py-1.5 text-xs font-mono text-neutral-800 focus:ring-1 focus:ring-[#8C6B4D] outline-hidden"
                    placeholder="YYYY-MM-DD"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[11px] uppercase font-bold text-[#5C4A38] font-mono mb-1">
                  Motivo o descripción
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Cita médica, Asunto personal, Cambio de turno..."
                  className="w-full bg-[#FAF8F5] border border-[#D9CEC2] rounded-md px-3 py-2 text-xs font-sans text-neutral-800 focus:ring-1 focus:ring-[#8C6B4D] outline-hidden"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 border border-neutral-300 rounded-md text-xs font-serif-luxury text-neutral-700 hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#2C221C] text-white rounded-md text-xs font-serif-luxury uppercase tracking-wider font-bold hover:bg-[#4A3B32] shadow-xs"
                >
                  Guardar Cambio
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#EFE7DC] px-6 py-3 border-t border-[#D9CEC2] flex items-center justify-between text-xs text-[#5C4A38]">
          <span className="font-mono">
            Salón CF Portadas · Gestión de Horarios
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2C221C] text-white rounded-md text-xs font-serif-luxury uppercase tracking-wider font-bold hover:bg-[#4A3B32]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
