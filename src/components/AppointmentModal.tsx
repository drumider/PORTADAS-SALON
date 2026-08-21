import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, User, Phone, Mail, FileText, CheckCircle, Save, Trash2, Scissors, AlertCircle, UserCheck, Sparkles, Plus, Minus } from 'lucide-react';
import { Appointment, AppointmentStatus, Client } from '../types';
import { SERVICES, STYLISTS, TIME_SLOTS } from '../constants';
import { getStoredClients, subscribeToClients, normalizePhone, getStoredAppointments } from '../utils/storage';
import { calculateAppointmentRange, formatDurationText, normalizeTimeTo24h, checkStylistBookingFeasibility, getServicePhases } from '../utils/timeUtils';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Omit<Appointment, 'id' | 'createdAt'> & { id?: string }) => void;
  onDelete?: (id: string) => void;
  initialAppointment?: Partial<Appointment> | null;
  selectedDate?: string;
  prefilledClient?: Client | null;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialAppointment,
  selectedDate,
  prefilledClient
}) => {
  const defaultService = useMemo(() => {
    return SERVICES.find(s => s.name === 'Blower Corto') || SERVICES.find(s => s.id === '03') || SERVICES[0];
  }, []);

  const resolveService = (sId?: string, sName?: string) => {
    if (sId) {
      const byId = SERVICES.find(s => s.id === sId);
      if (byId) return byId;
    }
    if (sName) {
      const cleanName = sName.trim().toLowerCase();
      const exact = SERVICES.find(s => s.name.trim().toLowerCase() === cleanName);
      if (exact) return exact;
      const partial = SERVICES.find(s => s.name.toLowerCase().includes(cleanName) || cleanName.includes(s.name.toLowerCase()));
      if (partial) return partial;
    }
    return defaultService;
  };

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [serviceId, setServiceId] = useState(() => (SERVICES.find(s => s.name === 'Blower Corto')?.id || SERVICES[0].id));
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [customDurationMinutes, setCustomDurationMinutes] = useState<number>(60);
  const [stylistId, setStylistId] = useState(STYLISTS[0].id);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [status, setStatus] = useState<AppointmentStatus>('Confirmada');
  const [notes, setNotes] = useState('');
  const [cancellationReason, setCancellationReason] = useState<string>('Asuntos personales');
  const [customCancelReason, setCustomCancelReason] = useState<string>('');

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [registeredClients, setRegisteredClients] = useState<Client[]>(getStoredClients());
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  // Subscribe to clients list
  useEffect(() => {
    const unsub = subscribeToClients((clients) => {
      setRegisteredClients(clients);
    });
    return () => unsub();
  }, []);

  // Filter client suggestions based on typing
  const clientSuggestions = useMemo(() => {
    const nameQ = clientName.toLowerCase().trim();
    const phoneQ = normalizePhone(clientPhone);

    if (!nameQ && !phoneQ) return [];

    return registeredClients.filter(c => {
      const matchName = nameQ && c.name.toLowerCase().includes(nameQ);
      const matchPhone = phoneQ && normalizePhone(c.phone).includes(phoneQ);
      return matchName || matchPhone;
    }).slice(0, 5);
  }, [clientName, clientPhone, registeredClients]);

  // Check if current input exactly matches an existing registered client
  const matchedClient = useMemo(() => {
    const phoneNorm = normalizePhone(clientPhone);
    const nameTrim = clientName.trim().toLowerCase();
    if (!phoneNorm && !nameTrim) return null;

    return registeredClients.find(c => 
      (phoneNorm && normalizePhone(c.phone) === phoneNorm) ||
      (nameTrim && c.name.trim().toLowerCase() === nameTrim)
    );
  }, [clientPhone, clientName, registeredClients]);

  // Handle selecting a suggested client
  const handleSelectClient = (client: Client) => {
    setClientName(client.name);
    setClientPhone(client.phone);
    if (client.email) setClientEmail(client.email);
    if (client.notes && !notes) setNotes(client.notes);
    setShowClientSuggestions(false);
  };

  // Initialize or reset form only when the modal opens or the specific appointment/slot changes
  useEffect(() => {
    if (!isOpen) return;

    if (prefilledClient) {
      setConfirmDelete(false);
      setClientName(prefilledClient.name || '');
      setClientPhone(prefilledClient.phone || '');
      setClientEmail(prefilledClient.email || '');
      setServiceId(defaultService.id);
      setStylistId(STYLISTS[0].id);
      setDate(selectedDate || new Date().toISOString().split('T')[0]);
      setTime('10:00');
      setStatus('Confirmada');
      setNotes(prefilledClient.notes || '');
      setShowClientSuggestions(false);
      return;
    }

    if (initialAppointment) {
      setConfirmDelete(false);
      setClientName(initialAppointment.clientName || '');
      setClientPhone(initialAppointment.clientPhone || '');
      setClientEmail(initialAppointment.clientEmail || '');
      
      const matchedS = resolveService(initialAppointment.serviceId, initialAppointment.serviceName);
      setServiceId(matchedS.id);
      
      // Match option if present in initialAppointment name
      let optDur = matchedS.durationMinutes || 60;
      if (matchedS.options && matchedS.options.length > 0) {
        const foundOpt = matchedS.options.find(o => 
          initialAppointment.serviceName?.toLowerCase().includes(o.name.toLowerCase())
        );
        setSelectedOptionId(foundOpt ? foundOpt.id : matchedS.options[0].id);
        if (foundOpt?.durationMinutes) optDur = foundOpt.durationMinutes;
      } else {
        setSelectedOptionId('');
      }

      setCustomDurationMinutes(initialAppointment.durationMinutes || optDur);

      const rawStylistId = initialAppointment.stylistId || '';
      const cleanStylistId = (rawStylistId === 'jorleny' ? 'yorleny' : rawStylistId) || STYLISTS[0].id;
      setStylistId(cleanStylistId);
      setDate(initialAppointment.date || selectedDate || new Date().toISOString().split('T')[0]);
      setTime(initialAppointment.time || '10:00');
      setStatus(initialAppointment.status || 'Confirmada');
      setNotes(initialAppointment.notes || '');
      setCancellationReason(initialAppointment.cancellationReason || 'Asuntos personales');
      setCustomCancelReason('');
      setShowClientSuggestions(false);
    } else {
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setServiceId(defaultService.id);
      setSelectedOptionId(defaultService.options?.[0]?.id || '');
      setCustomDurationMinutes(defaultService.options?.[0]?.durationMinutes || defaultService.durationMinutes || 60);
      setStylistId(STYLISTS[0].id);
      setDate(selectedDate || new Date().toISOString().split('T')[0]);
      setTime('10:00');
      setStatus('Confirmada');
      setNotes('');
      setCancellationReason('Asuntos personales');
      setCustomCancelReason('');
      setShowClientSuggestions(false);
    }
  }, [
    isOpen,
    initialAppointment?.id,
    initialAppointment?.serviceId,
    initialAppointment?.serviceName,
    initialAppointment?.durationMinutes,
    initialAppointment?.stylistId,
    initialAppointment?.time,
    initialAppointment?.date,
    selectedDate,
    prefilledClient,
    defaultService.id
  ]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const service = SERVICES.find(s => s.id === serviceId) || defaultService;
    const stylist = STYLISTS.find(s => s.id === stylistId) || STYLISTS[0];

    const currentOpt = service.options?.find(o => o.id === selectedOptionId) || (service.options ? service.options[0] : null);
    const finalServiceName = currentOpt ? `${service.name} (${currentOpt.name})` : service.name;
    const defaultDuration = currentOpt?.durationMinutes || service.durationMinutes || 60;
    const finalDuration = customDurationMinutes || defaultDuration;

    const finalCancelReason = status === 'Cancelada'
      ? (cancellationReason === 'Otro motivo (especificar)' 
          ? (customCancelReason.trim() || 'Otro motivo no especificado')
          : (customCancelReason.trim() ? `${cancellationReason} - ${customCancelReason.trim()}` : cancellationReason))
      : undefined;

    onSave({
      id: initialAppointment?.id,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim(),
      serviceId: service.id,
      serviceName: finalServiceName,
      stylistId: stylist.id,
      stylistName: stylist.name,
      date,
      time,
      durationMinutes: finalDuration,
      status,
      cancellationReason: finalCancelReason,
      cancelledAt: status === 'Cancelada' ? (initialAppointment?.cancelledAt || new Date().toISOString()) : undefined,
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
                <h3 className="text-xs sm:text-sm font-bold text-neutral-900 uppercase tracking-wider font-serif-luxury">
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
            
            {/* Matched Client Indicator Badge */}
            {matchedClient && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>{matchedClient.name}</strong> está registrado en el Directorio ({matchedClient.totalAppointments || 0} citas).
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-950 px-1.5 py-0.5 rounded">
                  Registrado
                </span>
              </div>
            )}

            {/* Client Info & Autocomplete */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
              <div className="relative">
                <label className="block text-[10px] uppercase tracking-wider text-[#8C6B4D] font-bold mb-1">
                  Nombre Cliente *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={clientName}
                    onFocus={() => setShowClientSuggestions(true)}
                    onChange={(e) => {
                      setClientName(e.target.value);
                      setShowClientSuggestions(true);
                    }}
                    placeholder="ej. María Rodríguez"
                    className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-base sm:text-xs pl-9 pr-3 py-2.5 outline-none font-medium"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-[10px] uppercase tracking-wider text-[#8C6B4D] font-bold mb-1">
                  Teléfono / WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onFocus={() => setShowClientSuggestions(true)}
                    onChange={(e) => {
                      setClientPhone(e.target.value);
                      setShowClientSuggestions(true);
                    }}
                    placeholder="ej. 8960 7575"
                    className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-base sm:text-xs pl-9 pr-3 py-2.5 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Suggestions Dropdown */}
              {showClientSuggestions && clientSuggestions.length > 0 && (
                <div className="col-span-1 sm:col-span-2 bg-white border border-[#B5916A] rounded-lg shadow-xl overflow-hidden z-20">
                  <div className="bg-[#FAF8F5] px-3 py-1.5 border-b border-neutral-200 flex items-center justify-between text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                    <span>Sugerencias de Clientes Registrados</span>
                    <button
                      type="button"
                      onClick={() => setShowClientSuggestions(false)}
                      className="text-neutral-400 hover:text-neutral-700"
                    >
                      Cerrar
                    </button>
                  </div>
                  <div className="divide-y divide-neutral-100 max-h-40 overflow-y-auto">
                    {clientSuggestions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectClient(c)}
                        className="w-full p-2.5 hover:bg-[#FAF8F5] flex items-center justify-between text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-[#2C221C] text-gold-champagne flex items-center justify-center text-[10px] font-bold">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-neutral-900 uppercase font-serif-luxury">{c.name}</p>
                            <p className="text-[11px] text-[#8C6B4D] font-mono">{c.phone}</p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded font-mono">
                          {c.totalAppointments || 1} cita(s)
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                  onChange={(e) => {
                    const newId = e.target.value;
                    setServiceId(newId);
                    const newService = SERVICES.find(s => s.id === newId);
                    if (newService?.options && newService.options.length > 0) {
                      setSelectedOptionId(newService.options[0].id);
                      setCustomDurationMinutes(newService.options[0].durationMinutes || newService.durationMinutes || 60);
                    } else {
                      setSelectedOptionId('');
                      setCustomDurationMinutes(newService?.durationMinutes || 60);
                    }
                  }}
                  className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-xs px-2.5 py-2.5 outline-none font-medium"
                >
                  {(() => {
                    const filtered = SERVICES.filter(s => {
                      if (!serviceSearch.trim()) return true;
                      const q = serviceSearch.toLowerCase().trim();
                      return s.name.toLowerCase().includes(q) || (s.code && s.code.toLowerCase().includes(q));
                    });
                    
                    // If current serviceId is not in filtered list, include it so the select doesn't break
                    const currentInFiltered = filtered.some(s => s.id === serviceId);
                    const currentObj = SERVICES.find(s => s.id === serviceId);
                    const listToRender = (!currentInFiltered && currentObj) ? [currentObj, ...filtered] : filtered;

                    return listToRender.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.code ? `[#${s.code}] ` : ''}{s.name} - {s.price} ({s.durationText || `${s.durationMinutes}min`})
                      </option>
                    ));
                  })()}
                </select>

                {(() => {
                  const currentService = SERVICES.find(s => s.id === serviceId);
                  if (!currentService) return null;
                  const currentOpt = currentService.options?.find(o => o.id === selectedOptionId) || currentService.options?.[0];

                  return (
                    <div className="space-y-1.5">
                      {currentService.options && currentService.options.length > 0 && (
                        <div className="p-2 bg-[#FAF5EE] border border-[#E2D9CE] rounded space-y-1">
                          <span className="text-[10px] uppercase font-bold text-[#8C6B4D] block">
                            {currentService.optionLabel || 'Opción de esmaltado / zona'}:
                          </span>
                          <div className="grid grid-cols-3 gap-1">
                            {currentService.options.map(opt => {
                              const isOptSel = selectedOptionId === opt.id || (!selectedOptionId && opt.id === currentService.options![0].id);
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedOptionId(opt.id);
                                    if (opt.durationMinutes) {
                                      setCustomDurationMinutes(opt.durationMinutes);
                                    }
                                  }}
                                  className={`py-1 px-1.5 text-center text-[10px] rounded border transition-all ${
                                    isOptSel
                                      ? 'bg-[#8C6B4D] border-[#8C6B4D] text-white font-bold'
                                      : 'bg-white border-[#E2D9CE] text-neutral-700 hover:border-[#8C6B4D]'
                                  }`}
                                >
                                  <span className="block truncate">{opt.name}</span>
                                  {opt.price && <span className="block font-mono text-[9px] opacity-90">{opt.price}</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="text-[10px] text-neutral-600 bg-[#FAF8F5] px-2 py-1 border border-[#EAE3DC] rounded flex items-center justify-between">
                        <span className="font-semibold text-neutral-900 truncate">
                          {currentOpt ? `${currentService.name} (${currentOpt.name})` : currentService.name}
                        </span>
                        <span className="font-mono text-[#8C6B4D] font-bold shrink-0 ml-1">
                          {currentOpt?.price || currentService.price} · {currentOpt?.durationText || currentService.durationText || `${currentService.durationMinutes}min`}
                        </span>
                      </div>
                    </div>
                  );
                })()}
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
                  {STYLISTS.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.role})
                    </option>
                  ))}
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
                  Hora de Inicio *
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

            {/* Time Duration Range & Duration Expander Controls */}
            {(() => {
              const selectedServiceObj = SERVICES.find(s => s.id === serviceId) || SERVICES[0];
              const effectiveDuration = customDurationMinutes || selectedServiceObj.durationMinutes || 60;
              const range = calculateAppointmentRange(time, effectiveDuration);
              const phases = getServicePhases(selectedServiceObj);
              const allAppointments = getStoredAppointments();
              
              // Filter out the appointment currently being edited so it doesn't collide with itself
              const otherAppointments = isEditing 
                ? allAppointments.filter(a => a.id !== initialAppointment?.id)
                : allAppointments;

              const feasibility = checkStylistBookingFeasibility({
                stylistId,
                dateStr: date,
                startTime: time,
                service: selectedServiceObj,
                durationMinutes: effectiveDuration,
                existingAppointments: otherAppointments,
                isStylistOff: (st, d) => {
                  if (!st || !st.offDays || !st.offDays.length || !d) return false;
                  const [y, m, day] = d.split('-').map(Number);
                  return st.offDays.includes(new Date(y, m - 1, day).getDay());
                },
                allStylists: STYLISTS
              });

              const handleAddMinutes = (mins: number) => {
                setCustomDurationMinutes(prev => Math.max(15, Math.min(480, (prev || 60) + mins)));
              };

              return (
                <div className="space-y-3 pt-1 border-t border-[#EAE3DC]">
                  {/* Duration Extender Header and Stepper */}
                  <div className="bg-[#FAF8F5] border border-[#B5916A]/40 p-3 rounded-lg space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-neutral-900 font-bold text-xs">
                        <Clock className="w-4 h-4 text-[#8C6B4D]" />
                        <span>Duración de la Cita / Tiempo:</span>
                      </div>
                      <span className="bg-[#8C6B4D] text-white font-mono text-xs font-bold px-2.5 py-0.5 rounded shadow-2xs">
                        {range.durationText} ({effectiveDuration} min)
                      </span>
                    </div>

                    {/* Quick Extender Buttons */}
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block mb-1">
                        ⚡ Extender tiempo rápido:
                      </span>
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
                            className="py-1.5 px-1 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-300 text-emerald-950 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer flex items-center justify-center gap-0.5"
                          >
                            <Plus className="w-2.5 h-2.5 text-emerald-700" />
                            <span>{ext.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stepper + Presets */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAddMinutes(-15)}
                        disabled={effectiveDuration <= 15}
                        className="w-8 h-8 rounded border border-[#D8CEB8] bg-white hover:bg-[#F2ECE5] disabled:opacity-40 text-neutral-800 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        title="Reducir 15 minutos"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex-1 overflow-x-auto flex gap-1 py-0.5">
                        {[30, 45, 60, 75, 90, 120, 150, 180, 240].map(mins => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setCustomDurationMinutes(mins)}
                            className={`px-2 py-1 rounded text-[10px] font-mono font-bold shrink-0 transition-all cursor-pointer ${
                              effectiveDuration === mins
                                ? 'bg-[#8C6B4D] text-white border border-[#8C6B4D] shadow-2xs'
                                : 'bg-white border border-[#E2D9CE] text-neutral-700 hover:border-[#8C6B4D]'
                            }`}
                          >
                            {mins >= 60 ? (mins % 60 === 0 ? `${mins/60}h` : `${Math.floor(mins/60)}h ${mins%60}m`) : `${mins}m`}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddMinutes(15)}
                        disabled={effectiveDuration >= 480}
                        className="w-8 h-8 rounded border border-[#D8CEB8] bg-white hover:bg-[#F2ECE5] disabled:opacity-40 text-neutral-800 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        title="Aumentar 15 minutos"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Time Window Summary */}
                    <div className="text-[11px] text-neutral-700 bg-white/90 p-2 rounded border border-[#EAE3DC] flex items-center justify-between">
                      <span>
                        Horario reservado: <strong className="font-mono text-neutral-900">{range.startTime12} ➔ {range.endTime12}</strong>
                      </span>
                      {selectedServiceObj.durationMinutes !== effectiveDuration && (
                        <span className="text-[10px] text-[#8C6B4D] font-bold font-mono">
                          (Base servicio: {selectedServiceObj.durationMinutes}m)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Phases breakdown chips */}
                  {phases.length > 1 && (
                    <div className="p-2.5 bg-amber-50/50 border border-amber-200/70 rounded space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-amber-900 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#8C6B4D]" />
                          Fases de {selectedServiceObj.name}:
                        </span>
                        <span className="text-[10px] font-mono text-neutral-600">
                          {phases.length} etapas
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {phases.map((p, idx) => (
                          <div
                            key={idx}
                            className={`p-1.5 rounded border text-[10px] flex items-center justify-between gap-1.5 ${
                              p.isStylistBusy
                                ? 'bg-amber-100/60 border-amber-300 text-amber-950 font-medium'
                                : 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${p.isStylistBusy ? 'bg-amber-600' : 'bg-emerald-600'}`} />
                              <span className="truncate">{p.name}</span>
                            </div>
                            <span className="font-mono font-bold shrink-0">
                              {p.durationMinutes}m {p.isStylistBusy ? '(Ocupado)' : '(Libre/Reposo)'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feasibility Alert / Reposo Confirmation */}
                  {!feasibility.allowed ? (
                    <div className="p-2.5 bg-rose-50 border border-rose-300 rounded text-xs text-rose-900 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold">Conflicto de Horario Detectado:</p>
                        <p className="text-[11px] text-rose-800">{feasibility.reason}</p>
                      </div>
                    </div>
                  ) : feasibility.isDuringReposo ? (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="flex-1">
                        <p className="font-bold">✨ Agendamiento en Espacio de Reposo:</p>
                        <p className="text-[11px] text-emerald-800">
                          El estilista tiene tiempo libre de reposo durante este horario. La cita encaja perfectamente.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })()}

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
                    className={`text-[10px] uppercase tracking-wider py-2.5 px-2 border font-bold transition-all text-center cursor-pointer ${
                      status === st
                        ? st === 'Confirmada'
                          ? 'border-emerald-400 bg-emerald-100 text-emerald-950 shadow-xs'
                          : st === 'Pendiente'
                          ? 'border-red-400 bg-red-100 text-red-950 ring-1 ring-red-300'
                          : st === 'Completada'
                          ? 'border-blue-400 bg-blue-100 text-blue-950'
                          : 'border-rose-400 bg-rose-100 text-rose-950'
                        : 'border-[#E2D9CE] bg-[#FAF8F5] text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {st === 'Pendiente' ? 'Por Aprobar' : st}
                  </button>
                ))}
              </div>

              {/* Cancellation Reason Box when Cancelada is selected */}
              {status === 'Cancelada' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2 text-xs"
                >
                  <div className="flex items-center gap-1.5 text-rose-950 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Motivo de Cancelación:</span>
                  </div>

                  <select
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full bg-white border border-rose-300 text-neutral-900 text-xs p-2 rounded outline-none"
                  >
                    <option value="Asuntos personales">Asuntos personales</option>
                    <option value="Enfermedad o salud">Enfermedad o salud</option>
                    <option value="Cambio de planes / Imprevisto laboral">Cambio de planes / Imprevisto laboral</option>
                    <option value="Inconveniente de transporte o tránsito">Inconveniente de transporte o tránsito</option>
                    <option value="Conflicto de horario / Reagendará después">Conflicto de horario / Reagendará después</option>
                    <option value="Otro motivo (especificar)">Otro motivo (especificar)</option>
                  </select>

                  {cancellationReason === 'Otro motivo (especificar)' && (
                    <input
                      type="text"
                      value={customCancelReason}
                      onChange={(e) => setCustomCancelReason(e.target.value)}
                      placeholder="Escribe el motivo detallado..."
                      className="w-full bg-white border border-rose-300 text-neutral-900 text-xs p-2 rounded outline-none"
                    />
                  )}

                  <p className="text-[10px] text-rose-700 italic">
                    ℹ️ Al guardar como "Cancelada", el espacio queda libre en el calendario y se registra el motivo.
                  </p>
                </motion.div>
              )}
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
