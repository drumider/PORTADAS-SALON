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
