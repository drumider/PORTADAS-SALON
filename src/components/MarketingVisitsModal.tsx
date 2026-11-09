import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Video,
  X,
  Calendar,
  Clock,
  Check,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Send,
  User,
  Phone,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Film,
  ArrowRight,
  Edit3,
  MessageSquare,
  Bell,
  CheckCheck,
  Ban
} from 'lucide-react';
import { MarketingVisit, Stylist } from '../types';
import { STYLISTS as DEFAULT_STYLISTS } from '../constants';
import {
  subscribeToMarketingVisits,
  saveMarketingVisit,
  approveMarketingVisit,
  rejectMarketingVisit,
  updateMarketingVisitDetails,
  deleteMarketingVisit,
  isMarketingAuthenticated,
  setMarketingAuthenticated
} from '../utils/storage';
import { formatTimeTo12h, minutesToTime24, timeToMinutes, formatDurationText } from '../utils/timeUtils';

interface MarketingVisitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'admin' | 'marketing_portal';
  stylists?: Stylist[];
  initialDate?: string;
  initialTab?: 'pending' | 'approved' | 'create' | 'my_notices';
  bypassAuth?: boolean;
  onJumpToDate?: (dateStr: string) => void;
  onNotify?: (message: string, type?: 'success' | 'info' | 'warning') => void;
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

