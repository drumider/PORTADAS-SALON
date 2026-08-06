export interface Service {
  id: string;
  name: string;
  price: string;
  icon?: any;
  description: string;
  durationMinutes: number;
}

export interface Stylist {
  id: string;
  name: string;
  role: string;
  avatarLetter: string;
}

export type AppointmentStatus = 'Confirmada' | 'Pendiente' | 'Completada' | 'Cancelada';

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
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  service: string;
  stylist: string;
  image: string;
}
