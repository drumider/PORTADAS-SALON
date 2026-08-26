import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, User, Phone, Mail, FileText, CheckCircle, Save, Trash2, Scissors, AlertCircle, UserCheck, Sparkles, Plus, Minus, RotateCcw, Check, Layers, Edit3 } from 'lucide-react';
import { Appointment, AppointmentStatus, Client, ServicePhase } from '../types';
import { SERVICES, STYLISTS, TIME_SLOTS } from '../constants';
import { getStoredClients, subscribeToClients, normalizePhone, getStoredAppointments } from '../utils/storage';
import { calculateAppointmentRange, formatDurationText, normalizeTimeTo24h, checkStylistBookingFeasibility, getServicePhases } from '../utils/timeUtils';
import { searchAndRankServices } from '../utils/serviceSearch';

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

  const getLocalTodayDate = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

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
  const [customPhases, setCustomPhases] = useState<ServicePhase[]>([]);
  const [stylistId, setStylistId] = useState(STYLISTS[0].id);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [status, setStatus] = useState<AppointmentStatus>('Confirmada');
  const [notes, setNotes] = useState('');
  const [cancellationReason, setCancellationReason] = useState<string>('Asuntos personales');
  const [customCancelReason, setCustomCancelReason] = useState<string>('');
  const [isCreateAsNew, setIsCreateAsNew] = useState(false);

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
    setIsCreateAsNew(false);

    if (prefilledClient) {
      setConfirmDelete(false);
      setClientName(prefilledClient.name || '');
      setClientPhone(prefilledClient.phone || '');
      setClientEmail(prefilledClient.email || '');
      setServiceId(defaultService.id);
      setCustomPhases(getServicePhases(defaultService, defaultService.durationMinutes));
      setStylistId(STYLISTS[0].id);
      setDate(selectedDate || getLocalTodayDate());
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

      // If initialAppointment duration is smaller than service's catalog duration, prioritize catalog optDur
      const effectiveDuration = (initialAppointment.durationMinutes && initialAppointment.durationMinutes >= optDur)
        ? initialAppointment.durationMinutes
        : optDur;

      setCustomDurationMinutes(effectiveDuration);

      // Initialize phases from appointment if available, or calculate defaults
      if (initialAppointment.customPhases && initialAppointment.customPhases.length > 0) {
        setCustomPhases(JSON.parse(JSON.stringify(initialAppointment.customPhases)));
      } else {
        setCustomPhases(getServicePhases(matchedS, effectiveDuration));
      }

      const rawStylistId = initialAppointment.stylistId || '';
      const cleanStylistId = (rawStylistId === 'jorleny' ? 'yorleny' : rawStylistId) || STYLISTS[0].id;
      setStylistId(cleanStylistId);
      setDate(initialAppointment.date || selectedDate || getLocalTodayDate());
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
      const initDur = defaultService.options?.[0]?.durationMinutes || defaultService.durationMinutes || 60;
      setCustomDurationMinutes(initDur);
      setCustomPhases(getServicePhases(defaultService, initDur));
      setStylistId(STYLISTS[0].id);
      setDate(selectedDate || getLocalTodayDate());
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
    initialAppointment?.customPhases,
    initialAppointment?.stylistId,
    initialAppointment?.time,
    initialAppointment?.date,
    selectedDate,
    prefilledClient,
    defaultService.id
  ]);

  // Phase editing handlers
  const handleUpdatePhaseName = (idx: number, name: string) => {
    setCustomPhases(prev => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = { ...next[idx], name };
      }
      return next;
    });
  };

  const handleUpdatePhaseDuration = (idx: number, mins: number) => {
    const validMins = Math.max(5, Math.min(240, mins));
    setCustomPhases(prev => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = { ...next[idx], durationMinutes: validMins };
      }
      const total = next.reduce((acc, p) => acc + p.durationMinutes, 0);
      if (total > 0) setCustomDurationMinutes(total);
      return next;
    });
  };

  const handleTogglePhaseBusy = (idx: number) => {
    setCustomPhases(prev => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = { ...next[idx], isStylistBusy: !next[idx].isStylistBusy };
      }
      return next;
    });
  };

  const handleDeletePhase = (idx: number) => {
    setCustomPhases(prev => {
      const next = prev.filter((_, i) => i !== idx);
      const total = next.reduce((acc, p) => acc + p.durationMinutes, 0);
      if (total > 0) {
        setCustomDurationMinutes(total);
      }
      return next;
    });
  };

  const handleAddPhase = (name: string = 'Nueva Etapa', mins: number = 30, isBusy: boolean = true) => {
    const newPhase: ServicePhase = {
      name,
      durationMinutes: mins,
      isStylistBusy: isBusy,
      description: ''
    };
    setCustomPhases(prev => {
      const next = [...prev, newPhase];
      const total = next.reduce((acc, p) => acc + p.durationMinutes, 0);
      if (total > 0) setCustomDurationMinutes(total);
      return next;
    });
  };

  const handleResetPhases = () => {
    const currentService = SERVICES.find(s => s.id === serviceId) || defaultService;
    const defPhases = getServicePhases(currentService, currentService.durationMinutes || 60);
    setCustomPhases(defPhases);
    const total = defPhases.reduce((acc, p) => acc + p.durationMinutes, 0);
    setCustomDurationMinutes(total || currentService.durationMinutes || 60);
  };

  // Lock body scroll when modal is open to prevent background jumps/movements on mobile
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen]);

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

    const isEffectiveEditing = Boolean(initialAppointment?.id) && !isCreateAsNew;

    onSave({
      id: isEffectiveEditing ? initialAppointment?.id : undefined,
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
      customPhases: customPhases.length > 0 ? customPhases : undefined,
      status,
      cancellationReason: finalCancelReason,
      cancelledAt: status === 'Cancelada' ? (initialAppointment?.cancelledAt || new Date().toISOString()) : undefined,
      notes: notes.trim()
    });
  };

  const isEditing = Boolean(initialAppointment?.id) && !isCreateAsNew;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/65 backdrop-blur-xs overscroll-contain overflow-hidden touch-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="w-[calc(100vw-1.25rem)] sm:w-full max-w-lg bg-white border border-[#D8CEB8] shadow-2xl overflow-hidden relative rounded-2xl sm:rounded-none max-h-[92vh] sm:max-h-[88vh] flex flex-col mx-auto"
        >
          {/* Header */}
          <div className="bg-[#FAF8F5] border-b border-[#EAE3DC] p-3.5 sm:p-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 border border-[#B5916A]/40 bg-[#B5916A]/10 flex items-center justify-center text-[#8C6B4D] shrink-0 rounded-sm">
                <Scissors className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-neutral-900 uppercase tracking-wider font-serif-luxury truncate">
                  {isEditing ? 'Editar Cita' : (initialAppointment?.id && isCreateAsNew ? 'Nueva Cita Separada' : 'Nueva Cita Manual')}
                </h3>
                <p className="text-[9px] sm:text-[10px] text-[#8C6B4D] uppercase tracking-widest font-bold truncate">
                  CF Portadas · Administración
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-900 transition-colors p-1.5 shrink-0"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-3.5 sm:p-5 space-y-3.5">
              
              {/* Existing appointment context banner with toggle */}
              {initialAppointment?.id && (
                !isCreateAsNew ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Edit3 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="truncate">Modificando cita existente de: {initialAppointment.clientName}</span>
                      </div>
                      <p className="text-[11px] text-amber-800 truncate">
                        {initialAppointment.serviceName} a las {initialAppointment.time} ({initialAppointment.date})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreateAsNew(true)}
                      className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-400 text-amber-950 text-[10px] font-bold rounded uppercase tracking-wider shrink-0 cursor-pointer shadow-2xs transition-colors self-start sm:self-auto"
                      title="No sobreescribir la cita de 2:00 PM: agendar como una cita totalmente nueva"
                    >
                      + Agendar como Cita Nueva
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Modo: Cita Nueva Separada</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 truncate">
                        La cita original de {initialAppointment.clientName} ({initialAppointment.time}) NO será reemplazada.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreateAsNew(false)}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-[10px] font-bold rounded uppercase tracking-wider shrink-0 cursor-pointer shadow-2xs transition-colors self-start sm:self-auto"
                    >
                      Volver a Modificar
                    </button>
                  </div>
                )
              )}

              {/* Matched Client Indicator Badge */}
              {matchedClient && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      <strong>{matchedClient.name}</strong> está registrado en el Directorio ({matchedClient.totalAppointments || 0} citas).
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-950 px-1.5 py-0.5 rounded shrink-0 ml-1">
                    Registrado
                  </span>
                </div>
              )}

              {/* Client Info & Autocomplete */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                <div className="relative min-w-0">
                  <label className="block text-[10px] uppercase tracking-wider text-[#8C6B4D] font-bold mb-1">
                    Nombre Cliente *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                      className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-base sm:text-xs pl-9 pr-3 py-2 sm:py-2.5 outline-none font-medium rounded-none"
                    />
                  </div>
                </div>

                <div className="relative min-w-0">
                  <label className="block text-[10px] uppercase tracking-wider text-[#8C6B4D] font-bold mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                      className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-base sm:text-xs pl-9 pr-3 py-2 sm:py-2.5 outline-none font-mono rounded-none"
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
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-[#2C221C] text-gold-champagne flex items-center justify-center text-[10px] font-bold shrink-0">
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-neutral-900 uppercase font-serif-luxury truncate">{c.name}</p>
                              <p className="text-[11px] text-[#8C6B4D] font-mono">{c.phone}</p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded font-mono shrink-0 ml-1">
                            {c.totalAppointments || 1} cita(s)
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Email (Optional) */}
              <div className="min-w-0">
                <label className="block text-[10px] uppercase tracking-wider text-neutral-600 font-medium mb-1">
                  Correo Electrónico (Opcional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="ej. cliente@correo.com"
                    className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-base sm:text-xs pl-9 pr-3 py-2 sm:py-2.5 outline-none rounded-none"
                  />
                </div>
              </div>

              {/* Service & Stylist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] uppercase tracking-wider text-[#8C6B4D] font-bold">
                      Servicio Solicitado
                    </label>
                    <span className="text-[9px] text-neutral-500 font-mono">175 disponibles</span>
                  </div>
                  
                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setServiceSearch(val);
                      if (val.trim()) {
                        const ranked = searchAndRankServices(SERVICES, val);
                        if (ranked.length > 0) {
                          const topService = ranked[0];
                          setServiceId(topService.id);
                          if (topService.options && topService.options.length > 0) {
                            setSelectedOptionId(topService.options[0].id);
                            const optDur = topService.options[0].durationMinutes || topService.durationMinutes || 60;
                            setCustomDurationMinutes(optDur);
                            setCustomPhases(getServicePhases(topService, optDur));
                          } else {
                            setSelectedOptionId('');
                            const dur = topService.durationMinutes || 60;
                            setCustomDurationMinutes(dur);
                            setCustomPhases(getServicePhases(topService, dur));
                          }
                        }
                      }
                    }}
                    placeholder="Filtrar por código o nombre (ej. k, keratina, 218)..."
                    className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-base sm:text-xs px-2.5 py-2 sm:py-1.5 outline-none font-sans rounded-none"
                  />

                  <select
                    value={serviceId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setServiceId(newId);
                      const newService = SERVICES.find(s => s.id === newId);
                      if (newService?.options && newService.options.length > 0) {
                        setSelectedOptionId(newService.options[0].id);
                        const optDur = newService.options[0].durationMinutes || newService.durationMinutes || 60;
                        setCustomDurationMinutes(optDur);
                        setCustomPhases(getServicePhases(newService, optDur));
                      } else {
                        setSelectedOptionId('');
                        const dur = newService?.durationMinutes || 60;
                        setCustomDurationMinutes(dur);
                        setCustomPhases(getServicePhases(newService || defaultService, dur));
                      }
                    }}
                    className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-base sm:text-xs px-2.5 py-2 sm:py-2.5 outline-none font-medium rounded-none"
                  >
                    {(() => {
                      const filtered = searchAndRankServices(SERVICES, serviceSearch);
                      
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
                      <div className="space-y-1.5 min-w-0">
                        {currentService.options && currentService.options.length > 0 && (
                          <div className="p-2 bg-[#FAF5EE] border border-[#E2D9CE] rounded space-y-1 min-w-0">
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

                        <div className="text-[10px] text-neutral-600 bg-[#FAF8F5] px-2 py-1 border border-[#EAE3DC] rounded flex items-center justify-between min-w-0">
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

                <div className="min-w-0">
                  <label className="block text-[10px] uppercase tracking-wider text-[#8C6B4D] font-bold mb-1">
                    Especialista / Estilista
                  </label>
                  <select
                    value={stylistId}
                    onChange={(e) => setStylistId(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-base sm:text-xs px-3 py-2 sm:py-2.5 outline-none font-medium rounded-none"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label className="block text-[10px] uppercase tracking-wider text-[#8C6B4D] font-bold mb-1">
                    Fecha *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-base sm:text-xs pl-9 pr-3 py-2 sm:py-2.5 outline-none font-mono rounded-none"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <label className="block text-[10px] uppercase tracking-wider text-[#8C6B4D] font-bold mb-1">
                    Hora de Inicio *
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-base sm:text-xs pl-9 pr-3 py-2 sm:py-2.5 outline-none font-mono rounded-none"
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
                  customPhases: customPhases.length > 0 ? customPhases : undefined,
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

                const totalPhasesDuration = customPhases.reduce((acc, p) => acc + p.durationMinutes, 0);

                return (
                  <div className="space-y-3 pt-1 border-t border-[#EAE3DC] min-w-0">
                    {/* Duration Extender Header and Stepper */}
                    <div className="bg-[#FAF8F5] border border-[#B5916A]/40 p-3 rounded-lg space-y-2.5 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-neutral-900 font-bold text-xs">
                          <Clock className="w-4 h-4 text-[#8C6B4D]" />
                          <span>Duración Total de la Cita:</span>
                        </div>
                        <span className="bg-[#8C6B4D] text-white font-mono text-xs font-bold px-2.5 py-0.5 rounded shadow-2xs">
                          {range.durationText} ({effectiveDuration} min)
                        </span>
                      </div>

                      {/* Quick Extender Buttons */}
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block mb-1">
                          ⚡ Ajuste rápido de tiempo total:
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
                      <div className="flex items-center gap-2 pt-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleAddMinutes(-15)}
                          disabled={effectiveDuration <= 15}
                          className="w-8 h-8 rounded border border-[#D8CEB8] bg-white hover:bg-[#F2ECE5] disabled:opacity-40 text-neutral-800 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                          title="Reducir 15 minutos"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex-1 overflow-x-auto flex gap-1 py-1 no-scrollbar scroll-smooth min-w-0">
                          {[30, 45, 60, 75, 90, 120, 150, 180, 240, 300].map(mins => (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => setCustomDurationMinutes(mins)}
                              className={`px-2.5 py-1.5 rounded text-[11px] font-mono font-bold shrink-0 transition-all cursor-pointer ${
                                effectiveDuration === mins
                                  ? 'bg-[#8C6B4D] text-white border border-[#8C6B4D] shadow-xs'
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
                      <div className="text-[11px] text-neutral-700 bg-white/90 p-2 rounded border border-[#EAE3DC] flex items-center justify-between min-w-0">
                        <span className="truncate">
                          Horario: <strong className="font-mono text-neutral-900">{range.startTime12} ➔ {range.endTime12}</strong>
                        </span>
                        {selectedServiceObj.durationMinutes !== effectiveDuration && (
                          <span className="text-[10px] text-[#8C6B4D] font-bold font-mono shrink-0 ml-1">
                            (Base: {selectedServiceObj.durationMinutes}m)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Interactive & Editable Phases Manager */}
                    <div className="p-3 bg-[#FAF8F5] border border-[#B5916A]/50 rounded-lg space-y-2.5 min-w-0">
                      {/* Header */}
                      <div className="flex items-center justify-between gap-2 border-b border-[#EAE3DC] pb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                            <Sparkles className="w-4 h-4 text-[#8C6B4D] shrink-0" />
                            <span className="truncate">Fases y Etapas del Servicio</span>
                          </div>
                          <p className="text-[10px] text-neutral-500 truncate">
                            {customPhases.length} etapas definidas · {totalPhasesDuration} min total
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={handleResetPhases}
                            className="px-2 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-700 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Restablecer fases a las predeterminadas"
                          >
                            <RotateCcw className="w-3 h-3 text-neutral-500" />
                            <span>Restablecer</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddPhase('Nueva Etapa', 30, true)}
                            className="px-2.5 py-1 bg-[#8C6B4D] hover:bg-[#74553a] text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Etapa</span>
                          </button>
                        </div>
                      </div>

                      {/* Phase Items */}
                      {customPhases.length === 0 ? (
                        <div className="p-3 bg-white border border-dashed border-neutral-300 rounded text-center text-xs text-neutral-500 space-y-1.5">
                          <p>No hay fases individuales. El servicio se tomará como un único bloque continuo.</p>
                          <button
                            type="button"
                            onClick={handleResetPhases}
                            className="text-[#8C6B4D] font-bold hover:underline text-[11px]"
                          >
                            Cargar fases sugeridas del catálogo
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {customPhases.map((phase, idx) => (
                            <div
                              key={idx}
                              className={`p-2.5 rounded-md border transition-all space-y-2 ${
                                phase.isStylistBusy
                                  ? 'bg-amber-50/70 border-amber-300/80 shadow-2xs'
                                  : 'bg-emerald-50/70 border-emerald-300/80 shadow-2xs'
                              }`}
                            >
                              {/* Top row: Index badge, Name input, and Delete button */}
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                                  phase.isStylistBusy ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                                }`}>
                                  {idx + 1}
                                </span>
                                
                                <input
                                  type="text"
                                  value={phase.name}
                                  onChange={(e) => handleUpdatePhaseName(idx, e.target.value)}
                                  placeholder="Nombre de la etapa (ej. Aplicación, Reposo, Acabado)"
                                  className="flex-1 bg-white border border-[#D8CEB8] focus:border-[#8C6B4D] text-neutral-900 text-xs px-2 py-1 rounded outline-none font-semibold truncate"
                                />

                                <button
                                  type="button"
                                  onClick={() => handleDeletePhase(idx)}
                                  className="p-1 rounded text-rose-600 hover:text-rose-800 hover:bg-rose-100 transition-colors shrink-0 cursor-pointer"
                                  title={`Borrar etapa: ${phase.name}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Bottom row: Duration changer and Busy/Free toggle */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-black/5 text-[11px]">
                                {/* Duration stepper */}
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-bold text-neutral-500 uppercase mr-0.5">Tiempo:</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdatePhaseDuration(idx, phase.durationMinutes - 5)}
                                    disabled={phase.durationMinutes <= 5}
                                    className="w-5 h-5 rounded bg-white hover:bg-neutral-100 disabled:opacity-30 border border-neutral-300 text-neutral-800 flex items-center justify-center font-bold"
                                    title="-5 minutos"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="5"
                                    max="240"
                                    step="5"
                                    value={phase.durationMinutes}
                                    onChange={(e) => handleUpdatePhaseDuration(idx, Number(e.target.value))}
                                    className="w-12 text-center bg-white border border-neutral-300 font-mono font-bold text-xs py-0.5 rounded outline-none"
                                  />
                                  <span className="font-mono text-neutral-700 text-[10px]">min</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdatePhaseDuration(idx, phase.durationMinutes + 5)}
                                    disabled={phase.durationMinutes >= 240}
                                    className="w-5 h-5 rounded bg-white hover:bg-neutral-100 disabled:opacity-30 border border-neutral-300 text-neutral-800 flex items-center justify-center font-bold"
                                    title="+5 minutos"
                                  >
                                    +
                                  </button>

                                  {/* Quick duration presets */}
                                  <div className="hidden sm:flex items-center gap-0.5 ml-1.5">
                                    {[15, 30, 45, 60].map(dur => (
                                      <button
                                        key={dur}
                                        type="button"
                                        onClick={() => handleUpdatePhaseDuration(idx, dur)}
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
                                          phase.durationMinutes === dur
                                            ? 'bg-[#8C6B4D] text-white'
                                            : 'bg-white/80 border border-neutral-300 text-neutral-600 hover:border-[#8C6B4D]'
                                        }`}
                                      >
                                        {dur}m
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Busy vs Reposo Toggle */}
                                <button
                                  type="button"
                                  onClick={() => handleTogglePhaseBusy(idx)}
                                  className={`px-2.5 py-1 rounded border text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    phase.isStylistBusy
                                      ? 'bg-amber-200/80 border-amber-400 text-amber-950 hover:bg-amber-300'
                                      : 'bg-emerald-200/80 border-emerald-400 text-emerald-950 hover:bg-emerald-300'
                                  }`}
                                  title="Haz clic para cambiar entre Estilista Ocupado o Reposo/Libre"
                                >
                                  <span className={`w-2 h-2 rounded-full ${phase.isStylistBusy ? 'bg-amber-700' : 'bg-emerald-700 animate-pulse'}`} />
                                  <span>{phase.isStylistBusy ? 'Estilista Ocupado' : 'Reposo / Libre (Permite cita)'}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quick Add Presets Bar */}
                      <div className="pt-2 border-t border-[#EAE3DC]/80 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                          + Agregar etapa predeterminada:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAddPhase('Reposo de Tinte', 30, false)}
                            className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-950 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Plus className="w-2.5 h-2.5 text-emerald-700" />
                            <span>Reposo (30m Libre)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddPhase('Acabado Final', 60, true)}
                            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Plus className="w-2.5 h-2.5 text-amber-700" />
                            <span>Acabado Final (60m)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddPhase('Lavado y Secado', 30, true)}
                            className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Plus className="w-2.5 h-2.5 text-neutral-600" />
                            <span>Lavado y Secado (30m)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddPhase('Matiz en Lavacabezas', 20, true)}
                            className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Plus className="w-2.5 h-2.5 text-neutral-600" />
                            <span>Matiz (20m)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Feasibility Alert / Reposo Confirmation */}
                    {!feasibility.allowed ? (
                      <div className="p-2.5 bg-rose-50 border border-rose-300 rounded text-xs text-rose-900 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold">Conflicto de Horario Detectado:</p>
                          <p className="text-[11px] text-rose-800">{feasibility.reason}</p>
                        </div>
                      </div>
                    ) : feasibility.isDuringReposo ? (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="flex-1 min-w-0">
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
              <div className="min-w-0">
                <label className="block text-[10px] uppercase tracking-wider text-[#8C6B4D] font-bold mb-1">
                  Estado de la Cita
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Confirmada', 'Pendiente', 'Completada', 'Cancelada'] as AppointmentStatus[]).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`text-[10px] uppercase tracking-wider py-2 sm:py-2.5 px-1.5 border font-bold transition-all text-center cursor-pointer ${
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
                      className="w-full bg-white border border-rose-300 text-neutral-900 text-base sm:text-xs p-2 rounded outline-none"
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
                        className="w-full bg-white border border-rose-300 text-neutral-900 text-base sm:text-xs p-2 rounded outline-none"
                      />
                    )}

                    <p className="text-[10px] text-rose-700 italic">
                      ℹ️ Al guardar como "Cancelada", el espacio queda libre en el calendario y se registra el motivo.
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Notes */}
              <div className="min-w-0">
                <label className="block text-[10px] uppercase tracking-wider text-neutral-600 font-medium mb-1">
                  Notas / Observaciones Específicas
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferencias del cliente, tratamientos previos o recordatorios..."
                  className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-base sm:text-xs p-2.5 outline-none resize-none rounded-none"
                />
              </div>

            </div>

            {/* Fixed Footer Actions pinned outside the scroll area */}
            <div className="p-3 sm:p-4 bg-[#FAF8F5] border-t border-[#EAE3DC] flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2 shrink-0">
              {isEditing && onDelete ? (
                confirmDelete ? (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(initialAppointment!.id!);
                        onClose();
                      }}
                      className="text-xs uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 font-bold flex items-center justify-center gap-1.5 px-3.5 py-2.5 transition-colors animate-pulse flex-1 sm:flex-none cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>¡Sí, Borrar!</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs text-neutral-500 hover:text-neutral-900 px-3 py-2 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="text-xs uppercase tracking-wider text-red-600 hover:text-red-800 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors w-full sm:w-auto cursor-pointer font-bold"
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
                  className="text-xs uppercase tracking-wider text-neutral-600 hover:text-neutral-900 px-3.5 py-2.5 font-medium flex-1 sm:flex-none text-center cursor-pointer border border-neutral-300 bg-white hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#2C221C] hover:bg-[#A68358] text-white text-xs uppercase tracking-[0.12em] font-bold px-4 py-2.5 flex items-center justify-center gap-1.5 transition-colors shadow-sm flex-1 sm:flex-none cursor-pointer active:scale-98"
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
