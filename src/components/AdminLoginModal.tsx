import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, User, Eye, EyeOff, ShieldCheck, X, KeyRound, Sparkles } from 'lucide-react';
import { setAdminAuthenticated } from '../utils/storage';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const validUser = username.trim().toLowerCase();
      const validPass = password.trim();

      // Accepted combinations for salon admin/owner
      if (
        (validUser === 'admin' || validUser === 'portadas' || validUser === 'cfportadas') &&
        (validPass === 'portadas102027')
      ) {
        setAdminAuthenticated(true);
        setLoading(false);
        onSuccess();
      } else {
        setLoading(false);
        setError('Usuario o contraseña incorrectos. Verifica las credenciales.');
      }
    }, 400);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md bg-warm-card border border-gold-champagne/30 shadow-2xl relative overflow-hidden"
        >
          {/* Top Gold Accent Bar */}
          <div className="h-1 bg-gradient-to-r from-gold-champagne via-white to-gold-champagne" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gold-champagne transition-colors p-2"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8 sm:p-10">
            {/* Header / Brand Badge */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 border border-gold-champagne/40 bg-dark-bg/80 flex items-center justify-center mb-4 text-gold-champagne shadow-lg">
                <ShieldCheck className="w-7 h-7" strokeWidth={1.5} />
              </div>

              <div className="relative inline-flex items-center mb-1">
                <span className="font-logo-doulaise text-3xl text-gold-champagne mr-1 transform -rotate-[10deg]">
                  cf
                </span>
                <span className="font-logo-sans text-base tracking-[0.2em] text-white font-light uppercase">
                  PORTADAS
                </span>
              </div>
              <span className="text-[9px] tracking-[0.35em] text-gold-champagne font-light uppercase">
                PANEL PRIVADO DE ADMINISTRACIÓN
              </span>
              <p className="text-xs text-gray-light/50 font-light mt-2">
                Acceso exclusivo para gestión y control de agenda del salón.
              </p>
            </div>

            {/* Default credentials hint badge */}
            <div className="bg-dark-bg/90 border border-gold-champagne/20 p-3 mb-6 flex items-start gap-2.5 rounded-none text-left">
              <Sparkles className="w-4 h-4 text-gold-champagne shrink-0 mt-0.5" />
              <div className="text-[11px] text-gray-light/80 font-light leading-relaxed">
                <span className="text-gold-champagne font-semibold block uppercase text-[10px] tracking-wider">
                  Acceso Propietaria / Administrador
                </span>
                Usuario: <code className="text-white bg-black/40 px-1 py-0.5 font-mono text-[10px]">admin</code> | Contraseña protegida
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-950/40 border border-red-500/40 p-3 mb-6 text-xs text-red-300 font-light text-center"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Username Input */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-gold-champagne/80 font-light mb-1.5">
                  Usuario Administrador
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gold-champagne/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ej. admin"
                    className="w-full bg-dark-bg border border-warm-border focus:border-gold-champagne text-white text-sm pl-10 pr-4 py-3 outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-gold-champagne/80 font-light mb-1.5">
                  Contraseña de Seguridad
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gold-champagne/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-dark-bg border border-warm-border focus:border-gold-champagne text-white text-sm pl-10 pr-10 py-3 outline-none transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold-champagne transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold-champagne text-dark-bg hover:bg-white text-xs uppercase tracking-[0.2em] font-bold py-3.5 transition-all duration-300 flex items-center justify-center gap-2 mt-6 shadow-lg shadow-gold-champagne/10 disabled:opacity-50"
              >
                {loading ? (
                  <span>VERIFICANDO CREDENCIALES...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>INGRESAR AL PANEL PRIVADO</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
