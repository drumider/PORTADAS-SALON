import { Appointment } from '../types';

const STORAGE_KEY = 'cf_portadas_appointments_v1';
const ADMIN_AUTH_KEY = 'cf_portadas_admin_auth_v1';

// Initial realistic sample appointments if storage is empty
const getSampleAppointments = (): Appointment[] => {
  const today = new Date();
  const formatDate = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'app-sample-1',
      clientName: 'María Rodríguez',
      clientPhone: '8812 3456',
      clientEmail: 'maria.rodriguez@gmail.com',
      serviceId: 'corte',
      serviceName: 'Corte y Estilo',
      stylistId: 'carlos',
      stylistName: 'Carlos',
      date: formatDate(0),
      time: '09:30',
      durationMinutes: 45,
      status: 'Confirmada',
      notes: 'Cliente frecuente. Prefiere peinado con volumen.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'app-sample-2',
      clientName: 'Sofia Alvarado',
      clientPhone: '8765 4321',
      clientEmail: 'sofia.a@hotmail.com',
      serviceId: 'color',
      serviceName: 'Coloración',
      stylistId: 'carlos',
      stylistName: 'Carlos',
      date: formatDate(0),
      time: '11:00',
      durationMinutes: 90,
      status: 'Confirmada',
      notes: 'Retoque de raíz y matiz dorado.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'app-sample-3',
      clientName: 'Valeria Chaves',
      clientPhone: '8321 9876',
      clientEmail: 'vchaves@outlook.com',
      serviceId: 'manicure',
      serviceName: 'Manicure y Pedicure',
      stylistId: 'fernando',
      stylistName: 'Fernando',
      date: formatDate(0),
      time: '14:00',
      durationMinutes: 60,
      status: 'Pendiente',
      notes: 'Gel permanente color nude.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'app-sample-4',
      clientName: 'Lucía Jiménez',
      clientPhone: '8555 1234',
      clientEmail: 'lucia.j@gmail.com',
      serviceId: 'kerastase',
      serviceName: 'Tratamiento Kérastase',
      stylistId: 'diego',
      stylistName: 'Diego',
      date: formatDate(1),
      time: '10:00',
      durationMinutes: 60,
      status: 'Confirmada',
      notes: 'Tratamiento Fusio-Dose para cabello seco.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'app-sample-5',
      clientName: 'Amanda Mora',
      clientPhone: '8999 7777',
      clientEmail: '',
      serviceId: 'alisado',
      serviceName: 'Alisado',
      stylistId: 'fernando',
      stylistName: 'Fernando',
      date: formatDate(1),
      time: '13:00',
      durationMinutes: 120,
      status: 'Confirmada',
      notes: 'Alisado orgánico libre de formol.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'app-sample-6',
      clientName: 'Camila Zúñiga',
      clientPhone: '8444 3322',
      clientEmail: 'czuniga@yahoo.com',
      serviceId: 'maquillaje',
      serviceName: 'Maquillaje',
      stylistId: 'diego',
      stylistName: 'Diego',
      date: formatDate(2),
      time: '15:30',
      durationMinutes: 60,
      status: 'Pendiente',
      notes: 'Maquillaje para evento de noche.',
      createdAt: new Date().toISOString()
    }
  ];
};

export const getStoredAppointments = (): Appointment[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const sample = getSampleAppointments();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
      return sample;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading appointments from localStorage', e);
    return getSampleAppointments();
  }
};

export const saveAppointment = (appointment: Omit<Appointment, 'id' | 'createdAt'> & { id?: string }): Appointment => {
  const appointments = getStoredAppointments();
  const now = new Date().toISOString();

  let finalAppointment: Appointment;

  if (appointment.id) {
    // Update existing
    const index = appointments.findIndex(a => a.id === appointment.id);
    finalAppointment = {
      ...appointment,
      id: appointment.id,
      createdAt: index !== -1 ? appointments[index].createdAt : now
    } as Appointment;

    if (index !== -1) {
      appointments[index] = finalAppointment;
    } else {
      appointments.push(finalAppointment);
    }
  } else {
    // Create new
    finalAppointment = {
      ...appointment,
      id: 'app-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      createdAt: now
    } as Appointment;
    appointments.push(finalAppointment);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  return finalAppointment;
};

export const deleteAppointment = (id: string): void => {
  const appointments = getStoredAppointments();
  const filtered = appointments.filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const updateAppointmentStatus = (id: string, status: Appointment['status']): void => {
  const appointments = getStoredAppointments();
  const index = appointments.findIndex(a => a.id === id);
  if (index !== -1) {
    appointments[index].status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  }
};

// Admin authentication helpers
export const setAdminAuthenticated = (isAuth: boolean) => {
  if (isAuth) {
    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
  } else {
    localStorage.removeItem(ADMIN_AUTH_KEY);
  }
};

export const isAdminAuthenticated = (): boolean => {
  return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
};
