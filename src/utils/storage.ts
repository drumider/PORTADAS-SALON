import { Appointment } from '../types';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';

const STORAGE_KEY = 'cf_portadas_appointments_v1';
const ADMIN_AUTH_KEY = 'cf_portadas_admin_auth_v1';

// Initial realistic sample appointments if database is empty
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

// In-memory cache for fast synchronous rendering
let cachedAppointments: Appointment[] = [];

const getLocalStorageAppointments = (): Appointment[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading local storage:', e);
  }
  return getSampleAppointments();
};

cachedAppointments = getLocalStorageAppointments();

export const getStoredAppointments = (): Appointment[] => {
  return cachedAppointments;
};

/**
 * Subscribe to real-time Firestore appointment updates across all devices
 */
export const subscribeToAppointments = (callback: (apps: Appointment[]) => void): (() => void) => {
  const colRef = collection(db, 'appointments');

  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        // Seed initial sample data to Firestore if collection is empty
        const samples = getSampleAppointments();
        samples.forEach((app) => {
          setDoc(doc(db, 'appointments', app.id), app).catch(console.error);
        });
        cachedAppointments = samples;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
        } catch (e) {}
        callback(samples);
        return;
      }

      const apps: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Appointment;
        apps.push({
          ...data,
          id: docSnap.id || data.id
        });
      });

      // Sort by date and time
      apps.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

      cachedAppointments = apps;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
      } catch (e) {}

      callback(apps);
    },
    (error) => {
      console.warn('Firestore subscription fallback to cache:', error);
      callback(cachedAppointments);
    }
  );

  return unsubscribe;
};

export const saveAppointment = (appointment: Omit<Appointment, 'id' | 'createdAt'> & { id?: string }): Appointment => {
  const now = new Date().toISOString();
  const id = appointment.id || 'app-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

  const finalApp: Appointment = {
    ...appointment,
    id,
    createdAt: appointment.id ? (cachedAppointments.find(a => a.id === appointment.id)?.createdAt || now) : now
  } as Appointment;

  // Immediate cache update
  const existingIdx = cachedAppointments.findIndex(a => a.id === id);
  if (existingIdx !== -1) {
    cachedAppointments[existingIdx] = finalApp;
  } else {
    cachedAppointments.push(finalApp);
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedAppointments));
  } catch (e) {}

  // Save to cloud Firestore for real-time sync across all devices
  setDoc(doc(db, 'appointments', id), finalApp, { merge: true }).catch((err) => {
    console.error('Error writing appointment to Firestore:', err);
  });

  return finalApp;
};

export const deleteAppointment = (id: string): void => {
  cachedAppointments = cachedAppointments.filter(a => a.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedAppointments));
  } catch (e) {}

  deleteDoc(doc(db, 'appointments', id)).catch((err) => {
    console.error('Error deleting appointment from Firestore:', err);
  });
};

export const updateAppointmentStatus = (id: string, status: Appointment['status']): void => {
  const index = cachedAppointments.findIndex(a => a.id === id);
  if (index !== -1) {
    cachedAppointments[index].status = status;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedAppointments));
    } catch (e) {}
  }

  updateDoc(doc(db, 'appointments', id), { status }).catch((err) => {
    console.error('Error updating appointment status in Firestore:', err);
  });
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
