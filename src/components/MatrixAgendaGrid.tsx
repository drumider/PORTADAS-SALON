import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CheckCircle,
  AlertCircle,
  X,
  Edit3,
  Trash2,
  MessageSquare,
  Scissors,
  Printer,
  HelpCircle,
  Settings,
  List as ListIcon,
  ClipboardList,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Maximize2,
  Minimize2,
  Minus,
  Square,
  Check,
  CalendarCheck,
  Grid,
  Columns,
  Sparkles,
  Layers,
  ChevronDown,
  Bell,
  ArrowRight,
  Send,
  CalendarPlus,
  CheckCheck,
  Users,
  UserPlus
} from 'lucide-react';
import { Appointment, AppointmentStatus, Stylist, Client } from '../types';
import { STYLISTS as DEFAULT_STYLISTS, SERVICES } from '../constants';
import { 
  getStoredAppointments, 
  saveAppointment, 
  deleteAppointment, 
  updateAppointmentStatus, 
  updateAppointmentDetails,
  cancelAppointment,
  subscribeToAppointments,
  getStoredClients,
  subscribeToClients
} from '../utils/storage';
import { 
  normalizeTimeTo24h, 
  formatTimeTo12h, 
  formatTimeDisplay, 
  timeToMinutes, 
  minutesToTime24, 
  formatDurationText,
  calculateAppointmentRange,
  getAppointmentPhasesTimeline,
  getServicePhases
} from '../utils/timeUtils';
import { AppointmentModal } from './AppointmentModal';
import { ClientDirectoryModal } from './ClientDirectoryModal';
import { CancelAppointmentModal } from './CancelAppointmentModal';
import { ExpandDurationModal } from './ExpandDurationModal';

export interface SlotAppointmentEntry {
  appointment: Appointment;
  isStart: boolean;
  isContinuation: boolean;
  startSlot24: string;
  endSlot24: string;
  startSlot12: string;
  endSlot12: string;
  durationMinutes: number;
  durationText: string;
  slotIndex: number;
  totalSlots: number;
  isStylistBusy: boolean;
  phaseName: string;
  isReposoFreeSlot: boolean;
}

interface MatrixAgendaGridProps {
  onClose?: () => void;
  isAdmin?: boolean;
}

// Generate customizable time slots between 07:30 and 21:00 (strictly 30-minute intervals)
const GENERATE_TIME_SLOTS = (): string[] => {
  const slots: string[] = [];
  const startHour = 7;
  const startMinute = 30;
  const endHour = 21;
  const endMinute = 0;

  let currentMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  while (currentMinutes <= endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    currentMinutes += 30;
  }
  return slots;
};

type AgendaViewMode = 'single_stylist' | 'timeline' | 'matrix';

