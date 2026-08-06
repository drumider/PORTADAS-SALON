import { Scissors, Paintbrush, Sparkles, Hand, Heart, Wind } from 'lucide-react';
import { Service, Stylist } from './types';

export const SERVICES: Service[] = [
  {
    id: 'corte',
    name: 'Corte y Estilo',
    price: '₡18,000',
    icon: Scissors,
    description: 'Diseño de corte personalizado, lavado premium con masaje capilar y secado con estilo.',
    durationMinutes: 45
  },
  {
    id: 'color',
    name: 'Coloración',
    price: '₡35,000',
    icon: Paintbrush,
    description: 'Técnicas avanzadas de balayage, babylights, cobertura total de canas o baño de color premium.',
    durationMinutes: 90
  },
  {
    id: 'kerastase',
    name: 'Tratamiento Kérastase',
    price: '₡25,000',
    icon: Sparkles,
    description: 'Rituales Fusio-Dose y mascarillas intensivas personalizadas para restaurar la fibra capilar.',
    durationMinutes: 60
  },
  {
    id: 'manicure',
    name: 'Manicure y Pedicure',
    price: '₡15,000',
    icon: Hand,
    description: 'Cuidado completo de uñas, exfoliación profunda, hidratación y esmaltado permanente en gel.',
    durationMinutes: 60
  },
  {
    id: 'maquillaje',
    name: 'Maquillaje',
    price: '₡30,000',
    icon: Heart,
    description: 'Maquillaje profesional HD de larga duración para eventos especiales, novias y pasarela.',
    durationMinutes: 60
  },
  {
    id: 'alisado',
    name: 'Alisado',
    price: '₡45,000',
    icon: Wind,
    description: 'Alisados orgánicos libres de formol y queratinas brasileñas para un lacio sedoso de larga duración.',
    durationMinutes: 120
  }
];

export const STYLISTS: Stylist[] = [
  { id: 'carlos', name: 'Carlos', role: 'Estilista Master / Colorista', avatarLetter: 'C' },
  { id: 'fernando', name: 'Fernando', role: 'Especialista en Alisados y Corte', avatarLetter: 'F' },
  { id: 'diego', name: 'Diego', role: 'Master en Tratamientos y Estilo', avatarLetter: 'D' },
  { id: 'cualquiera', name: 'Cualquier profesional', role: 'El primero disponible para tu comodidad', avatarLetter: '★' }
];
