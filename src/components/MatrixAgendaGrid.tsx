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
  CalendarCheck
} from 'lucide-react';
import { Appointment, AppointmentStatus, Stylist } from '../types';
import { STYLISTS as DEFAULT_STYLISTS, SERVICES } from '../constants';
import { 
  getStoredAppointments, 
  saveAppointment, 
  deleteAppointment, 
  updateAppointmentStatus, 
  subscribeToAppointments 
} from '../utils/storage';
import { AppointmentModal } from './AppointmentModal';

interface MatrixAgendaGridProps {
  onClose?: () => void;
  isAdmin?: boolean;
}

// Generate customizable time slots between 07:30 and 21:30 (default 30-minute intervals)
const GENERATE_TIME_SLOTS = (interval: 15 | 30 = 30): string[] => {
  const slots: string[] = [];
  const startHour = 7;
  const startMinute = 30;
  const endHour = 21;
  const endMinute = 30;

  let currentMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  while (currentMinutes <= endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    currentMinutes += interval;
  }
  return slots;
};

export const MatrixAgendaGrid: React.FC<MatrixAgendaGridProps> = ({ onClose, isAdmin = true }) => {
  // Real-time Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Selected Date (defaults to today)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Salon selection
  const [selectedSalon, setSelectedSalon] = useState<string>('Salón 1');
  const [isSalonMenuOpen, setIsSalonMenuOpen] = useState<boolean>(false);

  // Stylists list (with ability to add new ones dynamically)
  const [stylists, setStylists] = useState<Stylist[]>(() => {
    try {
      const saved = localStorage.getItem('cf_portadas_custom_stylists');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_STYLISTS;
  });

  // Appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Time slots interval (strictly 30 min blocks: 07:30, 08:00, 08:30, 09:00...)
  const [slotInterval, setSlotInterval] = useState<15 | 30>(30);
  const timeSlots = useMemo(() => GENERATE_TIME_SLOTS(slotInterval), [slotInterval]);

  // Modals & Drawers state
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [modalInitialSlot, setModalInitialSlot] = useState<{ stylistId: string; time: string } | null>(null);

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

  // Subscribe to real-time appointments
  useEffect(() => {
    const unsubscribe = subscribeToAppointments((updated) => {
      setAppointments(updated);
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

  // Format date helper: "Sábado, 15 de Agosto de 2026"
  const formattedSelectedDate = useMemo(() => {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const dayName = dayNames[selectedDate.getDay()];
    const dayNum = selectedDate.getDate();
    const monthName = monthNames[selectedDate.getMonth()];
    const year = selectedDate.getFullYear();
    return `${dayName}, ${dayNum} de ${monthName} de ${year}`;
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
    return appointments.filter(a => a.date === selectedDateStr);
  }, [appointments, selectedDateStr]);

  // Map appointments by stylistId and time (also supporting legacy :15 and :45 slots falling into the half-hour block)
  const appointmentMatrix = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    dayAppointments.forEach(app => {
      const cleanTime = app.time.substring(0, 5);
      const [hStr, mStr] = cleanTime.split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);

      // Determine target 30-min block
      const targetM = m < 30 ? '00' : '30';
      const targetSlotTime = `${String(h).padStart(2, '0')}:${targetM}`;

      // Set direct exact match
      const exactKey = `${app.stylistId}_${cleanTime}`;
      const existingExact = map.get(exactKey) || [];
      map.set(exactKey, [...existingExact, app]);

      // Also bucket into 30m block slot
      const blockKey = `${app.stylistId}_${targetSlotTime}`;
      if (blockKey !== exactKey) {
        const existingBlock = map.get(blockKey) || [];
        map.set(blockKey, [...existingBlock, app]);
      }

      if (app.stylistId === 'cualquiera') {
        const exactQual = `cualquiera_${cleanTime}`;
        map.set(exactQual, [...(map.get(exactQual) || []), app]);
        const blockQual = `cualquiera_${targetSlotTime}`;
        if (blockQual !== exactQual) {
          map.set(blockQual, [...(map.get(blockQual) || []), app]);
        }
      }
    });
    return map;
  }, [dayAppointments]);

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
          cardBg: 'bg-emerald-50/95 border-emerald-400 text-emerald-950 hover:border-emerald-600',
          dot: 'bg-emerald-500',
          textColor: 'text-emerald-950',
          subColor: 'text-emerald-800',
          timeColor: 'text-emerald-700',
          label: 'Confirmada'
        };
      case 'Pendiente':
        return {
          cardBg: 'bg-amber-50/95 border-amber-400 text-amber-950 hover:border-amber-600',
          dot: 'bg-amber-500',
          textColor: 'text-amber-950',
          subColor: 'text-amber-800',
          timeColor: 'text-amber-700',
          label: 'Pendiente'
        };
      case 'Completada':
        return {
          cardBg: 'bg-blue-50/95 border-blue-400 text-blue-950 hover:border-blue-600',
          dot: 'bg-blue-500',
          textColor: 'text-blue-950',
          subColor: 'text-blue-800',
          timeColor: 'text-blue-700',
          label: 'Completada'
        };
      case 'Cancelada':
        return {
          cardBg: 'bg-rose-50/90 border-rose-300 text-rose-800 line-through opacity-70',
          dot: 'bg-rose-400',
          textColor: 'text-rose-900',
          subColor: 'text-rose-700',
          timeColor: 'text-rose-600',
          label: 'Cancelada'
        };
      default:
        return {
          cardBg: 'bg-neutral-50 border-neutral-300 text-neutral-900',
          dot: 'bg-neutral-400',
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

  // Check if today
  const isToday = useMemo(() => {
    const today = new Date();
    return (
      today.getFullYear() === selectedDate.getFullYear() &&
      today.getMonth() === selectedDate.getMonth() &&
      today.getDate() === selectedDate.getDate()
    );
  }, [selectedDate]);

  // Memoize appointment payload passed into AppointmentModal to prevent unwanted re-initializations
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
      className={`min-h-[82vh] bg-[#FAF8F5] text-neutral-900 border border-[#E2D8CC] rounded-xl shadow-lg flex flex-col font-sans select-none overflow-x-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 p-0 rounded-none' : 'relative'
      }`}
      id="matrix-agenda-main"
    >
      {/* 1. TOP WINDOW BAR (Light & Clean) */}
      <header className="bg-white border-b border-[#E2D8CC] px-3 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4 shrink-0 shadow-xs">
        
        {/* Left: Calendar Icon + Title + Salon Subtitle */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md border border-[#B5916A]/40 bg-[#FAF8F5] flex items-center justify-center text-[#8C6B4D] shadow-xs shrink-0">
            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#8C6B4D]" />
          </div>
          <div className="relative">
            <h1 className="text-xs sm:text-sm md:text-base font-bold text-[#2C221C] tracking-wide uppercase font-serif-luxury leading-tight">
              Agenda de Citas
            </h1>
            
            {/* Salon Dropdown */}
            <div className="relative inline-block">
              <button 
                onClick={() => setIsSalonMenuOpen(!isSalonMenuOpen)}
                className="text-[10px] sm:text-[11px] text-[#8C6B4D] hover:text-[#2C221C] transition-colors flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>{selectedSalon}</span>
                <span className="text-[8px] opacity-80">▼</span>
              </button>

              {isSalonMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-[#E2D8CC] shadow-xl rounded-md z-50 py-1">
                  {['Salón 1 - Principal', 'Salón 2 - Spa y Estética', 'Cabina VIP Kérastase'].map(salon => (
                    <button
                      key={salon}
                      onClick={() => {
                        setSelectedSalon(salon.split(' - ')[0]);
                        setIsSalonMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-neutral-800 hover:bg-[#FAF8F5] hover:text-[#8C6B4D] transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>{salon}</span>
                      {selectedSalon === salon.split(' - ')[0] && <Check className="w-3.5 h-3.5 text-[#8C6B4D]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center: Date Navigation (< Sábado, 15 de Agosto de 2026 >) */}
        <div className="flex items-center gap-1 sm:gap-2.5">
          <button
            onClick={handlePrevDay}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-white border border-[#D9CEC2] hover:border-[#8C6B4D] hover:bg-[#F2ECE5] text-[#2C221C] flex items-center justify-center transition-all shadow-xs cursor-pointer"
            title="Día anterior"
            aria-label="Día anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            className="px-3 sm:px-5 py-1.5 rounded bg-[#FAF8F5] border border-[#D9CEC2] text-xs sm:text-sm font-semibold text-[#2C221C] tracking-wide flex items-center gap-2 shadow-xs"
          >
            <span className="font-serif-luxury font-bold text-neutral-900">{formattedSelectedDate}</span>
            {isToday && (
              <span className="text-[9px] uppercase font-mono tracking-wider bg-[#E5C1CD]/40 text-[#8C4A5A] border border-[#E5C1CD] px-1.5 py-0.2 rounded font-bold hidden sm:inline">
                Hoy
              </span>
            )}
          </div>

          <button
            onClick={handleNextDay}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-white border border-[#D9CEC2] hover:border-[#8C6B4D] hover:bg-[#F2ECE5] text-[#2C221C] flex items-center justify-center transition-all shadow-xs cursor-pointer"
            title="Día siguiente"
            aria-label="Día siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              onClick={handleSetToday}
              className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider px-2.5 py-1.5 bg-[#2C221C] hover:bg-[#8C6B4D] text-white transition-all rounded shadow-xs hidden lg:block cursor-pointer font-bold"
            >
              Ir a Hoy
            </button>
          )}
        </div>

        {/* Right: Action Buttons + Live Clock */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          
          {/* Action Buttons in Header */}
          <button
            onClick={() => setActiveBottomModal('help')}
            className="px-2.5 sm:px-3 py-1.5 rounded bg-[#FAF8F5] hover:bg-[#F2ECE5] border border-[#D9CEC2] hover:border-[#8C6B4D] text-[#5C4A38] hover:text-[#1A1410] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer text-xs font-bold uppercase tracking-wider"
            title="Ayuda y Guía de Uso"
          >
            <HelpCircle className="w-4 h-4 text-[#8C6B4D]" />
            <span className="hidden md:inline">Ayuda</span>
          </button>

          <button
            onClick={() => setActiveBottomModal('list')}
            className="px-2.5 sm:px-3 py-1.5 rounded bg-[#FAF8F5] hover:bg-[#F2ECE5] border border-[#D9CEC2] hover:border-[#8C6B4D] text-[#5C4A38] hover:text-[#1A1410] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer text-xs font-bold uppercase tracking-wider"
            title="Ver Todas las Citas en Lista"
          >
            <ListIcon className="w-4 h-4 text-[#8C6B4D]" />
            <span className="hidden md:inline">Lista</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-2.5 sm:px-3 py-1.5 rounded bg-[#FAF8F5] hover:bg-[#F2ECE5] border border-[#D9CEC2] hover:border-[#8C6B4D] text-[#5C4A38] hover:text-[#1A1410] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer text-xs font-bold uppercase tracking-wider"
            title="Imprimir Hoja de Trabajo Diaria"
          >
            <Printer className="w-4 h-4 text-[#8C6B4D]" />
            <span className="hidden md:inline">Imprimir</span>
          </button>

          <button
            onClick={() => setActiveBottomModal('pending')}
            className="px-2.5 sm:px-3 py-1.5 rounded bg-[#FAF8F5] hover:bg-amber-50 border border-amber-300 hover:border-amber-500 text-amber-900 transition-all shadow-xs flex items-center gap-1.5 relative cursor-pointer text-xs font-bold uppercase tracking-wider"
            title="Ver Citas Pendientes de Confirmación"
          >
            <ClipboardList className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Pendientes</span>
            {pendingAppointments.length > 0 && (
              <span className="bg-amber-600 text-white font-bold text-[9px] px-1.5 py-0.2 rounded-full animate-bounce">
                {pendingAppointments.length}
              </span>
            )}
          </button>

          {/* Live Clock */}
          <div className="flex items-center gap-1.5 text-[#2C221C] bg-[#FAF8F5] border border-[#E2D8CC] px-2.5 py-1 rounded shadow-xs hidden lg:flex">
            <Clock className="w-3.5 h-3.5 text-[#8C6B4D] animate-pulse" />
            <span className="font-mono text-xs sm:text-sm font-bold tracking-wider">
              {currentTime || '00:00:00'}
            </span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-7 h-7 rounded text-neutral-500 hover:text-neutral-900 hover:bg-[#F2ECE5] flex items-center justify-center transition-colors cursor-pointer"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
          </button>

        </div>

      </header>

      {/* 2. MAIN MATRIX GRID (Light Theme Table with high contrast) */}
      <div className="flex-1 overflow-auto bg-[#F7F4EF] relative" id="matrix-scroll-area">
        <div className="min-w-[1000px] w-full pb-24">
          <table className="w-full border-collapse text-left border-b border-[#E2D8CC]">
            
            {/* Table Header: HORA + Stylist Columns */}
            <thead className="sticky top-0 z-20 bg-[#F4EEE6] border-b-2 border-[#D9CEC2] shadow-xs">
              <tr>
                {/* Column: HORA */}
                <th className="w-24 px-3 py-3 border-r border-[#E2D8CC] text-center bg-[#F0EAE1] sticky left-0 z-30 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                  <span className="text-[11px] font-bold tracking-[0.2em] text-[#5C4A38] uppercase font-mono">
                    HORA
                  </span>
                </th>

                {/* Columns: Stylists */}
                {stylists.map((stylist) => {
                  const dayOfWeek = selectedDate.getDay();
                  const isOff = stylist.offDays?.includes(dayOfWeek);

                  return (
                    <th
                      key={stylist.id}
                      className={`px-3 py-2.5 border-r border-[#E2D8CC] text-center min-w-[180px] max-w-[240px] transition-colors ${
                        stylist.id === 'cualquiera' ? 'bg-[#F5EFE8]' : 'bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-[#1C1612] tracking-wider uppercase font-serif-luxury">
                            {stylist.name}
                          </span>
                          {isOff && (
                            <span className="text-[8px] bg-rose-100 border border-rose-300 text-rose-800 px-1 py-0.2 rounded uppercase font-mono font-bold">
                              Libre
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-[#7C6652] font-mono tracking-wider uppercase line-clamp-1 mt-0.5 font-medium">
                          {stylist.role}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body: Time Rows */}
            <tbody className="divide-y divide-[#EAE3DC] bg-white">
              {timeSlots.map((timeSlot) => {
                const [slotH, slotM] = timeSlot.split(':').map(Number);
                const now = new Date();
                const isCurrentHourSlot = isToday && now.getHours() === slotH && Math.abs(now.getMinutes() - slotM) < 15;

                return (
                  <tr 
                    key={timeSlot} 
                    className={`hover:bg-[#F4EFE9] transition-colors group ${
                      isCurrentHourSlot ? 'bg-amber-100/40 border-y border-amber-300/80' : ''
                    }`}
                  >
                    
                    {/* Time Column (Left Sticky) */}
                    <td className="w-24 px-3 py-1.5 border-r border-[#E2D8CC] text-center bg-[#F0EAE1] sticky left-0 z-10 font-mono text-[11px] text-[#5C4A38] font-bold group-hover:text-[#1C1612] shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center justify-center gap-1">
                        {isCurrentHourSlot && <span className="w-1.5 h-1.5 rounded-full bg-[#8C6B4D] animate-ping" />}
                        <span>{timeSlot}</span>
                      </div>
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
                          className="px-2 py-1 border-r border-[#E2D8CC] h-10 align-middle relative text-center"
                        >
                          {slotAppointments.length > 0 ? (
                            <div className="space-y-1">
                              {slotAppointments.map((appointment) => (
                                /* Booked Appointment Card (Light Theme) */
                                <motion.div
                                  key={appointment.id}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  onClick={() => handleSlotClick(stylist, timeSlot, appointment)}
                                  className={`p-1.5 rounded text-left border-2 cursor-pointer transition-all shadow-xs hover:shadow-md group/card ${
                                    getStatusBadge(appointment.status).cardBg
                                  } hover:scale-[1.02] hover:z-20 relative`}
                                  title={`Cita: ${appointment.clientName} - ${appointment.serviceName} (${appointment.time})`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className={`font-bold text-xs truncate max-w-[120px] ${getStatusBadge(appointment.status).textColor}`}>
                                      {appointment.clientName}
                                    </span>
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusBadge(appointment.status).dot}`} />
                                  </div>

                                  <div className="flex items-center justify-between text-[9px] mt-0.5">
                                    <span className={`truncate max-w-[110px] font-medium ${getStatusBadge(appointment.status).subColor}`}>
                                      {appointment.serviceName}
                                    </span>
                                    <span className={`font-mono font-bold shrink-0 ${getStatusBadge(appointment.status).timeColor}`}>
                                      {appointment.time}
                                    </span>
                                  </div>

                                  {appointment.clientPhone && (
                                    <div className="text-[8px] text-neutral-600 font-mono flex items-center gap-1 mt-0.5">
                                      <Phone className="w-2.5 h-2.5 text-emerald-600" />
                                      <span>{appointment.clientPhone}</span>
                                    </div>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          ) : isOff ? (
                            /* Day Off Muted Cell */
                            <div 
                              onClick={() => handleSlotClick(stylist, timeSlot)}
                              className="h-7 rounded border border-dashed border-[#DDD5CC] bg-[#EFEAE2]/60 flex items-center justify-center cursor-pointer hover:border-[#8C6B4D] transition-colors opacity-60 hover:opacity-100"
                              title="Día libre programado. Haga clic para agendar cita extraordinaria."
                            >
                              <span className="text-[9px] text-neutral-400 font-mono tracking-tight font-medium">Libre</span>
                            </div>
                          ) : (
                            /* Available Slot Button Pill in Light Theme */
                            <button
                              onClick={() => handleSlotClick(stylist, timeSlot)}
                              className="w-full max-w-[130px] mx-auto h-7 px-2.5 rounded-sm bg-white hover:bg-[#8C6B4D] hover:text-white border border-[#D9CEC2] hover:border-[#8C6B4D] text-[#3D3025] font-mono text-[10px] font-semibold transition-all flex items-center justify-center gap-1 shadow-xs group/btn cursor-pointer"
                              title={`Agendar espacio con ${stylist.name} a las ${timeSlot}`}
                            >
                              <span className="group-hover/btn:font-bold">{timeSlot}</span>
                              <Plus className="w-2.5 h-2.5 opacity-0 group-hover/btn:opacity-100 text-white transition-opacity" />
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

          {/* Bottom Table Action: + Agregar Profesional */}
          <div className="p-4 bg-white border-t border-[#E2D8CC] flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setActiveBottomModal('add_stylist')}
              className="px-3.5 py-2 rounded-md bg-[#FAF8F5] hover:bg-[#2C221C] hover:text-white border border-[#D9CEC2] hover:border-[#2C221C] text-xs text-[#2C221C] font-bold tracking-wider uppercase flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#8C6B4D]" />
              <span>Agregar Profesional</span>
            </button>

            <div className="flex items-center gap-3 text-xs text-[#6B5744] font-mono">
              <span>Total Citas Hoy: <strong className="text-[#2C221C] font-bold">{dayAppointments.length}</strong></span>
              <span>•</span>
              <span>Confirmadas: <strong className="text-emerald-700 font-bold">{dayAppointments.filter(a => a.status === 'Confirmada').length}</strong></span>
              {pendingAppointments.length > 0 && (
                <>
                  <span>•</span>
                  <button 
                    onClick={() => setActiveBottomModal('pending')} 
                    className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                  >
                    Pendientes: {pendingAppointments.length}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. MODALS & POPUPS (Light Theme)                             */}
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
                    Guía de la Agenda de Citas
                  </h3>
                </div>
                <button onClick={() => setActiveBottomModal(null)} className="text-neutral-400 hover:text-neutral-800 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-neutral-700 leading-relaxed">
                <div className="p-3 bg-[#FAF8F5] border border-[#EAE3DC] rounded">
                  <h4 className="font-bold text-neutral-900 uppercase text-[11px] mb-1">¿Cómo agendar una cita?</h4>
                  <p>Haga clic en cualquier botón de hora disponible (ej. <span className="font-mono font-bold text-[#8C6B4D]">08:00</span>) en la columna del estilista deseado para abrir el formulario y registrar cliente, servicio y notas.</p>
                </div>

                <div className="p-3 bg-[#FAF8F5] border border-[#EAE3DC] rounded">
                  <h4 className="font-bold text-neutral-900 uppercase text-[11px] mb-1">Código de Colores de Estado</h4>
                  <ul className="space-y-1.5 mt-1 font-mono text-[11px]">
                    <li className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      <strong className="text-emerald-900">Confirmada:</strong> Cita agendada y verificada.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      <strong className="text-amber-900">Pendiente:</strong> Solicitud web en espera de confirmación.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500" />
                      <strong className="text-blue-900">Completada:</strong> Servicio atendido y finalizado.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500" />
                      <strong className="text-rose-900">Cancelada:</strong> Cita anulada.
                    </li>
                  </ul>
                </div>

                <div className="p-3 bg-[#FAF8F5] border border-[#EAE3DC] rounded">
                  <h4 className="font-bold text-neutral-900 uppercase text-[11px] mb-1">Impresión y Exportación</h4>
                  <p>Haga clic en el botón <strong className="text-neutral-900">Imprimir</strong> en la barra inferior para generar una hoja de trabajo diaria lista para recepción.</p>
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

      {/* MODAL 2: MOSTRAR LISTA */}
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
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${getStatusBadge(app.status).cardBg}`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-right space-x-1">
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

      {/* MODAL 4: CITAS PENDIENTES */}
      <AnimatePresence>
        {activeBottomModal === 'pending' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white border border-[#D9CEC2] rounded-xl shadow-2xl p-6 text-left space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3 shrink-0">
                <div className="flex items-center gap-2 text-amber-700">
                  <ClipboardList className="w-5 h-5" />
                  <h3 className="font-serif-luxury text-lg font-bold text-neutral-900 uppercase tracking-wider">
                    Citas Pendientes de Confirmación ({pendingAppointments.length})
                  </h3>
                </div>
                <button onClick={() => setActiveBottomModal(null)} className="text-neutral-400 hover:text-neutral-800 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {pendingAppointments.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500 text-xs font-mono">
                    🎉 No hay citas pendientes. Todas las citas están confirmadas o procesadas.
                  </div>
                ) : (
                  pendingAppointments.map(app => (
                    <div key={app.id} className="p-3.5 bg-[#FAF8F5] border border-amber-300 rounded-lg flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-neutral-900 uppercase font-serif-luxury">{app.clientName}</span>
                          <span className="text-[10px] font-mono text-[#8C6B4D] bg-white px-1.5 py-0.5 rounded border border-[#D9CEC2] font-semibold">
                            {app.date} · {app.time}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-700 mt-0.5">
                          {app.serviceName} con <strong className="text-neutral-900">{app.stylistName}</strong>
                        </p>
                        {app.clientPhone && (
                          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                            Tel: {app.clientPhone}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleStatusChange(app.id, 'Confirmada')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded uppercase tracking-wider flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirmar</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveBottomModal(null);
                            setEditingAppointment(app);
                            setIsAppointmentModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-[#2C221C] hover:bg-[#8C6B4D] text-white text-xs rounded font-bold cursor-pointer"
                        >
                          Ver
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: AGREGAR PROFESIONAL */}
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
        }}
        onSave={handleSaveAppointment}
        onDelete={handleDeleteAppointment}
        initialAppointment={modalAppointmentData}
        selectedDate={selectedDateStr}
      />

    </div>
  );
};
