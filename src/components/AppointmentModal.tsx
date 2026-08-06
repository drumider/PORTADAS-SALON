import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, User, Phone, Mail, FileText, CheckCircle, Save, Trash2, Scissors } from 'lucide-react';
import { Appointment, AppointmentStatus } from '../types';
import { SERVICES, STYLISTS } from '../constants';

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-warm-card border border-gold-champagne/40 shadow-2xl overflow-hidden relative"
        >
          {/* Header */}
          <div className="bg-dark-bg border-b border-warm-border p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-gold-champagne/30 bg-gold-champagne/10 flex items-center justify-center text-gold-champagne">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  {isEditing ? 'Editar Cita' : 'Nueva Cita Manual (Teléfono / Presencial)'}
                </h3>
                <p className="text-[10px] text-gold-champagne uppercase tracking-widest font-light">
                  CF Portadas · Administración
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Client Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gold-champagne/80 font-light mb-1">
                  Nombre Cliente *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="ej. María Rodríguez"
                    className="w-full bg-dark-bg border border-warm-border focus:border-gold-champagne text-white text-xs pl-9 pr-3 py-2.5 outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gold-champagne/80 font-light mb-1">
                  Teléfono / WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="ej. 8888 8888"
                    className="w-full bg-dark-bg border border-warm-border focus:border-gold-champagne text-white text-xs pl-9 pr-3 py-2.5 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-light/60 font-light mb-1">
                Correo Electrónico (Opcional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="ej. cliente@correo.com"
                  className="w-full bg-dark-bg border border-warm-border focus:border-gold-champagne text-white text-xs pl-9 pr-3 py-2.5 outline-none"
                />
              </div>
            </div>

            {/* Service & Stylist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gold-champagne/80 font-light mb-1">
                  Servicio Solicitado
                </label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full bg-dark-bg border border-warm-border focus:border-gold-champagne text-white text-xs px-3 py-2.5 outline-none uppercase font-serif-luxury"
                >
                  {SERVICES.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gold-champagne/80 font-light mb-1">
                  Especialista / Estilista
                </label>
                <select
                  value={stylistId}
                  onChange={(e) => setStylistId(e.target.value)}
                  className="w-full bg-dark-bg border border-warm-border focus:border-gold-champagne text-white text-xs px-3 py-2.5 outline-none uppercase font-serif-luxury"
                >
                  {STYLISTS.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.role.split('/')[0]})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gold-champagne/80 font-light mb-1">
                  Fecha *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-dark-bg border border-warm-border focus:border-gold-champagne text-white text-xs pl-9 pr-3 py-2.5 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gold-champagne/80 font-light mb-1">
                  Hora *
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-dark-bg border border-warm-border focus:border-gold-champagne text-white text-xs pl-9 pr-3 py-2.5 outline-none font-mono"
                  >
                    {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'].map(t => (
                      <option key={t} value={t}>{t} AM/PM</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gold-champagne/80 font-light mb-1">
                Estado de la Cita
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Confirmada', 'Pendiente', 'Completada', 'Cancelada'] as AppointmentStatus[]).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`text-[10px] uppercase tracking-wider py-2 px-2 border font-medium transition-all ${
                      status === st
                        ? st === 'Confirmada'
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-400'
                          : st === 'Pendiente'
                          ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                          : st === 'Completada'
                          ? 'border-blue-500 bg-blue-950/40 text-blue-300'
                          : 'border-red-500 bg-red-950/40 text-red-300'
                        : 'border-neutral-800 bg-dark-bg text-neutral-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-light/60 font-light mb-1">
                Notas / Observaciones Específicas
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Preferencias del cliente, tratamientos previos o recordatorios..."
                className="w-full bg-dark-bg border border-warm-border focus:border-gold-champagne text-white text-xs p-3 outline-none resize-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-warm-border flex items-center justify-between gap-3">
              {isEditing && onDelete ? (
                confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(initialAppointment!.id!);
                        onClose();
                      }}
                      className="text-xs uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 font-bold flex items-center gap-1.5 px-3 py-2 transition-colors animate-pulse"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>¡Sí, Borrar!</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs text-gray-400 hover:text-white px-2 py-1"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="text-xs uppercase tracking-wider text-red-400 hover:text-red-300 flex items-center gap-1.5 px-3 py-2 border border-red-900/50 hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Cita</span>
                  </button>
                )
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs uppercase tracking-wider text-gray-400 hover:text-white px-4 py-2.5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gold-champagne text-dark-bg hover:bg-white text-xs uppercase tracking-[0.15em] font-bold px-5 py-2.5 flex items-center gap-2 transition-colors shadow-md"
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
