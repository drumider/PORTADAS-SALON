import { Appointment, Service, ServicePhase, Stylist } from '../types';
import { ALL_SERVICES } from '../data/servicesData';

/**
 * Time utility functions for CF Portadas Salon
 * Handles conversions between 12h (01:00 PM) and 24h (13:00) formats
 * and normalizes slot matching across the entire application.
 */

export function normalizeTimeTo24h(timeStr: string): string {
  if (!timeStr) return '09:00';
  
  const clean = timeStr.trim().toUpperCase();

  // If format is like "01:00 PM" or "1:30 PM" or "9:00 AM"
  const match12h = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12h) {
    let hours = parseInt(match12h[1], 10);
    const minutes = match12h[2];
    const modifier = match12h[3]?.toUpperCase();

    if (modifier === 'PM' && hours < 12) {
      hours += 12;
    } else if (modifier === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  // If already 24h format like "14:30" or "09:00"
  const match24h = clean.match(/^(\d{1,2}):(\d{2})/);
  if (match24h) {
    const hours = parseInt(match24h[1], 10);
    const minutes = match24h[2];
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  return timeStr.substring(0, 5);
}

export function formatTimeTo12h(timeStr: string): string {
  if (!timeStr) return '';
  const normalized = normalizeTimeTo24h(timeStr);
  const [hStr, mStr] = normalized.split(':');
  let hours = parseInt(hStr, 10);
  const minutes = mStr || '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

export function formatTimeDisplay(timeStr: string): string {
  return formatTimeTo12h(timeStr);
}

/**
 * Converts any time string (12h or 24h, e.g. "03:00 PM", "15:00", "9:30 AM")
 * into total minutes from midnight (0 to 1440).
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const normalized = normalizeTimeTo24h(timeStr);
  const [hStr, mStr] = normalized.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  return h * 60 + m;
}

/**
 * Converts total minutes from midnight into 24h time string (e.g. 900 -> "15:00").
 */
export function minutesToTime24(minutes: number): string {
  const normalized = Math.max(0, Math.min(1439, minutes));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Converts total minutes from midnight into 12h time string with AM/PM (e.g. 900 -> "03:00 PM").
 */
export function minutesToTime12(minutes: number): string {
  return formatTimeTo12h(minutesToTime24(minutes));
}

/**
 * Formats a duration in minutes into a clean human-readable text (e.g. 120 -> "2h", 150 -> "2h 30min", 45 -> "45min").
 */
export function formatDurationText(durationMinutes: number): string {
  if (!durationMinutes || durationMinutes <= 0) return '30min';
  const h = Math.floor(durationMinutes / 60);
  const m = durationMinutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

/**
 * Calculates start and end boundaries for an appointment or booking request.
 */
export function calculateAppointmentRange(startTime: string, durationMinutes: number = 60) {
  const startMin = timeToMinutes(startTime);
  const duration = Math.max(15, durationMinutes || 60);
  const endMin = startMin + duration;
  return {
    startMin,
    endMin,
    duration,
    startTime24: minutesToTime24(startMin),
    endTime24: minutesToTime24(endMin),
    startTime12: minutesToTime12(startMin),
    endTime12: minutesToTime12(endMin),
    durationText: formatDurationText(duration)
  };
}

/**
 * Returns true if two time intervals [startA, endA) and [startB, endB) overlap.
 */
export function doIntervalsOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && endA > startB;
}

/**
 * Checks if a specific 30-min time slot is occupied by an appointment.
 * A slot at slotTime (e.g. 15:30) is covered if appStart <= slotMin < appEnd.
 */
export function isSlotCoveredByAppointment(slotTime: string, appStartTime: string, appDurationMinutes: number = 60): boolean {
  const slotMin = timeToMinutes(slotTime);
  const appStart = timeToMinutes(appStartTime);
  const appEnd = appStart + Math.max(15, appDurationMinutes || 60);
  return slotMin >= appStart && slotMin < appEnd;
}

/**
 * Standard business hours time slots for booking (30-min increments)
 */
export const STANDARD_TIME_SLOTS_24H: string[] = [
  '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00',
  '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00',
  '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00'
];

/**
 * Friendly client-facing time slots (08:00 AM to 07:00 PM)
 */
export const CLIENT_BOOKING_SLOTS: { value: string; label: string }[] = [
  { value: '08:00', label: '08:00 AM' },
  { value: '08:30', label: '08:30 AM' },
  { value: '09:00', label: '09:00 AM' },
  { value: '09:30', label: '09:30 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '10:30', label: '10:30 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '11:30', label: '11:30 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '12:30', label: '12:30 PM' },
  { value: '13:00', label: '01:00 PM' },
  { value: '13:30', label: '01:30 PM' },
  { value: '14:00', label: '02:00 PM' },
  { value: '14:30', label: '02:30 PM' },
  { value: '15:00', label: '03:00 PM' },
  { value: '15:30', label: '03:30 PM' },
  { value: '16:00', label: '04:00 PM' },
  { value: '16:30', label: '04:30 PM' },
  { value: '17:00', label: '05:00 PM' },
  { value: '17:30', label: '05:30 PM' },
  { value: '18:00', label: '06:00 PM' },
  { value: '18:30', label: '06:30 PM' },
  { value: '19:00', label: '07:00 PM' }
];

/**
 * Returns structured phases for any service.
 * Rules:
 * - Tinte (1 hora total): Primeros 30 min ocupado (aplicación), últimos 30 min libre (tinte reposando)
 * - Highlights / Mechas / Decoloración: Aplicación ocupado + Espacio libre de 1 hora (tiempo de espera/reposo) + Acabado
 * - Default / Otros servicios: 100% ocupado
 */
export function getServicePhases(serviceOrName?: Service | string, durationMinutes?: number): ServicePhase[] {
  let service: Service | undefined;
  let serviceName = '';
  let dur = durationMinutes || 60;

  if (typeof serviceOrName === 'string') {
    serviceName = serviceOrName;
    service = ALL_SERVICES.find(s => s.name.toLowerCase() === serviceName.toLowerCase() || s.id === serviceName);
  } else if (serviceOrName) {
    service = serviceOrName;
    serviceName = service.name;
    dur = durationMinutes || service.durationMinutes || 60;
  }

  if (service?.phases && service.phases.length > 0) {
    // If explicit duration matches, return configured phases
    const totalPhasesDuration = service.phases.reduce((acc, p) => acc + p.durationMinutes, 0);
    if (totalPhasesDuration === dur) {
      return service.phases;
    }
  }

  const nameLower = (serviceName || service?.name || '').toLowerCase();

  // 1. Tinte / Coloración
  const isTinte = /tinte|coloración|coloracion|aplicacion de color|baño color/i.test(nameLower);
  if (isTinte) {
    if (dur <= 45) {
      return [
        { name: 'Aplicación de Tinte', durationMinutes: 20, isStylistBusy: true, description: 'Estilista aplicando el tinte' },
        { name: 'Reposo de Tinte', durationMinutes: dur - 20, isStylistBusy: false, description: 'Estilista libre (tinte reposando)' }
      ];
    }
    if (dur === 60) {
      return [
        { name: 'Aplicación de Tinte', durationMinutes: 30, isStylistBusy: true, description: 'Estilista aplicando el tinte' },
        { name: 'Reposo de Tinte', durationMinutes: 30, isStylistBusy: false, description: 'Estilista libre (tinte reposando)' }
      ];
    }
    if (dur === 75) {
      return [
        { name: 'Aplicación de Tinte', durationMinutes: 30, isStylistBusy: true, description: 'Estilista aplicando el tinte' },
        { name: 'Reposo de Tinte', durationMinutes: 30, isStylistBusy: false, description: 'Estilista libre (tinte reposando)' },
        { name: 'Lavado y Secado', durationMinutes: 15, isStylistBusy: true, description: 'Lavado y secado final' }
      ];
    }
    if (dur === 90) {
      return [
        { name: 'Aplicación de Tinte', durationMinutes: 30, isStylistBusy: true, description: 'Estilista aplicando el tinte' },
        { name: 'Reposo de Tinte', durationMinutes: 45, isStylistBusy: false, description: 'Estilista libre (tinte reposando)' },
        { name: 'Lavado y Secado', durationMinutes: 15, isStylistBusy: true, description: 'Lavado y secado final' }
      ];
    }
    // Greater than 90m
    return [
      { name: 'Aplicación de Tinte', durationMinutes: 45, isStylistBusy: true, description: 'Estilista aplicando el tinte' },
      { name: 'Reposo de Tinte', durationMinutes: 45, isStylistBusy: false, description: 'Estilista libre (tinte reposando)' },
      { name: 'Lavado y Secado', durationMinutes: dur - 90, isStylistBusy: true, description: 'Lavado y secado final' }
    ];
  }

  // 2. Highlights / Mechas / Decoloración / Color Light / Quick Light / Low Light / Balayage
  const isHighlights = /highlight|mecha|color light|quick light|low light|decolora|balayage/i.test(nameLower);
  if (isHighlights) {
    if (dur <= 60) {
      return [
        { name: 'Montaje de Luces', durationMinutes: 30, isStylistBusy: true, description: 'Estilista aplicando y montando mechas' },
        { name: 'Reposo / Espera', durationMinutes: 30, isStylistBusy: false, description: 'Estilista libre durante tiempo de reposo' }
      ];
    }
    if (dur <= 90) {
      return [
        { name: 'Montaje de Luces', durationMinutes: 30, isStylistBusy: true, description: 'Estilista aplicando mechas' },
        { name: 'Reposo de 1 Hora', durationMinutes: 60, isStylistBusy: false, description: 'Estilista libre durante 1 hora de espera' }
      ];
    }
    if (dur <= 120) {
      return [
        { name: 'Aplicación de Highlights', durationMinutes: 60, isStylistBusy: true, description: 'Estilista montando papel y producto' },
        { name: 'Reposo de 1 Hora', durationMinutes: 60, isStylistBusy: false, description: 'Estilista libre durante 1 hora de espera' }
      ];
    }
    // More than 120m (e.g. 150m = 2.5h)
    return [
      { name: 'Aplicación de Highlights', durationMinutes: 60, isStylistBusy: true, description: 'Estilista montando papel y producto' },
      { name: 'Reposo de 1 Hora', durationMinutes: 60, isStylistBusy: false, description: 'Estilista libre durante 1 hora de espera' },
      { name: 'Matizado y Lavado', durationMinutes: dur - 120, isStylistBusy: true, description: 'Matiz, lavado y acabado final' }
    ];
  }

  // 3. Default (All other services)
  return [
    {
      name: service?.name || 'Servicio directo',
      durationMinutes: dur,
      isStylistBusy: true,
      description: 'Estilista dedicado al servicio'
    }
  ];
}

export interface DetailedPhaseTimeline {
  name: string;
  isStylistBusy: boolean;
  startMin: number;
  endMin: number;
  startTime24: string;
  endTime24: string;
  startTime12: string;
  endTime12: string;
  durationMinutes: number;
  description?: string;
}

/**
 * Returns absolute timeline phases for an appointment (e.g. 10:00 to 10:30 Aplicación [Busy], 10:30 to 11:00 Reposo [Free])
 */
export function getAppointmentPhasesTimeline(app: Appointment, allServices: Service[] = ALL_SERVICES): DetailedPhaseTimeline[] {
  const service = allServices.find(s => s.id === app.serviceId || s.name === app.serviceName);
  const duration = app.durationMinutes || service?.durationMinutes || 60;
  const phases = getServicePhases(service || app.serviceName, duration);

  const startMin = timeToMinutes(app.time);
  let currentMin = startMin;

  return phases.map(phase => {
    const pStart = currentMin;
    const pEnd = currentMin + phase.durationMinutes;
    currentMin = pEnd;

    return {
      name: phase.name,
      isStylistBusy: phase.isStylistBusy,
      startMin: pStart,
      endMin: pEnd,
      startTime24: minutesToTime24(pStart),
      endTime24: minutesToTime24(pEnd),
      startTime12: minutesToTime12(pStart),
      endTime12: minutesToTime12(pEnd),
      durationMinutes: phase.durationMinutes,
      description: phase.description
    };
  });
}

/**
 * Gets all intervals where the stylist is actively hands-on busy for an appointment
 */
export function getAppointmentBusyIntervals(app: Appointment, allServices: Service[] = ALL_SERVICES): { startMin: number; endMin: number; phaseName: string }[] {
  const timeline = getAppointmentPhasesTimeline(app, allServices);
  return timeline
    .filter(p => p.isStylistBusy)
    .map(p => ({
      startMin: p.startMin,
      endMin: p.endMin,
      phaseName: p.name
    }));
}

/**
 * Gets all intervals where the client is in reposo/waiting time and stylist is FREE to take another short appointment
 */
export function getAppointmentReposoIntervals(app: Appointment, allServices: Service[] = ALL_SERVICES): { startMin: number; endMin: number; phaseName: string }[] {
  const timeline = getAppointmentPhasesTimeline(app, allServices);
  return timeline
    .filter(p => !p.isStylistBusy)
    .map(p => ({
      startMin: p.startMin,
      endMin: p.endMin,
      phaseName: p.name
    }));
}

export interface SlotFeasibilityResult {
  allowed: boolean;
  reason?: string;
  conflictingAppointment?: Appointment;
  isDuringReposo?: boolean;
  reposoHostAppointment?: Appointment;
  availableStylistId?: string;
  phasesTimeline?: DetailedPhaseTimeline[];
}

/**
 * Resolves any stylist ID or string name to a canonical unique ID.
 */
export function getCanonicalStylistId(stylistId?: string, stylistName?: string): string {
  const rawId = (stylistId || '').toLowerCase().trim();
  const rawName = (stylistName || '').toLowerCase().trim();

  if (rawId === 'carlos' || rawName === 'carlos' || rawId.startsWith('carlos') || rawName.startsWith('carlos')) return 'carlos';
  if (rawId === 'fernando' || rawName === 'fernando' || rawId.startsWith('fernando') || rawName.startsWith('fernando')) return 'fernando';
  if (rawId === 'junior' || rawName === 'junior' || rawId.startsWith('junior') || rawName.startsWith('junior')) return 'junior';
  if (rawId === 'jessica' || rawName === 'jessica' || rawId.startsWith('jessica') || rawName.startsWith('jessica')) return 'jessica';
  if (rawId === 'yorleny' || rawId === 'jorleny' || rawName === 'yorleny' || rawName === 'jorleny' || rawId.startsWith('yorleny') || rawName.startsWith('yorleny') || rawId.startsWith('jorleny') || rawName.startsWith('jorleny')) return 'yorleny';
  if (rawId === 'mariela' || rawName === 'mariela' || rawId.startsWith('mariela') || rawName.startsWith('mariela')) return 'mariela';
  if (rawId === 'cualquiera' || rawName === 'cualquiera' || rawId.startsWith('cualquier') || rawName.startsWith('cualquier')) return 'cualquiera';

  // If already matches a known simple string
  if (rawId) return rawId;
  if (rawName) return rawName;
  return 'cualquiera';
}

/**
 * Checks if an appointment belongs to a target stylist.
 * Guarantees that appointments for Carlos NEVER collide with Fernando, Junior, Jessica, etc.
 */
export function isSameStylist(
  appStylistId?: string,
  appStylistName?: string,
  targetStylistId?: string,
  targetStylistName?: string
): boolean {
  if (!targetStylistId && !targetStylistName) return false;
  if (!appStylistId && !appStylistName) return false;

  const canonicalApp = getCanonicalStylistId(appStylistId, appStylistName);
  const canonicalTarget = getCanonicalStylistId(targetStylistId, targetStylistName);

  // If either is 'cualquiera' or empty, they do not match as a specific stylist
  if (!canonicalApp || !canonicalTarget || canonicalApp === 'cualquiera' || canonicalTarget === 'cualquiera') {
    return false;
  }

  return canonicalApp === canonicalTarget;
}

/**
 * Checks whether a candidate booking can be scheduled for a stylist at a given date/time.
 * 
 * Regla de agendamiento:
 * - Si el horario cae en un espacio donde el estilista está "ocupado" (aplicación, corte, etc.), NO se permite.
 * - Si cae en un espacio "libre" (tiempo de reposo/espera de otro cliente), SÍ se permite,
 *   siempre que le alcance el tiempo antes de la siguiente cita / fase ocupada.
 */
export function checkStylistBookingFeasibility({
  stylistId,
  dateStr,
  startTime,
  service,
  durationMinutes,
  existingAppointments,
  isStylistOff,
  allStylists,
  excludeAppointmentId
}: {
  stylistId: string;
  dateStr: string;
  startTime: string;
  service: Service;
  durationMinutes?: number;
  existingAppointments: Appointment[];
  isStylistOff?: (st: Stylist, dateStr: string) => boolean;
  allStylists?: Stylist[];
  excludeAppointmentId?: string;
}): SlotFeasibilityResult {
  const candidateStartMin = timeToMinutes(startTime);
  const totalDuration = durationMinutes || service.durationMinutes || 60;
  const candidateEndMin = candidateStartMin + totalDuration;

  // Check salon business closing time (latest slot ends at 19:30 or 20:00)
  const salonClosingMin = 19 * 60 + 30; // 07:30 PM
  if (candidateEndMin > 20 * 60) {
    return {
      allowed: false,
      reason: `La duración del servicio (${formatDurationText(totalDuration)}) supera la hora de cierre del salón.`
    };
  }

  // Calculate candidate phases
  const candidatePhases = getServicePhases(service, totalDuration);
  let curMin = candidateStartMin;
  const candidatePhaseIntervals = candidatePhases.map(p => {
    const s = curMin;
    const e = curMin + p.durationMinutes;
    curMin = e;
    return { ...p, startMin: s, endMin: e };
  });

  const candidateBusyIntervals = candidatePhaseIntervals.filter(p => p.isStylistBusy);

  // Filter existing active appointments on that date
  const dayApps = existingAppointments.filter(
    a => a.date === dateStr && a.status !== 'Cancelada' && a.id !== excludeAppointmentId
  );

  // If specific stylist is chosen
  if (stylistId && stylistId !== 'cualquiera') {
    const stylistObj = allStylists ? allStylists.find(s => s.id === stylistId || s.name.toLowerCase() === stylistId.toLowerCase()) : undefined;

    // Check if stylist is off
    if (stylistObj && isStylistOff && isStylistOff(stylistObj, dateStr)) {
      return {
        allowed: false,
        reason: `${stylistObj.name} no labora en la fecha seleccionada.`
      };
    }

    // STRICT ISOLATION: Only check appointments assigned specifically to this stylist
    const stylistApps = dayApps.filter(a => 
      isSameStylist(a.stylistId, a.stylistName, stylistId, stylistObj?.name)
    );

    let isDuringReposo = false;
    let reposoHostAppointment: Appointment | undefined;

    // Check collision for each candidate busy interval
    for (const candBusy of candidateBusyIntervals) {
      for (const existingApp of stylistApps) {
        const existingBusyIntervals = getAppointmentBusyIntervals(existingApp, ALL_SERVICES);

        for (const exBusy of existingBusyIntervals) {
          // If intervals overlap
          if (doIntervalsOverlap(candBusy.startMin, candBusy.endMin, exBusy.startMin, exBusy.endMin)) {
            const displayName = stylistObj?.name || 'El especialista';
            return {
              allowed: false,
              reason: `${displayName} ya tiene una cita con ${existingApp.clientName} (${existingApp.serviceName} - ${exBusy.phaseName}) de ${minutesToTime12(exBusy.startMin)} a ${minutesToTime12(exBusy.endMin)}.`,
              conflictingAppointment: existingApp
            };
          }
        }

        // Check if candidate starts during a reposo interval of existingApp
        const existingReposo = getAppointmentReposoIntervals(existingApp, ALL_SERVICES);
        for (const rep of existingReposo) {
          if (candidateStartMin >= rep.startMin && candidateStartMin < rep.endMin) {
            isDuringReposo = true;
            reposoHostAppointment = existingApp;
          }
        }
      }
    }

    return {
      allowed: true,
      isDuringReposo,
      reposoHostAppointment,
      availableStylistId: stylistId
    };
  }

  // If 'cualquiera' is chosen, find at least one eligible stylist who is completely available
  if (allStylists) {
    const eligibleStylists = allStylists.filter(st => {
      if (st.id === 'cualquiera') return false;
      if (isStylistOff && isStylistOff(st, dateStr)) return false;
      if (st.allowedCategories && service.category && !st.allowedCategories.includes(service.category)) {
        return false;
      }
      return true;
    });

    for (const st of eligibleStylists) {
      const res = checkStylistBookingFeasibility({
        stylistId: st.id,
        dateStr,
        startTime,
        service,
        durationMinutes: totalDuration,
        existingAppointments,
        isStylistOff,
        allStylists,
        excludeAppointmentId
      });
      if (res.allowed) {
        return {
          allowed: true,
          isDuringReposo: res.isDuringReposo,
          reposoHostAppointment: res.reposoHostAppointment,
          availableStylistId: st.id
        };
      }
    }

    return {
      allowed: false,
      reason: 'No hay especialistas disponibles en este horario para la duración completa requerida.'
    };
  }

  return { allowed: true };
}
