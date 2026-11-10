import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Lock,
  BarChart3,
  Users,
  Calendar,
  TrendingUp,
  Video,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Film
} from 'lucide-react';
import {
  getStoredAppointments,
  subscribeToWebBookingAnalytics,
  subscribeToMarketingVisits,
  saveMarketingVisit,
  deleteMarketingVisit
} from '../utils/storage';
import { STYLISTS as DEFAULT_STYLISTS } from '../constants';
import { MarketingVisit } from '../types';
import { formatTimeTo12h, minutesToTime24, timeToMinutes, formatDurationText } from '../utils/timeUtils';

interface MantaiwebDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_TOPICS = [
  'Reels & TikTok @portadasalon',
  'Antes y Después (Balayage / Color)',
  'Grabación Alisado / Keratina',
  'Ritual Kérastase & Cuidado',
  'Tips de Estilistas / Entrevistas',
  'Contenido Mensual del Salón'
];

const DURATION_OPTIONS = [
  { label: '30 min', minutes: 30 },
  { label: '1 hora', minutes: 60 },
  { label: '1 hora 30 min', minutes: 90 },
  { label: '2 horas', minutes: 120 },
  { label: '3 horas', minutes: 180 },
  { label: '4 horas', minutes: 240 }
];

const TIME_OPTIONS_24 = (() => {
  const list: string[] = [];
  for (let m = 7 * 60; m <= 20 * 60; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    list.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return list;
})();

const getTodayISO = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

type MantaiTab = 'analytics' | 'send_notice' | 'notices_status';

export const MantaiwebDashboard: React.FC<MantaiwebDashboardProps> = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<MantaiTab>('analytics');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [marketingVisits, setMarketingVisits] = useState<MarketingVisit[]>([]);

  // Marketing Notice Form state
  const [title, setTitle] = useState('Reels & TikTok @portadasalon');
  const [marketingPerson, setMarketingPerson] = useState('Equipo Mantai Marketing');
  const [contactPhone, setContactPhone] = useState('');
  const [date, setDate] = useState<string>(() => getTodayISO());
  const [time, setTime] = useState<string>('10:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(90);
  const [targetStylistId, setTargetStylistId] = useState<string>('todo_salon');
  const [videoTopics, setVideoTopics] = useState('');
  const [notes, setNotes] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');

  const realStylists = useMemo(
    () => DEFAULT_STYLISTS.filter(s => s && s.id && s.id !== 'cualquiera'),
    []
  );

  // Lock background page scroll while modal is open to avoid GPU scroll/compositing lag
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Subscribe only while open & authenticated
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    const currentData = getStoredAppointments();
    const currentWebApps = currentData.filter(a => a.source === 'web');

    const unsubscribe = subscribeToWebBookingAnalytics((analyticsData) => {
      const mergedMap = new Map<string, any>();
      currentWebApps.forEach(app => mergedMap.set(app.id, app));
      analyticsData.forEach(app => mergedMap.set(app.id, app));
      setAppointments(Array.from(mergedMap.values()));
    });

    const unsubMarketing = subscribeToMarketingVisits((visits) => {
      setMarketingVisits(visits);
    });

    return () => {
      unsubscribe();
      unsubMarketing();
    };
  }, [isAuthenticated, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setIsAuthenticated(false);
      setError('');
      setActiveTab('analytics');
      setSubmitMessage('');
    }
  }, [isOpen]);

  // Memoize analytics metrics so typing in inputs does not recalculate lists
  const { totalAppointments, thisMonthAppointments, uniqueClientsCount } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let thisMonthCount = 0;
    const uniqueNames = new Set<string>();

    for (const a of appointments) {
      if (a.clientName) {
        uniqueNames.add(String(a.clientName).toLowerCase().trim());
      }
      if (a.date) {
        const parts = String(a.date).split('-');
        if (parts.length >= 2) {
          const y = Number(parts[0]);
          const m = Number(parts[1]) - 1;
          if (y === currentYear && m === currentMonth) {
            thisMonthCount++;
          }
        }
      }
    }

    return {
      totalAppointments: appointments.length,
      thisMonthAppointments: thisMonthCount,
      uniqueClientsCount: uniqueNames.size
    };
  }, [appointments]);

  const pendingMarketingCount = useMemo(
    () => marketingVisits.filter(v => v.status === 'Pendiente').length,
    [marketingVisits]
  );

  const approvedMarketingCount = useMemo(
    () => marketingVisits.filter(v => v.status === 'Aprobada').length,
    [marketingVisits]
  );

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

  const getTargetStylistName = (stId: string): string => {
    if (!stId || stId === 'todo_salon') return 'Todo el Salón';
    const found = realStylists.find(s => s.id === stId);
    return found ? found.name : stId;
  };

  const handleSubmitMarketingNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !title.trim()) return;

    const saved = saveMarketingVisit({
      title: title.trim(),
      marketingPerson: marketingPerson.trim() || 'Equipo Mantai Marketing',
      contactPhone: contactPhone.trim() || undefined,
      date,
      time,
      durationMinutes: Number(durationMinutes) || 60,
      targetStylistId: targetStylistId || 'todo_salon',
      targetStylistName: getTargetStylistName(targetStylistId),
      videoTopics: videoTopics.trim() || undefined,
      notes: notes.trim() || undefined,
      status: 'Pendiente'
    });

    setSubmitMessage(
      `¡Aviso enviado al salón! Programado para el ${saved.date} a las ${formatTimeTo12h(saved.time)}. El salón lo verá en su agenda para aprobarlo.`
    );
    setVideoTopics('');
    setNotes('');
    setActiveTab('notices_status');
  };

  const getStatusBadge = (status: MarketingVisit['status']) => {
    switch (status) {
      case 'Pendiente':
        return {
          cls: 'bg-violet-900/70 text-violet-200 border-violet-500/50',
          label: '⏳ Pendiente de Aprobación'
        };
      case 'Aprobada':
        return {
          cls: 'bg-emerald-900/70 text-emerald-200 border-emerald-500/50',
          label: '✅ Aprobada y En Agenda'
        };
      case 'Completada':
        return {
          cls: 'bg-blue-900/70 text-blue-200 border-blue-500/50',
          label: '🎬 Grabación Realizada'
        };
      case 'Rechazada':
        return {
          cls: 'bg-rose-900/70 text-rose-200 border-rose-500/50',
          label: '✕ No Aprobada / Reprogramar'
        };
    }
  };

  const getRangeLabel = (startTime24: string, durMin: number) => {
    const startMin = timeToMinutes(startTime24);
    const end24 = minutesToTime24(startMin + durMin);
    return `${formatTimeTo12h(startTime24)} - ${formatTimeTo12h(end24)} (${formatDurationText(durMin)})`;
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/92 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`bg-[#181615] rounded-xl border border-emerald-900/40 w-full overflow-hidden text-neutral-200 shadow-2xl relative flex flex-col max-h-[90vh] ${
          !isAuthenticated ? 'max-w-md' : 'max-w-xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {!isAuthenticated ? (
          <div className="p-7 sm:p-8">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white p-1 cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-400 border border-emerald-500/20">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-widest font-serif-luxury">MANTAI WEB</h2>
              <p className="text-xs text-neutral-400 font-mono mt-1">Acceso Privado de Analíticas & Marketing</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña secreta"
                  className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-3 text-center text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none tracking-widest font-mono text-white"
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
          <div className="flex flex-col h-full max-h-[88vh]">
            {/* HEADER */}
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-black/50 shrink-0">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold text-white tracking-widest font-serif-luxury uppercase">
                  Mantai Web Analytics
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FAST INTERNAL NAVIGATION TABS (Zero modal stacking / zero lag) */}
            <div className="px-4 py-2.5 border-b border-neutral-800 bg-black/30 flex items-center gap-2 overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-emerald-600/50'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Analíticas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSubmitMessage('');
                  setActiveTab('send_notice');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors ${
                  activeTab === 'send_notice'
                    ? 'bg-violet-600 text-white'
                    : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-violet-500/50'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Aviso Grabación</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('notices_status')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors ${
                  activeTab === 'notices_status'
                    ? 'bg-[#8C6B4D] text-white'
                    : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-[#8C6B4D]/60'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Estado Avisos ({marketingVisits.length})</span>
              </button>
            </div>

            {/* BODY */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {/* TAB 1: ANALYTICS */}
              {activeTab === 'analytics' && (
                <div className="space-y-5">
                  <div className="bg-black/50 border border-emerald-900/40 rounded-xl p-5 text-center">
                    <span className="text-xs text-neutral-400 font-mono uppercase tracking-wider block mb-1">
                      Total Citas Agendadas (Histórico)
                    </span>
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
                      <span className="text-2xl font-bold text-white">{uniqueClientsCount}</span>
                      <span className="text-[10px] text-neutral-400 font-mono mt-1 uppercase">Clientes Únicos</span>
                    </div>
                  </div>

                  {/* Hidden Marketing Notice Trigger Card */}
                  <div className="bg-violet-950/35 border border-violet-500/40 rounded-xl p-4 text-center space-y-2.5">
                    <span className="text-xs font-bold text-violet-200 uppercase tracking-wider font-serif-luxury block">
                      🎬 Aviso Grabación Marketing
                    </span>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      Envía avisos exclusivos de Mantai a la agenda del salón cuando vayan a grabar videos para que los aprueben.
                    </p>
                    {marketingVisits.length > 0 && (
                      <div className="flex items-center justify-center gap-2 text-[10px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-violet-900/70 text-violet-200 border border-violet-500/40">
                          {pendingMarketingCount} pendientes
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-500/40">
                          {approvedMarketingCount} aprobadas
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitMessage('');
                        setActiveTab('send_notice');
                      }}
                      className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>Programar Aviso de Grabación</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: SEND RECORDING NOTICE */}
              {activeTab === 'send_notice' && (
                <form onSubmit={handleSubmitMarketingNotice} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider mb-1.5 text-gold-champagne">
                      Tipo / Motivo de Grabación *
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {QUICK_TOPICS.map(topic => (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => setTitle(topic)}
                          className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors cursor-pointer ${
                            title === topic
                              ? 'bg-violet-600 text-white border-violet-500 font-bold'
                              : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-violet-400/50'
                          }`}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="ej. Reels & TikTok @portadasalon"
                      className="w-full p-2.5 rounded-lg text-xs border bg-black/70 border-neutral-700 text-white focus:border-violet-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider mb-1 text-gold-champagne">
                        Fecha *
                      </label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-2.5 rounded-lg text-xs font-mono border bg-black/70 border-neutral-700 text-white focus:border-violet-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider mb-1 text-gold-champagne">
                        Hora *
                      </label>
                      <select
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full p-2.5 rounded-lg text-xs font-mono border bg-black/70 border-neutral-700 text-white focus:border-violet-500 outline-none"
                      >
                        {TIME_OPTIONS_24.map(t => (
                          <option key={t} value={t}>
                            {formatTimeTo12h(t)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider mb-1 text-gold-champagne">
                        Duración
                      </label>
                      <select
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        className="w-full p-2.5 rounded-lg text-xs font-mono border bg-black/70 border-neutral-700 text-white focus:border-violet-500 outline-none"
                      >
                        {DURATION_OPTIONS.map(opt => (
                          <option key={opt.minutes} value={opt.minutes}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider mb-1 text-gold-champagne">
                        ¿Con quién / Área?
                      </label>
                      <select
                        value={targetStylistId}
                        onChange={(e) => setTargetStylistId(e.target.value)}
                        className="w-full p-2.5 rounded-lg text-xs border bg-black/70 border-neutral-700 text-white focus:border-violet-500 outline-none"
                      >
                        <option value="todo_salon">Todo el Salón (General)</option>
                        {realStylists.map(st => (
                          <option key={st.id} value={st.id}>
                            {st.name} ({st.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider mb-1 text-gold-champagne">
                        Responsable Mantai *
                      </label>
                      <input
                        type="text"
                        required
                        value={marketingPerson}
                        onChange={(e) => setMarketingPerson(e.target.value)}
                        placeholder="ej. Gabriel · Mantai Marketing"
                        className="w-full p-2.5 rounded-lg text-xs border bg-black/70 border-neutral-700 text-white focus:border-violet-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider mb-1 text-gold-champagne">
                        Teléfono (Opcional)
                      </label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="ej. 8888-8888"
                        className="w-full p-2.5 rounded-lg text-xs font-mono border bg-black/70 border-neutral-700 text-white focus:border-violet-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider mb-1 text-gold-champagne">
                        Escenas / Temas (Opcional)
                      </label>
                      <input
                        type="text"
                        value={videoTopics}
                        onChange={(e) => setVideoTopics(e.target.value)}
                        placeholder="ej. Proceso de keratina + resultados"
                        className="w-full p-2.5 rounded-lg text-xs border bg-black/70 border-neutral-700 text-white focus:border-violet-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider mb-1 text-gold-champagne">
                      Notas para el Salón (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="ej. Llevaremos micrófonos y luz LED..."
                      className="w-full p-2.5 rounded-lg text-xs border bg-black/70 border-neutral-700 text-white focus:border-violet-500 outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Aviso a la Agenda del Salón</span>
                  </button>
                </form>
              )}

              {/* TAB 3: NOTICES STATUS LIST */}
              {activeTab === 'notices_status' && (
                <div className="space-y-3 text-left">
                  {submitMessage && (
                    <div className="p-3 rounded-lg border bg-emerald-950/60 border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{submitMessage}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSubmitMessage('')}
                        className="opacity-70 hover:opacity-100 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {marketingVisits.length === 0 ? (
                    <div className="text-center py-8 space-y-2 text-neutral-400">
                      <Film className="w-10 h-10 mx-auto opacity-40" />
                      <p className="text-sm font-bold text-white">No hay avisos enviados</p>
                      <p className="text-xs">Usa la pestaña "Aviso Grabación" para notificar al salón.</p>
                    </div>
                  ) : (
                    marketingVisits.map(visit => {
                      const badge = getStatusBadge(visit.status);
                      return (
                        <div
                          key={visit.id}
                          className="p-3.5 rounded-xl border border-neutral-800 bg-black/50 space-y-2"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-sm text-white uppercase font-serif-luxury">
                                {visit.title}
                              </h4>
                              <p className="text-[11px] font-mono text-neutral-400">
                                {visit.marketingPerson} · {visit.targetStylistName || 'Todo el Salón'}
                              </p>
                            </div>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border self-start sm:self-center ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-gold-champagne bg-neutral-900/90 px-2.5 py-1.5 rounded border border-neutral-800">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {visit.date}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {getRangeLabel(visit.time, visit.durationMinutes)}
                            </span>
                          </div>

                          {visit.videoTopics && (
                            <p className="text-xs text-neutral-300">
                              <strong className="text-neutral-400">Contenido:</strong> {visit.videoTopics}
                            </p>
                          )}

                          {visit.status === 'Rechazada' && visit.rejectionReason && (
                            <div className="p-2 bg-rose-950/50 border border-rose-500/40 rounded text-xs text-rose-200 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                              <div>
                                <strong className="block text-[10px] uppercase text-rose-300">Motivo del Salón:</strong>
                                <span>{visit.rejectionReason}</span>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => deleteMarketingVisit(visit.id)}
                              className="text-[11px] text-neutral-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Eliminar aviso</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-neutral-800 text-center">
                <p className="text-[10px] text-neutral-500 font-mono">
                  Desarrollado y mantenido por <strong className="text-emerald-400">Mantaiweb.com</strong>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
