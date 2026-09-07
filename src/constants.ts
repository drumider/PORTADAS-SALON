import { Stylist, StylistScheduleException } from './types';
import { ALL_SERVICES } from './data/servicesData';

export const SERVICES = ALL_SERVICES;

export const SERVICE_CATEGORIES = [
  'Todos',
  'Alisados y Keratinas',
  'Coloración y Tintes',
  'Cortes y Peinados',
  'Tratamientos Capilares',
  'Manicure y Pedicure',
  'Depilación y Rostro',
  'Maquillaje y Masajes',
  'Paquetes y Promociones'
];

export const STYLISTS: Stylist[] = [
  { 
    id: 'carlos', 
    name: 'Carlos', 
    role: 'Estilista Master / Colorista', 
    avatarLetter: 'C', 
    offDays: [2],
    allowedCategories: ['Alisados y Keratinas', 'Coloración y Tintes', 'Cortes y Peinados', 'Tratamientos Capilares', 'Paquetes y Promociones'] 
  },
  { 
    id: 'fernando', 
    name: 'Fernando', 
    role: 'Especialista en Alisados y Corte', 
    avatarLetter: 'F', 
    offDays: [3],
    allowedCategories: ['Alisados y Keratinas', 'Coloración y Tintes', 'Cortes y Peinados', 'Tratamientos Capilares', 'Paquetes y Promociones'] 
  },
  { 
    id: 'junior', 
    name: 'Junior', 
    role: 'Master en Tratamientos y Estilo', 
    avatarLetter: 'J', 
    offDays: [1],
    allowedCategories: ['Alisados y Keratinas', 'Coloración y Tintes', 'Cortes y Peinados', 'Tratamientos Capilares', 'Maquillaje y Masajes', 'Paquetes y Promociones'] 
  },
  { 
    id: 'jessica', 
    name: 'Jessica', 
    role: 'Estilista y Manicurista', 
    avatarLetter: 'J', 
    offDays: [1],
    allowedCategories: ['Alisados y Keratinas', 'Coloración y Tintes', 'Cortes y Peinados', 'Tratamientos Capilares', 'Manicure y Pedicure', 'Depilación y Rostro', 'Maquillaje y Masajes', 'Paquetes y Promociones'] 
  },
  { 
    id: 'yorleny', 
    name: 'Yorleny', 
    role: 'Manicurista', 
    avatarLetter: 'Y', 
    offDays: [3],
    allowedCategories: ['Manicure y Pedicure', 'Depilación y Rostro', 'Maquillaje y Masajes', 'Paquetes y Promociones', 'Cortes y Peinados', 'Tratamientos Capilares'] 
  },
  { 
    id: 'mariela', 
    name: 'Mariela', 
    role: 'Manicurista', 
    avatarLetter: 'M', 
    offDays: [2],
    allowedCategories: ['Manicure y Pedicure', 'Depilación y Rostro', 'Maquillaje y Masajes', 'Paquetes y Promociones', 'Cortes y Peinados', 'Tratamientos Capilares'] 
  },
  { 
    id: 'cualquiera', 
    name: 'Cualquier profesional', 
    role: 'El primero disponible para tu comodidad', 
    avatarLetter: '★', 
    offDays: [],
    allowedCategories: ['Alisados y Keratinas', 'Coloración y Tintes', 'Cortes y Peinados', 'Tratamientos Capilares', 'Manicure y Pedicure', 'Depilación y Rostro', 'Maquillaje y Masajes', 'Paquetes y Promociones'] 
  }
];

export const TIME_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '01:00 PM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
  '05:30 PM',
  '06:00 PM',
  '06:30 PM'
];

export const DEFAULT_SCHEDULE_EXCEPTIONS: StylistScheduleException[] = [
  {
    id: 'exc-yorleny-2026-09-07',
    stylistId: 'yorleny',
    stylistName: 'Yorleny',
    date: '2026-09-07',
    type: 'off',
    reason: 'Cita médica (Cambio por Miércoles 9 de Septiembre)',
    replacesDate: '2026-09-09',
    createdAt: '2026-09-07T10:00:00Z'
  },
  {
    id: 'exc-yorleny-2026-09-09',
    stylistId: 'yorleny',
    stylistName: 'Yorleny',
    date: '2026-09-09',
    type: 'working',
    reason: 'Labora en sustitución del Lunes 7 (Cita médica)',
    replacesDate: '2026-09-07',
    createdAt: '2026-09-07T10:00:00Z'
  }
];
