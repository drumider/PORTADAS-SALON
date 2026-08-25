import { Appointment, Client } from '../types';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';

const APPOINTMENTS_STORAGE_KEY = 'cf_portadas_appointments_v1';
const CLIENTS_STORAGE_KEY = 'cf_portadas_clients_v1';
const ADMIN_AUTH_KEY = 'cf_portadas_admin_auth_v1';
const DELETED_APP_IDS_KEY = 'cf_portadas_deleted_app_ids_v1';
const DELETED_CLIENT_IDS_KEY = 'cf_portadas_deleted_client_ids_v1';

// Tombstones to prevent deleted documents from being resurrected by snapshots or offline sync
const getDeletedAppIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_APP_IDS_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch (e) {}
  return new Set<string>();
};

const getDeletedClientIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_CLIENT_IDS_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch (e) {}
  return new Set<string>();
};

const deletedAppIds = getDeletedAppIds();
const deletedClientIds = getDeletedClientIds();

const recordDeletedAppId = (id: string) => {
  deletedAppIds.add(id);
  try {
    localStorage.setItem(DELETED_APP_IDS_KEY, JSON.stringify(Array.from(deletedAppIds)));
  } catch (e) {}
};

const recordDeletedClientId = (id: string) => {
  deletedClientIds.add(id);
  try {
    localStorage.setItem(DELETED_CLIENT_IDS_KEY, JSON.stringify(Array.from(deletedClientIds)));
  } catch (e) {}
};

// Helper to clean objects for Firestore (removes any undefined values)
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = sanitizeForFirestore(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result as T;
}

// Helper to normalize phone numbers for accurate deduplication
export const normalizePhone = (phone: string): string => {
  if (!phone) return '';
  // Remove all non-digits
  let digits = phone.replace(/\D/g, '');
  // If it starts with Costa Rica country code 506 and has more than 8 digits, strip it for uniform local representation
  if (digits.startsWith('506') && digits.length === 11) {
    digits = digits.substring(3);
  }
  return digits || phone.trim();
};

// In-memory cache for fast synchronous rendering
let cachedAppointments: Appointment[] = [];
let cachedClients: Client[] = [];

const getLocalStorageAppointments = (): Appointment[] => {
  try {
    const data = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (data !== null) {
      const parsed: Appointment[] = JSON.parse(data);
      return parsed.filter(a => !deletedAppIds.has(a.id));
    }
  } catch (e) {
    console.error('Error reading appointments from local storage:', e);
  }
  return [];
};

const getLocalStorageClients = (): Client[] => {
  try {
    const data = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (data !== null) {
      const parsed: Client[] = JSON.parse(data);
      return parsed.filter(c => !deletedClientIds.has(c.id));
    }
  } catch (e) {
    console.error('Error reading clients from local storage:', e);
  }
  return [];
};

cachedAppointments = getLocalStorageAppointments();
cachedClients = getLocalStorageClients();

// Active subscribers for instant in-app reactivity
type AppointmentCallback = (apps: Appointment[]) => void;
type ClientCallback = (clients: Client[]) => void;

const appointmentSubscribers = new Set<AppointmentCallback>();
const clientSubscribers = new Set<ClientCallback>();

const notifyAppointmentSubscribers = () => {
  const filtered = cachedAppointments.filter(a => !deletedAppIds.has(a.id));
  const sorted = [...filtered].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  cachedAppointments = sorted;
  appointmentSubscribers.forEach((cb) => {
    try {
      cb(sorted);
    } catch (e) {
      console.error('Error in appointment subscriber callback:', e);
    }
  });
};

const notifyClientSubscribers = () => {
  const filtered = cachedClients.filter(c => !deletedClientIds.has(c.id));
  const sorted = [...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  cachedClients = sorted;
  clientSubscribers.forEach((cb) => {
    try {
      cb(sorted);
    } catch (e) {
      console.error('Error in client subscriber callback:', e);
    }
  });
};

// Listen for cross-tab local storage events
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === APPOINTMENTS_STORAGE_KEY) {
      cachedAppointments = getLocalStorageAppointments();
      notifyAppointmentSubscribers();
    }
    if (e.key === CLIENTS_STORAGE_KEY) {
      cachedClients = getLocalStorageClients();
      notifyClientSubscribers();
    }
  });
}

export const getStoredAppointments = (): Appointment[] => {
  return cachedAppointments.filter(a => !deletedAppIds.has(a.id));
};

export const getStoredClients = (): Client[] => {
  return cachedClients.filter(c => !deletedClientIds.has(c.id));
};

/**
 * Subscribe to real-time Firestore appointment updates across all devices
 */
