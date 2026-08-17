import React, { useState } from 'react';
import { 
  Plus, 
  LogOut
} from 'lucide-react';
import { saveAppointment, setAdminAuthenticated } from '../utils/storage';
import { AppointmentModal } from './AppointmentModal';
import { MatrixAgendaGrid } from './MatrixAgendaGrid';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  const handleSaveAppointment = (appointmentData: any) => {
    saveAppointment(appointmentData);
    setIsAppointmentModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-neutral-900 font-sans selection:bg-gold-champagne selection:text-dark-bg">
      
      {/* Top Navigation / Dashboard Header */}
      <header className="bg-white border-b border-[#E8DFD8] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
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
              onClick={() => setIsAppointmentModalOpen(true)}
              className="bg-[#2C221C] hover:bg-[#8C6B4D] text-white text-xs uppercase tracking-[0.15em] font-bold px-4 py-2.5 flex items-center gap-2 transition-all shadow-sm rounded-sm cursor-pointer"
              id="admin-nueva-cita-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Cita</span>
            </button>

            <button
              onClick={() => {
                setAdminAuthenticated(false);
                onLogout();
              }}
              className="border border-[#DCD3C9] hover:border-red-400 text-neutral-700 hover:text-red-600 text-xs uppercase tracking-wider px-3.5 py-2.5 flex items-center gap-2 transition-colors bg-white shadow-xs rounded-sm cursor-pointer"
              title="Cerrar sesión de administración"
              id="admin-logout-btn"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container - Renders the easy-to-read Light Theme Agenda */}
      <main className="max-w-7xl mx-auto px-2 sm:px-6 py-4">
        <MatrixAgendaGrid onClose={onLogout} isAdmin={true} />
      </main>

      {/* CREATE / EDIT APPOINTMENT MODAL */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSave={handleSaveAppointment}
      />

    </div>
  );
};
