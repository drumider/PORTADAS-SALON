import React, { useState, useEffect, useMemo } from 'react';
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
  Sparkles, 
  Scissors, 
  ExternalLink,
  List,
  Grid,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { Appointment, AppointmentStatus } from '../types';
import { getStoredAppointments, saveAppointment, deleteAppointment, updateAppointmentStatus, setAdminAuthenticated } from '../utils/storage';
import { AppointmentModal } from './AppointmentModal';
import { SERVICES } from '../constants';

interface AdminDashboardProps {
  onLogout: () => void;
}

type ViewMode = 'month' | 'week' | 'day' | 'list';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stylistFilter, setStylistFilter] = useState<string>('all');

  // Modals state
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [dayDetailModalDate, setDayDetailModalDate] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load appointments
  const refreshAppointments = () => {
    setAppointments(getStoredAppointments());
  };

  useEffect(() => {
    refreshAppointments();
  }, []);

  // Filtered appointments list
  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      const matchesSearch = 
        app.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.clientPhone.includes(searchQuery) ||
        app.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.stylistName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      const matchesStylist = stylistFilter === 'all' || app.stylistId === stylistFilter;

      return matchesSearch && matchesStatus && matchesStylist;
    });
  }, [appointments, searchQuery, statusFilter, stylistFilter]);

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Calculate calendar grid days
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Get ISO day of week (0 = Sunday, 1 = Monday, ...)
    let startingDay = firstDayOfMonth.getDay(); 
    // Adjust so Monday is 0
    startingDay = startingDay === 0 ? 6 : startingDay - 1;

    const daysInMonth = lastDayOfMonth.getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        dateStr: prevDate.toISOString().split('T')[0],
        dayNum: prevDate.getDate(),
        isCurrentMonth: false,
        isToday: false
      });
    }

    // Current month days
    const todayStr = new Date().toISOString().split('T')[0];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      // Format YYYY-MM-DD
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: true,
        isToday: dateStr === todayStr
      });
    }

    // Next month padding to fill grid (35 or 42 cells)
    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        dateStr: nextDate.toISOString().split('T')[0],
        dayNum: i,
        isCurrentMonth: false,
        isToday: false
      });
    }

    return days;
  }, [year, month]);

  // Appointments grouped by date YYYY-MM-DD
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    filteredAppointments.forEach(app => {
      if (!map[app.date]) {
        map[app.date] = [];
      }
      map[app.date].push(app);
    });

    // Sort each date's appointments by time
    Object.keys(map).forEach(dateKey => {
      map[dateKey].sort((a, b) => a.time.localeCompare(b.time));
    });

    return map;
  }, [filteredAppointments]);

  // Statistics
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayApps = appointments.filter(a => a.date === todayStr);
    const pendingApps = appointments.filter(a => a.status === 'Pendiente');
    const confirmedApps = appointments.filter(a => a.status === 'Confirmada');

    return {
      todayCount: todayApps.length,
      pendingCount: pendingApps.length,
      confirmedCount: confirmedApps.length,
      totalCount: appointments.length
    };
  }, [appointments]);

  // Actions
  const handleCreateNew = (dateStr?: string) => {
    setEditingAppointment(null);
    setSelectedDayDate(dateStr || new Date().toISOString().split('T')[0]);
    setIsAppointmentModalOpen(true);
  };

  const handleEditAppointment = (app: Appointment) => {
    setEditingAppointment(app);
    setIsAppointmentModalOpen(true);
  };

  const handleSaveAppointment = (appointmentData: Omit<Appointment, 'id' | 'createdAt'> & { id?: string }) => {
    saveAppointment(appointmentData);
    refreshAppointments();
    setIsAppointmentModalOpen(false);
    setEditingAppointment(null);
  };

  const handleDeleteAppointment = (id: string) => {
    deleteAppointment(id);
    setDeletingId(null);
    refreshAppointments();
  };

  const handleQuickStatusChange = (id: string, newStatus: AppointmentStatus) => {
    updateAppointmentStatus(id, newStatus);
    refreshAppointments();
  };

  const handleNavigateMonth = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
    } else if (direction === 'prev') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'Confirmada':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      case 'Pendiente':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'Completada':
        return 'bg-blue-100 text-blue-900 border-blue-300 font-bold';
      case 'Cancelada':
        return 'bg-red-100 text-red-900 border-red-300 font-bold';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-neutral-900 font-sans selection:bg-gold-champagne selection:text-dark-bg pb-20">
      
      {/* Top Navigation / Dashboard Header */}
      <header className="bg-white border-b border-[#E8DFD8] sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Brand Badge */}
          <div className="flex items-center gap-4">
            <div className="relative flex items-center pr-2">
              <span className="font-logo-doulaise text-3xl text-[#B5916A] transform -rotate-[10deg] leading-none">
                cf
              </span>
              <span className="font-logo-sans text-base tracking-[0.2em] text-neutral-900 font-semibold uppercase pl-1">
                PORTADAS
              </span>
            </div>
            <div className="h-6 w-[1px] bg-[#E8DFD8] hidden sm:block" />
            <div>
              <span className="text-[10px] tracking-[0.25em] text-[#8C6B4D] font-bold uppercase block">
                Panel de Administración
              </span>
              <p className="text-[11px] text-neutral-500 font-light">
                Gestión Integral de Agenda y Citas · Escazú
              </p>
            </div>
          </div>

          {/* Quick Actions & Logout */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleCreateNew()}
              className="bg-[#2C221C] hover:bg-[#A68358] text-white text-xs uppercase tracking-[0.15em] font-bold px-4 py-2.5 flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Cita</span>
            </button>

            <button
              onClick={() => {
                setAdminAuthenticated(false);
                onLogout();
              }}
              className="border border-[#DCD3C9] hover:border-red-400 text-neutral-700 hover:text-red-600 text-xs uppercase tracking-wider px-3.5 py-2.5 flex items-center gap-2 transition-colors bg-white shadow-sm"
              title="Cerrar sesión de administración"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-6">

        {/* 1. Quick Stats Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#EAE3DC] p-4 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#B5916A]/10 rounded-bl-full pointer-events-none" />
            <span className="text-[10px] uppercase tracking-widest text-[#8C6B4D] font-bold">Citas para Hoy</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-neutral-900">{stats.todayCount}</span>
              <CalendarIcon className="w-5 h-5 text-[#8C6B4D]" />
            </div>
          </div>

          <div className="bg-white border border-[#EAE3DC] p-4 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full pointer-events-none" />
            <span className="text-[10px] uppercase tracking-widest text-amber-700 font-bold">Pendientes</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-amber-700">{stats.pendingCount}</span>
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
          </div>

          <div className="bg-white border border-[#EAE3DC] p-4 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
            <span className="text-[10px] uppercase tracking-widest text-emerald-800 font-bold">Confirmadas</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-emerald-700">{stats.confirmedCount}</span>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white border border-[#EAE3DC] p-4 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full pointer-events-none" />
            <span className="text-[10px] uppercase tracking-widest text-blue-800 font-bold">Total Registradas</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-neutral-900">{stats.totalCount}</span>
              <Scissors className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* 2. Control Toolbar (Search, View Modes & Filters) */}
        <div className="bg-white border border-[#EAE3DC] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cliente, teléfono o servicio..."
              className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 placeholder:text-neutral-400 text-xs pl-10 pr-4 py-2.5 outline-none font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters & View switcher */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#E2D9CE] px-2 py-1">
              <Filter className="w-3.5 h-3.5 text-[#8C6B4D] shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-neutral-900 text-xs py-1 px-1 outline-none font-bold uppercase font-serif-luxury"
              >
                <option value="all">Todos los Estados</option>
                <option value="Confirmada">Confirmadas</option>
                <option value="Pendiente">Pendientes</option>
                <option value="Completada">Completadas</option>
                <option value="Cancelada">Canceladas</option>
              </select>
            </div>

            {/* View switcher buttons */}
            <div className="flex items-center border border-[#E2D9CE] bg-[#FAF8F5] p-0.5">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-colors flex items-center gap-1 ${
                  viewMode === 'month' ? 'bg-[#2C221C] text-white' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Mes</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-colors flex items-center gap-1 ${
                  viewMode === 'list' ? 'bg-[#2C221C] text-white' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Lista</span>
              </button>
            </div>

          </div>

        </div>

        {/* 3. CALENDAR VIEW MODE */}
        {viewMode === 'month' && (
          <div className="bg-white border border-[#EAE3DC] p-4 sm:p-6 space-y-4 shadow-sm">
            
            {/* Month Header Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3DC]">
              <div className="flex items-center gap-3">
                <h2 className="font-serif-luxury text-xl sm:text-2xl text-neutral-900 uppercase tracking-wider font-light">
                  {monthNames[month]} <span className="text-[#8C6B4D] font-mono font-bold">{year}</span>
                </h2>
                <button
                  onClick={() => handleNavigateMonth('today')}
                  className="text-[10px] uppercase font-mono tracking-widest px-2.5 py-1 border border-[#B5916A] text-[#8C6B4D] font-bold hover:bg-[#2C221C] hover:text-white transition-colors"
                >
                  Hoy
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavigateMonth('prev')}
                  className="p-2 border border-[#E2D9CE] hover:border-[#2C221C] text-neutral-700 hover:text-neutral-900 transition-colors bg-white"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleNavigateMonth('next')}
                  className="p-2 border border-[#E2D9CE] hover:border-[#2C221C] text-neutral-700 hover:text-neutral-900 transition-colors bg-white"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
              {daysOfWeek.map((day, idx) => (
                <div 
                  key={day} 
                  className={`py-2 text-[10px] sm:text-xs uppercase tracking-widest font-bold ${
                    idx >= 5 ? 'text-[#8C6B4D]' : 'text-neutral-500'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Month Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarGrid.map((dayObj, i) => {
                const dayApps = appointmentsByDate[dayObj.dateStr] || [];
                const hasApps = dayApps.length > 0;

                return (
                  <div
                    key={`${dayObj.dateStr}-${i}`}
                    onClick={() => {
                      if (hasApps) {
                        setDayDetailModalDate(dayObj.dateStr);
                      } else {
                        handleCreateNew(dayObj.dateStr);
                      }
                    }}
                    className={`min-h-[90px] sm:min-h-[120px] p-1.5 sm:p-2 border transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                      dayObj.isToday
                        ? 'border-[#B5916A] bg-[#FFFBF5] ring-2 ring-[#B5916A]/40'
                        : dayObj.isCurrentMonth
                        ? 'border-[#EAE3DC] bg-white hover:border-[#B5916A] hover:bg-[#FAF8F5]'
                        : 'border-neutral-200 bg-neutral-100/50 opacity-40'
                    }`}
                  >
                    {/* Day number & indicators */}
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs sm:text-sm font-mono font-bold ${
                        dayObj.isToday ? 'text-[#8C6B4D] scale-110' : dayObj.isCurrentMonth ? 'text-neutral-900' : 'text-neutral-400'
                      }`}>
                        {dayObj.dayNum}
                      </span>

                      {hasApps && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#8C6B4D]/10 text-[#8C6B4D] border border-[#8C6B4D]/30 rounded-none font-bold">
                          {dayApps.length} {dayApps.length === 1 ? 'cita' : 'citas'}
                        </span>
                      )}
                    </div>

                    {/* Appointments list inside cell */}
                    <div className="space-y-1 overflow-y-auto max-h-[60px] sm:max-h-[80px] custom-scrollbar">
                      {dayApps.slice(0, 3).map(app => (
                        <div
                          key={app.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAppointment(app);
                          }}
                          className={`text-[9px] sm:text-[10px] p-1 border font-mono truncate transition-all hover:scale-[1.02] ${getStatusColor(app.status)}`}
                          title={`${app.time} - ${app.clientName} (${app.serviceName})`}
                        >
                          <span className="font-bold mr-1">{app.time}</span>
                          <span className="truncate uppercase font-serif-luxury">{app.clientName.split(' ')[0]}</span>
                        </div>
                      ))}

                      {dayApps.length > 3 && (
                        <div className="text-[8px] text-[#8C6B4D] uppercase font-mono text-center font-bold">
                          + {dayApps.length - 3} más...
                        </div>
                      )}
                    </div>

                    {/* Quick add trigger on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] uppercase tracking-wider text-[#8C6B4D] font-mono text-right mt-1 font-bold">
                      + Agendar
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* 4. LIST / AGENDA VIEW MODE */}
        {viewMode === 'list' && (
          <div className="bg-white border border-[#EAE3DC] p-4 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE3DC]">
              <h2 className="font-serif-luxury text-lg text-neutral-900 uppercase tracking-wider font-light">
                Listado Cronológico de Citas ({filteredAppointments.length})
              </h2>
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="py-16 text-center text-neutral-500 font-light text-xs">
                No se encontraron citas con los filtros seleccionados.
              </div>
            ) : (
              <div className="divide-y divide-[#EAE3DC]">
                {filteredAppointments
                  .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
                  .map(app => (
                    <div
                      key={app.id}
                      className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAF8F5] px-3 transition-colors"
                    >
                      {/* Left: Date & Client details */}
                      <div className="flex items-start gap-4">
                        <div className="bg-[#FAF8F5] border border-[#E2D9CE] p-2 text-center min-w-[70px] shrink-0">
                          <span className="text-[10px] text-[#8C6B4D] uppercase tracking-widest font-mono font-bold block">
                            {app.date}
                          </span>
                          <span className="text-sm font-mono font-bold text-neutral-900 block mt-0.5">
                            {app.time}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-neutral-900 uppercase font-serif-luxury">
                              {app.clientName}
                            </h4>
                            <span className={`text-[9px] uppercase font-mono px-2 py-0.5 border ${getStatusColor(app.status)}`}>
                              {app.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600 font-light mt-1">
                            <span className="text-[#8C6B4D] font-medium">{app.serviceName}</span>
                            <span>• Estilista: <strong className="text-neutral-900">{app.stylistName}</strong></span>
                            <span>• Tel: <strong className="text-neutral-900 font-mono">{app.clientPhone}</strong></span>
                          </div>

                          {app.notes && (
                            <p className="text-[11px] text-neutral-500 italic mt-1 max-w-lg">
                              "{app.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Quick Actions */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <a
                          href={`https://wa.me/506${app.clientPhone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(app.clientName)},%20te%20escribimos%20de%20CF%20Portadas%20sobre%20tu%20cita%20de%20${encodeURIComponent(app.serviceName)}%20el%20${app.date}%20a%20las%20${app.time}.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                          title="Contactar por WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => handleEditAppointment(app)}
                          className="p-2 border border-[#E2D9CE] text-neutral-700 hover:text-[#8C6B4D] hover:border-[#8C6B4D] bg-white transition-colors"
                          title="Editar Cita"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {deletingId === app.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteAppointment(app.id)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse flex items-center gap-1"
                              title="Confirmar eliminación"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Confirmar</span>
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-1 text-neutral-500 hover:text-neutral-900 text-[10px]"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(app.id)}
                            className="p-2 border border-[#E2D9CE] text-neutral-400 hover:text-red-600 hover:border-red-300 bg-white transition-colors"
                            title="Eliminar Cita"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* DAY DETAIL MODAL */}
      <AnimatePresence>
        {dayDetailModalDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white border border-[#D8CEB8] shadow-2xl overflow-hidden relative max-h-[85vh] flex flex-col"
            >
              <div className="bg-[#FAF8F5] border-b border-[#EAE3DC] p-5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#8C6B4D] uppercase tracking-widest font-mono font-bold">
                    Agenda del Día
                  </span>
                  <h3 className="font-serif-luxury text-xl text-neutral-900 uppercase tracking-wider font-bold mt-0.5">
                    {dayDetailModalDate}
                  </h3>
                </div>
                <button
                  onClick={() => setDayDetailModalDate(null)}
                  className="text-neutral-400 hover:text-neutral-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Day's appointments list */}
              <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-white">
                {(!appointmentsByDate[dayDetailModalDate] || appointmentsByDate[dayDetailModalDate].length === 0) ? (
                  <div className="py-12 text-center text-neutral-500 font-light text-xs">
                    No hay citas registradas para este día.
                  </div>
                ) : (
                  appointmentsByDate[dayDetailModalDate].map(app => (
                    <div
                      key={app.id}
                      className="bg-[#FAF8F5] border border-[#EAE3DC] p-4 space-y-3 relative group hover:border-[#B5916A] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-mono font-bold text-[#8C6B4D]">
                            {app.time}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-neutral-900 uppercase font-serif-luxury">
                              {app.clientName}
                            </h4>
                            <p className="text-xs text-neutral-600">
                              {app.serviceName} • <span className="text-neutral-900 font-medium">{app.stylistName}</span>
                            </p>
                          </div>
                        </div>

                        {/* Status switcher dropdown */}
                        <div className="flex items-center gap-2">
                          <select
                            value={app.status}
                            onChange={(e) => handleQuickStatusChange(app.id, e.target.value as AppointmentStatus)}
                            className={`text-[10px] uppercase font-mono px-2 py-1 border outline-none font-bold ${getStatusColor(app.status)}`}
                          >
                            <option value="Confirmada">Confirmada</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Completada">Completada</option>
                            <option value="Cancelada">Cancelada</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2D9CE] text-xs">
                        <span className="text-neutral-600 font-mono">
                          Tel: <strong className="text-neutral-900">{app.clientPhone}</strong>
                        </span>

                        <div className="flex items-center gap-2">
                          <a
                            href={`https://wa.me/506${app.clientPhone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(app.clientName)},%20te%20escribimos%20de%20CF%20Portadas%20sobre%20tu%20cita%20de%20${encodeURIComponent(app.serviceName)}%20el%20${app.date}%20a%20las%20${app.time}.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-700 hover:text-emerald-900 uppercase font-bold flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>

                          <button
                            onClick={() => {
                              setDayDetailModalDate(null);
                              handleEditAppointment(app);
                            }}
                            className="text-[10px] text-[#8C6B4D] hover:text-neutral-900 uppercase font-bold flex items-center gap-1 ml-2"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          {deletingId === app.id ? (
                            <div className="flex items-center gap-1.5 ml-2">
                              <button
                                onClick={() => handleDeleteAppointment(app.id)}
                                className="text-[10px] bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider px-2 py-0.5 flex items-center gap-1 animate-pulse"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>¡Confirmar!</span>
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="text-[10px] text-neutral-500 hover:text-neutral-900"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingId(app.id)}
                              className="text-[10px] text-red-600 hover:text-red-800 uppercase font-bold flex items-center gap-1 ml-2"
                              title="Borrar cita"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Borrar</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {app.notes && (
                        <p className="text-[11px] text-neutral-600 italic bg-white p-2 border border-[#E2D9CE]">
                          Nota: {app.notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Day Modal Footer */}
              <div className="bg-[#FAF8F5] border-t border-[#EAE3DC] p-4 flex items-center justify-between">
                <button
                  onClick={() => setDayDetailModalDate(null)}
                  className="text-xs uppercase font-medium text-neutral-600 hover:text-neutral-900"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    const d = dayDetailModalDate;
                    setDayDetailModalDate(null);
                    handleCreateNew(d);
                  }}
                  className="bg-[#2C221C] text-white hover:bg-[#A68358] text-xs uppercase tracking-wider font-bold px-4 py-2 flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Cita para este día</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE / EDIT APPOINTMENT MODAL */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSave={handleSaveAppointment}
        onDelete={handleDeleteAppointment}
        initialAppointment={editingAppointment}
        selectedDate={selectedDayDate || undefined}
      />

    </div>
  );
};