export const subscribeToAppointments = (callback: (apps: Appointment[]) => void): (() => void) => {
  appointmentSubscribers.add(callback);
  // Immediately notify caller with existing cache so UI renders synchronously without waiting
  callback([...cachedAppointments].filter(a => !deletedAppIds.has(a.id)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)));

  const colRef = collection(db, 'appointments');

  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      const appsMap = new Map<string, Appointment>();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Appointment;
        const appId = docSnap.id || data.id;
        if (!deletedAppIds.has(appId)) {
          const app = {
            ...data,
            id: appId
          };
          appsMap.set(app.id, app);
        }
      });

      const apps = Array.from(appsMap.values());
      apps.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

      cachedAppointments = apps;
      try {
        localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(apps));
      } catch (e) {}

      notifyAppointmentSubscribers();
    },
    (error) => {
      console.warn('Firestore appointments subscription fallback to cache:', error);
      notifyAppointmentSubscribers();
    }
  );

  return () => {
    appointmentSubscribers.delete(callback);
    unsubscribe();
  };
};

/**
 * Subscribe to real-time Firestore clients updates across all devices
 */
export const subscribeToClients = (callback: (clients: Client[]) => void): (() => void) => {
  clientSubscribers.add(callback);
  // Immediately notify caller with existing cache
  callback([...cachedClients].filter(c => !deletedClientIds.has(c.id)).sort((a, b) => (a.name || '').localeCompare(b.name || '')));

  const colRef = collection(db, 'clients');

  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      const clientsMap = new Map<string, Client>();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Client;
        const clientId = docSnap.id || data.id;
        if (!deletedClientIds.has(clientId)) {
          const client = {
            ...data,
            id: clientId
          };
          clientsMap.set(client.id, client);
        }
      });

      const clients = Array.from(clientsMap.values());
      clients.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      cachedClients = clients;
      try {
        localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
      } catch (e) {}

      notifyClientSubscribers();
    },
    (error) => {
      console.warn('Firestore clients subscription fallback to cache:', error);
      notifyClientSubscribers();
    }
  );

  return () => {
    clientSubscribers.delete(callback);
    unsubscribe();
  };
};

/**
 * Save or manually register a client (by Admin or directly)
 */
export const saveClient = (
  clientData: Omit<Client, 'id' | 'registeredAt' | 'totalAppointments'> & { 
    id?: string; 
    registeredAt?: string; 
    totalAppointments?: number;
    lastVisit?: string;
  }
): Client => {
  const now = new Date().toISOString();
  const rawPhone = clientData.phone.trim();
  const normalized = normalizePhone(rawPhone);

  // Check if a client with same normalized phone or same ID already exists
  const existingClient = cachedClients.find(c => 
    (clientData.id && c.id === clientData.id) ||
    (normalized && normalizePhone(c.phone) === normalized) ||
    (c.name.trim().toLowerCase() === clientData.name.trim().toLowerCase())
  );

  const id = clientData.id || existingClient?.id || 'client-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

  const finalClient: Client = {
    id,
    name: clientData.name.trim(),
    phone: rawPhone,
    email: clientData.email?.trim() || existingClient?.email || '',
    notes: clientData.notes !== undefined ? clientData.notes.trim() : (existingClient?.notes || ''),
    registeredAt: clientData.registeredAt || existingClient?.registeredAt || now,
    lastVisit: clientData.lastVisit || existingClient?.lastVisit || '',
    totalAppointments: clientData.totalAppointments !== undefined 
      ? clientData.totalAppointments 
      : (existingClient?.totalAppointments || 0)
  };

  // If this client was previously marked deleted, un-tombstone
  deletedClientIds.delete(id);
  try {
    localStorage.setItem(DELETED_CLIENT_IDS_KEY, JSON.stringify(Array.from(deletedClientIds)));
  } catch (e) {}

  // Immediate cache update
  const existingIdx = cachedClients.findIndex(c => c.id === id);
  if (existingIdx !== -1) {
    cachedClients[existingIdx] = finalClient;
  } else {
    cachedClients.push(finalClient);
  }

  // Sort alphabetically
  cachedClients.sort((a, b) => a.name.localeCompare(b.name));

  try {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(cachedClients));
  } catch (e) {}

  notifyClientSubscribers();

  // Save to Firestore in cloud
  setDoc(doc(db, 'clients', id), sanitizeForFirestore(finalClient), { merge: true }).catch((err) => {
    console.error('Error writing client to Firestore:', err);
  });

  return finalClient;
};

/**
 * Automatically upsert client upon appointment registration (from Client Web Assistant or Admin)
 */
export const upsertClientFromAppointment = (
  clientName: string,
  clientPhone: string,
  clientEmail?: string,
  appointmentDate?: string
): Client => {
  const trimmedName = clientName.trim();
  const trimmedPhone = clientPhone.trim();
  const normalized = normalizePhone(trimmedPhone);

  const existingClient = cachedClients.find(c => 
    (normalized && normalizePhone(c.phone) === normalized) ||
    (c.name.toLowerCase() === trimmedName.toLowerCase())
  );

  const currentCount = existingClient?.totalAppointments || 0;
  const lastVisit = appointmentDate || existingClient?.lastVisit || new Date().toISOString().split('T')[0];

  return saveClient({
    id: existingClient?.id,
    name: trimmedName || existingClient?.name || 'Cliente Sin Nombre',
    phone: trimmedPhone || existingClient?.phone || '',
    email: clientEmail?.trim() || existingClient?.email || '',
    notes: existingClient?.notes || '',
    registeredAt: existingClient?.registeredAt,
    lastVisit: lastVisit,
    totalAppointments: currentCount + 1
  });
};

