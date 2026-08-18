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

// Default empty list when empty
const getSampleAppointments = (): Appointment[] => [];

// In-memory cache for fast synchronous rendering
let cachedAppointments: Appointment[] = [];

const getLocalStorageAppointments = (): Appointment[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data !== null) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading local storage:', e);
  }
  return [];
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
        cachedAppointments = [];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        } catch (e) {}
        callback([]);
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

export const updateAppointmentDetails = (id: string, updates: Partial<Appointment>): void => {
  const index = cachedAppointments.findIndex(a => a.id === id);
  if (index !== -1) {
    cachedAppointments[index] = {
      ...cachedAppointments[index],
      ...updates
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedAppointments));
    } catch (e) {}
  }

  updateDoc(doc(db, 'appointments', id), updates).catch((err) => {
    console.error('Error updating appointment in Firestore:', err);
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