export const MarketingVisitsModal: React.FC<MarketingVisitsModalProps> = ({
  isOpen,
  onClose,
  mode,
  stylists = DEFAULT_STYLISTS,
  initialDate,
  initialTab,
  bypassAuth = false,
  onJumpToDate,
  onNotify
}) => {
  const [visits, setVisits] = useState<MarketingVisit[]>([]);
  const [isAuth, setIsAuth] = useState<boolean>(() => bypassAuth || mode === 'admin' || isMarketingAuthenticated());
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [authError, setAuthError] = useState('');

  // Tabs: admin ('pending' | 'approved' | 'create'), marketing_portal ('create' | 'my_notices')
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'create' | 'my_notices'>(() => {
    if (initialTab) return initialTab;
    return mode === 'marketing_portal' ? 'create' : 'pending';
  });

  // Form states
  const [title, setTitle] = useState('Grabación Reels & TikTok');
  const [marketingPerson, setMarketingPerson] = useState('Equipo de Marketing');
  const [contactPhone, setContactPhone] = useState('');
  const [date, setDate] = useState<string>(initialDate || getTodayISO());
  const [time, setTime] = useState<string>('10:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(90);
  const [targetStylistId, setTargetStylistId] = useState<string>('todo_salon');
  const [videoTopics, setVideoTopics] = useState('');
  const [notes, setNotes] = useState('');
  const [submitStatusMessage, setSubmitStatusMessage] = useState('');

  // Inline approval / rejection states in admin mode
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [adjustingVisit, setAdjustingVisit] = useState<MarketingVisit | null>(null);

  const realStylists = useMemo(
    () => (stylists || DEFAULT_STYLISTS).filter(s => s && s.id && s.id !== 'cualquiera'),
    [stylists]
  );

  // Sync real-time marketing visits from Firestore
  useEffect(() => {
    const unsub = subscribeToMarketingVisits((list) => {
      setVisits(list);
    });
    return () => unsub();
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setIsAuth(bypassAuth || mode === 'admin' || isMarketingAuthenticated());
    setAuthError('');
    setSubmitStatusMessage('');
    setRejectingId(null);
    setRejectReason('');
    setAdjustingVisit(null);
    if (initialDate) setDate(initialDate);

    if (initialTab) {
      setActiveTab(initialTab);
    } else if (mode === 'marketing_portal') {
      setActiveTab('create');
    } else {
      // In admin mode, open pending tab if there are pending visits, otherwise approved
      const hasPending = visits.some(v => v.status === 'Pendiente');
      setActiveTab(hasPending ? 'pending' : 'approved');
    }
  }, [isOpen, mode, bypassAuth, initialDate, initialTab]);

  const pendingVisits = useMemo(
    () => visits.filter(v => v.status === 'Pendiente'),
    [visits]
  );

  const approvedVisits = useMemo(
    () => visits.filter(v => v.status === 'Aprobada' || v.status === 'Completada'),
    [visits]
  );

  const handleMarketingLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = accessCode.trim().toLowerCase();
    if (
      clean === 'marketing' ||
      clean === 'marketing2026' ||
      clean === 'mantai' ||
      clean === 'mantai2026' ||
      clean === 'mantaiweb2026' ||
      clean === 'portadas102027'
    ) {
      setMarketingAuthenticated(true);
      setIsAuth(true);
      setAuthError('');
    } else {
      setAuthError('Código de acceso incorrecto. Verifica con el salón o Mantai Web.');
    }
  };

  const getTargetStylistName = (stId: string): string => {
    if (!stId || stId === 'todo_salon') return 'Todo el Salón';
    const found = realStylists.find(s => s.id === stId);
    return found ? found.name : stId;
  };

  const handleSubmitNotice = (e: React.FormEvent, directApprove = false) => {
    e.preventDefault();
    if (!date || !time || !title.trim()) return;

    const targetName = getTargetStylistName(targetStylistId);
    const shouldApprove = mode === 'admin' && directApprove;

    const saved = saveMarketingVisit({
      title: title.trim(),
      marketingPerson: marketingPerson.trim() || 'Equipo de Marketing',
      contactPhone: contactPhone.trim() || undefined,
      date,
      time,
      durationMinutes: Number(durationMinutes) || 60,
      targetStylistId: targetStylistId || 'todo_salon',
      targetStylistName: targetName,
      videoTopics: videoTopics.trim() || undefined,
      notes: notes.trim() || undefined,
      status: shouldApprove ? 'Aprobada' : 'Pendiente',
      approvedAt: shouldApprove ? new Date().toISOString() : undefined
    });

    if (mode === 'marketing_portal') {
      setSubmitStatusMessage(
        `¡Aviso enviado al salón! Se notificó en la agenda para el ${saved.date} a las ${formatTimeTo12h(saved.time)}. Te avisaremos aquí cuando el salón lo apruebe.`
      );
      setActiveTab('my_notices');
    } else {
      setSubmitStatusMessage(
        shouldApprove
          ? `✅ Grabación de marketing agregada y aprobada en la agenda para el ${saved.date} a las ${formatTimeTo12h(saved.time)}.`
          : `🔔 Aviso de grabación creado como pendiente de aprobación para el ${saved.date}.`
      );
      setActiveTab(shouldApprove ? 'approved' : 'pending');
      if (shouldApprove && onJumpToDate) {
        onJumpToDate(saved.date);
      }
    }

    if (onNotify) {
      onNotify(
        shouldApprove
          ? `🎬 Grabación "${saved.title}" aprobada y agendada para el ${saved.date} (${formatTimeTo12h(saved.time)}).`
          : `🎬 Aviso de grabación enviado para el ${saved.date} (${formatTimeTo12h(saved.time)}).`,
        'success'
      );
    }

    // Reset optional fields
    setVideoTopics('');
    setNotes('');
  };

  const handleApprove = (visit: MarketingVisit, customAdjustments?: Partial<MarketingVisit>) => {
    const finalTargetId = customAdjustments?.targetStylistId ?? visit.targetStylistId ?? 'todo_salon';
    const finalTargetName = getTargetStylistName(finalTargetId);

    approveMarketingVisit(visit.id, {
      ...customAdjustments,
      targetStylistId: finalTargetId,
      targetStylistName: finalTargetName
    });

    const finalDate = customAdjustments?.date || visit.date;
    const finalTime = customAdjustments?.time || visit.time;

    setAdjustingVisit(null);
    if (onJumpToDate) {
      onJumpToDate(finalDate);
    }
    if (onNotify) {
      onNotify(
        `✅ Grabación de Marketing aprobada ("${visit.title}") y agregada a la agenda del ${finalDate} a las ${formatTimeTo12h(finalTime)}.`,
        'success'
      );
    }
  };

  const handleReject = (visitId: string) => {
    rejectMarketingVisit(visitId, rejectReason || 'Horario no disponible, por favor reprogramar.');
    setRejectingId(null);
    setRejectReason('');
    if (onNotify) {
      onNotify('Aviso de grabación rechazado. El equipo de marketing podrá ver el motivo.', 'warning');
    }
  };

  const getRangeLabel = (startTime24: string, durMin: number) => {
    const startMin = timeToMinutes(startTime24);
    const end24 = minutesToTime24(startMin + durMin);
    return `${formatTimeTo12h(startTime24)} - ${formatTimeTo12h(end24)} (${formatDurationText(durMin)})`;
  };

  const getStatusBadge = (status: MarketingVisit['status']) => {
    switch (status) {
      case 'Pendiente':
        return {
          bg: 'bg-violet-100 text-violet-900 border-violet-300',
          label: '⏳ Pendiente de Aprobación'
        };
      case 'Aprobada':
        return {
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          label: '✅ Aprobada y En Agenda'
        };
      case 'Completada':
        return {
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
          label: '🎬 Grabación Realizada'
        };
      case 'Rechazada':
        return {
          bg: 'bg-rose-100 text-rose-900 border-rose-300',
          label: '✕ No Aprobada / Reprogramar'
        };
    }
  };

  if (!isOpen) return null;

  const isLightTheme = mode === 'admin';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-left border ${
            isLightTheme
              ? 'bg-white border-[#D9CEC2] text-neutral-900'
              : 'bg-[#161412] border-gold-champagne/30 text-neutral-100'
          }`}
        >
          {/* AUTH GATE FOR EXTERNAL MARKETING PORTAL */}
          {!isAuth && mode === 'marketing_portal' ? (
            <div className="p-6 sm:p-8 relative">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1.5 cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-violet-950/60 border border-violet-400/40 flex items-center justify-center mx-auto mb-3 text-violet-300 shadow-lg">
                  <Video className="w-7 h-7" />
                </div>
                <h2 className="font-serif-luxury text-xl font-bold uppercase tracking-wider text-white">
                  Portal de Marketing · Grabaciones
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Envía avisos cuando vayas a grabar videos al salón y revisa cuando sean aprobados en la agenda.
                </p>
              </div>

              <div className="bg-black/40 border border-gold-champagne/20 p-3 mb-5 flex items-start gap-2.5 text-xs text-neutral-300">
                <Sparkles className="w-4 h-4 text-gold-champagne shrink-0 mt-0.5" />
                <div>
                  <span className="text-gold-champagne font-semibold uppercase text-[10px] tracking-wider block">
                    Acceso Equipo Marketing / Mantai Web
                  </span>
                  Ingresa el código de acceso de marketing (ej. <code className="text-white bg-black/60 px-1.5 py-0.5 font-mono">marketing</code> o código Mantai).
                </div>
              </div>

              {authError && (
                <div className="bg-red-950/50 border border-red-500/40 p-3 mb-4 text-xs text-red-300 text-center">
                  {authError}
                </div>
              )}

              <form onSubmit={handleMarketingLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-gold-champagne/80 mb-1.5">
                    Código de Acceso Marketing
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gold-champagne/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showCode ? 'text' : 'password'}
                      required
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder="Código de marketing..."
                      className="w-full bg-black/60 border border-neutral-700 focus:border-gold-champagne text-white text-sm pl-10 pr-10 py-3 outline-none font-mono rounded-lg"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowCode(!showCode)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-gold-champagne"
                    >
                      {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gold-champagne hover:bg-white text-dark-bg font-bold text-xs uppercase tracking-[0.2em] py-3.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  <span>Ingresar a Avisos de Grabación</span>
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* HEADER */}
              <div
                className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
                  isLightTheme ? 'bg-[#FAF8F5] border-[#EAE3DC]' : 'bg-black/40 border-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isLightTheme
                        ? 'bg-violet-100 text-violet-700 border border-violet-300'
                        : 'bg-violet-950/70 text-violet-300 border border-violet-500/40'
                    }`}
                  >
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <h3
                      className={`font-serif-luxury text-base sm:text-lg font-bold uppercase tracking-wider ${
                        isLightTheme ? 'text-[#2C221C]' : 'text-white'
                      }`}
                    >
                      {mode === 'admin'
                        ? 'Grabaciones de Video · Marketing'
                        : 'Aviso de Grabación · Marketing'}
                    </h3>
                    <p className={`text-[11px] font-mono ${isLightTheme ? 'text-[#8C6B4D]' : 'text-neutral-400'}`}>
                      {mode === 'admin'
                        ? 'Aprueba las visitas de marketing para agendarlas en el horario del salón'
                        : 'Notifica al salón cuándo irás a grabar y verifica su aprobación en agenda'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isLightTheme ? 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100' : 'text-neutral-400 hover:text-white'
                  }`}
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* TABS BAR */}
              <div
                className={`px-5 py-2.5 border-b flex items-center gap-2 overflow-x-auto shrink-0 ${
                  isLightTheme ? 'bg-white border-[#EAE3DC]' : 'bg-black/20 border-neutral-800'
                }`}
              >
                {mode === 'admin' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab('pending')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        activeTab === 'pending'
                          ? 'bg-violet-700 text-white shadow-sm'
                          : isLightTheme
                          ? 'bg-[#FAF8F5] text-neutral-700 border border-[#E2D8CC] hover:border-violet-400'
                          : 'bg-neutral-900 text-neutral-300'
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Por Aprobar</span>
                      {pendingVisits.length > 0 && (
                        <span className="bg-amber-400 text-neutral-950 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                          {pendingVisits.length}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('approved')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        activeTab === 'approved'
                          ? 'bg-[#2C221C] text-white shadow-sm'
                          : isLightTheme
                          ? 'bg-[#FAF8F5] text-neutral-700 border border-[#E2D8CC] hover:border-[#8C6B4D]'
                          : 'bg-neutral-900 text-neutral-300'
                      }`}
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>En Agenda ({approvedVisits.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('create')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        activeTab === 'create'
                          ? 'bg-[#8C6B4D] text-white shadow-sm'
                          : isLightTheme
                          ? 'bg-[#FAF8F5] text-neutral-700 border border-[#E2D8CC] hover:border-[#8C6B4D]'
                          : 'bg-neutral-900 text-neutral-300'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>+ Programar Grabación</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab('create')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        activeTab === 'create'
                          ? 'bg-gold-champagne text-dark-bg shadow-sm'
                          : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-gold-champagne/50'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar Aviso de Grabación</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('my_notices')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        activeTab === 'my_notices'
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-violet-400/50'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Estado de Avisos ({visits.length})</span>
                    </button>
                  </>
                )}
              </div>

              {/* BODY */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {submitStatusMessage && (
                  <div
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                      isLightTheme
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{submitStatusMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubmitStatusMessage('')}
                      className="opacity-60 hover:opacity-100 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* TAB: ADMIN PENDING REQUESTS */}
                {mode === 'admin' && activeTab === 'pending' && (
                  <div className="space-y-3">
                    {pendingVisits.length === 0 ? (
                      <div className="text-center py-10 space-y-2">
                        <CheckCheck className="w-12 h-12 text-emerald-500 mx-auto" />
                        <p className="text-sm font-bold text-neutral-800 font-serif-luxury uppercase">
                          Sin avisos pendientes de marketing
                        </p>
                        <p className="text-xs text-neutral-500">
                          Cuando el equipo de marketing envíe una fecha para grabar videos, aparecerá aquí para su aprobación.
                        </p>
                      </div>
                    ) : (
                      pendingVisits.map(visit => {
                        const isAdjusting = adjustingVisit?.id === visit.id;
                        const isRejecting = rejectingId === visit.id;

                        return (
                          <div
                            key={visit.id}
                            className="p-4 rounded-xl border-2 border-violet-300 bg-gradient-to-r from-violet-50/80 via-white to-indigo-50/40 shadow-xs space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-violet-200/80 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full bg-violet-700 text-white flex items-center justify-center shrink-0">
                                  <Video className="w-3.5 h-3.5" />
                                </span>
                                <div>
                                  <h4 className="font-bold text-sm text-neutral-900 uppercase font-serif-luxury">
                                    {visit.title}
                                  </h4>
                                  <span className="text-[10px] font-mono text-violet-800 font-semibold">
                                    Solicitado por: {visit.marketingPerson}
                                    {visit.contactPhone && ` · ${visit.contactPhone}`}
                                  </span>
                                </div>
                              </div>

                              <span className="px-2 py-0.5 bg-violet-600 text-white text-[10px] font-mono font-bold rounded uppercase self-start sm:self-center animate-pulse">
                                Por Aprobar
                              </span>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-700">
                              <div className="flex items-center gap-1.5 font-mono font-bold text-violet-950">
                                <Calendar className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                                <span>{visit.date}</span>
                              </div>
                              <div className="flex items-center gap-1.5 font-mono font-bold text-violet-950">
                                <Clock className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                                <span>{getRangeLabel(visit.time, visit.durationMinutes)}</span>
                              </div>
                              <div className="flex items-center gap-1.5 sm:col-span-2">
                                <User className="w-3.5 h-3.5 text-[#8C6B4D] shrink-0" />
                                <span>
                                  Área / Especialista: <strong className="text-neutral-900">{visit.targetStylistName || 'Todo el Salón'}</strong>
                                </span>
                              </div>
                            </div>

                            {(visit.videoTopics || visit.notes) && (
                              <div className="bg-white/90 border border-violet-200/70 rounded-lg p-2.5 text-xs text-neutral-700 space-y-1">
                                {visit.videoTopics && (
                                  <p>
                                    <strong className="text-violet-900">Contenido:</strong> {visit.videoTopics}
                                  </p>
                                )}
                                {visit.notes && (
                                  <p className="italic text-neutral-600">
                                    <strong>Notas:</strong> "{visit.notes}"
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Inline Adjust Form */}
                            {isAdjusting && adjustingVisit && (
                              <div className="p-3 bg-white border border-violet-300 rounded-lg space-y-2.5 text-xs">
                                <p className="font-bold text-violet-900 uppercase text-[10px] tracking-wider">
                                  Ajustar Fecha / Hora antes de Aprobar
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <input
                                    type="date"
                                    value={adjustingVisit.date}
                                    onChange={(e) => setAdjustingVisit({ ...adjustingVisit, date: e.target.value })}
                                    className="bg-[#FAF8F5] border border-[#D9CEC2] p-1.5 rounded font-mono text-xs"
                                  />
                                  <select
                                    value={adjustingVisit.time}
                                    onChange={(e) => setAdjustingVisit({ ...adjustingVisit, time: e.target.value })}
                                    className="bg-[#FAF8F5] border border-[#D9CEC2] p-1.5 rounded font-mono text-xs"
                                  >
                                    {TIME_OPTIONS_24.map(t => (
                                      <option key={t} value={t}>{formatTimeTo12h(t)}</option>
                                    ))}
                                  </select>
                                  <select
                                    value={adjustingVisit.targetStylistId || 'todo_salon'}
                                    onChange={(e) =>
                                      setAdjustingVisit({
                                        ...adjustingVisit,
                                        targetStylistId: e.target.value,
                                        targetStylistName: getTargetStylistName(e.target.value)
                                      })
                                    }
                                    className="bg-[#FAF8F5] border border-[#D9CEC2] p-1.5 rounded text-xs"
                                  >
                                    <option value="todo_salon">Todo el Salón</option>
                                    {realStylists.map(st => (
                                      <option key={st.id} value={st.id}>{st.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setAdjustingVisit(null)}
                                    className="px-2.5 py-1 text-neutral-600 hover:text-neutral-900 font-bold cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleApprove(visit, {
                                        date: adjustingVisit.date,
                                        time: adjustingVisit.time,
                                        targetStylistId: adjustingVisit.targetStylistId,
                                        targetStylistName: adjustingVisit.targetStylistName
                                      })
                                    }
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold uppercase text-[11px] flex items-center gap-1 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Guardar Cambios y Aprobar</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Inline Reject Reason */}
                            {isRejecting && (
                              <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg space-y-2 text-xs">
                                <label className="block font-bold text-rose-900 text-[10px] uppercase tracking-wider">
                                  Motivo o sugerencia de otro horario para Marketing:
                                </label>
                                <input
                                  type="text"
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  placeholder="ej. Ese día tenemos agenda llena, ¿puedes venir el viernes a las 2 PM?"
                                  className="w-full bg-white border border-rose-300 p-2 rounded text-xs outline-none"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRejectingId(null);
                                      setRejectReason('');
                                    }}
                                    className="px-2.5 py-1 text-neutral-600 font-bold cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReject(visit.id)}
                                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold uppercase text-[11px] cursor-pointer"
                                  >
                                    Confirmar Rechazo
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            {!isAdjusting && !isRejecting && (
                              <div className="pt-2 border-t border-violet-200/80 flex flex-wrap items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setAdjustingVisit(visit)}
                                  className="px-2.5 py-1.5 bg-white hover:bg-[#FAF8F5] border border-[#D9CEC2] text-neutral-700 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Ajustar Hora</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setRejectingId(visit.id)}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Rechazar</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleApprove(visit)}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Aprobar y Tener en Agenda</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* TAB: ADMIN APPROVED / SCHEDULED VISITS */}
                {mode === 'admin' && activeTab === 'approved' && (
                  <div className="space-y-3">
                    {approvedVisits.length === 0 ? (
                      <div className="text-center py-10 space-y-3">
                        <Film className="w-12 h-12 text-neutral-300 mx-auto" />
                        <p className="text-sm font-bold text-neutral-800 font-serif-luxury uppercase">
                          No hay grabaciones de marketing agendadas
                        </p>
                        <p className="text-xs text-neutral-500 max-w-md mx-auto">
                          Cuando apruebes un aviso de marketing o programes una grabación, aparecerá aquí y directamente en la agenda del día.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('create')}
                          className="px-4 py-2 bg-[#8C6B4D] hover:bg-[#72553B] text-white rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>+ Programar Grabación</span>
                        </button>
                      </div>
                    ) : (
                      approvedVisits.map(visit => {
                        const stBadge = getStatusBadge(visit.status);
                        return (
                          <div
                            key={visit.id}
                            className="p-4 rounded-xl border border-[#E2D8CC] bg-[#FAF8F5] space-y-2.5 shadow-2xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full bg-violet-700 text-white flex items-center justify-center shrink-0">
                                  <Video className="w-3.5 h-3.5" />
                                </span>
                                <div>
                                  <h4 className="font-bold text-sm text-neutral-900 uppercase font-serif-luxury">
                                    {visit.title}
                                  </h4>
                                  <p className="text-[11px] font-mono text-[#8C6B4D]">
                                    {visit.marketingPerson} · {visit.targetStylistName || 'Todo el Salón'}
                                  </p>
                                </div>
                              </div>
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border self-start sm:self-center ${stBadge.bg}`}>
                                {stBadge.label}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-800 bg-white p-2 rounded border border-[#EAE3DC]">
                              <span className="flex items-center gap-1 font-bold">
                                <Calendar className="w-3.5 h-3.5 text-violet-600" />
                                {visit.date}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-bold">
                                <Clock className="w-3.5 h-3.5 text-violet-600" />
                                {getRangeLabel(visit.time, visit.durationMinutes)}
                              </span>
                            </div>

                            {(visit.videoTopics || visit.notes) && (
                              <p className="text-xs text-neutral-600">
                                {visit.videoTopics && <span className="font-medium text-neutral-800">{visit.videoTopics}</span>}
                                {visit.videoTopics && visit.notes && ' · '}
                                {visit.notes && <span className="italic">"{visit.notes}"</span>}
                              </p>
                            )}

                            <div className="pt-2 border-t border-[#EAE3DC] flex flex-wrap items-center justify-end gap-2">
                              {onJumpToDate && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onJumpToDate(visit.date);
                                    onClose();
                                  }}
                                  className="px-3 py-1.5 bg-[#2C221C] hover:bg-[#8C6B4D] text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <span>Ver en Agenda</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}

                              {visit.status === 'Aprobada' && (
                                <button
                                  type="button"
                                  onClick={() => updateMarketingVisitDetails(visit.id, { status: 'Completada' })}
                                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Marcar Realizada</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => deleteMarketingVisit(visit.id)}
                                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Eliminar</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* TAB: MARKETING PORTAL STATUS LIST */}
                {mode === 'marketing_portal' && activeTab === 'my_notices' && (
                  <div className="space-y-3">
                    {visits.length === 0 ? (
                      <div className="text-center py-10 space-y-2 text-neutral-400">
                        <Film className="w-10 h-10 mx-auto opacity-40" />
                        <p className="text-sm font-bold text-white">No hay avisos enviados aún</p>
                        <p className="text-xs">Envía tu primer aviso de grabación para que el salón lo apruebe en su agenda.</p>
                      </div>
                    ) : (
                      visits.map(visit => {
                        const stBadge = getStatusBadge(visit.status);
                        return (
                          <div
                            key={visit.id}
                            className="p-4 rounded-xl border border-neutral-800 bg-black/40 space-y-2.5"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-sm text-white uppercase font-serif-luxury">
                                  {visit.title}
                                </h4>
                                <p className="text-[11px] font-mono text-neutral-400">
                                  {visit.marketingPerson} · Área: {visit.targetStylistName || 'Todo el Salón'}
                                </p>
                              </div>
                              <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded border self-start sm:self-center ${stBadge.bg}`}>
                                {stBadge.label}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-gold-champagne bg-neutral-900/80 px-3 py-2 rounded border border-neutral-800">
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
                              <div className="p-2.5 bg-rose-950/50 border border-rose-500/40 rounded text-xs text-rose-200 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="block text-[10px] uppercase tracking-wider text-rose-300">
                                    Mensaje del Salón:
                                  </strong>
                                  <span>{visit.rejectionReason}</span>
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => deleteMarketingVisit(visit.id)}
                                className="text-[11px] text-neutral-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Cancelar / Borrar aviso</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* TAB: CREATE NOTICE FORM (SHARED BETWEEN MARKETING PORTAL & ADMIN) */}
                {activeTab === 'create' && (
                  <form onSubmit={(e) => handleSubmitNotice(e, mode === 'admin')} className="space-y-4">
                    {/* Quick Topic Chips */}
                    <div>
                      <label
                        className={`block text-[10px] uppercase font-bold tracking-wider mb-1.5 ${
                          isLightTheme ? 'text-[#8C6B4D]' : 'text-gold-champagne'
                        }`}
                      >
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
                                ? isLightTheme
                                  ? 'bg-violet-700 text-white border-violet-700'
                                  : 'bg-gold-champagne text-dark-bg border-gold-champagne font-bold'
                                : isLightTheme
                                ? 'bg-[#FAF8F5] text-neutral-700 border-[#D9CEC2] hover:border-violet-400'
                                : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-gold-champagne/50'
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
                        placeholder="ej. Grabación Reels Balayage & TikTok"
                        className={`w-full p-2.5 rounded-lg text-xs border outline-none ${
                          isLightTheme
                            ? 'bg-[#FAF8F5] border-[#D9CEC2] text-neutral-900 focus:border-violet-500'
                            : 'bg-black/60 border-neutral-700 text-white focus:border-gold-champagne'
                        }`}
                      />
                    </div>

                    {/* Date, Time, Duration */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label
                          className={`block text-[10px] uppercase font-bold tracking-wider mb-1 ${
                            isLightTheme ? 'text-[#8C6B4D]' : 'text-gold-champagne'
                          }`}
                        >
                          Fecha de Grabación *
                        </label>
                        <input
                          type="date"
                          required
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className={`w-full p-2.5 rounded-lg text-xs font-mono border outline-none ${
                            isLightTheme
                              ? 'bg-[#FAF8F5] border-[#D9CEC2] text-neutral-900 focus:border-violet-500'
                              : 'bg-black/60 border-neutral-700 text-white focus:border-gold-champagne'
                          }`}
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-[10px] uppercase font-bold tracking-wider mb-1 ${
                            isLightTheme ? 'text-[#8C6B4D]' : 'text-gold-champagne'
                          }`}
                        >
                          Hora de Llegada *
                        </label>
                        <select
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className={`w-full p-2.5 rounded-lg text-xs font-mono border outline-none ${
                            isLightTheme
                              ? 'bg-[#FAF8F5] border-[#D9CEC2] text-neutral-900 focus:border-violet-500'
                              : 'bg-black/60 border-neutral-700 text-white focus:border-gold-champagne'
                          }`}
                        >
                          {TIME_OPTIONS_24.map(t => (
                            <option key={t} value={t}>
                              {formatTimeTo12h(t)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          className={`block text-[10px] uppercase font-bold tracking-wider mb-1 ${
                            isLightTheme ? 'text-[#8C6B4D]' : 'text-gold-champagne'
                          }`}
                        >
                          Duración Estimada
                        </label>
                        <select
                          value={durationMinutes}
                          onChange={(e) => setDurationMinutes(Number(e.target.value))}
                          className={`w-full p-2.5 rounded-lg text-xs font-mono border outline-none ${
                            isLightTheme
                              ? 'bg-[#FAF8F5] border-[#D9CEC2] text-neutral-900 focus:border-violet-500'
                              : 'bg-black/60 border-neutral-700 text-white focus:border-gold-champagne'
                          }`}
                        >
                          {DURATION_OPTIONS.map(opt => (
                            <option key={opt.minutes} value={opt.minutes}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Stylist/Area & Marketing Person */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          className={`block text-[10px] uppercase font-bold tracking-wider mb-1 ${
                            isLightTheme ? 'text-[#8C6B4D]' : 'text-gold-champagne'
                          }`}
                        >
                          ¿Con quién / Qué área grabarán?
                        </label>
                        <select
                          value={targetStylistId}
                          onChange={(e) => setTargetStylistId(e.target.value)}
                          className={`w-full p-2.5 rounded-lg text-xs border outline-none ${
                            isLightTheme
                              ? 'bg-[#FAF8F5] border-[#D9CEC2] text-neutral-900 focus:border-violet-500'
                              : 'bg-black/60 border-neutral-700 text-white focus:border-gold-champagne'
                          }`}
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
                        <label
                          className={`block text-[10px] uppercase font-bold tracking-wider mb-1 ${
                            isLightTheme ? 'text-[#8C6B4D]' : 'text-gold-champagne'
                          }`}
                        >
                          Responsable / Equipo de Marketing *
                        </label>
                        <input
                          type="text"
                          required
                          value={marketingPerson}
                          onChange={(e) => setMarketingPerson(e.target.value)}
                          placeholder="ej. Gabriel · Marketing"
                          className={`w-full p-2.5 rounded-lg text-xs border outline-none ${
                            isLightTheme
                              ? 'bg-[#FAF8F5] border-[#D9CEC2] text-neutral-900 focus:border-violet-500'
                              : 'bg-black/60 border-neutral-700 text-white focus:border-gold-champagne'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Video topics & Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          className={`block text-[10px] uppercase font-bold tracking-wider mb-1 ${
                            isLightTheme ? 'text-[#8C6B4D]' : 'text-gold-champagne'
                          }`}
                        >
                          Teléfono de Contacto (Opcional)
                        </label>
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="ej. 8888-8888"
                          className={`w-full p-2.5 rounded-lg text-xs font-mono border outline-none ${
                            isLightTheme
                              ? 'bg-[#FAF8F5] border-[#D9CEC2] text-neutral-900 focus:border-violet-500'
                              : 'bg-black/60 border-neutral-700 text-white focus:border-gold-champagne'
                          }`}
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-[10px] uppercase font-bold tracking-wider mb-1 ${
                            isLightTheme ? 'text-[#8C6B4D]' : 'text-gold-champagne'
                          }`}
                        >
                          Temas / Escenas a Grabar (Opcional)
                        </label>
                        <input
                          type="text"
                          value={videoTopics}
                          onChange={(e) => setVideoTopics(e.target.value)}
                          placeholder="ej. Proceso de keratina + resultados finales"
                          className={`w-full p-2.5 rounded-lg text-xs border outline-none ${
                            isLightTheme
                              ? 'bg-[#FAF8F5] border-[#D9CEC2] text-neutral-900 focus:border-violet-500'
                              : 'bg-black/60 border-neutral-700 text-white focus:border-gold-champagne'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        className={`block text-[10px] uppercase font-bold tracking-wider mb-1 ${
                          isLightTheme ? 'text-[#8C6B4D]' : 'text-gold-champagne'
                        }`}
                      >
                        Notas para el Salón (Opcional)
                      </label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="ej. Llevaremos micrófonos y luz LED, avisar si hay cliente modelo..."
                        className={`w-full p-2.5 rounded-lg text-xs border outline-none resize-none ${
                          isLightTheme
                            ? 'bg-[#FAF8F5] border-[#D9CEC2] text-neutral-900 focus:border-violet-500'
                            : 'bg-black/60 border-neutral-700 text-white focus:border-gold-champagne'
                        }`}
                      />
                    </div>

                    {/* Submit Actions */}
                    <div
                      className={`pt-3 border-t flex flex-wrap items-center justify-end gap-2 ${
                        isLightTheme ? 'border-[#EAE3DC]' : 'border-neutral-800'
                      }`}
                    >
                      {mode === 'admin' ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleSubmitNotice(e as any, false)}
                            className="px-3.5 py-2.5 bg-violet-100 hover:bg-violet-200 border border-violet-300 text-violet-900 text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer"
                          >
                            Guardar como Aviso Pendiente
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Aprobar y Agregar a la Agenda</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="submit"
                          className="w-full sm:w-auto px-5 py-3 bg-gold-champagne hover:bg-white text-dark-bg text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <Send className="w-4 h-4" />
                          <span>Enviar Aviso a la Agenda del Salón</span>
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