/**
 * Delete a client
 */
export const deleteClient = (id: string): void => {
  if (!id) return;
  recordDeletedClientId(id);
  cachedClients = cachedClients.filter(c => c.id !== id);
  try {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(cachedClients));
  } catch (e) {}

  notifyClientSubscribers();

  deleteDoc(doc(db, 'clients', id)).catch((err) => {
    console.error('Error deleting client from Firestore:', err);
  });
};

/**
 * Update client details
 */
export const updateClient = (id: string, updates: Partial<Client>): void => {
  const index = cachedClients.findIndex(c => c.id === id);
  if (index !== -1) {
    cachedClients[index] = {
      ...cachedClients[index],
      ...updates
    };
    try {
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(cachedClients));
    } catch (e) {}

    notifyClientSubscribers();
  }

  updateDoc(doc(db, 'clients', id), sanitizeForFirestore(updates)).catch((err) => {
    console.error('Error updating client in Firestore:', err);
  });
};

export const saveAppointment = (appointment: Omit<Appointment, 'id' | 'createdAt'> & { id?: string }): Appointment => {
  const now = new Date().toISOString();
  const id = appointment.id || 'app-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

  const finalApp: Appointment = {
    ...appointment,
    id,
    createdAt: appointment.id ? (cachedAppointments.find(a => a.id === appointment.id)?.createdAt || now) : now
  } as Appointment;

  // If this appointment was marked deleted, remove from tombstones
  deletedAppIds.delete(id);
  try {
    localStorage.setItem(DELETED_APP_IDS_KEY, JSON.stringify(Array.from(deletedAppIds)));
  } catch (e) {}

  // Immediate cache update
  const existingIdx = cachedAppointments.findIndex(a => a.id === id);
  if (existingIdx !== -1) {
    cachedAppointments[existingIdx] = finalApp;
  } else {
    cachedAppointments.push(finalApp);
  }
  try {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(cachedAppointments));
  } catch (e) {}

  // Broadcast synchronously to all mounted UI components
  notifyAppointmentSubscribers();

  // Save to cloud Firestore for real-time sync across all devices
  setDoc(doc(db, 'appointments', id), sanitizeForFirestore(finalApp), { merge: true }).catch((err) => {
    console.error('Error writing appointment to Firestore:', err);
  });

  // Automatically save/update the client in the Clients Directory
  try {
    upsertClientFromAppointment(
      finalApp.clientName,
      finalApp.clientPhone,
      finalApp.clientEmail,
      finalApp.date
    );
  } catch (err) {
    console.error('Error auto-saving client record:', err);
  }

  return finalApp;
};

export const deleteAppointment = (id: string): void => {
  if (!id) return;
  recordDeletedAppId(id);
  cachedAppointments = cachedAppointments.filter(a => a.id !== id);
  try {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(cachedAppointments));
  } catch (e) {}

  notifyAppointmentSubscribers();

  deleteDoc(doc(db, 'appointments', id)).catch((err) => {
    console.error('Error deleting appointment from Firestore:', err);
  });
};

export const cancelAppointment = (id: string, reason: string): void => {
  const index = cachedAppointments.findIndex(a => a.id === id);
  const now = new Date().toISOString();
  const trimmedReason = reason?.trim() || 'Asuntos personales';

  if (index !== -1) {
    cachedAppointments[index] = {
      ...cachedAppointments[index],
      status: 'Cancelada',
      cancellationReason: trimmedReason,
      cancelledAt: now
    };
    try {
      localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(cachedAppointments));
    } catch (e) {}

    notifyAppointmentSubscribers();
  }

  updateDoc(doc(db, 'appointments', id), sanitizeForFirestore({ 
    status: 'Cancelada',
    cancellationReason: trimmedReason,
    cancelledAt: now
  })).catch((err) => {
    console.error('Error cancelling appointment in Firestore:', err);
  });
};

export const updateAppointmentStatus = (id: string, status: Appointment['status']): void => {
  const index = cachedAppointments.findIndex(a => a.id === id);
  if (index !== -1) {
    cachedAppointments[index].status = status;
    try {
      localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(cachedAppointments));
    } catch (e) {}

    notifyAppointmentSubscribers();
  }

  updateDoc(doc(db, 'appointments', id), sanitizeForFirestore({ status })).catch((err) => {
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
      localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(cachedAppointments));
    } catch (e) {}

    notifyAppointmentSubscribers();
  }

  updateDoc(doc(db, 'appointments', id), sanitizeForFirestore(updates)).catch((err) => {
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