export const MatrixAgendaGrid: React.FC<MatrixAgendaGridProps> = ({ onClose, isAdmin = true }) => {
  // Real-time Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Selected Date (defaults to today)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // View Mode: On desktop/tablets (width >= 768px) default to 'matrix' like before; on mobile (< 768px) default to 'single_stylist'
  const [viewMode, setViewMode] = useState<AgendaViewMode>(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      return 'matrix';
    }
    return 'single_stylist';
  });
  
  // Active Stylist filter for single stylist view or matrix highlight
  const [activeStylistId, setActiveStylistId] = useState<string>('carlos');

  // Stylists list (with ability to add new ones dynamically)
  const [stylists, setStylists] = useState<Stylist[]>(() => {
    try {
      const saved = localStorage.getItem('cf_portadas_custom_stylists');
      if (saved) {
        let parsed = JSON.parse(saved) as Stylist[];
        // Fix spelling of Yorleny if previously saved as Jorleny
        parsed = parsed.map(st => {
          if (st.id === 'jorleny' || st.name.toLowerCase() === 'jorleny') {
            return {
              ...st,
              id: 'yorleny',
              name: 'Yorleny',
              avatarLetter: 'Y',
              role: 'Manicurista'
            };
          }
          return st;
        });

        // Ensure all DEFAULT_STYLISTS (including Yorleny and Mariela) are present
        DEFAULT_STYLISTS.forEach(defSt => {
          const exists = parsed.some(s => s.id === defSt.id || s.name.toLowerCase() === defSt.name.toLowerCase());
          if (!exists) {
            const anyIdx = parsed.findIndex(s => s.id === 'cualquiera');
            if (anyIdx !== -1) {
              parsed.splice(anyIdx, 0, defSt);
            } else {
              parsed.push(defSt);
            }
          }
        });

        return parsed;
      }
    } catch (e) {}
    return DEFAULT_STYLISTS;
  });

  // Appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Time slots (30 min blocks: 07:30, 08:00, 08:30, 09:00...)
  const timeSlots = useMemo(() => GENERATE_TIME_SLOTS(), []);

  // Modals & Drawers state
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [expandingAppointment, setExpandingAppointment] = useState<Appointment | null>(null);
  const [isExpandModalOpen, setIsExpandModalOpen] = useState(false);
  const [modalInitialSlot, setModalInitialSlot] = useState<{ stylistId: string; time: string } | null>(null);
  const [prefilledClientForBooking, setPrefilledClientForBooking] = useState<Client | null>(null);

  // Client Directory Modal State
  const [isClientDirectoryOpen, setIsClientDirectoryOpen] = useState(false);
  const [clientsCount, setClientsCount] = useState<number>(() => getStoredClients().length);

  useEffect(() => {
    const unsub = subscribeToClients((cls) => {
      setClientsCount(cls.length);
    });
    return () => unsub();
  }, []);

  // Bottom action bar modals
  const [activeBottomModal, setActiveBottomModal] = useState<
    'help' | 'list' | 'pending' | 'add_stylist' | null
  >(null);

  // Search & Filters for List modal
  const [listSearch, setListSearch] = useState('');
  const [listStatusFilter, setListStatusFilter] = useState('all');

  // New Stylist Form
  const [newStylistName, setNewStylistName] = useState('');
  const [newStylistRole, setNewStylistRole] = useState('');
  const [newStylistOffDay, setNewStylistOffDay] = useState<number>(-1);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Notification Toast state
  const [notificationToast, setNotificationToast] = useState<{
    id: string;
    message: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!notificationToast) return;
    const timer = setTimeout(() => {
      setNotificationToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notificationToast]);

  // Update live clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${h}:${m}:${s}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const prevPendingCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);

  // Subscribe to real-time appointments
  useEffect(() => {
    const unsubscribe = subscribeToAppointments((updated) => {
      setAppointments(updated);

      const currentPending = updated.filter(a => a.status === 'Pendiente');
      
      if (!isInitialLoadRef.current && currentPending.length > prevPendingCountRef.current) {
        const latestNewApp = currentPending[currentPending.length - 1];
        setNotificationToast({
          id: 'toast-' + Date.now(),
          message: `🔔 ¡Nueva Solicitud de Cita! ${latestNewApp?.clientName || 'Un cliente'} ha agendado vía Asistente Web para el ${latestNewApp?.date || ''} (${formatTimeTo12h(latestNewApp?.time || '')}).`,
          type: 'warning'
        });
      }
      
      prevPendingCountRef.current = currentPending.length;
      isInitialLoadRef.current = false;
    });
    return () => unsubscribe();
  }, []);

  // Save custom stylists
  const handleAddStylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStylistName.trim()) return;

    const newS: Stylist = {
      id: 'stylist-' + Date.now(),
      name: newStylistName.trim().toUpperCase(),
      role: newStylistRole.trim().toUpperCase() || 'ESTILISTA PROFESIONAL',
      avatarLetter: newStylistName.trim().charAt(0).toUpperCase(),
      offDays: newStylistOffDay >= 0 ? [newStylistOffDay] : [],
      allowedCategories: ['Alisados y Keratinas', 'Coloración y Tintes', 'Cortes y Peinados', 'Tratamientos Capilares', 'Manicure y Pedicure']
    };

    const updated = [...stylists];
    const anyIdx = updated.findIndex(s => s.id === 'cualquiera');
    if (anyIdx !== -1) {
      updated.splice(anyIdx, 0, newS);
    } else {
      updated.push(newS);
    }

    setStylists(updated);
    try {
      localStorage.setItem('cf_portadas_custom_stylists', JSON.stringify(updated));
    } catch (err) {}

    setNewStylistName('');
    setNewStylistRole('');
    setNewStylistOffDay(-1);
    setActiveBottomModal(null);
  };

  // Format date helper
  const formattedSelectedDate = useMemo(() => {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'
    ];
    const dayName = dayNames[selectedDate.getDay()];
    const dayNum = selectedDate.getDate();
    const monthName = monthNames[selectedDate.getMonth()];
    const year = selectedDate.getFullYear();
    return `${dayName}, ${dayNum} ${monthName} ${year}`;
  }, [selectedDate]);

  const selectedDateStr = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  // Navigate Date
  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleSetToday = () => {
    setSelectedDate(new Date());
  };

  // Appointments for the selected day
  const dayAppointments = useMemo(() => {
    return appointments
      .filter(a => a.date === selectedDateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDateStr]);

  // Map appointments by stylistId and time with normalized times, covering full service duration and phase state (busy vs reposo/free)
  const appointmentMatrix = useMemo(() => {
    const map = new Map<string, SlotAppointmentEntry[]>();

    dayAppointments.forEach(app => {
      const normalizedStart24 = normalizeTimeTo24h(app.time);
      const startMin = timeToMinutes(normalizedStart24);
      const serviceDuration = app.durationMinutes || (SERVICES.find(s => s.id === app.serviceId)?.durationMinutes || 60);
      const endMin = startMin + serviceDuration;
      const end24 = minutesToTime24(endMin);
      const start12 = formatTimeTo12h(normalizedStart24);
      const end12 = formatTimeTo12h(end24);
      const durationText = formatDurationText(serviceDuration);
      const totalSlots = Math.max(1, Math.ceil(serviceDuration / 30));
      const timeline = getAppointmentPhasesTimeline(app);

      let slotIndex = 0;
      for (let t = startMin; t < endMin; t += 30) {
        const slot24 = minutesToTime24(t);
        const isStart = (t === startMin);
        const isContinuation = !isStart;

        // Find which phase of the service is active at this time slot t
        const currentPhase = timeline.find(p => t >= p.startMin && t < p.endMin) || timeline[0];
        const isStylistBusy = currentPhase ? currentPhase.isStylistBusy : true;
        const phaseName = currentPhase ? currentPhase.name : 'Servicio';
        const isReposoFreeSlot = !isStylistBusy;

        const entry: SlotAppointmentEntry = {
          appointment: app,
          isStart,
          isContinuation,
          startSlot24: normalizedStart24,
          endSlot24: end24,
          startSlot12: start12,
          endSlot12: end12,
          durationMinutes: serviceDuration,
          durationText,
          slotIndex,
          totalSlots,
          isStylistBusy,
          phaseName,
          isReposoFreeSlot
        };

        const rawId = (app.stylistId || '').toLowerCase().trim();
        const matchedSt = stylists.find(s => 
          s.id.toLowerCase() === rawId || 
          s.name.toLowerCase() === rawId ||
          (app.stylistName && s.name.toLowerCase() === app.stylistName.toLowerCase().trim())
        );
        const cleanAppStylistId = matchedSt ? matchedSt.id : (rawId === 'jorleny' ? 'yorleny' : (rawId || 'cualquiera'));
        const targetStylistIds = cleanAppStylistId === 'cualquiera'
          ? ['cualquiera']
          : [cleanAppStylistId];

        targetStylistIds.forEach(stId => {
          const key = `${stId}_${slot24}`;
          const existing = map.get(key) || [];
          if (!existing.some(e => e.appointment.id === app.id)) {
            map.set(key, [...existing, entry]);
          }
        });

        slotIndex++;
      }
    });
    return map;
  }, [dayAppointments]);

  // Approve & Schedule handler for pending appointments
  const handleApproveAppointment = (
    appointment: Appointment,
    targetStylistId?: string
  ) => {
    const assignedStylist = targetStylistId && targetStylistId !== 'cualquiera'
      ? stylists.find(s => s.id === targetStylistId) || { id: targetStylistId, name: targetStylistId }
      : (appointment.stylistId !== 'cualquiera' 
          ? stylists.find(s => s.id === appointment.stylistId) || { id: appointment.stylistId, name: appointment.stylistName }
          : stylists.find(s => s.id !== 'cualquiera') || stylists[0]);

    const updatedData: Partial<Appointment> = {
      status: 'Confirmada',
      stylistId: assignedStylist.id,
      stylistName: assignedStylist.name
    };

    updateAppointmentDetails(appointment.id, updatedData);

    // Jump agenda view directly to the appointment's date so it's instantly visible
    try {
      const [y, m, d] = appointment.date.split('-').map(Number);
      if (y && m && d) {
        setSelectedDate(new Date(y, m - 1, d));
      }
    } catch (e) {}

    // Switch active stylist in single view
    if (assignedStylist.id && assignedStylist.id !== 'cualquiera') {
      setActiveStylistId(assignedStylist.id);
    }

    setNotificationToast({
      id: 'toast-' + Date.now(),
      message: `✅ Cita de ${appointment.clientName} confirmada y agendada para ${assignedStylist.name} el ${appointment.date} a las ${formatTimeTo12h(appointment.time)}!`,
      type: 'success'
    });
  };

  // Slot click handler
  const handleSlotClick = (stylist: Stylist, time: string, existingApp?: Appointment) => {
    if (existingApp) {
      setEditingAppointment(existingApp);
      setModalInitialSlot(null);
      setIsAppointmentModalOpen(true);
    } else {
      setEditingAppointment(null);
      setModalInitialSlot({ stylistId: stylist.id, time });
      setIsAppointmentModalOpen(true);
    }
  };

  // Save handler
  const handleSaveAppointment = (appointmentData: Omit<Appointment, 'id' | 'createdAt'> & { id?: string }) => {
    saveAppointment(appointmentData);
    setIsAppointmentModalOpen(false);
    setEditingAppointment(null);
    setModalInitialSlot(null);
  };

  // Delete handler
  const handleDeleteAppointment = (id: string) => {
    deleteAppointment(id);
    setIsAppointmentModalOpen(false);
    setEditingAppointment(null);
  };

  // Open Cancel Modal handler
  const handleOpenCancelModal = (appointment: Appointment) => {
    setCancellingAppointment(appointment);
    setIsCancelModalOpen(true);
  };

  // Open Expand Duration Modal handler
  const handleOpenExpandModal = (appointment: Appointment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandingAppointment(appointment);
    setIsExpandModalOpen(true);
  };

  // Confirm Expand Duration handler
  const handleConfirmExpand = (appointmentId: string, newDurationMinutes: number) => {
    updateAppointmentDetails(appointmentId, { durationMinutes: newDurationMinutes });
    const targetApp = appointments.find(a => a.id === appointmentId);
    setNotificationToast({
      id: 'toast-expand-' + Date.now(),
      message: `⏱️ Duración de cita de ${targetApp?.clientName || 'Cliente'} actualizada a ${newDurationMinutes} min.`,
      type: 'success'
    });
  };

  // Confirm Cancellation handler
  const handleConfirmCancellation = (appointmentId: string, reason: string) => {
    cancelAppointment(appointmentId, reason);
    const targetApp = appointments.find(a => a.id === appointmentId);
    setNotificationToast({
      id: 'toast-cancel-' + Date.now(),
      message: `🚫 Cita de ${targetApp?.clientName || 'Cliente'} cancelada ("${reason}"). El horario ha quedado libre.`,
      type: 'warning'
    });
  };

  // Quick Status change
  const handleStatusChange = (id: string, status: AppointmentStatus) => {
    updateAppointmentStatus(id, status);
  };

  // Print schedule
  const handlePrint = () => {
    window.print();
  };

  // Status badges colors in Light Theme
  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'Confirmada':
        return {
          cardBg: 'bg-emerald-50 border-emerald-400 text-emerald-950 hover:border-emerald-600',
          dot: 'bg-emerald-500',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          textColor: 'text-emerald-950',
          subColor: 'text-emerald-800',
          timeColor: 'text-emerald-700',
          label: 'Confirmada'
        };
      case 'Pendiente':
        return {
          cardBg: 'bg-red-50/90 border-red-400 text-red-950 hover:border-red-600 ring-1 ring-red-300/80',
          dot: 'bg-red-500',
          badge: 'bg-red-100 text-red-800 border-red-300 font-bold',
          textColor: 'text-red-950',
          subColor: 'text-red-800',
          timeColor: 'text-red-700',
          label: 'Por Aprobar'
        };
      case 'Completada':
        return {
          cardBg: 'bg-blue-50 border-blue-400 text-blue-950 hover:border-blue-600',
          dot: 'bg-blue-500',
          badge: 'bg-blue-100 text-blue-800 border-blue-300',
          textColor: 'text-blue-950',
          subColor: 'text-blue-800',
          timeColor: 'text-blue-700',
          label: 'Completada'
        };
      case 'Cancelada':
        return {
          cardBg: 'bg-rose-50 border-rose-300 text-rose-800 line-through opacity-70',
          dot: 'bg-rose-400',
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          textColor: 'text-rose-900',
          subColor: 'text-rose-700',
          timeColor: 'text-rose-600',
          label: 'Cancelada'
        };
      default:
        return {
          cardBg: 'bg-neutral-50 border-neutral-300 text-neutral-900',
          dot: 'bg-neutral-400',
          badge: 'bg-neutral-100 text-neutral-800 border-neutral-300',
          textColor: 'text-neutral-900',
          subColor: 'text-neutral-700',
          timeColor: 'text-neutral-600',
          label: status
        };
    }
  };

  // Filtered appointments for List modal
  const listFilteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      const matchesSearch = 
        app.clientName.toLowerCase().includes(listSearch.toLowerCase()) ||
        app.clientPhone.includes(listSearch) ||
        app.serviceName.toLowerCase().includes(listSearch.toLowerCase()) ||
        app.stylistName.toLowerCase().includes(listSearch.toLowerCase());
      const matchesStatus = listStatusFilter === 'all' || app.status === listStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [appointments, listSearch, listStatusFilter]);

  // Pending appointments list
  const pendingAppointments = useMemo(() => {
    return appointments.filter(app => app.status === 'Pendiente');
  }, [appointments]);

  // Active stylist object
  const selectedStylistObj = useMemo(() => {
    return stylists.find(s => s.id === activeStylistId) || stylists[0];
  }, [stylists, activeStylistId]);

  // Check if today
  const isToday = useMemo(() => {
    const today = new Date();
    return (
      today.getFullYear() === selectedDate.getFullYear() &&
      today.getMonth() === selectedDate.getMonth() &&
      today.getDate() === selectedDate.getDate()
    );
  }, [selectedDate]);

  // Memoize appointment payload passed into AppointmentModal
  const modalAppointmentData = useMemo(() => {
    if (editingAppointment) return editingAppointment;
    if (modalInitialSlot) {
      return {
        stylistId: modalInitialSlot.stylistId,
        date: selectedDateStr,
        time: modalInitialSlot.time,
        status: 'Confirmada' as const
      };
    }
    return null;
  }, [editingAppointment, modalInitialSlot, selectedDateStr]);

  return (
    <div 
      ref={gridContainerRef}
      className={`min-h-[82vh] bg-[#FAF8F5] text-neutral-900 border border-[#E2D8CC] rounded-xl shadow-lg flex flex-col font-sans select-none overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 p-0 rounded-none' : 'relative'
      }`}
      id="matrix-agenda-main"
    >
      {/* FLOATING REAL-TIME NOTIFICATION TOAST */}
      <AnimatePresence>
        {notificationToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
              notificationToast.type === 'success'
                ? 'bg-emerald-950/95 text-white border-emerald-500/50 ring-2 ring-emerald-500/20'
                : notificationToast.type === 'warning'
                ? 'bg-red-950/95 text-white border-red-500/60 ring-2 ring-red-500/30'
                : 'bg-[#2C221C]/95 text-white border-[#8C6B4D]/50'
            }`}
          >
            <div className="p-1 rounded-full bg-white/10 shrink-0 mt-0.5">
              {notificationToast.type === 'success' ? (
                <CheckCheck className="w-5 h-5 text-emerald-400" />
              ) : notificationToast.type === 'warning' ? (
                <Bell className="w-5 h-5 text-red-400 animate-bounce" />
              ) : (
                <Sparkles className="w-5 h-5 text-gold-champagne" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold leading-relaxed font-sans">
                {notificationToast.message}
              </p>
            </div>
            <button
              onClick={() => setNotificationToast(null)}
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. COMPACT RESPONSIVE TOP BAR */}
      <header className="bg-white border-b border-[#E2D8CC] px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0 shadow-xs">
        
        {/* Left: Brand Badge & Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded bg-[#FAF8F5] border border-[#B5916A]/40 flex items-center justify-center text-[#8C6B4D] shadow-xs shrink-0">
            <CalendarIcon className="w-4 h-4 text-[#8C6B4D]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-bold text-[#2C221C] tracking-wide uppercase font-serif-luxury leading-tight">
                Agenda de Citas
              </h1>
              {isToday && (
                <span className="text-[9px] uppercase font-mono tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded font-bold">
                  Hoy
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#8C6B4D] font-mono">
              Salón Escazú · {dayAppointments.length} {dayAppointments.length === 1 ? 'cita' : 'citas'}
            </span>
          </div>
        </div>

        {/* Center: Clean Date Navigator (< Lun, 17 Ago 2026 >) */}
        <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#D9CEC2] p-1 rounded-md shadow-xs">
          <button
            onClick={handlePrevDay}
            className="w-7 h-7 rounded bg-white hover:bg-[#F2ECE5] text-[#2C221C] border border-[#E2D8CC] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
            title="Día anterior"
            aria-label="Día anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleSetToday}
            className="px-2.5 py-1 text-xs font-semibold text-[#2C221C] tracking-wide hover:text-[#8C6B4D] transition-colors cursor-pointer font-serif-luxury"
            title="Clic para ir a Hoy"
          >
            {formattedSelectedDate}
          </button>

          <button
            onClick={handleNextDay}
            className="w-7 h-7 rounded bg-white hover:bg-[#F2ECE5] text-[#2C221C] border border-[#E2D8CC] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
            title="Día siguiente"
            aria-label="Día siguiente"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Quick View Switcher & Action Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* View Mode Switcher Pills */}
          <div className="flex items-center bg-[#F2ECE5] p-0.5 rounded border border-[#D9CEC2]">
            <button
              onClick={() => setViewMode('single_stylist')}
              className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'single_stylist'
                  ? 'bg-white text-[#2C221C] shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="Vista Individual por Estilista (Ideal para móvil)"
            >
              <User className="w-3 h-3 text-[#8C6B4D]" />
              <span className="hidden sm:inline">Por Estilista</span>
            </button>

            <button
              onClick={() => setViewMode('timeline')}
              className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white text-[#2C221C] shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="Cronograma de citas del día"
            >
              <ListIcon className="w-3 h-3 text-[#8C6B4D]" />
              <span className="hidden sm:inline">Cronograma</span>
            </button>

            <button
              onClick={() => setViewMode('matrix')}
              className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-white text-[#2C221C] shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="Tabla Matriz Completa"
            >
              <Columns className="w-3 h-3 text-[#8C6B4D]" />
              <span className="hidden sm:inline">Matriz</span>
            </button>
          </div>

          {/* Pending Requests Noticeable Button (Light Red / Urgent) */}
          {pendingAppointments.length > 0 && (
            <button
              onClick={() => setActiveBottomModal('pending')}
              className="px-2.5 py-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1.5 transition-all shadow-md animate-pulse cursor-pointer ring-2 ring-red-300"
              title={`${pendingAppointments.length} Cita(s) agendada(s) por el asistente web pendientes por aprobar`}
            >
              <Bell className="w-3.5 h-3.5 animate-bounce" />
              <span className="font-mono font-bold">{pendingAppointments.length} Por Aprobar</span>
            </button>
          )}

          {/* Quick Tools Trigger */}
          <button
            onClick={() => setIsClientDirectoryOpen(true)}
            className="px-2.5 py-1 bg-white hover:bg-[#FAF8F5] border border-[#D9CEC2] hover:border-[#8C6B4D] text-[#2C221C] text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Directorio de Clientes Registrados"
            id="admin-topbar-clientes-btn"
          >
            <Users className="w-3.5 h-3.5 text-[#8C6B4D]" />
            <span className="hidden sm:inline">Clientes</span>
            <span className="bg-[#8C6B4D] text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full">
              {clientsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveBottomModal('list')}
            className="w-7 h-7 rounded bg-[#FAF8F5] hover:bg-[#F2ECE5] border border-[#D9CEC2] text-[#5C4A38] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
            title="Buscador general de citas"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handlePrint}
            className="w-7 h-7 rounded bg-[#FAF8F5] hover:bg-[#F2ECE5] border border-[#D9CEC2] text-[#5C4A38] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
            title="Imprimir hoja de trabajo"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>

      </header>

      {/* PROMINENT PENDING APPOINTMENTS ALERT BANNER (LIGHT RED / URGENT) */}
      {pendingAppointments.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 via-rose-50/80 to-red-50 border-b border-red-300 px-3 sm:px-5 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 shadow-xs ring-2 ring-red-200">
              <Bell className="w-3.5 h-3.5 animate-bounce" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-950 font-serif-luxury uppercase tracking-wide">
                  ⚡ Solicitud de Cita Recibida (Asistente Web)
                </span>
                <span className="bg-red-500 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase shadow-xs animate-pulse">
                  {pendingAppointments.length} Por Aprobar
                </span>
              </div>
              <p className="text-[11px] text-red-900 truncate mt-0.5">
                <strong className="text-red-950 font-bold">{pendingAppointments[0].clientName}</strong> agendó <strong>{pendingAppointments[0].serviceName}</strong> para el <strong>{pendingAppointments[0].date}</strong> a las <strong>{formatTimeTo12h(pendingAppointments[0].time)}</strong> ({pendingAppointments[0].stylistName || 'Cualquier profesional'}).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              onClick={() => handleApproveAppointment(pendingAppointments[0])}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
              title="Aprobar y agendar automáticamente en la agenda"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Aprobar y Agendar</span>
            </button>

            <button
              onClick={() => setActiveBottomModal('pending')}
              className="px-2.5 py-1.5 bg-white hover:bg-red-100 border border-red-400 text-red-950 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span>Revisar Todas ({pendingAppointments.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. STYLIST SELECTOR TABS (Visible in mobile or when single_stylist mode is active) */}
      {(viewMode === 'single_stylist' || viewMode === 'timeline') && (
        <div className="bg-[#FAF8F5] border-b border-[#E2D8CC] px-3 sm:px-5 py-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] uppercase font-bold text-[#8C6B4D] font-mono mr-1 hidden sm:inline">
              Profesionales:
            </span>

            {stylists.map((st) => {
              const isSelected = activeStylistId === st.id;
              const dayOfWeek = selectedDate.getDay();
              const isOff = st.offDays?.includes(dayOfWeek);
              
              // Count stylist appointments for this day
              const stAppointmentsCount = dayAppointments.filter(
                a => a.stylistId === st.id || (st.id !== 'cualquiera' && a.stylistId === 'cualquiera')
              ).length;

              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setActiveStylistId(st.id);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-serif-luxury uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#2C221C] text-white font-bold shadow-xs'
                      : 'bg-white border border-[#D9CEC2] text-neutral-800 hover:border-[#8C6B4D] hover:bg-[#F2ECE5]'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    isSelected ? 'bg-[#8C6B4D] text-white' : 'bg-[#FAF8F5] text-neutral-700 border border-[#E2D8CC]'
                  }`}>
                    {st.avatarLetter}
                  </span>
                  <span>{st.name.split(' ')[0]}</span>
                  
                  {isOff ? (
                    <span className="text-[8px] bg-rose-100 text-rose-800 border border-rose-200 px-1 py-0.2 rounded font-mono font-bold">
                      Libre
                    </span>
                  ) : stAppointmentsCount > 0 ? (
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-[#8C6B4D] text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {stAppointmentsCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Add Stylist Action */}
          <button
            onClick={() => setActiveBottomModal('add_stylist')}
            className="text-[10px] text-[#8C6B4D] hover:text-[#2C221C] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 px-2 py-1 bg-white border border-[#D9CEC2] rounded hover:border-[#8C6B4D] transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>
      )}

      {/* 3. MAIN CONTENT VIEWS */}
      <div className="flex-1 overflow-y-auto bg-[#F7F4EF] p-2.5 sm:p-4" id="matrix-scroll-area">
        
        {/* ========================================================= */}
        {/* VIEW A: SINGLE STYLIST (Spacious & Ergonomic for Mobile)  */}
        {/* ========================================================= */}
        {viewMode === 'single_stylist' && (
          <div className="max-w-3xl mx-auto space-y-3">
            
            {/* Stylist Header Summary Card */}
            <div className="bg-white border border-[#E2D8CC] p-3.5 rounded-lg shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2C221C] text-gold-champagne flex items-center justify-center text-sm font-bold font-serif-luxury shadow-xs shrink-0">
                  {selectedStylistObj.avatarLetter}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif-luxury text-sm sm:text-base font-bold text-neutral-900 uppercase">
                      {selectedStylistObj.name}
                    </h3>
                    {selectedStylistObj.offDays?.includes(selectedDate.getDay()) && (
                      <span className="text-[9px] bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                        Día de Descanso
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#8C6B4D] font-mono uppercase tracking-wider">
                    {selectedStylistObj.role}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-neutral-500 font-mono block">Citas programadas</span>
                <strong className="text-base font-serif-luxury font-bold text-[#2C221C]">
                  {dayAppointments.filter(a => a.stylistId === selectedStylistObj.id || a.stylistId === 'cualquiera').length}
                </strong>
              </div>
            </div>

            {/* Time Slots Vertical Flow */}
            <div className="space-y-1.5">
              {timeSlots.map((timeSlot) => {
                const cleanTime = timeSlot;
                const appKey = `${selectedStylistObj.id}_${cleanTime}`;
                const slotAppointments = appointmentMatrix.get(appKey) || [];
                const [slotH, slotM] = timeSlot.split(':').map(Number);
                const now = new Date();
                const isCurrentHourSlot = isToday && now.getHours() === slotH && Math.abs(now.getMinutes() - slotM) < 15;
                const isOff = selectedStylistObj.offDays?.includes(selectedDate.getDay());

                return (
                  <div
                    key={timeSlot}
                    className={`bg-white border rounded-lg p-2.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs ${
                      isCurrentHourSlot ? 'border-[#8C6B4D] ring-1 ring-[#8C6B4D]/30 bg-amber-50/30' : 'border-[#E2D8CC] hover:border-[#8C6B4D]/60'
                    }`}
                  >
                    {/* Time Label */}
                    <div className="flex items-center gap-2 shrink-0 sm:w-28">
                      <span className="w-2 h-2 rounded-full bg-[#8C6B4D]" />
                      <span className="font-mono text-sm font-bold text-[#2C221C]">
                        {timeSlot}
                      </span>
                      {isCurrentHourSlot && (
                        <span className="text-[8px] bg-amber-200 text-amber-900 px-1 rounded font-bold uppercase font-mono">
                          Actual
                        </span>
                      )}
                    </div>

                    {/* Slot Content */}
                    <div className="flex-1 min-w-0">
                      {slotAppointments.length > 0 ? (
                        <div className="space-y-2">
                          {slotAppointments.map((entry) => {
                            const app = entry.appointment;
                            const badge = getStatusBadge(app.status);

                            if (entry.isReposoFreeSlot) {
                              return (
                                <div
                                  key={`${app.id}_reposo_${entry.slotIndex}`}
                                  onClick={() => handleSlotClick(selectedStylistObj, timeSlot, app)}
                                  className="p-2 rounded-md border border-dashed border-emerald-400 bg-emerald-50/70 text-left cursor-pointer transition-all hover:shadow-xs flex items-center justify-between gap-2"
                                  title={`Tiempo de espera / reposo (${entry.phaseName}): ${app.clientName}. Estilista libre para atender otra cita.`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-emerald-700 font-mono text-xs font-bold shrink-0">⏳ {entry.phaseName}:</span>
                                    <span className="font-bold text-xs uppercase font-serif-luxury truncate text-emerald-950">
                                      {app.clientName}
                                    </span>
                                    <span className="text-[10px] text-emerald-800 font-mono bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 shrink-0 font-bold">
                                      Estilista libre
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-mono font-bold bg-emerald-200/80 text-emerald-950 border border-emerald-300 px-2 py-0.5 rounded shrink-0">
                                    {entry.startSlot12} - {entry.endSlot12}
                                  </span>
                                </div>
                              );
                            }

                            if (entry.isContinuation) {
                              return (
                                <div
                                  key={`${app.id}_cont_${entry.slotIndex}`}
                                  onClick={() => handleSlotClick(selectedStylistObj, timeSlot, app)}
                                  className={`p-2 rounded-md border border-dashed text-left cursor-pointer transition-all ${badge.cardBg} hover:shadow-xs flex items-center justify-between gap-2`}
                                  title={`Cita en curso: ${app.clientName} (${entry.startSlot12} a ${entry.endSlot12})`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-[#8C6B4D] font-mono text-xs font-bold shrink-0">↳ En curso ({entry.phaseName}):</span>
                                    <span className="font-bold text-xs uppercase font-serif-luxury truncate text-neutral-800">
                                      {app.clientName}
                                    </span>
                                    <span className="text-[10px] text-neutral-500 truncate hidden sm:inline">
                                      · {app.serviceName}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-mono font-bold bg-[#8C6B4D]/10 text-[#8C6B4D] border border-[#8C6B4D]/25 px-2 py-0.5 rounded shrink-0">
                                    {entry.startSlot12} - {entry.endSlot12} ({entry.durationText})
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={app.id}
                                onClick={() => handleSlotClick(selectedStylistObj, timeSlot, app)}
                                className={`p-2.5 rounded-md border text-left cursor-pointer transition-all ${badge.cardBg} hover:shadow-md relative overflow-hidden`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <User className="w-3.5 h-3.5 text-[#8C6B4D] shrink-0" />
                                    <span className="font-bold text-xs uppercase font-serif-luxury truncate text-neutral-900">
                                      {app.clientName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[9px] bg-white/80 border border-neutral-300 font-mono font-bold text-neutral-700 px-1.5 py-0.5 rounded">
                                      ⏱️ {entry.startSlot12} - {entry.endSlot12} ({entry.durationText})
                                    </span>
                                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${badge.badge}`}>
                                      {badge.label}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-neutral-700 mt-1.5">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <Scissors className="w-3 h-3 text-[#8C6B4D] shrink-0" />
                                    <span className="truncate">{app.serviceName}</span>
                                  </div>
                                  {app.clientPhone && (
                                    <div className="flex items-center gap-1.5 font-mono text-neutral-600">
                                      <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span>{app.clientPhone}</span>
                                    </div>
                                  )}
                                </div>

                                {app.notes && (
                                  <p className="text-[10px] text-neutral-500 italic mt-1 bg-white/60 p-1 rounded border border-black/5">
                                    "{app.notes}"
                                  </p>
                                )}

                                {/* Admin Quick Controls for Appointment */}
                                <div className="mt-2 pt-2 border-t border-neutral-200/80 flex items-center justify-between gap-1.5 bg-white/80 p-1 rounded">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSlotClick(selectedStylistObj, timeSlot, app);
                                      }}
                                      className="px-2 py-1 bg-[#2C221C] hover:bg-[#8C6B4D] text-white rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                      title="Modificar horario, estilista o reasignar cliente"
                                    >
                                      <Edit3 className="w-2.5 h-2.5 text-gold-champagne" />
                                      <span>Reasignar / Editar</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenExpandModal(app, e);
                                      }}
                                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                                      title="Expandir o ajustar duración de esta cita"
                                    >
                                      <Clock className="w-2.5 h-2.5 text-amber-700" />
                                      <span>Expandir Tiempo</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenCancelModal(app);
                                      }}
                                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                                      title="Cancelar cita con motivo y liberar horario"
                                    >
                                      <X className="w-2.5 h-2.5 text-rose-600" />
                                      <span>Cancelar</span>
                                    </button>
                                  </div>

                                  {app.clientPhone && (
                                    <a
                                      href={`https://wa.me/${app.clientPhone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(app.clientName)},%20le%20escribimos%20de%20CF%20Portadas%20respecto%20a%20su%20cita.`}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] cursor-pointer"
                                      title="WhatsApp"
                                    >
                                      <MessageSquare className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>

                                {app.status === 'Pendiente' && (
                                  <div className="mt-1 pt-1.5 border-t border-red-300/80 flex items-center justify-between gap-2 bg-red-50/80 p-1.5 rounded border border-red-200">
                                    <span className="text-[10px] text-red-800 font-bold uppercase font-mono flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                      Por Aprobar
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleApproveAppointment(app, selectedStylistObj.id);
                                      }}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>Aprobar Cita</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {!slotAppointments.some(e => e.isStylistBusy) && (
                            <button
                              type="button"
                              onClick={() => handleSlotClick(selectedStylistObj, timeSlot)}
                              className="w-full py-1.5 px-3 rounded border border-dashed border-emerald-400/80 hover:border-emerald-600 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-950 text-xs font-medium transition-all flex items-center justify-between cursor-pointer"
                            >
                              <span className="text-[10px] text-emerald-800 font-mono flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                <span>Espacio disponible en reposo a las {timeSlot} (permite cita corta)</span>
                              </span>
                              <span className="text-[9px] text-emerald-950 font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1 shadow-xs">
                                <Plus className="w-3 h-3" />
                                <span>Agendar aquí</span>
                              </span>
                            </button>
                          )}
                        </div>
                      ) : isOff ? (
                        <div 
                          onClick={() => handleSlotClick(selectedStylistObj, timeSlot)}
                          className="py-2 px-3 border border-dashed border-neutral-300 rounded bg-[#FAF8F5] text-neutral-400 text-xs font-mono flex items-center justify-between cursor-pointer hover:border-[#8C6B4D] hover:text-neutral-700 transition-colors"
                        >
                          <span>Día de descanso programado</span>
                          <span className="text-[10px] text-[#8C6B4D] font-bold uppercase">+ Forzar cita</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSlotClick(selectedStylistObj, timeSlot)}
                          className="w-full py-2 px-3 rounded border border-dashed border-[#D9CEC2] hover:border-[#8C6B4D] bg-[#FAF8F5] hover:bg-white text-[#5C4A38] text-xs font-medium transition-all flex items-center justify-between cursor-pointer group"
                        >
                          <span className="text-[11px] text-neutral-500 group-hover:text-neutral-900 font-mono">
                            Espacio libre a las {timeSlot}
                          </span>
                          <span className="text-[10px] text-[#8C6B4D] font-bold uppercase tracking-wider bg-white group-hover:bg-[#8C6B4D] group-hover:text-white px-2 py-0.5 rounded border border-[#D9CEC2] transition-colors flex items-center gap-1">
                            <Plus className="w-3 h-3" />
                            <span>Agendar Cita</span>
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW B: TIMELINE / CHRONOLOGICAL SCHEDULE FOR THE DAY     */}
        {/* ========================================================= */}
        {viewMode === 'timeline' && (
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="bg-white border border-[#E2D8CC] p-3 rounded-lg flex items-center justify-between">
              <span className="text-xs font-bold uppercase font-serif-luxury text-neutral-900">
                Cronograma de {formattedSelectedDate}
              </span>
              <span className="text-xs font-mono text-[#8C6B4D]">
                Total: {dayAppointments.length} citas registradas
              </span>
            </div>

            {dayAppointments.length === 0 ? (
              <div className="bg-white border border-[#E2D8CC] rounded-lg p-10 text-center space-y-3">
                <CalendarCheck className="w-10 h-10 text-neutral-300 mx-auto" />
                <p className="text-sm text-neutral-600 font-serif-luxury">
                  No hay citas agendadas para {formattedSelectedDate}.
                </p>
                <button
                  onClick={() => {
                    setEditingAppointment(null);
                    setModalInitialSlot({ stylistId: activeStylistId, time: '09:00' });
                    setIsAppointmentModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#2C221C] hover:bg-[#8C6B4D] text-white text-xs font-bold uppercase tracking-wider rounded shadow-xs cursor-pointer"
                >
                  + Agendar Primera Cita
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {dayAppointments.map((app) => {
                  const badge = getStatusBadge(app.status);
                  return (
                    <div
                      key={app.id}
                      className={`bg-white border rounded-lg p-3.5 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${badge.cardBg}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-bold font-mono text-neutral-900">
                            {app.time}
                          </span>
                          {(() => {
                            const norm24 = normalizeTimeTo24h(app.time);
                            const dur = app.durationMinutes || (SERVICES.find(s => s.id === app.serviceId)?.durationMinutes || 60);
                            const range = calculateAppointmentRange(norm24, dur);
                            return (
                              <span className="text-[10px] bg-white/80 border border-neutral-300 font-mono font-bold text-neutral-700 px-1.5 py-0.5 rounded">
                                ⏱️ {range.startTime12} - {range.endTime12} ({range.durationText})
                              </span>
                            );
                          })()}
                          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${badge.badge}`}>
                            {badge.label}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-neutral-900 uppercase font-serif-luxury">
                          {app.clientName}
                        </h4>

                        <p className="text-xs text-neutral-700">
                          {app.serviceName} · Especialista: <strong className="text-neutral-900 font-medium">{app.stylistName}</strong>
                        </p>

                        {app.clientPhone && (
                          <p className="text-[11px] text-neutral-500 font-mono">
                            Tel / WA: {app.clientPhone}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/10">
                        {app.status === 'Pendiente' && (
                          <button
                            onClick={() => handleStatusChange(app.id, 'Confirmada')}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded uppercase tracking-wider flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Confirmar</span>
                          </button>
                        )}

                        {app.clientPhone && (
                          <a
                            href={`https://wa.me/${app.clientPhone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(app.clientName)},%20le%20escribimos%20de%20CF%20Portadas%20para%20su%20cita%20a%20las%20${app.time}.`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold rounded flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        <button
                          onClick={() => {
                            setEditingAppointment(app);
                            setIsAppointmentModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-[#2C221C] hover:bg-[#8C6B4D] text-white text-[11px] font-bold rounded uppercase cursor-pointer"
                          title="Reasignar o editar cita"
                        >
                          Reasignar / Editar
                        </button>

                        <button
                          onClick={() => handleOpenCancelModal(app)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-[11px] font-bold rounded uppercase cursor-pointer transition-colors"
                          title="Cancelar cita y liberar horario"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW C: FULL MULTI-COLUMN MATRIX (Horizontal Scrolling)   */}
        {/* ========================================================= */}
        {viewMode === 'matrix' && (
          <div className="overflow-x-auto pb-6 bg-white border-2 border-[#8C7A68] rounded-lg shadow-sm">
            <div className="min-w-[760px] w-full">
              <table className="w-full border-collapse text-left">
                
                {/* Table Header: HORA + Stylists */}
                <thead className="bg-[#EFE7DC] border-b-2 border-[#6B5744] sticky top-0 z-20">
                  <tr>
                    <th className="w-20 px-3 py-2.5 border-r-2 border-[#6B5744] text-center bg-[#E5DCD0] sticky left-0 z-30 font-mono text-[10px] font-bold text-[#3B2D20] uppercase">
                      HORA
                    </th>

                    {stylists.map((stylist) => {
                      const dayOfWeek = selectedDate.getDay();
                      const isOff = stylist.offDays?.includes(dayOfWeek);

                      return (
                        <th
                          key={stylist.id}
                          className="px-3 py-2.5 border-r-2 border-[#8C7A68] text-center min-w-[190px] max-w-[240px] bg-[#FAF8F5] last:border-r-0"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#1C1612] uppercase font-serif-luxury truncate">
                                {stylist.name}
                              </span>
                              {isOff && (
                                <span className="text-[8px] bg-rose-100 text-rose-800 border border-rose-300 px-1 py-0.2 rounded uppercase font-mono font-bold">
                                  Libre
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-[#5C4A38] font-mono font-semibold tracking-wider uppercase truncate mt-0.5">
                              {stylist.role}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* Table Body: Time Rows */}
                <tbody className="divide-y-2 divide-[#D4C8BC] bg-white">
                  {timeSlots.map((timeSlot) => {
                    const [slotH, slotM] = timeSlot.split(':').map(Number);
                    const now = new Date();
                    const isCurrentHourSlot = isToday && now.getHours() === slotH && Math.abs(now.getMinutes() - slotM) < 15;

                    return (
                      <tr 
                        key={timeSlot} 
                        className={`hover:bg-[#F4EFE9] transition-colors ${
                          isCurrentHourSlot ? 'bg-amber-100/30' : ''
                        }`}
                      >
                        {/* Time Column (Sticky) */}
                        <td className="w-20 px-2 py-2 border-r-2 border-[#6B5744] text-center bg-[#E5DCD0] sticky left-0 z-10 font-mono text-[11px] text-[#3B2D20] font-bold">
                          {timeSlot}
                        </td>

                        {/* Stylist Cells */}
                        {stylists.map((stylist) => {
                          const cleanTime = timeSlot;
                          const appKey = `${stylist.id}_${cleanTime}`;
                          const slotAppointments = appointmentMatrix.get(appKey) || [];
                          const dayOfWeek = selectedDate.getDay();
                          const isOff = stylist.offDays?.includes(dayOfWeek);

                          return (
                            <td
                              key={stylist.id}
                              className="px-2 py-1.5 border-r-2 border-[#8C7A68] last:border-r-0 align-middle text-center"
                            >
                              {slotAppointments.length > 0 ? (
                                <div className="space-y-1">
                                  {slotAppointments.map((entry) => {
                                    const app = entry.appointment;
                                    const badge = getStatusBadge(app.status);

                                    if (entry.isReposoFreeSlot) {
                                      return (
                                        <div
                                          key={`${app.id}_reposo_${entry.slotIndex}`}
                                          onClick={() => handleSlotClick(stylist, timeSlot, app)}
                                          className="p-1 rounded text-left border border-dashed border-emerald-400 bg-emerald-50 text-emerald-950 cursor-pointer transition-all hover:shadow-xs"
                                          title={`Reposo (${entry.phaseName}): ${app.clientName}. Estilista libre para atender otra cita.`}
                                        >
                                          <div className="flex items-center justify-between gap-1">
                                            <span className="text-[9px] font-bold text-emerald-800 font-mono truncate">
                                              ⏳ {entry.phaseName}
                                            </span>
                                            <span className="text-[8px] font-mono bg-emerald-200/80 text-emerald-950 font-bold px-1 rounded shrink-0">
                                              Libre
                                            </span>
                                          </div>
                                          <div className="text-[9px] text-emerald-700 truncate font-serif-luxury">
                                            ↳ {app.clientName}
                                          </div>
                                        </div>
                                      );
                                    }

                                    if (entry.isContinuation) {
                                      return (
                                        <div
                                          key={`${app.id}_cont_${entry.slotIndex}`}
                                          onClick={() => handleSlotClick(stylist, timeSlot, app)}
                                          className={`p-1 rounded text-left border border-dashed cursor-pointer transition-all opacity-85 hover:opacity-100 ${badge.cardBg}`}
                                          title={`En progreso (${entry.startSlot12} a ${entry.endSlot12}): ${app.clientName} - ${app.serviceName}`}
                                        >
                                          <div className="flex items-center justify-between gap-1">
                                            <span className="text-[10px] text-neutral-700 font-mono truncate">
                                              ↳ {app.clientName}
                                            </span>
                                            <span className="text-[8px] font-mono text-neutral-500 shrink-0">
                                              {entry.startSlot24}-{entry.endSlot24}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div
                                        key={app.id}
                                        onClick={() => handleSlotClick(stylist, timeSlot, app)}
                                        className={`p-1.5 rounded text-left border cursor-pointer transition-all shadow-xs hover:shadow-md ${badge.cardBg}`}
                                        title={`Cita: ${app.clientName} (${entry.startSlot12} a ${entry.endSlot12}) - ${app.serviceName}`}
                                      >
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="font-bold text-xs truncate max-w-[130px] text-neutral-900 font-serif-luxury">
                                            {app.clientName}
                                          </span>
                                          {app.status === 'Pendiente' ? (
                                            <span className="text-[8px] bg-red-600 text-white font-mono font-bold px-1 rounded uppercase animate-pulse">
                                              Por Aprobar
                                            </span>
                                          ) : (
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${badge.dot}`} />
                                          )}
                                        </div>
                                        <div className="text-[10px] text-neutral-600 truncate mt-0.5 flex items-center justify-between">
                                          <span className="truncate">{app.serviceName}</span>
                                          <span className="text-[8px] font-mono font-bold text-[#8C6B4D] ml-1 shrink-0">
                                            {entry.durationText}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {!slotAppointments.some(e => e.isStylistBusy) && (
                                    <button
                                      type="button"
                                      onClick={() => handleSlotClick(stylist, timeSlot)}
                                      className="w-full mt-1 py-0.5 px-1 rounded bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-dashed border-emerald-300 text-emerald-900 font-mono text-[8px] font-bold transition-all flex items-center justify-center gap-0.5 cursor-pointer shadow-2xs"
                                      title="Estilista libre durante reposo - Clic para agendar cita corta"
                                    >
                                      <Plus className="w-2 h-2" />
                                      <span>+ Cita en reposo</span>
                                    </button>
                                  )}
                                </div>
                              ) : isOff ? (
                                <div 
                                  onClick={() => handleSlotClick(stylist, timeSlot)}
                                  className="h-7 rounded border border-dashed border-[#DDD5CC] bg-[#EFEAE2]/60 flex items-center justify-center cursor-pointer opacity-60 hover:opacity-100"
                                >
                                  <span className="text-[9px] text-neutral-400 font-mono">Libre</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSlotClick(stylist, timeSlot)}
                                  className="w-full h-7 px-2 rounded bg-white hover:bg-[#8C6B4D] hover:text-white border border-[#B5916A]/60 hover:border-[#8C6B4D] text-[#2C221C] font-mono text-[10px] font-bold transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer group/btn"
                                >
                                  <span>{timeSlot}</span>
                                  <Plus className="w-2.5 h-2.5 opacity-0 group-hover/btn:opacity-100 text-white" />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ============================================================ */}
      {/* 4. MODALS & POPUPS                                           */}
      {/* ============================================================ */}

      {/* MODAL 1: AYUDA */}
      <AnimatePresence>
        {activeBottomModal === 'help' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white border border-[#D9CEC2] rounded-xl p-6 shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
                <div className="flex items-center gap-2 text-[#8C6B4D]">
                  <HelpCircle className="w-5 h-5" />
                  <h3 className="font-serif-luxury text-lg font-bold text-neutral-900 uppercase tracking-wider">
                    Guía de la Agenda
                  </h3>
                </div>
                <button onClick={() => setActiveBottomModal(null)} className="text-neutral-400 hover:text-neutral-800 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-neutral-700 leading-relaxed">
                <div className="p-3 bg-[#FAF8F5] border border-[#EAE3DC] rounded">
                  <h4 className="font-bold text-neutral-900 uppercase text-[11px] mb-1">Vistas Adaptables</h4>
                  <p>En dispositivos móviles, use la pestaña <strong>"Por Estilista"</strong> para ver de forma amplia y cómoda los espacios de cada profesional sin apretar columnas.</p>
                </div>

                <div className="p-3 bg-[#FAF8F5] border border-[#EAE3DC] rounded">
                  <h4 className="font-bold text-neutral-900 uppercase text-[11px] mb-1">Código de Colores de Estado</h4>
                  <ul className="space-y-1.5 mt-1 font-mono text-[11px]">
                    <li className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      <strong className="text-emerald-900">Confirmada:</strong> Cita agendada y lista.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      <strong className="text-amber-900">Pendiente:</strong> Solicitud web por verificar.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500" />
                      <strong className="text-blue-900">Completada:</strong> Servicio finalizado.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500" />
                      <strong className="text-rose-900">Cancelada:</strong> Cita anulada.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setActiveBottomModal(null)}
                  className="px-4 py-2 bg-[#2C221C] hover:bg-[#8C6B4D] text-white text-xs uppercase tracking-wider font-bold rounded cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: BUSCADOR GENERAL DE CITAS */}
      <AnimatePresence>
        {activeBottomModal === 'list' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-white border border-[#D9CEC2] rounded-xl shadow-2xl flex flex-col max-h-[90vh] text-left"
            >
              {/* Header */}
              <div className="p-4 border-b border-[#EAE3DC] flex items-center justify-between bg-[#FAF8F5] rounded-t-xl">
                <div className="flex items-center gap-2 text-[#8C6B4D]">
                  <ListIcon className="w-5 h-5" />
                  <h3 className="font-serif-luxury text-lg font-bold text-neutral-900 uppercase tracking-wider">
                    Listado General de Citas ({listFilteredAppointments.length})
                  </h3>
                </div>
                <button onClick={() => setActiveBottomModal(null)} className="text-neutral-400 hover:text-neutral-800 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filters */}
              <div className="p-3 bg-white border-b border-[#EAE3DC] flex flex-wrap gap-2 items-center justify-between">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                    placeholder="Buscar por cliente, teléfono o servicio..."
                    className="w-full bg-[#FAF8F5] border border-[#D9CEC2] pl-8 pr-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 rounded outline-none focus:border-[#8C6B4D]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={listStatusFilter}
                    onChange={(e) => setListStatusFilter(e.target.value)}
                    className="bg-[#FAF8F5] border border-[#D9CEC2] text-xs text-neutral-800 px-2 py-1.5 rounded outline-none font-mono"
                  >
                    <option value="all">Todos los Estados</option>
                    <option value="Confirmada">Confirmadas</option>
                    <option value="Pendiente">Pendientes</option>
                    <option value="Completada">Completadas</option>
                    <option value="Cancelada">Canceladas</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-y-auto p-2">
                {listFilteredAppointments.length === 0 ? (
                  <div className="text-center py-12 text-neutral-400 text-xs font-mono">
                    No se encontraron citas con los filtros seleccionados.
                  </div>
                ) : (
                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] text-[#8C6B4D] uppercase font-mono border-b border-[#EAE3DC] bg-[#FAF8F5] sticky top-0">
                      <tr>
                        <th className="p-2.5">Fecha/Hora</th>
                        <th className="p-2.5">Cliente</th>
                        <th className="p-2.5">Servicio</th>
                        <th className="p-2.5">Estilista</th>
                        <th className="p-2.5">Estado</th>
                        <th className="p-2.5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE3DC]">
                      {listFilteredAppointments.map((app) => (
                        <tr key={app.id} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="p-2.5 font-mono text-[#8C6B4D] font-semibold">
                            <div>{app.date}</div>
                            <div className="text-[10px] text-neutral-500 font-normal">{app.time}</div>
                          </td>
                          <td className="p-2.5 font-bold text-neutral-900 uppercase font-serif-luxury">
                            <div>{app.clientName}</div>
                            <div className="text-[10px] text-neutral-500 font-mono font-normal">{app.clientPhone}</div>
                          </td>
                          <td className="p-2.5 text-neutral-700">{app.serviceName}</td>
                          <td className="p-2.5 font-serif-luxury text-neutral-900 font-medium">{app.stylistName}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${getStatusBadge(app.status).badge}`}>
                              {getStatusBadge(app.status).label}
                            </span>
                          </td>
                          <td className="p-2.5 text-right space-x-1">
                            <button
                              onClick={() => {
                                setActiveBottomModal(null);
                                handleOpenExpandModal(app);
                              }}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] uppercase font-bold cursor-pointer"
                              title="Expandir o ajustar duración"
                            >
                              Expandir
                            </button>
                            <button
                              onClick={() => {
                                setActiveBottomModal(null);
                                setEditingAppointment(app);
                                setIsAppointmentModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-[#2C221C] hover:bg-[#8C6B4D] text-white rounded text-[10px] uppercase font-bold cursor-pointer"
                            >
                              Editar
                            </button>
                            {app.clientPhone && (
                              <a
                                href={`https://wa.me/${app.clientPhone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(app.clientName)},%20le%20escribimos%20de%20CF%20Portadas%20para%20su%20cita.`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                              >
                                WhatsApp
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: CITAS PENDIENTES */}
      <AnimatePresence>
        {activeBottomModal === 'pending' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white border border-[#D9CEC2] rounded-xl shadow-2xl p-5 sm:p-6 text-left space-y-4 max-h-[88vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3 shrink-0">
                <div className="flex items-center gap-2.5 text-red-700">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-700">
                    <Bell className="w-4 h-4 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-serif-luxury text-base sm:text-lg font-bold text-neutral-900 uppercase tracking-wider">
                      Solicitudes de Citas Por Aprobar ({pendingAppointments.length})
                    </h3>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      Citas agendadas por clientes vía Asistente Web que requieren aprobación inmediata
                    </p>
                  </div>
                </div>
                <button onClick={() => setActiveBottomModal(null)} className="text-neutral-400 hover:text-neutral-800 p-1 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {pendingAppointments.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <CheckCheck className="w-12 h-12 text-emerald-500 mx-auto" />
                    <p className="text-sm font-bold text-neutral-800 font-serif-luxury uppercase">
                      ¡Al día! No hay citas pendientes
                    </p>
                    <p className="text-xs text-neutral-500 font-mono">
                      Todas las solicitudes agendadas han sido aprobadas y asignadas a la agenda.
                    </p>
                  </div>
                ) : (
                  pendingAppointments.map(app => (
                    <div 
                      key={app.id} 
                      className="p-4 bg-gradient-to-r from-red-50/80 via-white to-rose-50/40 border border-red-300 rounded-xl shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-200/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#2C221C] text-gold-champagne flex items-center justify-center text-xs font-bold font-serif-luxury">
                            {app.clientName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-neutral-900 uppercase font-serif-luxury">
                              {app.clientName}
                            </span>
                            <span className="text-[10px] bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded font-mono font-bold ml-2 uppercase animate-pulse">
                              Por Aprobar
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-xs text-red-900 font-bold">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          <span>{app.date}</span>
                          <span>•</span>
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatTimeTo12h(app.time)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-700">
                        <div className="flex items-center gap-2">
                          <Scissors className="w-3.5 h-3.5 text-[#8C6B4D] shrink-0" />
                          <span>Servicio: <strong className="text-neutral-900 font-semibold">{app.serviceName}</strong></span>
                        </div>
                        {app.clientPhone && (
                          <div className="flex items-center gap-2 font-mono text-neutral-700">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Teléfono: <strong>{app.clientPhone}</strong></span>
                          </div>
                        )}
                      </div>

                      {app.notes && (
                        <div className="text-[11px] text-neutral-600 bg-white/80 p-2 rounded border border-red-200/60 italic">
                          "{app.notes}"
                        </div>
                      )}

                      {/* Stylist Assignment and Approval Bar */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-red-200/80">
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C6B4D] font-mono">
                            Profesional:
                          </label>
                          <select
                            value={app.stylistId}
                            onChange={(e) => {
                              const targetSt = stylists.find(s => s.id === e.target.value);
                              if (targetSt) {
                                updateAppointmentDetails(app.id, {
                                  stylistId: targetSt.id,
                                  stylistName: targetSt.name
                                });
                              }
                            }}
                            className="bg-white border border-[#D9CEC2] text-neutral-900 text-xs rounded px-2 py-1 font-serif-luxury uppercase font-semibold focus:border-[#8C6B4D] outline-none shadow-xs"
                          >
                            <option value="cualquiera">Cualquier Profesional</option>
                            {stylists.filter(s => s.id !== 'cualquiera').map(st => (
                              <option key={st.id} value={st.id}>
                                {st.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {app.clientPhone && (
                            <a
                              href={`https://wa.me/${app.clientPhone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(app.clientName)},%20le%20confirmamos%20su%20cita%20en%20CF%20Portadas%20para%20el%20día%20${app.date}%20a%20las%20${formatTimeTo12h(app.time)}%20con%20${encodeURIComponent(app.stylistName)}.`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                              title="Enviar mensaje por WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </a>
                          )}

                          <button
                            onClick={() => {
                              setActiveBottomModal(null);
                              setEditingAppointment(app);
                              setIsAppointmentModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-[#F2ECE5] border border-[#D9CEC2] text-[#2C221C] text-xs rounded font-bold uppercase transition-colors cursor-pointer"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => {
                              handleApproveAppointment(app, app.stylistId);
                              setActiveBottomModal(null);
                            }}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Aprobar y Agendar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: AGREGAR PROFESIONAL */}
      <AnimatePresence>
        {activeBottomModal === 'add_stylist' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white border border-[#D9CEC2] rounded-xl shadow-2xl p-6 text-left space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
                <div className="flex items-center gap-2 text-[#8C6B4D]">
                  <Plus className="w-5 h-5" />
                  <h3 className="font-serif-luxury text-lg font-bold text-neutral-900 uppercase tracking-wider">
                    Agregar Nuevo Profesional
                  </h3>
                </div>
                <button onClick={() => setActiveBottomModal(null)} className="text-neutral-400 hover:text-neutral-800 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddStylist} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C6B4D] tracking-wider mb-1">
                    Nombre del Profesional *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStylistName}
                    onChange={(e) => setNewStylistName(e.target.value)}
                    placeholder="ej. MARIANA"
                    className="w-full bg-[#FAF8F5] border border-[#D9CEC2] p-2.5 text-neutral-900 rounded text-xs outline-none focus:border-[#8C6B4D] font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C6B4D] tracking-wider mb-1">
                    Especialidad / Cargo
                  </label>
                  <input
                    type="text"
                    value={newStylistRole}
                    onChange={(e) => setNewStylistRole(e.target.value)}
                    placeholder="ej. COLORISTA MASTER / CORTE"
                    className="w-full bg-[#FAF8F5] border border-[#D9CEC2] p-2.5 text-neutral-900 rounded text-xs outline-none focus:border-[#8C6B4D] uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C6B4D] tracking-wider mb-1">
                    Día Libre Habitual
                  </label>
                  <select
                    value={newStylistOffDay}
                    onChange={(e) => setNewStylistOffDay(Number(e.target.value))}
                    className="w-full bg-[#FAF8F5] border border-[#D9CEC2] p-2.5 text-neutral-900 rounded text-xs outline-none font-mono focus:border-[#8C6B4D]"
                  >
                    <option value={-1}>Sin día libre fijo</option>
                    <option value={1}>Lunes</option>
                    <option value={2}>Martes</option>
                    <option value={3}>Miércoles</option>
                    <option value={4}>Jueves</option>
                    <option value={5}>Viernes</option>
                    <option value={6}>Sábado</option>
                    <option value={0}>Domingo</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveBottomModal(null)}
                    className="px-4 py-2 border border-[#D9CEC2] text-neutral-600 hover:text-neutral-900 text-xs uppercase font-bold rounded cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#2C221C] hover:bg-[#8C6B4D] text-white text-xs uppercase tracking-wider font-bold rounded shadow-xs cursor-pointer"
                  >
                    Guardar Profesional
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* APPOINTMENT CREATION / EDIT MODAL */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => {
          setIsAppointmentModalOpen(false);
          setEditingAppointment(null);
          setModalInitialSlot(null);
          setPrefilledClientForBooking(null);
        }}
        onSave={handleSaveAppointment}
        onDelete={handleDeleteAppointment}
        initialAppointment={modalAppointmentData}
        selectedDate={selectedDateStr}
        prefilledClient={prefilledClientForBooking}
      />

      {/* CANCEL APPOINTMENT MODAL */}
      <CancelAppointmentModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setCancellingAppointment(null);
        }}
        onConfirmCancel={handleConfirmCancellation}
        appointment={cancellingAppointment}
      />

      {/* EXPAND DURATION MODAL */}
      <ExpandDurationModal
        isOpen={isExpandModalOpen}
        onClose={() => {
          setIsExpandModalOpen(false);
          setExpandingAppointment(null);
        }}
        onConfirmExpand={handleConfirmExpand}
        appointment={expandingAppointment}
      />

      {/* CLIENT DIRECTORY MODAL */}
      <ClientDirectoryModal
        isOpen={isClientDirectoryOpen}
        onClose={() => setIsClientDirectoryOpen(false)}
        onBookAppointmentForClient={(client) => {
          setPrefilledClientForBooking(client);
          setEditingAppointment(null);
          setModalInitialSlot({ stylistId: activeStylistId, time: '10:00' });
          setIsAppointmentModalOpen(true);
        }}
        appointments={appointments}
      />

      {/* 5. BOTTOM COMMAND DOCK (Identical to original desktop layout) */}
      <footer className="bg-white border-t border-[#E2D8CC] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 shadow-xs">
        {/* Left: Clock & App Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[#2C221C] bg-[#FAF8F5] border border-[#D9CEC2] px-2.5 py-1 rounded shadow-xs">
            <Clock className="w-3.5 h-3.5 text-[#8C6B4D]" />
            <span className="font-bold">{currentTime || '00:00:00'}</span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-neutral-600 font-mono text-[11px]">
            <span>{dayAppointments.length} citas hoy</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">
              {dayAppointments.filter(a => a.status === 'Confirmada').length} confirmadas
            </span>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsClientDirectoryOpen(true)}
            className="px-2.5 py-1 text-[#2C221C] hover:text-[#8C6B4D] hover:bg-[#FAF8F5] border border-[#D9CEC2] rounded transition-colors flex items-center gap-1.5 font-mono text-xs cursor-pointer shadow-2xs font-semibold"
            title="Ver o registrar clientes"
          >
            <Users className="w-3.5 h-3.5 text-[#8C6B4D]" />
            <span>Directorio Clientes ({clientsCount})</span>
          </button>

          <button
            onClick={() => setActiveBottomModal('help')}
            className="px-2.5 py-1 text-neutral-600 hover:text-neutral-900 hover:bg-[#FAF8F5] border border-transparent hover:border-[#D9CEC2] rounded transition-colors flex items-center gap-1 font-mono text-xs cursor-pointer"
            title="Ayuda del sistema"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#8C6B4D]" />
            <span className="hidden sm:inline">Ayuda</span>
          </button>

          <button
            onClick={() => setActiveBottomModal('add_stylist')}
            className="px-2.5 py-1 text-neutral-600 hover:text-neutral-900 hover:bg-[#FAF8F5] border border-transparent hover:border-[#D9CEC2] rounded transition-colors flex items-center gap-1 font-mono text-xs cursor-pointer"
            title="Agregar estilista"
          >
            <Plus className="w-3.5 h-3.5 text-[#8C6B4D]" />
            <span className="hidden sm:inline">Nuevo Profesional</span>
          </button>

          <button
            onClick={() => {
              setEditingAppointment(null);
              setPrefilledClientForBooking(null);
              setModalInitialSlot({ stylistId: activeStylistId, time: '09:00' });
              setIsAppointmentModalOpen(true);
            }}
            className="px-3 py-1 bg-[#2C221C] hover:bg-[#8C6B4D] text-white text-xs font-bold uppercase tracking-wider rounded shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-gold-champagne" />
            <span>Nueva Cita</span>
          </button>
        </div>
      </footer>

    </div>
  );
};
