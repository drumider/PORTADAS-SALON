import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  Calendar,
  Clock,
  FileText,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  Plus,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Award
} from 'lucide-react';
import { Client, Appointment } from '../types';
import {
  getStoredClients,
  subscribeToClients,
  saveClient,
  deleteClient,
  updateClient,
  normalizePhone
} from '../utils/storage';

interface ClientDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookAppointmentForClient: (client: Client) => void;
  appointments?: Appointment[];
}

export const ClientDirectoryModal: React.FC<ClientDirectoryModalProps> = ({
  isOpen,
  onClose,
  onBookAppointmentForClient,
  appointments = []
}) => {
  const [clients, setClients] = useState<Client[]>(getStoredClients());
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form State for creating/editing a client
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Subscribe to real-time changes
  useEffect(() => {
    const unsubscribe = subscribeToClients((updatedClients) => {
      setClients(updatedClients);
    });
    return () => unsubscribe();
  }, []);

  // Clear toast after delay
  useEffect(() => {
    if (!successToast) return;
    const timer = setTimeout(() => setSuccessToast(null), 3500);
    return () => clearTimeout(timer);
  }, [successToast]);

  // Open Create Form
  const handleOpenRegister = () => {
    setEditingClient(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormNotes('');
    setFormError(null);
    setIsRegisterOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormPhone(client.phone);
    setFormEmail(client.email || '');
    setFormNotes(client.notes || '');
    setFormError(null);
    setIsRegisterOpen(true);
  };

  // Save or Update Client
  const handleSaveClientForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formName.trim();
    const trimmedPhone = formPhone.trim();

    if (!trimmedName) {
      setFormError('Por favor ingresa el nombre completo del cliente.');
      return;
    }

    if (!trimmedPhone || trimmedPhone.length < 8) {
      setFormError('Por favor ingresa un número de teléfono válido (mínimo 8 dígitos).');
      return;
    }

    const saved = saveClient({
      id: editingClient?.id,
      name: trimmedName,
      phone: trimmedPhone,
      email: formEmail.trim(),
      notes: formNotes.trim(),
      registeredAt: editingClient?.registeredAt,
      lastVisit: editingClient?.lastVisit,
      totalAppointments: editingClient?.totalAppointments || 0
    });

    setIsRegisterOpen(false);
    setSuccessToast(
      editingClient 
        ? `Cliente "${saved.name}" actualizado correctamente.` 
        : `Cliente "${saved.name}" registrado exitosamente con teléfono ${saved.phone}.`
    );
  };

  // Delete Client
  const handleDelete = (id: string) => {
    deleteClient(id);
    setConfirmDeleteId(null);
    setSuccessToast('Cliente eliminado del directorio.');
  };

  // Filter Clients
  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return clients;
    const qNorm = normalizePhone(q);

    return clients.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q);
      const matchPhone = c.phone.includes(q) || (qNorm && normalizePhone(c.phone).includes(qNorm));
      const matchEmail = c.email ? c.email.toLowerCase().includes(q) : false;
      const matchNotes = c.notes ? c.notes.toLowerCase().includes(q) : false;
      return matchName || matchPhone || matchEmail || matchNotes;
    });
  }, [clients, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = clients.length;
    const withMultiple = clients.filter(c => (c.totalAppointments || 0) > 1).length;
    return { total, withMultiple };
  }, [clients]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-4xl bg-white border border-[#D8CEB8] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-[#FAF8F5] border-b border-[#EAE3DC] p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#B5916A]/15 text-[#8C6B4D] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 uppercase tracking-wide font-serif-luxury">
                  Directorio de Clientes Registrados
                </h2>
                <span className="bg-[#8C6B4D] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  {stats.total} {stats.total === 1 ? 'Cliente' : 'Clientes'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-light">
                Base de datos con nombres, teléfonos y registro automático de citas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenRegister}
              className="bg-[#2C221C] hover:bg-[#8C6B4D] text-white text-xs uppercase tracking-wider font-bold px-3.5 py-2 rounded flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              id="admin-btn-registrar-cliente"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar Cliente</span>
            </button>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-900 p-2 transition-colors rounded-full hover:bg-neutral-100 cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Search & Quick Stats Bar */}
        <div className="p-3 sm:p-4 bg-neutral-50/70 border-b border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, teléfono o notas..."
              className="w-full bg-white border border-neutral-300 focus:border-[#B5916A] text-neutral-900 text-xs pl-9 pr-8 py-2 rounded outline-none shadow-xs font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-600 font-mono w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-neutral-200 shadow-2xs">
              <UserCheck className="w-3.5 h-3.5 text-[#8C6B4D]" />
              <span>{filteredClients.length} mostrados</span>
            </div>
            {stats.withMultiple > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 px-2.5 py-1 rounded border border-amber-200 shadow-2xs">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>{stats.withMultiple} frecuentes</span>
              </div>
            )}
          </div>
        </div>

        {/* Client List Content */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 bg-white space-y-3">
          {filteredClients.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-neutral-700">
                {searchQuery ? 'No se encontraron clientes que coincidan con la búsqueda.' : 'No hay clientes registrados todavía.'}
              </p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Los clientes se registran automáticamente al agendar una cita o puedes agregarlos manualmente usando el botón "Registrar Cliente".
              </p>
              <button
                onClick={handleOpenRegister}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8C6B4D] hover:bg-[#2C221C] text-white text-xs font-bold uppercase tracking-wider rounded transition-all shadow-xs cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Primer Cliente</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredClients.map((client) => {
                const isConfirmingDelete = confirmDeleteId === client.id;
                const cleanPhoneDigits = client.phone.replace(/\D/g, '');

                return (
                  <div
                    key={client.id}
                    className="p-4 bg-white hover:bg-neutral-50/60 border border-[#EAE3DC] hover:border-[#B5916A]/60 rounded-xl transition-all shadow-xs flex flex-col justify-between gap-3 group"
                  >
                    {/* Top Row: Avatar + Name + Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#2C221C] text-[#E5C1CD] flex items-center justify-center font-serif-luxury text-sm font-bold shrink-0 border border-[#B5916A]/40">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-neutral-900 uppercase font-serif-luxury truncate">
                            {client.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#8C6B4D]">
                            <Phone className="w-3.5 h-3.5 text-[#B5916A]" />
                            <a 
                              href={`tel:${cleanPhoneDigits}`} 
                              className="hover:underline hover:text-[#2C221C]"
                              title="Llamar al cliente"
                            >
                              {client.phone}
                            </a>
                          </div>
                        </div>
                      </div>

                      {client.totalAppointments && client.totalAppointments > 0 ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-full shrink-0">
                          {client.totalAppointments} {client.totalAppointments === 1 ? 'cita' : 'citas'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded-full border border-neutral-200 shrink-0">
                          Registrado
                        </span>
                      )}
                    </div>

                    {/* Middle: Email & Notes */}
                    <div className="space-y-1 text-xs text-neutral-600">
                      {client.email && (
                        <div className="flex items-center gap-1.5 text-neutral-600 truncate">
                          <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.notes && (
                        <div className="text-[11px] text-neutral-700 bg-amber-50/60 border border-amber-200/60 p-2 rounded italic line-clamp-2">
                          "{client.notes}"
                        </div>
                      )}
                      {client.lastVisit && (
                        <div className="text-[10px] text-neutral-400 font-mono flex items-center gap-1 pt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>Última cita: {client.lastVisit}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom: Action Buttons */}
                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onBookAppointmentForClient(client);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 bg-[#8C6B4D] hover:bg-[#2C221C] text-white text-[11px] font-bold uppercase tracking-wider rounded flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                          title="Agendar cita para este cliente"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Agendar Cita</span>
                        </button>

                        <a
                          href={`https://wa.me/506${cleanPhoneDigits}?text=Hola%20${encodeURIComponent(client.name)},%20te%20saludamos%20de%20CF%20Portadas%20Sal%C3%B3n.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-semibold rounded flex items-center gap-1 transition-colors"
                          title="Contactar por WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </a>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(client)}
                          className="p-1.5 text-neutral-500 hover:text-[#8C6B4D] hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                          title="Editar información"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 bg-red-50 p-1 rounded border border-red-200">
                            <span className="text-[10px] text-red-700 font-bold">¿Eliminar?</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(client.id)}
                              className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded hover:bg-red-700"
                            >
                              Sí
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-1.5 py-0.5 bg-neutral-200 text-neutral-700 text-[9px] rounded hover:bg-neutral-300"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(client.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Eliminar cliente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#FAF8F5] border-t border-[#EAE3DC] p-3 sm:p-4 flex items-center justify-between text-xs text-neutral-500 shrink-0">
          <span className="font-mono text-[11px]">
            Sincronización en tiempo real · CF Portadas
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-neutral-300 hover:border-neutral-500 text-neutral-800 text-xs font-semibold rounded shadow-2xs transition-colors cursor-pointer"
          >
            Cerrar Directorio
          </button>
        </div>
      </motion.div>

      {/* CREATE / EDIT CLIENT POPUP FORM */}
      <AnimatePresence>
        {isRegisterOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="w-full max-w-md bg-white border border-[#D8CEB8] rounded-xl shadow-2xl p-5 space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
                <div className="flex items-center gap-2 text-[#8C6B4D]">
                  <UserPlus className="w-5 h-5" />
                  <h3 className="text-sm font-bold text-neutral-900 uppercase font-serif-luxury">
                    {editingClient ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="text-neutral-400 hover:text-neutral-900 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveClientForm} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8C6B4D] mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="ej. María Rodríguez"
                    className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-xs px-3 py-2 rounded outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8C6B4D] mb-1">
                    Número Telefónico / WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="ej. 89607575 o 22883535"
                      className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-xs pl-9 pr-3 py-2 rounded outline-none font-mono font-medium"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Este número identificará al cliente para autocompletar citas futuras.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8C6B4D] mb-1">
                    Correo Electrónico (Opcional)
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="ej. cliente@ejemplo.com"
                      className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-xs pl-9 pr-3 py-2 rounded outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8C6B4D] mb-1">
                    Notas / Preferencias de Estilo (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="ej. Prefiere tinte sin amoníaco, alérgico a cierto fijador, café sin azúcar..."
                    className="w-full bg-[#FAF8F5] border border-[#E2D9CE] focus:border-[#B5916A] text-neutral-900 text-xs p-2.5 rounded outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setIsRegisterOpen(false)}
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#2C221C] hover:bg-[#8C6B4D] text-white text-xs font-bold uppercase tracking-wider rounded shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{editingClient ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
