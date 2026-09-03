import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CalendarDays,
  ArrowRight,
  Search,
  Filter,
  CheckCheck,
  CalendarRange
} from 'lucide-react';
import { Appointment, Stylist } from '../types';
import { formatTimeTo12h } from '../utils/timeUtils';

interface YearAgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onScheduleNewForDate: (dateStr: string) => void;
  appointments: Appointment[];
  stylists: Stylist[];
  onOpenAppointment?: (appointment: Appointment) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTH_ABBR = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'
];

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const YearAgendaModal: React.FC<YearAgendaModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  onScheduleNewForDate,
  appointments,
  stylists,
  onOpenAppointment
}) => {
  // Year navigation state
  const [currentYear, setCurrentYear] = useState<number>(() => selectedDate.getFullYear());
  const [activeTab, setActiveTab] = useState<'calendar' | 'upcoming_list'>('calendar');
  const [inspectedDateStr, setInspectedDateStr] = useState<string>(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [stylistFilter, setStylistFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const monthRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Keep inspected date in sync when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentYear(selectedDate.getFullYear());
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      setInspectedDateStr(`${y}-${m}-${d}`);
    }
  }, [isOpen, selectedDate]);

  // Today helpers
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  // Map appointments by date string "YYYY-MM-DD"
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach(app => {
      if (!app.date) return;
      // Filter by stylist if active
      if (stylistFilter !== 'all' && app.stylistId !== stylistFilter) return;
      // Filter by status if active
      if (statusFilter !== 'all' && app.status !== statusFilter) return;

      const list = map.get(app.date) || [];
      list.push(app);
      map.set(app.date, list);
    });

    // Sort appointments in each day by time
    map.forEach(list => {
      list.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    });

    return map;
  }, [appointments, stylistFilter, statusFilter]);

  // Stats for the current year
  const yearStats = useMemo(() => {
    let total = 0;
    let confirmed = 0;
    let pending = 0;
    const yearPrefix = `${currentYear}-`;

    appointments.forEach(a => {
      if (a.date && a.date.startsWith(yearPrefix)) {
        total++;
        if (a.status === 'Confirmada') confirmed++;
        if (a.status === 'Pendiente') pending++;
      }
    });

    return { total, confirmed, pending };
  }, [appointments, currentYear]);

  // Appointments for inspected date
  const inspectedAppointments = useMemo(() => {
    return appointmentsByDate.get(inspectedDateStr) || [];
  }, [appointmentsByDate, inspectedDateStr]);

  // Formatted inspected date title
  const formattedInspectedDate = useMemo(() => {
    if (!inspectedDateStr) return '';
    try {
      const [y, m, d] = inspectedDateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      return `${dayNames[dateObj.getDay()]}, ${d} de ${MONTH_NAMES[m - 1]} ${y}`;
    } catch {
      return inspectedDateStr;
    }
  }, [inspectedDateStr]);

  // Appointments grouped by month for upcoming list tab
  const appointmentsGroupedByMonth = useMemo(() => {
    const groups: { monthIndex: number; monthName: string; year: number; list: Appointment[] }[] = [];

    for (let m = 0; m < 12; m++) {
      const monthPrefix = `${currentYear}-${String(m + 1).padStart(2, '0')}-`;
      const monthApps = appointments.filter(a => {
        if (!a.date || !a.date.startsWith(monthPrefix)) return false;
        if (stylistFilter !== 'all' && a.stylistId !== stylistFilter) return false;
        if (statusFilter !== 'all' && a.status !== statusFilter) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchClient = a.clientName?.toLowerCase().includes(q);
          const matchService = a.serviceName?.toLowerCase().includes(q);
          const matchStylist = a.stylistName?.toLowerCase().includes(q);
          const matchPhone = a.clientPhone?.includes(q);
          if (!matchClient && !matchService && !matchStylist && !matchPhone) return false;
        }
        return true;
      });

      monthApps.sort((a, b) => {
        const dateComp = (a.date || '').localeCompare(b.date || '');
        if (dateComp !== 0) return dateComp;
        return (a.time || '').localeCompare(b.time || '');
      });

      if (monthApps.length > 0) {
        groups.push({
          monthIndex: m,
          monthName: MONTH_NAMES[m],
          year: currentYear,
          list: monthApps
        });
      }
    }

    return groups;
  }, [appointments, currentYear, stylistFilter, statusFilter, searchQuery]);

  // Scroll to a specific month
  const scrollToMonth = (monthIndex: number) => {
    setActiveTab('calendar');
    const el = monthRefs.current[monthIndex];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Jump to today
  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setInspectedDateStr(todayStr);
    onSelectDate(now);
    onClose();
  };

  // Select day and go to matrix agenda
  const handleOpenDayInAgenda = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (y && m && d) {
      onSelectDate(new Date(y, m - 1, d));
      onClose();
    }
  };

  // Schedule for a specific day
  const handleScheduleForDate = (dateStr: string) => {
    onScheduleNewForDate(dateStr);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-neutral-950/75 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-[#FAF8F5] border border-[#D9CEC2] w-full max-w-7xl h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-900 font-sans"
        >
          {/* 1. TOP HEADER BAR */}
          <header className="bg-white border-b border-[#E2D8CC] px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
            {/* Title & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FAF5EE] to-[#EFE7DC] border border-[#B5916A]/50 flex items-center justify-center text-[#8C6B4D] shadow-xs shrink-0">
                <CalendarDays className="w-5 h-5 text-[#8C6B4D]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-[#2C221C] tracking-wide uppercase font-serif-luxury leading-tight">
                    Agenda Anual de Citas
                  </h2>
                  <span className="px-2 py-0.5 bg-[#8C6B4D]/10 text-[#8C6B4D] border border-[#8C6B4D]/30 text-[11px] font-mono font-bold rounded">
                    {currentYear}
                  </span>
                </div>
                <p className="text-xs text-[#8C6B4D] font-medium">
                  CF Portadas Escazú · Planificación completa a meses vista
                </p>
              </div>
            </div>

            {/* Year Navigator (< 2026 >) */}
            <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#D9CEC2] p-1 rounded-lg shadow-xs">
              <button
                type="button"
                onClick={() => setCurrentYear(prev => prev - 1)}
                className="p-1.5 rounded-md bg-white hover:bg-[#F2ECE5] text-[#2C221C] border border-[#E2D8CC] transition-colors cursor-pointer shadow-2xs"
                title="Año anterior"
                aria-label="Año anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Quick Year Picker */}
              <div className="flex items-center gap-1 px-1">
                {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(y => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setCurrentYear(y)}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                      currentYear === y
                        ? 'bg-[#8C6B4D] text-white shadow-xs'
                        : 'text-neutral-700 hover:bg-white'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentYear(prev => prev + 1)}
                className="p-1.5 rounded-md bg-white hover:bg-[#F2ECE5] text-[#2C221C] border border-[#E2D8CC] transition-colors cursor-pointer shadow-2xs"
                title="Año siguiente"
                aria-label="Año siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right Action Tools */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleJumpToToday}
                className="px-3 py-1.5 text-xs font-bold font-mono bg-white hover:bg-neutral-100 text-neutral-800 border border-[#D9CEC2] rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                title="Ir a la fecha de hoy"
              >
                <Sparkles className="w-3.5 h-3.5 text-gold-champagne" />
                <span>Hoy</span>
              </button>

              <button
                type="button"
                onClick={() => handleScheduleForDate(inspectedDateStr || todayStr)}
                className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#8C6B4D] hover:bg-[#72553B] text-white rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                title="Agendar nueva cita para la fecha seleccionada"
              >
                <Plus className="w-4 h-4" />
                <span>+ Agendar Cita</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer ml-1"
                title="Cerrar vista anual"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* 2. SUB-BAR: MONTH JUMP STRIP & FILTER CONTROLS */}
          <div className="bg-[#FAF5EE] border-b border-[#E2D8CC] px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5 shrink-0 text-xs">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-[#E2D8CC] shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'calendar'
                    ? 'bg-[#8C6B4D] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>12 Meses</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('upcoming_list')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'upcoming_list'
                    ? 'bg-[#8C6B4D] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Citas del Año ({yearStats.total})</span>
              </button>
            </div>

            {/* 12 Months Quick Jump Pills */}
            <div className="hidden lg:flex items-center gap-1 overflow-x-auto py-0.5">
              {MONTH_ABBR.map((abbr, mIdx) => {
                const prefix = `${currentYear}-${String(mIdx + 1).padStart(2, '0')}-`;
                let count = 0;
                appointments.forEach(a => {
                  if (a.date && a.date.startsWith(prefix)) count++;
                });

                return (
                  <button
                    key={abbr}
                    type="button"
                    onClick={() => scrollToMonth(mIdx)}
                    className="px-2 py-1 bg-white hover:bg-[#EFE7DC] border border-[#E2D8CC] hover:border-[#B5916A] text-[11px] font-mono rounded font-semibold text-neutral-800 transition-colors flex items-center gap-1 cursor-pointer"
                    title={`Ir a ${MONTH_NAMES[mIdx]} (${count} citas)`}
                  >
                    <span>{abbr}</span>
                    {count > 0 && (
                      <span className="px-1 py-0.2 bg-[#8C6B4D] text-white text-[9px] rounded-full font-bold">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Stylist & Status Filters */}
            <div className="flex items-center gap-2">
              <select
                value={stylistFilter}
                onChange={(e) => setStylistFilter(e.target.value)}
                className="bg-white border border-[#D9CEC2] text-neutral-800 text-xs px-2 py-1 rounded-md outline-none cursor-pointer"
                title="Filtrar por especialista"
              >
                <option value="all">Todos los estilistas</option>
                {stylists.filter(s => s.id !== 'cualquiera').map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-[#D9CEC2] text-neutral-800 text-xs px-2 py-1 rounded-md outline-none cursor-pointer"
                title="Filtrar por estado"
              >
                <option value="all">Todos los estados</option>
                <option value="Confirmada">Confirmadas</option>
                <option value="Pendiente">Pendientes</option>
                <option value="Completada">Completadas</option>
                <option value="Cancelada">Canceladas</option>
              </select>
            </div>
          </div>

          {/* 3. MAIN BODY CONTENT */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
            {/* Left/Center: Calendar Grid or Upcoming List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-6">
              {activeTab === 'calendar' ? (
                /* 12-MONTH GRID */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {MONTH_NAMES.map((monthName, monthIndex) => {
                    const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
                    const firstDayRaw = new Date(currentYear, monthIndex, 1).getDay();
                    // Monday first offset (0 = Lun, 6 = Dom)
                    const firstDayOffset = firstDayRaw === 0 ? 6 : firstDayRaw - 1;

                    // Month appointment count
                    const monthPrefix = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-`;
                    let monthCount = 0;
                    appointments.forEach(a => {
                      if (a.date && a.date.startsWith(monthPrefix)) monthCount++;
                    });

                    return (
                      <div
                        key={monthName}
                        ref={(el) => { monthRefs.current[monthIndex] = el; }}
                        className="bg-white rounded-xl border border-[#E2D8CC] shadow-2xs hover:shadow-sm transition-shadow p-3 flex flex-col"
                      >
                        {/* Month Card Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-[#EAE3DC] mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-serif-luxury font-bold text-sm text-[#2C221C]">
                              {monthName}
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              {currentYear}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {monthCount > 0 ? (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-mono font-bold rounded-full">
                                {monthCount} {monthCount === 1 ? 'cita' : 'citas'}
                              </span>
                            ) : (
                              <span className="text-[10px] text-neutral-400 font-mono">0 citas</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleScheduleForDate(`${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-01`)}
                              className="p-1 hover:bg-[#FAF5EE] text-[#8C6B4D] rounded transition-colors"
                              title={`Agendar en ${monthName}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Weekday Labels (Lun .. Dom) */}
                        <div className="grid grid-cols-7 gap-1 text-center mb-1">
                          {WEEKDAYS.map((wd, wdIdx) => (
                            <span
                              key={wd}
                              className={`text-[10px] font-bold uppercase tracking-wider ${
                                wdIdx >= 5 ? 'text-amber-800/70' : 'text-neutral-500'
                              }`}
                            >
                              {wd}
                            </span>
                          ))}
                        </div>

                        {/* Month Days Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center">
                          {/* Empty offset days */}
                          {Array.from({ length: firstDayOffset }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-7 sm:h-8" />
                          ))}

                          {/* Days 1..N */}
                          {Array.from({ length: daysInMonth }).map((_, i) => {
                            const dayNum = i + 1;
                            const dateStr = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                            const dayApps = appointmentsByDate.get(dateStr) || [];
                            const isTodayDay = dateStr === todayStr;
                            const isInspected = dateStr === inspectedDateStr;
                            const hasPending = dayApps.some(a => a.status === 'Pendiente');
                            const hasConfirmed = dayApps.some(a => a.status === 'Confirmada');

                            return (
                              <button
                                key={dayNum}
                                type="button"
                                onClick={() => setInspectedDateStr(dateStr)}
                                onDoubleClick={() => handleOpenDayInAgenda(dateStr)}
                                className={`h-7 sm:h-8 rounded flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                                  isInspected
                                    ? 'bg-[#8C6B4D] text-white font-bold ring-2 ring-[#8C6B4D]/50 shadow-xs'
                                    : isTodayDay
                                    ? 'bg-amber-100/90 text-amber-950 font-bold border border-amber-400'
                                    : dayApps.length > 0
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 font-semibold'
                                    : 'hover:bg-[#FAF5EE] text-neutral-800'
                                }`}
                                title={`${dateStr}: ${dayApps.length} citas. Doble clic para abrir en la agenda.`}
                              >
                                <span className="text-[11px] leading-none font-mono">
                                  {dayNum}
                                </span>

                                {/* Appointments Indicator Dot / Count */}
                                {dayApps.length > 0 && (
                                  <div className="flex items-center gap-0.5 mt-0.5">
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        isInspected
                                          ? 'bg-white'
                                          : hasPending
                                          ? 'bg-red-500 animate-pulse'
                                          : hasConfirmed
                                          ? 'bg-emerald-600'
                                          : 'bg-neutral-500'
                                      }`}
                                    />
                                    {dayApps.length > 1 && (
                                      <span
                                        className={`text-[8px] font-mono leading-none ${
                                          isInspected ? 'text-white font-bold' : 'text-emerald-800 font-bold'
                                        }`}
                                      >
                                        {dayApps.length}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* UPCOMING / YEAR APPOINTMENTS LIST TAB */
                <div className="space-y-6 max-w-4xl mx-auto">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar citas del año por cliente, servicio, estilista o teléfono..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-[#D9CEC2] focus:border-[#8C6B4D] rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none shadow-xs"
                    />
                  </div>

                  {appointmentsGroupedByMonth.length === 0 ? (
                    <div className="bg-white rounded-xl border border-[#E2D8CC] p-10 text-center space-y-3 shadow-xs">
                      <Calendar className="w-12 h-12 text-[#8C6B4D]/40 mx-auto" />
                      <h4 className="text-sm font-bold text-neutral-800 uppercase font-serif-luxury">
                        No hay citas programadas para el año {currentYear}
                      </h4>
                      <p className="text-xs text-neutral-500 max-w-md mx-auto">
                        Puedes seleccionar cualquier día en el calendario para programar citas con meses de anticipación.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleScheduleForDate(todayStr)}
                        className="px-4 py-2 bg-[#8C6B4D] hover:bg-[#72553B] text-white text-xs font-bold uppercase rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Agendar Cita Futura</span>
                      </button>
                    </div>
                  ) : (
                    appointmentsGroupedByMonth.map(group => (
                      <div key={group.monthName} className="bg-white rounded-xl border border-[#E2D8CC] shadow-xs overflow-hidden">
                        <div className="bg-[#FAF5EE] px-4 py-2.5 border-b border-[#E2D8CC] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-serif-luxury font-bold text-sm text-[#2C221C]">
                              {group.monthName} {group.year}
                            </span>
                            <span className="px-2 py-0.5 bg-[#8C6B4D] text-white text-[10px] font-mono font-bold rounded-full">
                              {group.list.length} {group.list.length === 1 ? 'cita' : 'citas'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleScheduleForDate(`${group.year}-${String(group.monthIndex + 1).padStart(2, '0')}-01`)}
                            className="text-xs font-bold text-[#8C6B4D] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Cita en {group.monthName}</span>
                          </button>
                        </div>

                        <div className="divide-y divide-neutral-100">
                          {group.list.map(app => (
                            <div
                              key={app.id}
                              onClick={() => {
                                setInspectedDateStr(app.date);
                                if (onOpenAppointment) onOpenAppointment(app);
                              }}
                              className="p-3 sm:p-4 hover:bg-[#FAF8F5] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="p-2 rounded-lg bg-[#FAF5EE] border border-[#E2D8CC] text-center shrink-0 min-w-[54px]">
                                  <span className="block text-[10px] uppercase font-bold text-[#8C6B4D]">
                                    {app.date.split('-')[2]}
                                  </span>
                                  <span className="block text-xs font-mono font-bold text-[#2C221C]">
                                    {formatTimeTo12h(app.time)}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h5 className="text-xs font-bold text-neutral-900 truncate uppercase font-serif-luxury">
                                      {app.clientName}
                                    </h5>
                                    <span
                                      className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded border ${
                                        app.status === 'Confirmada'
                                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                          : app.status === 'Pendiente'
                                          ? 'bg-red-100 text-red-950 border-red-300 animate-pulse'
                                          : app.status === 'Cancelada'
                                          ? 'bg-rose-100 text-rose-800 border-rose-300 line-through'
                                          : 'bg-neutral-100 text-neutral-800 border-neutral-300'
                                      }`}
                                    >
                                      {app.status}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#8C6B4D] font-medium truncate mt-0.5">
                                    {app.serviceName} · {app.stylistName}
                                  </p>
                                  <p className="text-[11px] text-neutral-500 font-mono truncate">
                                    📞 {app.clientPhone} {app.notes && `· "${app.notes}"`}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDayInAgenda(app.date);
                                  }}
                                  className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-700 text-xs font-semibold rounded transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Ver este día en la agenda"
                                >
                                  <span>Ver en Agenda</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Right Side: Inspected Day Details & Quick Actions Panel */}
            <aside className="w-full md:w-80 lg:w-96 bg-white border-t md:border-t-0 md:border-l border-[#E2D8CC] p-4 flex flex-col shrink-0 overflow-y-auto">
              {/* Day Header */}
              <div className="pb-3 border-b border-[#EAE3DC] space-y-1">
                <span className="text-[10px] text-[#8C6B4D] font-bold uppercase tracking-wider block">
                  Día Seleccionado
                </span>
                <h3 className="text-sm font-bold text-[#2C221C] font-serif-luxury leading-snug">
                  {formattedInspectedDate}
                </h3>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-mono font-bold bg-[#FAF5EE] text-[#8C6B4D] px-2 py-0.5 rounded border border-[#E2D8CC]">
                    {inspectedAppointments.length} {inspectedAppointments.length === 1 ? 'cita programada' : 'citas programadas'}
                  </span>
                  {inspectedDateStr === todayStr && (
                    <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded">
                      Hoy
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Action Buttons for Inspected Day */}
              <div className="py-3 border-b border-[#EAE3DC] space-y-2">
                <button
                  type="button"
                  onClick={() => handleScheduleForDate(inspectedDateStr)}
                  className="w-full py-2.5 px-3 bg-[#8C6B4D] hover:bg-[#72553B] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agendar Cita en este día</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenDayInAgenda(inspectedDateStr)}
                  className="w-full py-2 px-3 bg-white hover:bg-[#FAF5EE] text-[#2C221C] border border-[#D9CEC2] rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer font-serif-luxury"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#8C6B4D]" />
                  <span>Abrir Agenda de este día</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto text-neutral-400" />
                </button>
              </div>

              {/* Day's Appointments List */}
              <div className="flex-1 py-3 space-y-2.5 min-h-[140px]">
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider font-mono">
                  Horarios Ocupados:
                </h4>

                {inspectedAppointments.length === 0 ? (
                  <div className="p-4 bg-[#FAF8F5] border border-dashed border-[#D9CEC2] rounded-xl text-center space-y-2 my-2">
                    <p className="text-xs text-neutral-500">
                      No hay citas agendadas para este día todavía.
                    </p>
                    <p className="text-[11px] text-[#8C6B4D] font-medium">
                      Todos los horarios están disponibles.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {inspectedAppointments.map(app => (
                      <div
                        key={app.id}
                        onClick={() => {
                          if (onOpenAppointment) onOpenAppointment(app);
                        }}
                        className="p-2.5 rounded-lg border border-[#E2D8CC] bg-[#FAF8F5] hover:bg-white hover:border-[#8C6B4D] transition-all cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-mono font-bold text-[#8C6B4D]">
                            {formatTimeTo12h(app.time)}
                          </span>
                          <span
                            className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded border ${
                              app.status === 'Confirmada'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : app.status === 'Pendiente'
                                ? 'bg-red-100 text-red-950 border-red-300 animate-pulse'
                                : 'bg-neutral-100 text-neutral-800 border-neutral-300'
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-neutral-900 truncate uppercase font-serif-luxury mt-1">
                          {app.clientName}
                        </p>
                        <p className="text-[11px] text-neutral-600 truncate">
                          {app.serviceName}
                        </p>
                        <p className="text-[10px] text-neutral-500 font-mono truncate">
                          Estilista: {app.stylistName}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
