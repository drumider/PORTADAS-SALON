import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scissors, 
  User, 
  CalendarDays, 
  Clock, 
  CheckCircle, 
  Search, 
  X, 
  ChevronRight, 
  MessageSquare, 
  Phone, 
  Copy, 
  Check, 
  Sparkles,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { Service, Stylist, Appointment } from '../types';
import { SERVICES, STYLISTS, SERVICE_CATEGORIES, TIME_SLOTS } from '../constants';

interface ClientBookingWidgetProps {
  existingAppointments: Appointment[];
  externalSelectedService?: Service | null;
  onSaveAppointment: (appointmentData: any) => Promise<{ success: boolean; id: string; error?: string }>;
}

export const ClientBookingWidget: React.FC<ClientBookingWidgetProps> = ({
  existingAppointments,
  externalSelectedService,
  onSaveAppointment
}) => {
  // Selection State
  const [selectedService, setSelectedService] = useState<Service | null>(SERVICES[0] || null);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(STYLISTS[0] || null);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('');
  
  // Client Details
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>('');
  const [showNoteField, setShowNoteField] = useState<boolean>(false);

  // Service Selector Modal / Bottom Sheet
  const [isServiceModalOpen, setIsServiceModalOpen] = useState<boolean>(false);
  const [modalSearch, setModalSearch] = useState<string>('');
  const [modalCategory, setModalCategory] = useState<string>('Todos');

  // Submission & Confirmation state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // React to external service selection (e.g. clicking Agendar in catalog)
  useEffect(() => {
    if (externalSelectedService) {
      setSelectedService(externalSelectedService);
      setConfirmedAppointment(null);
      setBookingError(null);
    }
  }, [externalSelectedService]);

  // Generate 8 upcoming open business days (skipping Sundays)
  const availableDays = useMemo(() => {
    const days = [];
    const today = new Date();
    let count = 0;

    while (count < 14 && days.length < 8) {
      const d = new Date(today);
      d.setDate(today.getDate() + count);

      // 0 is Sunday - Salon is closed on Sundays
      if (d.getDay() !== 0) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const rawValue = `${y}-${m}-${day}`;
        const isToday = count === 0;

        const dayName = d.toLocaleDateString('es-CR', { weekday: 'short' }).toUpperCase().replace('.', '');
        const monthName = d.toLocaleDateString('es-CR', { month: 'short' }).toUpperCase().replace('.', '');
        const dayNumber = d.getDate();

        days.push({
          rawValue,
          dayName,
          monthName,
          dayNumber,
          isToday,
          formatted: `${d.toLocaleDateString('es-CR', { weekday: 'short', day: 'numeric', month: 'short' })}`
        });
      }
      count++;
    }
    return days;
  }, []);

  // Set default date to first available day if empty
  useEffect(() => {
    if (!bookingDate && availableDays.length > 0) {
      setBookingDate(availableDays[0].rawValue);
    }
  }, [availableDays, bookingDate]);

  // Filtered Services for Modal Picker
  const modalFilteredServices = useMemo(() => {
    return SERVICES.filter((s) => {
      const matchCat = modalCategory === 'Todos' || s.category === modalCategory;
      const q = modalSearch.toLowerCase().trim();
      const matchQuery = !q || 
        s.name.toLowerCase().includes(q) || 
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [modalSearch, modalCategory]);

  // Check if stylist is off on a date
  const isStylistOff = (stylist: Stylist | null, dateStr: string) => {
    if (!stylist || !stylist.offDays || !stylist.offDays.length || !dateStr) return false;
    if (stylist.id === 'cualquiera') return false;
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return false;
    const dayOfWeek = new Date(y, m - 1, d).getDay();
    return stylist.offDays.includes(dayOfWeek);
  };

  // Check if a time slot is occupied
  const isSlotOccupied = (timeSlot: string, dateStr: string, stylistId: string) => {
    if (!dateStr || !stylistId) return false;
    return existingAppointments.some((app) => {
      if (app.date !== dateStr) return false;
      if (app.status === 'Cancelada') return false;
      if (stylistId !== 'cualquiera' && app.stylistId !== 'cualquiera' && app.stylistId !== stylistId) {
        return false;
      }
      return app.time === timeSlot;
    });
  };

  // Available Stylists
  const availableStylists = useMemo(() => {
    if (!selectedService) return STYLISTS;
    return STYLISTS.filter(st => {
      if (!st.allowedCategories || st.allowedCategories.length === 0) return true;
      return st.allowedCategories.includes(selectedService.category);
    });
  }, [selectedService]);

  // Handle Form Submission
  const handleSubmitBooking = async (sendWhatsApp: boolean = true) => {
    setBookingError(null);

    if (!selectedService) {
      setBookingError('Por favor selecciona un servicio.');
      return;
    }
    if (!selectedStylist) {
      setBookingError('Por favor selecciona un especialista.');
      return;
    }
    if (!bookingDate) {
      setBookingError('Por favor selecciona la fecha de tu cita.');
      return;
    }
    if (!bookingTime) {
      setBookingError('Por favor toca un horario de 30 min disponible.');
      return;
    }
    if (!clientName.trim()) {
      setBookingError('Por favor escribe tu nombre completo.');
      return;
    }
    if (!clientPhone.trim() || clientPhone.trim().length < 8) {
      setBookingError('Por favor ingresa un número de WhatsApp / teléfono válido.');
      return;
    }

    if (isStylistOff(selectedStylist, bookingDate)) {
      setBookingError(`${selectedStylist.name} descansa este día. Por favor elige otro especialista o fecha.`);
      return;
    }

    if (isSlotOccupied(bookingTime, bookingDate, selectedStylist.id)) {
      setBookingError(`El horario ${bookingTime} ya está ocupado. Elige otra hora disponible.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const chosenDay = availableDays.find(d => d.rawValue === bookingDate);
      const formattedDate = chosenDay ? chosenDay.formatted : bookingDate;

      const newApp = {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: '',
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        stylistId: selectedStylist.id,
        stylistName: selectedStylist.name,
        date: bookingDate,
        time: bookingTime,
        durationMinutes: selectedService.durationMinutes || 60,
        status: 'Pendiente',
        notes: customNote.trim()
      };

      const result = await onSaveAppointment(newApp);

      if (result && result.success) {
        const appointmentId = result.id;
        
        const waMsg = `¡Hola CF Portadas Escazú! ✨✂️\n\nAcabo de agendar una cita en su sistema:\n\n` +
          `🔖 *Código de Cita:* ${appointmentId}\n` +
          `👤 *Cliente:* ${clientName.trim()}\n` +
          `📱 *Teléfono:* ${clientPhone.trim()}\n` +
          `💇‍♀️ *Servicio:* ${selectedService.name} (${selectedService.price})\n` +
          `✂️ *Especialista:* ${selectedStylist.name}\n` +
          `📅 *Fecha:* ${formattedDate}\n` +
          `⏰ *Hora:* ${bookingTime}\n` +
          (customNote.trim() ? `📝 *Nota:* ${customNote.trim()}\n\n` : `\n`) +
          `Por favor me confirman en recepción. ¡Muchas gracias!`;

        const waUrl = `https://wa.me/50689607575?text=${encodeURIComponent(waMsg)}`;

        setConfirmedAppointment({
          id: appointmentId,
          ...newApp,
          formattedDate,
          price: selectedService.price,
          waUrl
        });

        if (sendWhatsApp) {
          try {
            window.open(waUrl, '_blank', 'noopener,noreferrer');
          } catch (e) {
            // fallback
          }
        }
      } else {
        setBookingError(result?.error || 'No se pudo guardar la cita. Intenta de nuevo.');
      }
    } catch (err: any) {
      console.error('Error saving appointment:', err);
      setBookingError('Ocurrió un error al agendar. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setConfirmedAppointment(null);
    setBookingTime('');
    setCustomNote('');
    setBookingError(null);
  };

  return (
    <div className="w-full bg-[#121214] border border-gold-champagne/25 shadow-2xl relative overflow-hidden rounded-sm">
      {/* Top Gold Accent Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-gold-champagne/40 via-gold-champagne to-gold-champagne/40" />

      {/* CONFIRMED STATE */}
      {confirmedAppointment ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center gap-3 border-b border-emerald-500/30 pb-3.5">
            <div className="w-9 h-9 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest block font-bold">
                ¡CITA AGENDADA CON ÉXITO!
              </span>
              <h4 className="text-white text-base font-serif-luxury uppercase tracking-wider font-normal">
                Reserva Registrada
              </h4>
            </div>
          </div>

          {/* Compact Ticket */}
          <div className="bg-[#18181b] border border-gold-champagne/30 p-3.5 rounded space-y-2.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <span className="text-[10px] text-gray-400 font-mono uppercase">Código de Cita</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-gold-champagne font-bold bg-black/50 px-2 py-0.5 border border-gold-champagne/30 text-xs">
                  {confirmedAppointment.id}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(confirmedAppointment.id);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="text-[9px] text-gray-300 hover:text-white bg-white/10 px-1.5 py-0.5 rounded font-mono uppercase cursor-pointer"
                >
                  {copiedCode ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300">
              <div>
                <span className="text-[9px] text-gray-400 uppercase block font-mono">Servicio</span>
                <strong className="text-white font-medium truncate block">{confirmedAppointment.serviceName}</strong>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-gray-400 uppercase block font-mono">Especialista</span>
                <strong className="text-white font-medium truncate block">{confirmedAppointment.stylistName}</strong>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 uppercase block font-mono">Fecha y Hora</span>
                <strong className="text-gold-champagne font-mono font-bold block">
                  {confirmedAppointment.formattedDate} · {confirmedAppointment.time}
                </strong>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-gray-400 uppercase block font-mono">Cliente</span>
                <strong className="text-white font-medium truncate block">{confirmedAppointment.clientName}</strong>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <a
              href={confirmedAppointment.waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-transform"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              <span>Enviar Confirmación por WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium uppercase tracking-wider rounded border border-white/10 transition-colors"
            >
              Agendar Otra Cita
            </button>
          </div>
        </motion.div>
      ) : (
        /* COMPACT MOBILE-FIRST FORM */
        <div className="p-4 sm:p-5 space-y-4">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gold-champagne animate-pulse" />
              <h3 className="text-white text-sm sm:text-base font-serif-luxury uppercase tracking-wider font-medium">
                Agenda tu Cita en Línea
              </h3>
            </div>
            <span className="text-[9px] font-mono text-gold-champagne bg-gold-champagne/10 border border-gold-champagne/30 px-2 py-0.5 rounded uppercase">
              Escazú
            </span>
          </div>

          {/* Error Message */}
          {bookingError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2.5 bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-center gap-2 rounded"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="flex-1 text-[11px] leading-snug">{bookingError}</span>
              <button 
                type="button"
                onClick={() => setBookingError(null)}
                className="text-red-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}

          {/* 1. SERVICIO SELECTOR (Compact Card / Modal Trigger) */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-gold-champagne/80 font-mono font-medium block">
              1. Tratamiento o Servicio:
            </label>
            
            <button
              type="button"
              onClick={() => setIsServiceModalOpen(true)}
              className="w-full p-2.5 bg-[#1a1a1e] hover:bg-[#222228] active:bg-[#26262e] border border-gold-champagne/40 hover:border-gold-champagne rounded transition-all text-left flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded bg-gold-champagne/10 border border-gold-champagne/30 flex items-center justify-center text-gold-champagne shrink-0">
                  <Scissors className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-white font-medium truncate group-hover:text-gold-champagne transition-colors">
                    {selectedService?.name || 'Selecciona un servicio...'}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                    {selectedService?.price} · {selectedService?.durationText || `${selectedService?.durationMinutes}m`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gold-champagne font-mono uppercase bg-gold-champagne/10 px-2 py-1 rounded shrink-0">
                <span>Cambiar</span>
                <ChevronDown className="w-3 h-3" />
              </div>
            </button>
          </div>

          {/* 2. ESPECIALISTA (Compact Chips) */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-gold-champagne/80 font-mono font-medium block">
              2. Especialista:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {availableStylists.map((st) => {
                const isSelected = selectedStylist?.id === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStylist(st)}
                    className={`p-2 rounded border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-gold-champagne border-gold-champagne text-dark-bg font-bold shadow-md ring-1 ring-gold-champagne'
                        : 'bg-[#1a1a1e] border-white/10 hover:border-gold-champagne/40 text-gray-300 active:bg-white/10'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-serif-luxury ${
                      isSelected ? 'bg-dark-bg text-gold-champagne' : 'bg-black/60 border border-white/20 text-white'
                    }`}>
                      {st.avatarLetter}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider truncate w-full font-medium">
                      {st.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. DÍA (Horizontal Scrollable Strip) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase tracking-widest text-gold-champagne/80 font-mono font-medium block">
                3. Día:
              </label>
              <span className="text-[9px] text-gray-400 font-mono">
                {availableDays.find(d => d.rawValue === bookingDate)?.formatted}
              </span>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x -mx-1 px-1">
              {availableDays.map((day) => {
                const isOff = isStylistOff(selectedStylist, day.rawValue);
                const isSelected = bookingDate === day.rawValue;

                return (
                  <button
                    key={day.rawValue}
                    type="button"
                    disabled={isOff}
                    onClick={() => {
                      if (isOff) return;
                      setBookingDate(day.rawValue);
                    }}
                    className={`py-2 px-2.5 min-w-[58px] rounded border text-center transition-all flex flex-col items-center shrink-0 snap-start ${
                      isOff
                        ? 'opacity-25 bg-black/40 border-white/5 text-gray-600 cursor-not-allowed'
                        : isSelected
                          ? 'bg-gold-champagne border-gold-champagne text-dark-bg font-bold shadow-md ring-1 ring-gold-champagne'
                          : 'bg-[#1a1a1e] border-white/10 hover:border-gold-champagne/40 text-gray-300 active:bg-white/10'
                    }`}
                  >
                    <span className={`text-[9px] font-mono uppercase tracking-wider ${isSelected ? 'text-dark-bg font-bold' : 'text-gray-400'}`}>
                      {day.dayName}
                    </span>
                    <span className={`text-base font-serif-luxury font-bold leading-tight ${isSelected ? 'text-dark-bg' : 'text-white'}`}>
                      {day.dayNumber}
                    </span>
                    <span className={`text-[8px] font-mono uppercase ${isSelected ? 'text-dark-bg/80' : day.isToday ? 'text-emerald-400 font-semibold' : 'text-gray-500'}`}>
                      {day.isToday ? 'HOY' : day.monthName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. HORA (30-min Compact Grid) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase tracking-widest text-gold-champagne/80 font-mono font-medium block">
                4. Hora (Bloques de 30 min):
              </label>
              {bookingTime && (
                <span className="text-[9px] text-emerald-400 font-mono font-bold">
                  Seleccionado: {bookingTime}
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-40 overflow-y-auto pr-0.5 custom-scrollbar">
              {TIME_SLOTS.map((time) => {
                const isOccupied = isSlotOccupied(time, bookingDate, selectedStylist?.id || '');
                const isSelected = bookingTime === time;

                return (
                  <button
                    key={time}
                    type="button"
                    disabled={isOccupied}
                    onClick={() => setBookingTime(time)}
                    className={`py-2 px-1 rounded border text-center text-xs font-mono transition-all flex flex-col items-center justify-center min-h-[36px] ${
                      isOccupied
                        ? 'opacity-30 bg-red-950/20 border-red-900/30 text-red-400 line-through cursor-not-allowed text-[10px]'
                        : isSelected
                          ? 'bg-gold-champagne border-gold-champagne text-dark-bg font-bold shadow-md ring-1 ring-gold-champagne'
                          : 'bg-[#1a1a1e] border-white/10 hover:border-gold-champagne/50 text-gray-200 active:bg-white/10'
                    }`}
                  >
                    <span>{time}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. DATOS DEL CLIENTE (Compact Inputs) */}
          <div className="space-y-2 pt-1 border-t border-white/10">
            <label className="text-[10px] uppercase tracking-widest text-gold-champagne/80 font-mono font-medium block">
              5. Tus Datos de Contacto:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                autoComplete="name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nombre completo *"
                className="w-full bg-[#1a1a1e] border border-white/15 focus:border-gold-champagne text-white text-xs px-3 py-2.5 rounded outline-none placeholder:text-gray-500 font-sans"
              />
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="WhatsApp / Teléfono *"
                className="w-full bg-[#1a1a1e] border border-white/15 focus:border-gold-champagne text-white text-xs px-3 py-2.5 rounded outline-none placeholder:text-gray-500 font-mono"
              />
            </div>

            {/* Optional Note toggle */}
            {!showNoteField ? (
              <button
                type="button"
                onClick={() => setShowNoteField(true)}
                className="text-[10px] text-gray-400 hover:text-gold-champagne underline tracking-wider font-mono block pt-0.5"
              >
                + Agregar nota o especificación especial
              </button>
            ) : (
              <div className="pt-1">
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Detalles sobre tu cabello o pedido (opcional)..."
                  className="w-full bg-[#1a1a1e] border border-white/15 focus:border-gold-champagne text-white text-xs px-3 py-2 rounded outline-none placeholder:text-gray-500 font-sans"
                />
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmitBooking(true)}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 transition-transform cursor-pointer"
            >
              {isSubmitting ? (
                <span>Guardando cita...</span>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 fill-current" />
                  <span>Confirmar Cita por WhatsApp</span>
                </>
              )}
            </button>
            
            <p className="text-center text-[9px] text-gray-400 font-mono mt-1.5">
              Sin pago por adelantado · Confirmación directa con recepción
            </p>
          </div>

        </div>
      )}

      {/* SERVICE PICKER MODAL / BOTTOM SHEET */}
      <AnimatePresence>
        {isServiceModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setIsServiceModalOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-lg bg-[#141417] border border-gold-champagne/30 rounded-t-xl sm:rounded-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-[#1a1a1e]">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-gold-champagne" />
                  <h4 className="text-white text-sm font-serif-luxury uppercase tracking-wider font-medium">
                    Selecciona tu Servicio
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar in Modal */}
              <div className="p-3 border-b border-white/10 space-y-2 bg-[#121214]">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder="Buscar (ej: keratina, corte, tinte, manicure)..."
                    className="w-full bg-[#1c1c22] border border-white/15 focus:border-gold-champagne text-white text-xs pl-8 pr-8 py-2 rounded outline-none"
                  />
                  {modalSearch && (
                    <button
                      type="button"
                      onClick={() => setModalSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Categories Bar */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x">
                  {SERVICE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setModalCategory(cat)}
                      className={`text-[9px] uppercase tracking-wider px-2.5 py-1 rounded shrink-0 snap-start border transition-colors ${
                        modalCategory === cat
                          ? 'bg-gold-champagne border-gold-champagne text-dark-bg font-bold'
                          : 'bg-[#1c1c22] border-white/10 text-gray-300 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Services List in Modal */}
              <div className="p-3 overflow-y-auto space-y-1.5 max-h-96 custom-scrollbar">
                {modalFilteredServices.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400 font-mono">
                    No encontramos servicios para "{modalSearch}".
                  </div>
                ) : (
                  modalFilteredServices.map((s) => {
                    const isSelected = selectedService?.id === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedService(s);
                          setIsServiceModalOpen(false);
                          setBookingError(null);
                        }}
                        className={`p-2.5 rounded border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-gold-champagne/15 border-gold-champagne text-white'
                            : 'bg-[#18181c] border-white/10 hover:border-gold-champagne/40 active:bg-[#202026]'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-white font-serif-luxury uppercase font-medium truncate">
                              {s.name}
                            </span>
                            {s.code && (
                              <span className="text-[8px] font-mono text-gold-champagne bg-gold-champagne/10 px-1 rounded">
                                #{s.code}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                            {s.description || s.category}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono text-gold-champagne font-bold block">
                            {s.price}
                          </span>
                          <span className="text-[9px] font-mono text-gray-400">
                            {s.durationText || `${s.durationMinutes}m`}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-2.5 bg-[#121214] border-t border-white/10 text-center">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="text-[11px] text-gray-400 hover:text-white uppercase font-mono tracking-wider"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
