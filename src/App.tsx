import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  Paintbrush, 
  Sparkles, 
  Hand, 
  Heart, 
  Wind, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Clock, 
  X, 
  Instagram, 
  Facebook, 
  ChevronRight, 
  Calendar,
  CheckCircle,
  User,
  ExternalLink,
  Lock,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { saveAppointment, isAdminAuthenticated } from './utils/storage';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';

// Type definitions
interface Service {
  id: string;
  name: string;
  price: string;
  icon: any;
  description: string;
}

interface Stylist {
  id: string;
  name: string;
  role: string;
  avatarLetter: string;
}

interface GalleryItem {
  id: string;
  title: string;
  service: string;
  stylist: string;
  image: string;
}

// Data
const SERVICES: Service[] = [
  {
    id: 'corte',
    name: 'Corte y Estilo',
    price: '₡18,000',
    icon: Scissors,
    description: 'Diseño de corte personalizado, lavado premium con masaje capilar y secado con estilo.'
  },
  {
    id: 'color',
    name: 'Coloración',
    price: '₡35,000',
    icon: Paintbrush,
    description: 'Técnicas avanzadas de balayage, babylights, cobertura total de canas o baño de color premium.'
  },
  {
    id: 'kerastase',
    name: 'Tratamiento Kérastase',
    price: '₡25,000',
    icon: Sparkles,
    description: 'Rituales Fusio-Dose y mascarillas intensivas personalizadas para restaurar la fibra capilar.'
  },
  {
    id: 'manicure',
    name: 'Manicure y Pedicure',
    price: '₡15,000',
    icon: Hand,
    description: 'Cuidado completo de uñas, exfoliación profunda, hidratación y esmaltado permanente en gel.'
  },
  {
    id: 'maquillaje',
    name: 'Maquillaje',
    price: '₡30,000',
    icon: Heart,
    description: 'Maquillaje profesional HD de larga duración para eventos especiales, novias y pasarela.'
  },
  {
    id: 'alisado',
    name: 'Alisado',
    price: '₡45,000',
    icon: Wind,
    description: 'Alisados orgánicos libres de formol y queratinas brasileñas para un lacio sedoso de larga duración.'
  }
];

const STYLISTS: Stylist[] = [
  { id: 'carlos', name: 'Carlos', role: 'Estilista Master / Colorista', avatarLetter: 'C' },
  { id: 'fernando', name: 'Fernando', role: 'Especialista en Alisados y Corte', avatarLetter: 'F' },
  { id: 'diego', name: 'Diego', role: 'Master en Tratamientos y Estilo', avatarLetter: 'D' },
  { id: 'cualquiera', name: 'Cualquier profesional', role: 'El primero disponible para tu comodidad', avatarLetter: '★' }
];

// Generated image assets (referenced strictly from real paths returned by tool)
const GALLERY: GalleryItem[] = [
  {
    id: 'g1',
    title: 'Corte Shag Moderno',
    service: 'Corte y Estilo',
    stylist: 'Carlos',
    image: '/src/assets/images/corte_estilo.jpg'
  },
  {
    id: 'g2',
    title: 'Balayage Caramelo',
    service: 'Coloración',
    stylist: 'Carlos',
    image: '/src/assets/images/color.jpg'
  },
  {
    id: 'g3',
    title: 'Ritual de Reconstrucción Kérastase',
    service: 'Tratamiento Kérastase',
    stylist: 'Diego',
    image: '/src/assets/images/tratamiento_kerastase.jpg'
  },
  {
    id: 'g4',
    title: 'Manicure Minimal Champagne',
    service: 'Manicure y Pedicure',
    stylist: 'Fernando',
    image: '/src/assets/images/manicura.jpg'
  },
  {
    id: 'g5',
    title: 'Maquillaje Social Elegante',
    service: 'Maquillaje',
    stylist: 'Diego',
    image: '/src/assets/images/maquillaje.jpg'
  },
  {
    id: 'g6',
    title: 'Alisado Orgánico Espejo',
    service: 'Alisado',
    stylist: 'Fernando',
    image: '/src/assets/images/alisado.jpg'
  }
];

