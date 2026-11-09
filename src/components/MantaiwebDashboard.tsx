import React, { useState, useEffect } from 'react';
import { X, Lock, BarChart3, Users, Calendar, TrendingUp, Video } from 'lucide-react';
import { getStoredAppointments, subscribeToWebBookingAnalytics, subscribeToMarketingVisits } from '../utils/storage';
import { Appointment, MarketingVisit } from '../types';
import { MarketingVisitsModal } from './MarketingVisitsModal';

interface MantaiwebDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MantaiwebDashboard: React.FC<MantaiwebDashboardProps> = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [marketingVisits, setMarketingVisits] = useState<MarketingVisit[]>([]);
  const [isMarketingPortalOpen, setIsMarketingPortalOpen] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let unsubMarketing: (() => void) | undefined;
    if (isAuthenticated) {
      // First, get any active non-deleted web appointments from standard cache
      const currentData = getStoredAppointments();
      const currentWebApps = currentData.filter(a => a.source === 'web');
      
      // We will merge standard web apps (just in case they were made before the analytics logger)
      // with the permanently logged ones.
      
      unsubscribe = subscribeToWebBookingAnalytics((analyticsData) => {
        // Merge analytics data with any existing web appointments that might have missed the logger
        const mergedMap = new Map<string, any>();
        currentWebApps.forEach(app => mergedMap.set(app.id, app));
        analyticsData.forEach(app => mergedMap.set(app.id, app));
        
        setAppointments(Array.from(mergedMap.values()));
      });

      unsubMarketing = subscribeToMarketingVisits((visits) => {
        setMarketingVisits(visits);
      });
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
      if (unsubMarketing) unsubMarketing();
    };
  }, [isAuthenticated, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setIsAuthenticated(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'mantaiweb2026' || password === 'Mantai2026' || password === 'mantai') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Contraseña incorrecta');
    }
  };

  const totalAppointments = appointments.length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthAppointments = appointments.filter(a => {
    const d = new Date(a.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div 
        className="bg-[#1A1A1A] rounded-xl border border-emerald-900/30 w-full max-w-md overflow-hidden text-neutral-200 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {!isAuthenticated ? (
          <div className="p-8">
            <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-400 border border-emerald-500/20">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-widest font-serif-luxury">MANTAI WEB</h2>
              <p className="text-xs text-neutral-400 font-mono mt-1">Acceso Privado de Analíticas</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña secreta"
                  className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-3 text-center text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all tracking-widest font-mono"
                  autoFocus
                />
              </div>
              {error && <p className="text-rose-500 text-xs text-center font-mono">{error}</p>}
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg text-xs tracking-widest uppercase transition-colors cursor-pointer"
              >
                Acceder
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col h-full max-h-[80vh]">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold text-white tracking-widest font-serif-luxury uppercase">Mantai Web Analytics</h2>
              </div>
              <button onClick={onClose} className="text-neutral-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="bg-black/50 border border-emerald-900/30 rounded-xl p-5 text-center">
                <span className="text-xs text-neutral-400 font-mono uppercase tracking-wider block mb-1">Total Citas Agendadas (Histórico)</span>
                <span className="text-4xl font-bold text-white">{totalAppointments}</span>
                <p className="text-[10px] text-emerald-400 mt-2 flex items-center justify-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Personas que han agendado por medio de la web
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <Calendar className="w-5 h-5 text-neutral-500 mb-2" />
                  <span className="text-2xl font-bold text-white">{thisMonthAppointments}</span>
                  <span className="text-[10px] text-neutral-400 font-mono mt-1 uppercase">Citas este mes</span>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <Users className="w-5 h-5 text-neutral-500 mb-2" />
                  <span className="text-2xl font-bold text-white">{new Set(appointments.map(a => a.clientName.toLowerCase().trim())).size}</span>
                  <span className="text-[10px] text-neutral-400 font-mono mt-1 uppercase">Clientes Únicos</span>
                </div>
              </div>
              
              {/* Marketing Video Notice Quick Trigger (Hidden exclusively inside Mantai Web Analytics) */}
              <div className="bg-violet-950/40 border border-violet-500/40 rounded-xl p-4 text-center space-y-2.5">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs font-bold text-violet-200 uppercase tracking-wider font-serif-luxury">
                    🎬 Aviso Grabación Marketing
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Envía avisos exclusivos de Mantai a la agenda del salón cuando vayan a grabar videos y revisa si ya fueron aprobados.
                </p>
                {marketingVisits.length > 0 && (
                  <div className="flex items-center justify-center gap-2 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-violet-900/70 text-violet-200 border border-violet-500/40">
                      {marketingVisits.filter(v => v.status === 'Pendiente').length} pendientes
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-500/40">
                      {marketingVisits.filter(v => v.status === 'Aprobada').length} aprobadas
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsMarketingPortalOpen(true)}
                  className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Video className="w-4 h-4" />
                  <span>Aviso Grabación Marketing</span>
                </button>
              </div>
              
              <div className="pt-4 border-t border-neutral-800 text-center">
                <p className="text-[10px] text-neutral-500 font-mono">
                  Desarrollado y mantenido por <strong className="text-emerald-400">Mantaiweb.com</strong>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <MarketingVisitsModal
        isOpen={isMarketingPortalOpen}
        onClose={() => setIsMarketingPortalOpen(false)}
        mode="marketing_portal"
        bypassAuth={true}
      />
    </div>
  );
};
