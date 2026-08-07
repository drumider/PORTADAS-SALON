import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, User, Phone, Mail, FileText, CheckCircle, Save, Trash2, Scissors, AlertCircle } from 'lucide-react';
import { Appointment, AppointmentStatus } from '../types';
import { SERVICES, STYLISTS, TIME_SLOTS } from '../constants';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Omit<Appointment, 'id' | 'createdAt'> & { id?: string }) => void;
  onDelete?: (id: string) => void;
  initialAppointment?: Partial<Appointment> | null;
  selectedDate?: string;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialAppointment,
  selectedDate
}) => {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [serviceId, setServiceId] = useState(SERVICES[0].id);
  const [serviceSearch, setServiceSearch] = useState('');
  const [stylistId, setStylistId] = useState(STYLISTS[0].id);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [status, setStatus] = useState<AppointmentStatus>('Confirmada');
  const [notes, setNotes] = useState('');

  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (initialAppointment) {
      setConfirmDelete(false);
      setClientName(initialAppointment.clientName || '');
      setClientPhone(initialAppointment.clientPhone || '');
      setClientEmail(initialAppointment.clientEmail || '');
      setServiceId(initialAppointment.serviceId || SERVICES[0].id);
      setStylistId(initialAppointment.stylistId || STYLISTS[0].id);
      setDate(initialAppointment.date || selectedDate || new Date().toISOString().split('T')[0]);
      setTime(initialAppointment.time || '10:00');
      setStatus(initialAppointment.status || 'Confirmada');
      setNotes(initialAppointment.notes || '');
    } else {
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setServiceId(SERVICES[0].id);
      setStylistId(STYLISTS[0].id);
      setDate(selectedDate || new Date().toISOString().split('T')[0]);
      setTime('10:00');
      setStatus('Confirmada');
      setNotes('');
    }
  }, [initialAppointment, selectedDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const service = SERVICES.find(s => s.id === serviceId) || SERVICES[0];
    const stylist = STYLISTS.find(s => s.id === stylistId) || STYLISTS[0];

    onSave({
      id: initialAppointment?.id,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim(),
      serviceId: service.id,
      serviceName: service.name,
      stylistId: stylist.id,
      stylistName: stylist.name,
      date,
      time,
      durationMinutes: service.durationMinutes,
      status,
      notes: notes.trim()
    });
  };

  const isEditing = Boolean(initialAppointment?.id);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-lg bg-white border-t sm:border border-[#D8CEB8] shadow-2xl overflow-hidden relative rounded-t-2xl sm:rounded-none max-h-[92vh] sm:max-h-[90vh] flex flex-col"
        >
          {/* Mobile Handle Bar */}
          <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mt-2.5 sm:hidden" />

          {/* Header */}
          <div className="bg-[#FAF8F5] border-b border-[#EAE3DC] p-4 sm:p-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-[#B5916A]/40 bg-[#B5916A]/10 flex items-center justify-center text-[#8C6B4D] shrink-0">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-neutral-900 uppercase tracking-wider">
                  {isEditing ? 'Editar Cita' : 'Nueva Cita Manual'}
                </h3>
                <p className="text-[9px] sm:text-[10px] text-[#8C6B4D] uppercase tracking-widest font-bold">
                  CF Portadas · Administración
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-900 transition-colors p-2"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto bg-white flex-1">
            {/* Client Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#8C6B4D] font-bold mb-1">
                  Nombre Cliente *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="ej. María Rodríguez"
                    className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-base sm:text-xs pl-9 pr-3 py-2.5 outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#8C6B4D] font-bold mb-1">
                  Teléfono / WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="ej. 8888 8888"
                    className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-base sm:text-xs pl-9 pr-3 py-2.5 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-neutral-600 font-medium mb-1">
                Correo Electrónico (Opcional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="ej. cliente@correo.com"
                  className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-base sm:text-xs pl-9 pr-3 py-2.5 outline-none"
                />
              </div>
            </div>

            {/* Service & Stylist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] uppercase tracking-wider text-[#8C6B4D] font-bold">
                    Servicio Solicitado
                  </label>
                  <span className="text-[9px] text-neutral-500 font-mono">175 disponibles</span>
                </div>
                
                <input
                  type="text"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  placeholder="Filtrar por código o nombre (ej. 218)..."
                  className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-xs px-2.5 py-1.5 outline-none font-sans"
                />

                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-xs px-2.5 py-2.5 outline-none font-medium"
                >
                  {SERVICES.filter(s => {
                    if (!serviceSearch.trim()) return true;
                    const q = serviceSearch.toLowerCase().trim();
                    return s.name.toLowerCase().includes(q) || (s.code && s.code.toLowerCase().includes(q));
                  }).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code ? `[#${s.code}] ` : ''}{s.name} - {s.price} ({s.durationText || `${s.durationMinutes}min`})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#8C6B4D] font-bold mb-1">
                  Especialista / Estilista
                </label>
                <select
                  value={stylistId}
                  onChange={(e) => setStylistId(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-xs px-3 py-2.5 outline-none font-medium"
                >
                  {(() => {
                    const selectedServiceObj = SERVICES.find(s => s.id === serviceId);
                    const availableStylists = STYLISTS.filter(st => {
                      if (!selectedServiceObj) return true;
                      if (!st.allowedCategories || st.allowedCategories.length === 0) return true;
                      return st.allowedCategories.includes(selectedServiceObj.category);
                    });
                    return availableStylists.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.role.split('/')[0]})
                      </option>
                    ));
                  })()}
                </select>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#8C6B4D] font-bold mb-1">
                  Fecha *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-base sm:text-xs pl-9 pr-3 py-2.5 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#8C6B4D] font-bold mb-1">
                  Hora *
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-xs pl-9 pr-3 py-2.5 outline-none font-mono"
                  >
                    {TIME_SLOTS.map(t => {
                      const val24 = t.replace(' AM', '').replace(' PM', '');
                      return (
                        <option key={t} value={val24}>
                          {t} ({val24})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#8C6B4D] font-bold mb-1">
                Estado de la Cita
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Confirmada', 'Pendiente', 'Completada', 'Cancelada'] as AppointmentStatus[]).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`text-[10px] uppercase tracking-wider py-2.5 px-2 border font-bold transition-all text-center ${
                      status === st
                        ? st === 'Confirmada'
                          ? 'border-emerald-400 bg-emerald-100 text-emerald-950'
                          : st === 'Pendiente'
                          ? 'border-amber-400 bg-amber-100 text-amber-950'
                          : st === 'Completada'
                          ? 'border-blue-400 bg-blue-100 text-blue-950'
                          : 'border-red-400 bg-red-100 text-red-950'
                        : 'border-[#E2D9CE] bg-[#FAF8F5] text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-neutral-600 font-medium mb-1">
                Notas / Observaciones Específicas
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Preferencias del cliente, tratamientos previos o recordatorios..."
                className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-xs p-3 outline-none resize-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[#EAE3DC] flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 sticky bottom-0 bg-white py-2">
              {isEditing && onDelete ? (
                confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(initialAppointment!.id!);
                        onClose();
                      }}
                      className="text-xs uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 font-bold flex items-center justify-center gap-1.5 px-3 py-2.5 transition-colors animate-pulse w-full sm:w-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>¡Sí, Borrar!</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs text-neutral-500 hover:text-neutral-900 px-2 py-1"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="text-xs uppercase tracking-wider text-red-600 hover:text-red-800 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors w-full sm:w-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Cita</span>
                  </button>
                )
              ) : <div className="hidden sm:block" />}

              <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs uppercase tracking-wider text-neutral-600 hover:text-neutral-900 px-4 py-2.5 font-medium flex-1 sm:flex-none text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#2C221C] hover:bg-[#A68358] text-white text-xs uppercase tracking-[0.15em] font-bold px-5 py-3 sm:py-2.5 flex items-center justify-center gap-2 transition-colors shadow-sm flex-1 sm:flex-none"
                >
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? 'Guardar Cambios' : 'Agendar Cita'}</span>
                </button>
              </div>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