export default function App() {
  // Navigation & Interactive states
  const [activeTab, setActiveTab] = useState<'inicio' | 'servicios' | 'galeria' | 'contacto'>('inicio');
  const [activeLightbox, setActiveLightbox] = useState<GalleryItem | null>(null);

  // Booking Assistant Form State
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>('');
  const [showBookingSuccess, setShowBookingSuccess] = useState<boolean>(false);
  const [latestAppointment, setLatestAppointment] = useState<any | null>(null);

  // Admin Panel & Secret Login States
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isAdminViewActive, setIsAdminViewActive] = useState<boolean>(false);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['inicio', 'servicios', 'galeria', 'contacto'];
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveTab(section as any);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll smoothly to target section
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveTab(id as any);
    }
  };

  // Generate date options (Next 7 business days excluding Sundays)
  const getNextDays = () => {
    const days = [];
    const today = new Date();
    let count = 0;
    
    // Max 7 days
    while (count < 10 && days.length < 7) {
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() + count);
      
      // 0 is Sunday
      if (nextDay.getDay() !== 0) {
        days.push({
          rawValue: nextDay.toISOString().split('T')[0],
          formatted: nextDay.toLocaleDateString('es-CR', { weekday: 'short', day: 'numeric', month: 'short' }),
          dayName: nextDay.toLocaleDateString('es-CR', { weekday: 'long' }),
          dayNumber: nextDay.getDate()
        });
      }
      count++;
    }
    return days;
  };

  const availableDates = getNextDays();
  const timeSlots = ['09:00 AM', '10:30 AM', '12:00 PM', '01:30 PM', '03:00 PM', '04:30 PM', '06:00 PM'];

  // Handle Reservation processing: saves to persistent DB & prepares WhatsApp confirmation
  const handleProcessBooking = (openWhatsApp: boolean = false) => {
    if (!selectedService || !selectedStylist || !bookingDate || !bookingTime || !clientName.trim() || !clientPhone.trim()) {
      alert('Por favor completa todos los campos requeridos (Nombre, Teléfono, Servicio, Especialista, Fecha y Hora).');
      return;
    }

    // Save appointment persistently into database / localStorage
    const newAppointment = saveAppointment({
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: '',
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      stylistId: selectedStylist.id,
      stylistName: selectedStylist.name,
      date: bookingDate,
      time: bookingTime.replace(' AM', '').replace(' PM', ''),
      durationMinutes: 60,
      status: 'Pendiente',
      notes: customNote.trim()
    });

    const formattedDate = availableDates.find(d => d.rawValue === bookingDate)?.formatted || bookingDate;
    
    const message = `¡Hola CF Portadas! Me gustaría solicitar/confirmar mi cita:

✨ Servicio: ${selectedService.name}
💇‍♂️ Especialista: ${selectedStylist.name} (${selectedStylist.role})
📅 Fecha: ${formattedDate}
⏰ Hora: ${bookingTime}

👤 Cliente: ${clientName.trim()}
📞 Teléfono: ${clientPhone.trim()}
${customNote.trim() ? `📝 Nota: ${customNote.trim()}` : ''}

📌 Código de Cita: ${newAppointment.id}
_Solicitado desde el sitio web de CF Portadas_`;

    const encodedText = encodeURIComponent(message);
    const waUrl = `https://wa.me/50689607575?text=${encodedText}`;
    
    setLatestAppointment({
      ...newAppointment,
      formattedDate,
      formattedTime: bookingTime,
      waUrl
    });

    if (openWhatsApp) {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }

    setShowBookingSuccess(true);
  };

  // Reset booking form
  const resetForm = () => {
    setSelectedService(null);
    setSelectedStylist(null);
    setBookingDate('');
    setBookingTime('');
    setClientName('');
    setClientPhone('');
    setCustomNote('');
    setBookingStep(1);
    setShowBookingSuccess(false);
    setLatestAppointment(null);
  };

  // If Admin Panel view is active, render AdminDashboard
  if (isAdminViewActive) {
    return (
      <div className="relative">
        {/* Floating Top Banner to toggle back to Public Website */}
        <div className="bg-black border-b border-gold-champagne/30 px-4 py-2 text-center text-xs flex items-center justify-between text-gray-300 z-50 relative">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gold-champagne" />
            <span className="text-[11px] text-gold-champagne font-semibold uppercase tracking-wider">
              Modo Administración Activo · CF Portadas
            </span>
          </div>
          <button
            onClick={() => setIsAdminViewActive(false)}
            className="text-[10px] uppercase font-mono tracking-widest text-gold-champagne hover:text-white underline border border-gold-champagne/30 px-2.5 py-1 bg-warm-card"
          >
            ← Ver Sitio Web Público
          </button>
        </div>

        <AdminDashboard onLogout={() => setIsAdminViewActive(false)} />
      </div>
    );
  }

  return (
    <div className="bg-dark-bg text-gray-light min-h-screen selection:bg-gold-champagne selection:text-dark-bg relative overflow-x-hidden font-sans antialiased">
      
      {/* GLOBAL BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(201,169,106,0.05),rgba(255,255,255,0))]" />
      
      {/* HEADER / NAVIGATION */}
      <header className="fixed top-0 left-0 w-full z-40 bg-transparent py-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div 
            onClick={() => scrollToSection('inicio')} 
            className="cursor-pointer flex flex-col items-start group"
            id="header-logo"
          >
            <div className="relative pl-6 pr-1 pt-2 flex items-center">
              <span className="absolute -top-1.5 left-0 font-logo-doulaise text-4xl text-gold-champagne group-hover:text-white transition-colors leading-none select-none pointer-events-none transform -rotate-[10deg]">
                cf
              </span>
              <span className="font-logo-sans text-base sm:text-lg tracking-[0.2em] text-white font-light uppercase group-hover:text-gold-champagne transition-colors pl-[0.1em]">
                PORTADAS
              </span>
            </div>
            <span className="text-[7px] sm:text-[8px] tracking-[0.35em] text-gold-champagne/80 font-light uppercase mt-0.5 ml-6">
              SALÓN DE BELLEZA
            </span>
          </div>

          <nav className="hidden md:flex space-x-8 items-center">
            {['inicio', 'servicios', 'galeria', 'contacto'].map((section) => (
              <button
                key={section}
                onClick={() => scrollToSection(section)}
                className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 font-light hover:text-gold-champagne ${
                  activeTab === section ? 'text-gold-champagne font-normal' : 'text-gray-light/60'
                }`}
                id={`nav-${section}`}
              >
                {section === 'galeria' ? 'galería' : section}
              </button>
            ))}
          </nav>

          <div>
            <button 
              onClick={() => {
                scrollToSection('contacto');
                setShowBookingSuccess(false);
              }}
              className="border border-gold-champagne hover:border-white text-gold-champagne px-5 py-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 hover:bg-gold-champagne hover:text-dark-bg cursor-pointer"
              id="cta-reservas-header"
            >
              AGENDAR CON ASISTENTE
            </button>
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION */}
      <section 
        id="inicio" 
        className="relative h-screen flex flex-col justify-center items-center text-center px-4 overflow-hidden bg-dark-bg"
      >
        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/src/assets/images/hero.png" 
            alt="Interior de CF Portadas Salón de Belleza" 
            className="w-full h-full object-cover object-center filter contrast-110 brightness-[0.38] sepia-[15%]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/50 to-transparent" />
          <div className="absolute inset-0 bg-black/45" />
          {/* Luminous Gold Spot */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-champagne/10 rounded-full filter blur-[120px] pointer-events-none" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center mt-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            {/* BRAND LOGO EXACTLY LIKE THE UPLOADED IMAGE */}
            <div className="flex flex-col items-center select-none my-4 sm:my-8" id="hero-brand-logo">
              {/* Overlapping text container with generous top padding to ensure the elegant script fits */}
              <div className="relative mb-4 sm:mb-6 pt-16 sm:pt-24 pb-2 px-6 flex flex-col items-center">
                {/* The "cf" elegant script, perfectly positioned higher up, overlapping the letters 'P' and 'O' */}
                <span className="absolute top-[-1.5rem] sm:top-[-2.2rem] md:top-[-2.6rem] lg:top-[-3.2rem] left-[25.5%] -translate-x-1/2 font-logo-doulaise text-[5rem] sm:text-[7rem] md:text-[8.5rem] lg:text-[9.8rem] text-gold-champagne/95 leading-none select-none pointer-events-none transform -rotate-[12deg] tracking-tight font-normal">
                  cf
                </span>
                
                {/* "PORTADAS" geometric modern text in beautiful Signature blush pink */}
                <h1 className="font-logo-sans text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-[0.25em] text-gold-champagne leading-none relative z-10 select-none pl-[0.25em]">
                  PORTADAS
                </h1>
              </div>

              {/* Elegant Thin Horizontal Divider (rose-gold tint) */}
              <div className="w-64 sm:w-80 md:w-[26rem] h-[1.5px] bg-gold-champagne/70 my-2 opacity-90 shadow-[0_0_10px_rgba(229,193,205,0.4)]" />

              {/* Subtitle "SALÓN DE BELLEZA" */}
              <h2 className="font-logo-sans text-xs sm:text-sm md:text-base tracking-[0.45em] text-white/95 font-light text-center uppercase mt-2.5 mb-1 pl-[0.45em]">
                SALÓN DE BELLEZA
              </h2>
              
              {/* Small details / Phone numbers like at the bottom of the logo */}
              <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs tracking-[0.18em] text-gray-light/45 font-logo-sans font-light mt-5 sm:mt-7">
                <span>22019090</span>
                <span className="text-gold-champagne/60">•</span>
                <span>22883535</span>
                <span className="text-gold-champagne/60">•</span>
                <span className="text-gold-champagne font-normal">WA 89607575</span>
              </div>
            </div>

            <div className="w-16 h-[1px] bg-gold-champagne/30 my-8 sm:my-10" />
            <p className="text-gray-light/70 text-sm sm:text-base max-w-lg font-light leading-relaxed px-4 mb-10">
              Un santuario de estética y sofisticación diseñado para realzar tu belleza natural con la maestría de expertos y firmas exclusivas de nivel mundial.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 1.0 }}
          >
            <button
              onClick={() => {
                scrollToSection('contacto');
                setShowBookingSuccess(false);
              }}
              className="group relative border border-gold-champagne bg-gold-champagne/10 text-gold-champagne px-8 sm:px-10 py-4 text-xs sm:text-sm tracking-[0.2em] uppercase font-semibold overflow-hidden transition-all duration-700 hover:border-white shadow-lg cursor-pointer"
              id="hero-reserve-btn"
            >
              <span className="absolute inset-0 w-full h-full bg-gold-champagne transform origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-500 ease-[0.16, 1, 0.3, 1] z-0" />
              <span className="relative z-10 group-hover:text-dark-bg transition-colors duration-500 flex items-center justify-center gap-2">
                AGENDAR CITA (ASISTENTE VIRTUAL) <ChevronRight className="w-4 h-4" />
              </span>
            </button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center opacity-40 hover:opacity-100 transition-opacity duration-300">
          <span className="text-[9px] tracking-[0.3em] uppercase text-white font-light mb-2">Deslizar</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-gold-champagne to-transparent animate-pulse" />
        </div>
      </section>

      {/* 2. SERVICIOS SECTION */}
      <section id="servicios" className="py-24 sm:py-32 px-6 relative z-10 bg-dark-bg overflow-hidden">
        {/* Soft Background Golden Glows */}
        <div className="absolute -left-32 top-40 w-[400px] h-[400px] bg-gold-champagne/5 rounded-full filter blur-[100px] pointer-events-none" />
        <div className="absolute -right-32 bottom-40 w-[400px] h-[400px] bg-gold-champagne/5 rounded-full filter blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-20">
            <span className="text-gold-champagne text-xs tracking-[0.3em] uppercase font-light">NUESTROS SERVICIOS</span>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl text-white tracking-[0.15em] uppercase font-light mt-3 mb-6">
              EXPERIENCIA BOUTIQUE
            </h2>
            <div className="w-12 h-[1px] bg-gold-champagne/40 mx-auto" />
          </div>

          {/* Grid de Servicios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
            {SERVICES.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                  className="group bg-warm-card border border-warm-border hover:border-gold-champagne/40 p-8 sm:p-10 transition-all duration-500 relative flex flex-col justify-between hover:shadow-[0_10px_30px_rgba(212,175,55,0.03)]"
                  id={`service-card-${service.id}`}
                >
                  {/* Accent Corner Line */}
                  <div className="absolute top-0 right-0 w-0 h-0 border-t-2 border-r-2 border-gold-champagne opacity-0 group-hover:opacity-100 group-hover:w-4 group-hover:h-4 transition-all duration-500" />
                  
                  <div>
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-none border border-gold-champagne/10 flex items-center justify-center mb-8 group-hover:border-gold-champagne/40 transition-colors duration-500">
                      <IconComponent className="w-5 h-5 text-gold-champagne font-light" strokeWidth={1.2} />
                    </div>
                    
                    {/* Title */}
                    <h3 className="font-serif-luxury text-xl sm:text-2xl text-white uppercase tracking-[0.1em] font-light mb-4 group-hover:text-gold-champagne transition-colors duration-300">
                      {service.name}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-gray-light/60 text-xs sm:text-sm font-light leading-relaxed mb-6">
                      {service.description}
                    </p>
                  </div>

                  {/* Price and CTA */}
                  <div className="pt-6 border-t border-neutral-900 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] tracking-[0.15em] uppercase text-gray-light/40 font-light">Inversión</span>
                      <span className="font-mono text-sm sm:text-base text-gold-champagne font-light">
                        {service.price} <span className="text-[10px] text-gray-light/40 font-sans ml-1">desde</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedService(service);
                        setBookingStep(2);
                        setShowBookingSuccess(false);
                        scrollToSection('contacto');
                      }}
                      className="w-full bg-dark-bg/90 border border-gold-champagne/40 hover:border-gold-champagne text-gold-champagne hover:bg-gold-champagne hover:text-dark-bg text-[10px] uppercase tracking-[0.15em] font-semibold py-2.5 px-3 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                    >
                      <span>Agendar con Asistente Virtual</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Quick CTA to Form */}
          <div className="text-center mt-16">
            <button 
              onClick={() => {
                scrollToSection('contacto');
                setBookingStep(1);
              }}
              className="text-[11px] sm:text-xs tracking-[0.3em] uppercase text-gold-champagne hover:text-white transition-colors duration-300 inline-flex items-center gap-2 group border-b border-gold-champagne/20 pb-1"
              id="service-cta-book"
            >
              PERSONALIZAR RITUAL EN ASISTENTE <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. MARCAS PREMIUM */}
      <section className="py-20 border-y border-warm-border/60 bg-warm-card/85 relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gold-champagne/85 text-[10px] sm:text-xs tracking-[0.35em] uppercase font-light mb-10 sm:mb-12">
            TRABAJAMOS SOLO CON LO MEJOR
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 lg:gap-32 opacity-75">
            {/* Kérastase */}
            <div className="flex flex-col items-center">
              <span className="font-serif-luxury text-2xl sm:text-3xl tracking-[0.3em] text-white font-light">KÉRASTASE</span>
              <span className="text-[8px] tracking-[0.5em] text-gray-light/40 font-extralight uppercase mt-1">PARIS</span>
            </div>

            {/* L'Oréal */}
            <div className="flex flex-col items-center">
              <span className="font-serif-luxury text-2xl sm:text-3xl tracking-[0.2em] text-white font-light">L'ORÉAL</span>
              <span className="text-[8px] tracking-[0.25em] text-gray-light/40 font-extralight uppercase mt-1">PROFESSIONNEL PARIS</span>
            </div>

            {/* Biotop */}
            <div className="flex flex-col items-center">
              <span className="font-serif-luxury text-2xl sm:text-3xl tracking-[0.25em] text-white font-light">BIOTOP</span>
              <span className="text-[8px] tracking-[0.3em] text-gray-light/40 font-extralight uppercase mt-1">PROFESSIONAL</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. GALERÍA EDITORIAL */}
      <section id="galeria" className="py-24 sm:py-32 relative z-10 bg-dark-bg overflow-hidden">
        {/* Luminous backdrop */}
        <div className="absolute left-1/3 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-champagne/3 rounded-full filter blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-20 px-6">
            <span className="text-gold-champagne text-xs tracking-[0.3em] uppercase font-light">GALERÍA DE TRABAJOS</span>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl text-white tracking-[0.15em] uppercase font-light mt-3 mb-6">
              DISEÑO & ARTE CAPILAR
            </h2>
            <div className="w-12 h-[1px] bg-gold-champagne/40 mx-auto mb-4" />
            <p className="text-gray-light/60 text-xs sm:text-sm font-light max-w-md mx-auto leading-relaxed">
              Trabajos de alta costura, coloraciones espectaculares y cortes sofisticados de clientas reales en nuestro salón de Escazú. Selecciona para ampliar.
            </p>
          </div>

          {/* Masonry Grid de 6 fotos de trabajos, sin bordes, con leve zoom al hacer hover */}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 px-4 sm:px-6 space-y-4">
            {GALLERY.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                onClick={() => setActiveLightbox(item)}
                className="break-inside-avoid bg-warm-card border border-warm-border group cursor-pointer overflow-hidden relative hover:shadow-[0_15px_30px_rgba(212,175,55,0.04)] hover:border-gold-champagne/30 transition-all duration-500"
                id={`gallery-item-${item.id}`}
              >
                {/* Image Wrap */}
                <div className="overflow-hidden aspect-[3/4]">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover object-center filter contrast-105 brightness-95 group-hover:scale-105 group-hover:brightness-105 transition-all duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Dark Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                  <span className="text-gold-champagne text-[10px] tracking-[0.2em] uppercase font-light mb-1">
                    {item.service}
                  </span>
                  <h3 className="font-serif-luxury text-lg text-white uppercase tracking-wider font-light">
                    {item.title}
                  </h3>
                  <p className="text-gray-light/50 text-[11px] font-light mt-1 flex items-center gap-1">
                    <span>Especialista:</span> <span className="text-white">{item.stylist}</span>
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. RESERVAS Y CONTACTO */}
      <section id="contacto" className="py-24 sm:py-32 bg-dark-bg relative z-10 border-t border-warm-border/60 overflow-hidden">
        {/* Soft Gold glow */}
        <div className="absolute right-0 bottom-0 w-[500px] h-[500px] bg-gold-champagne/4 rounded-full filter blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 items-start">
            
            {/* Left Side: Contact Information & Hours */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-12">
              <div>
                <span className="text-gold-champagne text-xs tracking-[0.3em] uppercase font-light">CONECTEMOS</span>
                <div className="relative pl-6 pr-1 pt-2 flex items-center mt-3 mb-6">
                  <span className="absolute -top-1.5 left-0 font-logo-doulaise text-4xl text-gold-champagne leading-none select-none pointer-events-none transform -rotate-[10deg]">
                    cf
                  </span>
                  <span className="font-logo-sans text-xl sm:text-2xl tracking-[0.22em] text-white font-light uppercase pl-[0.1em]">
                    PORTADAS
                  </span>
                </div>
                <p className="text-gray-light/60 text-xs sm:text-sm font-light leading-relaxed max-w-md">
                  Estamos ubicados en el corazón de San Rafael de Escazú, listos para brindarte un servicio personalizado inigualable. Agenda tu espacio por medio de nuestro asistente virtual o llámanos directamente.
                </p>
              </div>

              {/* Contact Information List */}
              <div className="space-y-6">
                {/* Teléfonos */}
                <div className="flex items-start gap-4" id="contact-phones">
                  <div className="w-8 h-8 rounded-none border border-gold-champagne/20 flex items-center justify-center shrink-0 mt-1">
                    <Phone className="w-3.5 h-3.5 text-gold-champagne" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-[10px] tracking-[0.2em] uppercase text-gold-champagne/70 font-light mb-1">Línea de Atención</h4>
                    <div className="flex gap-4">
                      <a href="tel:2219090" className="text-sm text-white hover:text-gold-champagne transition-colors font-mono">
                        2219 0909
                      </a>
                      <span className="text-neutral-800">·</span>
                      <a href="tel:22883535" className="text-sm text-white hover:text-gold-champagne transition-colors font-mono">
                        2288 3535
                      </a>
                    </div>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-4" id="contact-whatsapp">
                  <div className="w-8 h-8 rounded-none border border-emerald-500/20 bg-emerald-950/10 flex items-center justify-center shrink-0 mt-1">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-[10px] tracking-[0.2em] uppercase text-emerald-400 font-light mb-1">WhatsApp Directo</h4>
                    <a 
                      href="https://wa.me/50689607575?text=Hola%20CF%20Portadas,%20quisiera%20reservar%20una%20cita." 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-white hover:text-emerald-400 transition-colors font-medium"
                    >
                      <span>8960 7575</span>
                      <ExternalLink className="w-3 h-3 text-emerald-500" />
                    </a>
                  </div>
                </div>

                {/* Dirección */}
                <div className="flex items-start gap-4" id="contact-address">
                  <div className="w-8 h-8 rounded-none border border-gold-champagne/20 flex items-center justify-center shrink-0 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-gold-champagne" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-[10px] tracking-[0.2em] uppercase text-gold-champagne/70 font-light mb-1">Ubicación</h4>
                    <p className="text-xs text-white/80 font-light leading-relaxed max-w-sm">
                      Asama Plaza, Carretera John F. Kennedy, San Rafael de Escazú, San José Province, Costa Rica.
                    </p>
                  </div>
                </div>

                {/* Horario */}
                <div className="flex items-start gap-4" id="contact-hours">
                  <div className="w-8 h-8 rounded-none border border-gold-champagne/20 flex items-center justify-center shrink-0 mt-1">
                    <Clock className="w-3.5 h-3.5 text-gold-champagne" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-[10px] tracking-[0.2em] uppercase text-gold-champagne/70 font-light mb-1">Horario de Atención</h4>
                    <p className="text-xs text-white/80 font-light">
                      Lunes a Sábado: <span className="text-white font-mono">9:00 AM - 7:00 PM</span>
                    </p>
                    <p className="text-xs text-gray-light/40 font-light mt-0.5">
                      Domingo: <span className="text-gold-champagne/50">Cerrado</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Map Embed - Dark Mode Styled with CSS filter */}
              <div className="w-full h-64 border border-warm-border overflow-hidden relative group">
                <iframe 
                  src="https://maps.google.com/maps?q=Asama%20Plaza,%20Escazu,%20Costa%20Rica&t=&z=16&ie=UTF8&iwloc=&output=embed" 
                  className="w-full h-full border-0 grayscale invert contrast-115 opacity-65 group-hover:opacity-85 transition-opacity duration-500" 
                  allowFullScreen 
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  title="Google Maps Asama Plaza"
                />
                <div className="absolute top-3 left-3 bg-warm-card/95 border border-gold-champagne/20 px-3 py-1 text-[9px] tracking-widest text-gold-champagne uppercase">
                  UBICACIÓN PREFERENCIAL
                </div>
              </div>
            </div>

            {/* Right Side: Interactive Booking Assistant (Form) */}
            <div className="lg:col-span-7 bg-warm-card border border-warm-border p-8 sm:p-12 relative" id="booking-assistant-container">
              {/* Gold border accent */}
              <div className="absolute top-0 left-0 w-[2px] h-full bg-gold-champagne" />
              
              <div className="mb-8">
                <span className="text-gold-champagne text-[10px] tracking-[0.3em] uppercase font-light">ASISTENTE VIRTUAL</span>
                <h3 className="font-serif-luxury text-2xl text-white uppercase tracking-wider font-light mt-1">
                  AGENDA TU EXPERIENCIA
                </h3>
                <p className="text-gray-light/40 text-[11px] font-light mt-1">
                  Completa tu solicitud en 4 simples pasos y envíala directamente a nuestro equipo de recepción.
                </p>
              </div>

              {/* Step Indicators */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-900">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center">
                    <div 
                      className={`w-6 h-6 rounded-none text-[10px] flex items-center justify-center font-mono border transition-all duration-300 ${
                        bookingStep === step 
                          ? 'border-gold-champagne bg-gold-champagne text-dark-bg font-bold shadow-md shadow-gold-champagne/10' 
                          : bookingStep > step 
                          ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400' 
                          : 'border-neutral-800 text-neutral-500'
                      }`}
                    >
                      {step}
                    </div>
                    {step < 4 && (
                      <div className={`h-[1px] w-8 sm:w-16 mx-2 ${bookingStep > step ? 'bg-emerald-500/50' : 'bg-neutral-800'}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Confirmation view or Step-by-step form */}
              {showBookingSuccess && latestAppointment ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.97 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="space-y-6 bg-dark-bg/90 border border-emerald-500/40 p-6 shadow-2xl relative"
                >
                  <div className="flex items-start gap-4 border-b border-emerald-500/30 pb-4">
                    <div className="w-10 h-10 border border-emerald-500/50 bg-emerald-950/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 uppercase font-mono tracking-widest font-semibold block">
                        CITA GUARDADA EN LA AGENDA AUTOMÁTICAMENTE
                      </span>
                      <h4 className="font-serif-luxury text-xl text-white uppercase tracking-wider font-light mt-0.5">
                        ¡Agendamiento Confirmado!
                      </h4>
                      <p className="text-[11px] text-gray-light/70 font-light mt-1">
                        Tu reservación ha sido registrada directamente en el sistema de CF Portadas.
                      </p>
                    </div>
                  </div>

                  {/* Appointment Details Ticket */}
                  <div className="bg-warm-card border border-gold-champagne/30 p-5 space-y-3 text-xs font-sans">
                    <div className="flex justify-between items-center pb-2 border-b border-warm-border">
                      <span className="text-[10px] uppercase font-mono text-gold-champagne tracking-wider">Código de Cita:</span>
                      <span className="font-mono text-white font-bold">{latestAppointment.id}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 text-gray-300">
                      <div>
                        <span className="block text-[10px] uppercase text-gray-light/50 font-mono">Cliente</span>
                        <strong className="text-white font-serif-luxury uppercase text-sm block mt-0.5">{latestAppointment.clientName}</strong>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] uppercase text-gray-light/50 font-mono">Teléfono</span>
                        <strong className="text-white font-mono block mt-0.5">{latestAppointment.clientPhone}</strong>
                      </div>

                      <div>
                        <span className="block text-[10px] uppercase text-gray-light/50 font-mono">Servicio</span>
                        <strong className="text-gold-champagne font-serif-luxury uppercase text-sm block mt-0.5">{latestAppointment.serviceName}</strong>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] uppercase text-gray-light/50 font-mono">Especialista</span>
                        <strong className="text-white font-serif-luxury uppercase block mt-0.5">{latestAppointment.stylistName}</strong>
                      </div>

                      <div>
                        <span className="block text-[10px] uppercase text-gray-light/50 font-mono">Fecha</span>
                        <strong className="text-white font-mono block mt-0.5">{latestAppointment.formattedDate || latestAppointment.date}</strong>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] uppercase text-gray-light/50 font-mono">Hora</span>
                        <strong className="text-gold-champagne font-mono font-bold block mt-0.5">{latestAppointment.formattedTime || latestAppointment.time}</strong>
                      </div>
                    </div>

                    {latestAppointment.notes && (
                      <div className="pt-2 border-t border-warm-border/50 text-[11px] text-gray-light/70 italic">
                        Nota: "{latestAppointment.notes}"
                      </div>
                    )}

                    <div className="pt-3 border-t border-warm-border flex items-center justify-between text-[11px]">
                      <span className="text-gray-light/60 font-mono">Estado en la Agenda:</span>
                      <span className="text-amber-300 font-mono uppercase bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 text-[9px] font-bold">
                        Pendiente (Guardada)
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-2">
                    <a
                      href={latestAppointment.waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs uppercase tracking-[0.15em] font-bold py-3.5 px-4 flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-950/50 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Confirmar / Enviar por WhatsApp</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="w-full bg-dark-bg border border-gold-champagne/40 hover:border-gold-champagne text-gold-champagne hover:text-white text-xs uppercase tracking-wider py-3 px-3 transition-colors font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agendar Otra Cita</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (isAdminAuthenticated()) {
                            setIsAdminViewActive(true);
                          } else {
                            setIsAdminLoginOpen(true);
                          }
                        }}
                        className="w-full bg-neutral-900 border border-warm-border hover:border-gray-400 text-gray-300 hover:text-white text-xs uppercase tracking-wider py-3 px-3 transition-colors font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Ver Agenda en Sistema</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleProcessBooking(true); }}>
                  
                  {/* STEP 1: SELECT SERVICE */}
                {bookingStep === 1 && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <label className="block text-xs uppercase tracking-[0.2em] text-white font-light">
                      Paso 1: Selecciona el Servicio
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                      {SERVICES.map((s) => (
                        <div 
                          key={s.id}
                          onClick={() => {
                            setSelectedService(s);
                            setBookingStep(2);
                          }}
                          className={`p-4 border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                            selectedService?.id === s.id 
                              ? 'border-gold-champagne bg-dark-bg text-white shadow-[0_0_15px_rgba(212,175,55,0.05)]' 
                              : 'border-warm-border hover:border-gold-champagne/30 bg-dark-bg/60'
                          }`}
                        >
                          <span className="font-serif-luxury text-sm uppercase tracking-wider text-white">
                            {s.name}
                          </span>
                          <span className="font-mono text-xs text-gold-champagne mt-2">
                            {s.price} <span className="text-[9px] text-gray-light/40 font-sans">desde</span>
                          </span>
                        </div>
                      ))}
                    </div>
                    {selectedService && (
                      <div className="pt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setBookingStep(2)}
                          className="bg-neutral-900 border border-gold-champagne/40 hover:border-gold-champagne text-gold-champagne px-5 py-2.5 text-xs uppercase tracking-wider font-light flex items-center gap-1.5 transition-colors"
                        >
                          Siguiente <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* STEP 2: SELECT STYLIST */}
                {bookingStep === 2 && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <label className="block text-xs uppercase tracking-[0.2em] text-white font-light">
                        Paso 2: Especialista Preferido
                      </label>
                      <button 
                        type="button" 
                        onClick={() => setBookingStep(1)} 
                        className="text-[10px] text-gold-champagne/50 hover:text-gold-champagne uppercase tracking-wider"
                      >
                        Atrás
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {STYLISTS.map((stylist) => (
                        <div 
                          key={stylist.id}
                          onClick={() => {
                            setSelectedStylist(stylist);
                            setBookingStep(3);
                          }}
                          className={`p-4 border transition-all duration-300 cursor-pointer flex items-center justify-between ${
                            selectedStylist?.id === stylist.id 
                              ? 'border-gold-champagne bg-dark-bg text-white shadow-[0_0_15px_rgba(212,175,55,0.05)]' 
                              : 'border-warm-border hover:border-gold-champagne/30 bg-dark-bg/60'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 border border-gold-champagne/20 flex items-center justify-center bg-dark-bg font-serif-luxury text-gold-champagne font-bold">
                              {stylist.avatarLetter}
                            </div>
                            <div>
                              <h4 className="text-sm font-serif-luxury uppercase tracking-wider text-white">
                                {stylist.name}
                              </h4>
                              <p className="text-[10px] text-gray-light/40 font-light uppercase tracking-wider">
                                {stylist.role}
                              </p>
                            </div>
                          </div>
                          
                          <div className={`w-3 h-3 border ${selectedStylist?.id === stylist.id ? 'bg-gold-champagne border-gold-champagne' : 'border-neutral-700'}`} />
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setBookingStep(1)}
                        className="text-xs uppercase tracking-wider text-gray-light/40 hover:text-white"
                      >
                        Paso anterior
                      </button>
                      {selectedStylist && (
                        <button
                          type="button"
                          onClick={() => setBookingStep(3)}
                          className="bg-neutral-900 border border-gold-champagne/40 hover:border-gold-champagne text-gold-champagne px-5 py-2.5 text-xs uppercase tracking-wider font-light flex items-center gap-1.5 transition-colors"
                        >
                          Siguiente <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: DATE & TIME */}
                {bookingStep === 3 && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <label className="block text-xs uppercase tracking-[0.2em] text-white font-light">
                        Paso 3: Fecha y Hora de Preferencia
                      </label>
                      <button 
                        type="button" 
                        onClick={() => setBookingStep(2)} 
                        className="text-[10px] text-gold-champagne/50 hover:text-gold-champagne uppercase tracking-wider"
                      >
                        Atrás
                      </button>
                    </div>

                    {/* Date Selector */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase tracking-wider text-gray-light/50 font-mono block">Selecciona un día:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {availableDates.map((date) => (
                          <div
                            key={date.rawValue}
                            onClick={() => setBookingDate(date.rawValue)}
                            className={`p-3 border text-center transition-all duration-300 cursor-pointer ${
                              bookingDate === date.rawValue 
                                ? 'border-gold-champagne bg-dark-bg text-white shadow-[0_0_15px_rgba(212,175,55,0.05)]' 
                                : 'border-warm-border hover:border-gold-champagne/30 bg-dark-bg/60'
                            }`}
                          >
                            <span className="block text-[10px] text-gold-champagne tracking-wider font-mono uppercase">{date.dayName.slice(0,3)}</span>
                            <span className="block text-lg font-serif-luxury font-light">{date.dayNumber}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Time Selector */}
                    {bookingDate && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="space-y-2"
                      >
                        <span className="text-[10px] uppercase tracking-wider text-gray-light/50 font-mono block">Bloques de Horarios disponibles:</span>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {timeSlots.map((time) => (
                            <div
                              key={time}
                              onClick={() => setBookingTime(time)}
                              className={`p-2.5 border text-center text-xs transition-all duration-300 cursor-pointer font-mono ${
                                bookingTime === time 
                                  ? 'border-gold-champagne bg-dark-bg text-white font-semibold shadow-[0_0_15px_rgba(212,175,55,0.05)]' 
                                  : 'border-warm-border hover:border-gold-champagne/30 bg-dark-bg/60 text-gray-light/60'
                              }`}
                            >
                              {time}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    <div className="pt-4 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => setBookingStep(2)}
                        className="text-xs uppercase tracking-wider text-gray-light/40 hover:text-white"
                      >
                        Atrás
                      </button>
                      {bookingDate && bookingTime && (
                        <button
                          type="button"
                          onClick={() => setBookingStep(4)}
                          className="bg-neutral-900 border border-gold-champagne/40 hover:border-gold-champagne text-gold-champagne px-5 py-2.5 text-xs uppercase tracking-wider font-light flex items-center gap-1.5 transition-colors"
                        >
                          Siguiente <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: CLIENT DATA & COMPILING */}
                {bookingStep === 4 && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="space-y-5"
                  >
                    <div className="flex justify-between items-center">
                      <label className="block text-xs uppercase tracking-[0.2em] text-white font-light">
                        Paso 4: Información de Contacto
                      </label>
                      <button 
                        type="button" 
                        onClick={() => setBookingStep(3)} 
                        className="text-[10px] text-gold-champagne/50 hover:text-gold-champagne uppercase tracking-wider"
                      >
                        Atrás
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Name input */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gold-champagne/70 font-light mb-1">Nombre Completo</label>
                        <input 
                          type="text" 
                          required
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="p.ej. Mariana Rodríguez"
                          className="w-full bg-dark-bg border border-warm-border focus:border-gold-champagne text-white text-sm px-4 py-3 outline-none transition-colors"
                        />
                      </div>

                      {/* Phone input */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gold-champagne/70 font-light mb-1">Número de Celular</label>
                        <input 
                          type="tel" 
                          required
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="p.ej. 8888 8888"
                          className="w-full bg-dark-bg border border-warm-border focus:border-gold-champagne text-white text-sm px-4 py-3 outline-none transition-colors font-mono"
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gold-champagne/70 font-light mb-1">Nota Especial (Opcional)</label>
                        <textarea 
                          rows={2}
                          value={customNote}
                          onChange={(e) => setCustomNote(e.target.value)}
                          placeholder="Si necesitas algún detalle o aclaración, escríbela aquí..."
                          className="w-full bg-dark-bg border border-warm-border focus:border-gold-champagne text-white text-sm px-4 py-3 outline-none transition-colors resize-none"
                        />
                      </div>
                    </div>

                    {/* Booking summary recap */}
                    <div className="bg-dark-bg border border-warm-border/80 p-4 space-y-2 text-xs">
                      <p className="text-[10px] uppercase text-gold-champagne tracking-widest font-semibold">Resumen de Reserva:</p>
                      <div className="grid grid-cols-2 gap-y-1 text-gray-light/80">
                        <span className="font-light">Servicio:</span>
                        <span className="text-white text-right uppercase font-serif-luxury font-medium">{selectedService?.name}</span>
                        
                        <span className="font-light">Estilista:</span>
                        <span className="text-white text-right uppercase font-serif-luxury">{selectedStylist?.name}</span>
                        
                        <span className="font-light">Horario:</span>
                        <span className="text-gold-champagne text-right font-mono font-medium">
                          {availableDates.find(d => d.rawValue === bookingDate)?.formatted} - {bookingTime}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setBookingStep(3)}
                        className="text-xs uppercase tracking-wider text-gray-light/40 hover:text-white text-center sm:text-left py-2"
                      >
                        ← Modificar hora
                      </button>

                      <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleProcessBooking(false)}
                          className="bg-gold-champagne text-dark-bg hover:bg-white text-[11px] uppercase tracking-[0.1em] font-bold px-5 py-3.5 flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
                        >
                          <CheckCircle className="w-4 h-4 text-dark-bg" />
                          <span>Agendar Cita con Asistente</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleProcessBooking(true)}
                          className="bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] uppercase tracking-[0.1em] font-medium px-4 py-3 flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-500/50"
                          id="booking-submit-whatsapp"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Agendar y Enviar por WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
                
              </form>
              )}
            </div>
            
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="bg-dark-bg border-t border-neutral-900 py-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-left">
          
          {/* Left - Brand identity */}
          <div className="flex flex-col items-center md:items-start">
            <div className="relative pl-6 pr-1 pt-2 flex items-center mb-1">
              <span className="absolute -top-1 left-0 font-logo-doulaise text-4xl text-gold-champagne leading-none select-none pointer-events-none transform -rotate-[10deg]">
                cf
              </span>
              <span className="font-logo-sans text-lg sm:text-xl tracking-[0.22em] text-white font-light uppercase pl-[0.1em]">
                PORTADAS
              </span>
            </div>
            <span className="text-[8px] sm:text-[9px] tracking-[0.4em] text-gold-champagne font-light uppercase mt-1 ml-6">
              SALÓN DE BELLEZA
            </span>
            <p className="text-gray-light/30 text-[11px] font-light max-w-xs mt-4 leading-relaxed ml-6 md:ml-0 md:text-left text-center">
              Asama Plaza, Carr. John F. Kennedy, San Rafael de Escazú, San José, Costa Rica.
            </p>

            {/* SECRET LOGIN BUTTON BELOW PORTADAS LOGO */}
            <button
              onClick={() => {
                if (isAdminAuthenticated()) {
                  setIsAdminViewActive(true);
                } else {
                  setIsAdminLoginOpen(true);
                }
              }}
              className="mt-4 text-[10px] uppercase font-mono tracking-widest text-gold-champagne/60 hover:text-gold-champagne transition-colors flex items-center gap-1.5 border border-gold-champagne/20 hover:border-gold-champagne/60 px-3 py-1.5 bg-dark-bg/90 shadow-md group ml-6 md:ml-0 cursor-pointer"
              title="Acceso Privado para Administración de Citas"
              id="secret-admin-login-button"
            >
              <Lock className="w-3 h-3 text-gold-champagne/70 group-hover:text-gold-champagne" />
              <span>Acceso Privado Administrador</span>
            </button>
          </div>

          {/* Center - Simple social presence */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] tracking-[0.2em] text-white/40 uppercase font-light mb-4">SÍGUENOS EN REDES</span>
            <div className="flex gap-6">
              <a 
                href="https://instagram.com/cfportadas" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 border border-neutral-900 hover:border-gold-champagne flex items-center justify-center text-gray-light hover:text-gold-champagne transition-all duration-300"
                id="social-instagram"
              >
                <Instagram className="w-4 h-4" strokeWidth={1.5} />
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 border border-neutral-900 hover:border-gold-champagne flex items-center justify-center text-gray-light hover:text-gold-champagne transition-all duration-300"
                id="social-facebook"
              >
                <Facebook className="w-4 h-4" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Right - Copyright & Studio note */}
          <div className="text-center md:text-right flex flex-col items-center md:items-end">
            <span className="text-[10px] tracking-[0.1em] text-gray-light/40 font-light">
              &copy; {new Date().getFullYear()} CF PORTADAS. Todos los derechos reservados.
            </span>
            <span className="text-[8px] tracking-[0.2em] text-white/20 font-mono mt-2 uppercase">
              PREMIUM LUXURY BRANDING COSTA RICA
            </span>
          </div>

        </div>
      </footer>

      {/* LIGHTBOX / IMAGE MODAL VIEWER */}
      <AnimatePresence>
        {activeLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setActiveLightbox(null)}
          >
            <button 
              onClick={() => setActiveLightbox(null)}
              className="absolute top-6 right-6 text-white hover:text-gold-champagne transition-colors p-2"
              id="close-lightbox"
            >
              <X className="w-6 h-6" />
            </button>
            
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="max-w-4xl w-full max-h-[85vh] bg-warm-card border border-warm-border overflow-hidden flex flex-col md:flex-row relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Photo */}
              <div className="md:w-3/5 overflow-hidden flex items-center bg-black">
                <img 
                  src={activeLightbox.image} 
                  alt={activeLightbox.title} 
                  className="w-full h-auto object-cover filter contrast-105 brightness-100"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Sidebar Description */}
              <div className="md:w-2/5 p-8 flex flex-col justify-between bg-warm-card">
                <div>
                  <span className="text-gold-champagne text-[10px] tracking-[0.2em] uppercase font-semibold">
                    {activeLightbox.service}
                  </span>
                  <h3 className="font-serif-luxury text-2xl text-white uppercase tracking-wider font-light mt-2">
                    {activeLightbox.title}
                  </h3>
                  <div className="w-8 h-[1px] bg-gold-champagne/30 my-6" />
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border border-gold-champagne/20 flex items-center justify-center bg-dark-bg text-[10px] font-serif-luxury text-gold-champagne font-bold">
                        {activeLightbox.stylist.slice(0, 1)}
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-gray-light/40 font-light">Especialista</p>
                        <p className="text-xs text-white uppercase font-serif-luxury">{activeLightbox.stylist}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-gray-light/40 font-light">Ubicación de Trabajo</p>
                      <p className="text-xs text-white/80 font-light">CF Portadas Escazú · Costa Rica</p>
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <button 
                    onClick={() => {
                      // Pre-fill booking assistant with this service & stylist
                      const matchedService = SERVICES.find(s => s.name === activeLightbox.service);
                      const matchedStylist = STYLISTS.find(st => st.name === activeLightbox.stylist);
                      if (matchedService) setSelectedService(matchedService);
                      if (matchedStylist) setSelectedStylist(matchedStylist);
                      
                      setActiveLightbox(null);
                      scrollToSection('contacto');
                      setBookingStep(3); // Skip directly to date/time step since service & stylist are selected!
                    }}
                    className="w-full bg-gold-champagne text-dark-bg hover:bg-white text-xs uppercase tracking-[0.2em] font-bold py-3.5 text-center transition-colors duration-300"
                    id="lightbox-book-now"
                  >
                    AGENDAR TRABAJO SIMILAR
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DISCREET FLOATING WHATSAPP BUTTON (ALWAYS VISIBLE ON MOBILE) */}
      <a 
        href="https://wa.me/50689607575?text=Hola%20CF%20Portadas,%20quisiera%20reservar%20una%20cita."
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center border border-emerald-500 md:bottom-8 md:right-8 group"
        aria-label="Contactar por WhatsApp"
        id="floating-whatsapp-btn"
      >
        <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-25 group-hover:opacity-0" />
        <MessageSquare className="w-6 h-6 text-white" strokeWidth={2.0} />
      </a>

      {/* SECRET ADMIN LOGIN MODAL */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => {
          setIsAdminLoginOpen(false);
          setIsAdminViewActive(true);
        }}
      />

    </div>
  );
}
