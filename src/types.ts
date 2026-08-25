export interface ServicePhase {
  name: string;
  durationMinutes: number;
  isStylistBusy: boolean; // true if stylist is hands-on busy, false if client is in reposo/waiting time
  description?: string;
}

export interface ServiceOption {
  id: string;
  name: string;
  price?: string;
  priceNumber?: number;
  durationMinutes?: number;
  durationText?: string;
}

export interface Service {
  id: string;
  name: string;
  price: string;
  priceNumber?: number;
  code?: string;
  durationText?: string;
  durationMinutes: number;
  category?: string;
  icon?: any;
  description?: string;
  phases?: ServicePhase[];
  options?: ServiceOption[];
  optionLabel?: string;
}

export interface Stylist {
  id: string;
  name: string;
  role: string;
  avatarLetter: string;
  offDays?: number[]; // JS getDay() values: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  offDaysText?: string;
  allowedCategories?: string[]; // Allowed service categories for this specialist
}

export type AppointmentStatus = 'Confirmada' | 'Pendiente' | 'Completada' | 'Cancelada';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  registeredAt: string; // ISO string
  lastVisit?: string; // YYYY-MM-DD
  totalAppointments: number;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceId: string;
  serviceName: string;
  stylistId: string;
  stylistName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm format (e.g. "09:00", "10:30")
  durationMinutes: number;
  customPhases?: ServicePhase[];
  status: AppointmentStatus;
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  service: string;
  stylist: string;
  image: string;
}
