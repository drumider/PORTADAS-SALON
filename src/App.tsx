import React, { useState, useEffect, useMemo } from 'react';
import { getImageUrl } from './utils/imageUtils';
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
  ChevronDown,
  ChevronUp,
  Calendar,
  CheckCircle,
  User,
  ExternalLink,
  Lock,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  Tag,
  AlertCircle,
  Menu,
  ShoppingBag,
  CalendarDays,
  Check,
  Share2,
  Copy,
  ChevronLeft,
  Sparkle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { saveAppointment, isAdminAuthenticated, subscribeToAppointments } from './utils/storage';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ProductsSection } from './components/ProductsSection';
import { ClientBookingWidget } from './components/ClientBookingWidget';
import { Service, Stylist, Appointment } from './types';
import { SERVICES, STYLISTS, TIME_SLOTS } from './constants';
import { SERVICE_CATEGORIES } from './data/servicesData';
import { searchAndRankServices } from './utils/serviceSearch';

interface GalleryItem {
  id: string;
  title: string;
  service: string;
  stylist: string;
  image: string;
}

// Generated image assets (referenced strictly from real public paths)
const GALLERY: GalleryItem[] = [
  {
    id: 'g1',
    title: 'Corte Shag Moderno',
    service: 'Corte y Estilo',
    stylist: 'Carlos',
    image: getImageUrl('corte_estilo.jpg')
  },
  {
    id: 'g2',
    title: 'Balayage Caramelo',
    service: 'Coloración',
    stylist: 'Carlos',
    image: getImageUrl('color.jpg')
  },
  {
    id: 'g3',
    title: 'Ritual de Reconstrucción Kérastase',
    service: 'Tratamiento Kérastase',
    stylist: 'Junior',
    image: getImageUrl('tratamiento_kerastase.jpg')
  },
  {
    id: 'g4',
    title: 'Manicure Minimal Champagne',
    service: 'Manicure y Pedicure',
    stylist: 'Yorleny',
    image: getImageUrl('manicura.jpg')
  },
  {
    id: 'g5',
    title: 'Maquillaje Social Elegante',
    service: 'Maquillaje',
    stylist: 'Junior',
    image: getImageUrl('maquillaje.jpg')
  },
  {
    id: 'g6',
    title: 'Alisado Orgánico Espejo',
    service: 'Alisado',
    stylist: 'Fernando',
    image: getImageUrl('alisado.jpg')
  }
];

export default function App() {
  // Navigation & Interactive states
  const [activeTab, setActiveTab] = useState<'inicio' | 'servicios' | 'productos' | 'galeria' | 'contacto'>('inicio');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [activeLightbox, setActiveLightbox] = useState<GalleryItem | null>(null);

  // Selected service passed from services catalog to ClientBookingWidget
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);

  // Real-time listener for booked appointments to block occupied slots
  useEffect(() => {
    const unsubscribe = subscribeToAppointments((apps) => {
      setExistingAppointments(apps);
    });
    return () => unsubscribe();
  }, []);

  // Admin Panel & Secret Login States
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isAdminViewActive, setIsAdminViewActive] = useState<boolean>(false);

  // Search, Category Filters & Expand Bar for Services
  const [isServicesExpanded, setIsServicesExpanded] = useState<boolean>(false);
  const [servicesSearch, setServicesSearch] = useState<string>('');
  const [servicesCategory, setServicesCategory] = useState<string>('Todos');

  const [bookingSearch, setBookingSearch] = useState<string>('');
  const [bookingCategory, setBookingCategory] = useState<string>('Todos');

  // Filtered Services for Main Page with smart rank
  const filteredMainServices = useMemo(() => {
    return searchAndRankServices(SERVICES, servicesSearch, servicesCategory);
  }, [servicesSearch, servicesCategory]);

  // Filtered Services for Booking Widget with smart rank
  const filteredBookingServices = useMemo(() => {
    return searchAndRankServices(SERVICES, bookingSearch, bookingCategory);
  }, [bookingSearch, bookingCategory]);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['inicio', 'servicios', 'productos', 'galeria', 'contacto'];
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
    <div className="bg-dark-bg text-gray-light min-h-screen selection:bg-gold-champagne selection:text-dark-bg relative overflow-x-hidden font-sans antialiased pb-20 md:pb-0">
      
      {/* GLOBAL BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(201,169,106,0.05),rgba(255,255,255,0))]" />
      
      {/* HEADER / NAVIGATION */}
      <header className="fixed top-0 left-0 w-full z-40 bg-dark-bg/85 backdrop-blur-md border-b border-warm-border/50 py-4 sm:py-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <div 
            onClick={() => {
              scrollToSection('inicio');
              setIsMobileMenuOpen(false);
            }} 
            className="cursor-pointer flex flex-col items-start group"
            id="header-logo"
          >
            <div className="relative pl-6 pr-1 pt-2 flex items-center">
              <span className="absolute -top-1.5 left-0 font-logo-doulaise text-3xl sm:text-4xl text-gold-champagne group-hover:text-white transition-colors leading-none select-none pointer-events-none transform -rotate-[10deg]">
                cf
              </span>
              <span className="font-logo-sans text-sm sm:text-lg tracking-[0.2em] text-white font-light uppercase group-hover:text-gold-champagne transition-colors pl-[0.1em]">
                PORTADAS
              </span>
            </div>
            <span className="text-[7px] sm:text-[8px] tracking-[0.35em] text-gold-champagne/80 font-light uppercase mt-0.5 ml-6">
              SALÓN DE BELLEZA
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            {['inicio', 'servicios', 'productos', 'galeria', 'contacto'].map((section) => (
              <button
                key={section}
                onClick={() => scrollToSection(section)}
                className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 font-light hover:text-gold-champagne cursor-pointer ${
                  activeTab === section ? 'text-gold-champagne font-normal border-b border-gold-champagne pb-1' : 'text-gray-light/60'
                }`}
                id={`nav-${section}`}
              >
                {section === 'galeria' ? 'galería' : section}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => {
                scrollToSection('contacto');
                setIsMobileMenuOpen(false);
              }}
              className="border border-gold-champagne bg-gold-champagne/10 hover:bg-gold-champagne hover:text-dark-bg text-gold-champagne px-3.5 sm:px-5 py-2 text-[10px] sm:text-xs uppercase tracking-[0.18em] font-medium transition-all duration-300 cursor-pointer shadow-sm flex items-center gap-1.5"
              id="cta-reservas-header"
            >
              <Sparkles className="w-3 h-3 text-gold-champagne" />
              <span className="hidden sm:inline">AGENDAR CON ASISTENTE</span>
              <span className="sm:hidden font-bold">AGENDAR</span>
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gold-champagne hover:text-white border border-warm-border bg-warm-card flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Abrir menú"
              id="mobile-menu-toggle-btn"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown / Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden bg-warm-card border-b border-gold-champagne/30 overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-5 flex flex-col space-y-4">
                {[
                  { id: 'inicio', label: 'Inicio' },
                  { id: 'servicios', label: 'Menú de Servicios (175)' },
                  { id: 'productos', label: 'Líneas & Marcas' },
                  { id: 'galeria', label: 'Galería de Trabajos' },
                  { id: 'contacto', label: '✨ Agendar Cita con Asistente' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      scrollToSection(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`text-left text-xs uppercase tracking-[0.2em] py-2 border-b border-warm-border/50 transition-colors flex items-center justify-between ${
                      item.id === 'contacto' 
                        ? 'text-gold-champagne font-bold' 
                        : activeTab === item.id 
                          ? 'text-gold-champagne font-medium' 
                          : 'text-gray-light/80 hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  </button>
                ))}

                <div className="pt-2 flex items-center justify-between text-[11px] text-gray-light/60">
                  <a href="tel:2219090" className="hover:text-gold-champagne flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gold-champagne" /> 2219-0909
                  </a>
                  <a 
                    href="https://wa.me/50689607575?text=Hola%20CF%20Portadas,%20quisiera%20consultar%20por%20una%20cita."
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="text-emerald-400 font-medium flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> WA 8960-7575
                  </a>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (isAdminAuthenticated()) {
                        setIsAdminViewActive(true);
                      } else {
                        setIsAdminLoginOpen(true);
                      }
                    }}
                    className="w-full text-center py-2.5 bg-dark-bg/80 border border-gold-champagne/30 text-gold-champagne/80 hover:text-gold-champagne text-[10px] uppercase font-mono tracking-widest flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3 h-3 text-gold-champagne/70" />
                    <span>Acceso Administrador de Citas</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 1. HERO SECTION */}
      <section 
        id="inicio" 
        className="relative h-screen flex flex-col justify-center items-center text-center px-4 overflow-hidden bg-dark-bg"
      >
        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={getImageUrl('hero.png')} 
            alt="Interior de CF Portadas Salón de Belleza" 
            className="w-full h-full object-cover object-center filter contrast-105 brightness-[0.45] sepia-[10%]"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.failed) {
                target.dataset.failed = 'true';
                target.src = '/assets/images/hero.png';
              }
            }}
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

      {/* 2. SERVICIOS SECTION - EXPANDABLE BAR CATALOG */}
      <section id="servicios" className="py-20 sm:py-28 px-6 relative z-10 bg-dark-bg overflow-hidden">
        {/* Soft Background Golden Glows */}
        <div className="absolute -left-32 top-40 w-[400px] h-[400px] bg-gold-champagne/5 rounded-full filter blur-[100px] pointer-events-none" />
        <div className="absolute -right-32 bottom-40 w-[400px] h-[400px] bg-gold-champagne/5 rounded-full filter blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-gold-champagne text-xs tracking-[0.3em] uppercase font-light">MÚLTIPLES TRATAMIENTOS DE LUJO</span>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl text-white tracking-[0.15em] uppercase font-light mt-3 mb-4">
              NUESTROS SERVICIOS
            </h2>
            <div className="w-12 h-[1px] bg-gold-champagne/40 mx-auto mb-4" />
            <p className="text-gray-light/60 text-xs sm:text-sm font-light max-w-xl mx-auto">
              Contamos con un menú completo de 175 servicios especializados. Despliega la barra interactiva para explorar todas las categorías.
            </p>
          </div>

          {/* MAIN EXPANDABLE BAR BANNER */}
          <div className="bg-warm-card border border-warm-border hover:border-gold-champagne/40 transition-all duration-300 p-4 sm:p-6 mb-8 shadow-2xl relative">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Left Info */}
              <div 
                onClick={() => setIsServicesExpanded(!isServicesExpanded)}
                className="flex items-center gap-4 cursor-pointer w-full md:w-auto"
              >
                <div className="w-12 h-12 border border-gold-champagne/30 bg-gold-champagne/10 flex items-center justify-center shrink-0 text-gold-champagne">
                  <Scissors className="w-6 h-6" strokeWidth={1.2} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-[0.2em] font-serif-luxury text-white font-medium">
                      Catálogo Interactivo de Servicios
                    </span>
                    <span className="bg-gold-champagne/20 text-gold-champagne border border-gold-champagne/40 text-[10px] font-mono px-2 py-0.5 uppercase tracking-wider">
                      175 Servicios
                    </span>
                  </div>
                  <p className="text-gray-light/50 text-xs font-light mt-0.5">
                    Alisados, Tintes, Cortes, Tratamientos Kérastase, Manicure, Paquetes y más.
                  </p>
                </div>
              </div>

              {/* Quick Search Bar directly inside Expandable Bar */}
              <div className="relative w-full md:w-72">
                <Search className="w-3.5 h-3.5 text-gold-champagne/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={servicesSearch}
                  onChange={(e) => {
                    setServicesSearch(e.target.value);
                    if (!isServicesExpanded) setIsServicesExpanded(true);
                  }}
                  onFocus={() => {
                    if (!isServicesExpanded) setIsServicesExpanded(true);
                  }}
                  placeholder="Buscar servicio o código (ej. 218)..."
                  className="w-full bg-dark-bg/90 border border-warm-border focus:border-gold-champagne text-white text-xs pl-9 pr-8 py-2.5 outline-none font-light placeholder:text-gray-light/40"
                />
                {servicesSearch && (
                  <button
                    onClick={() => setServicesSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-light/40 hover:text-white text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Expand Toggle Button */}
              <button
                type="button"
                onClick={() => setIsServicesExpanded(!isServicesExpanded)}
                className="w-full md:w-auto bg-gold-champagne hover:bg-gold-champagne/90 text-dark-bg font-semibold text-xs uppercase tracking-[0.15em] px-6 py-3 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-lg"
              >
                <span>{isServicesExpanded || servicesSearch ? 'Plegar Catálogo' : 'Desplegar Catálogo (175)'}</span>
                {isServicesExpanded || servicesSearch ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Quick Category Pills when Collapsed */}
            {!isServicesExpanded && !servicesSearch && (
              <div className="mt-4 pt-4 border-t border-warm-border/50 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] uppercase tracking-wider text-gray-light/40 shrink-0 font-mono">
                  Categorías:
                </span>
                {SERVICE_CATEGORIES.slice(1).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setServicesCategory(cat);
                      setIsServicesExpanded(true);
                    }}
                    className="text-[10px] uppercase tracking-wider px-3 py-1 bg-dark-bg/60 border border-warm-border hover:border-gold-champagne/50 text-gray-light/70 hover:text-gold-champagne transition-all shrink-0 cursor-pointer"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* EXPANDABLE SECTION CONTENT */}
          <AnimatePresence>
            {(isServicesExpanded || servicesSearch !== '' || servicesCategory !== 'Todos') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                {/* Category Filter Pills Bar */}
                <div className="mb-8 space-y-4">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center px-1">
                    {SERVICE_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setServicesCategory(cat)}
                        className={`text-[11px] uppercase tracking-wider font-medium px-4 py-2 border transition-all shrink-0 cursor-pointer ${
                          servicesCategory === cat
                            ? 'border-gold-champagne bg-gold-champagne text-dark-bg font-bold shadow-md'
                            : 'border-warm-border text-gray-light/70 hover:border-gold-champagne/40 hover:text-white bg-warm-card/80'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Filter Status & Counter */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-[11px] uppercase tracking-[0.15em] text-gold-champagne/80 font-mono">
                    <span>
                      {servicesCategory !== 'Todos' ? `Categoría: ${servicesCategory}` : 'Todas las categorías'}
                    </span>
                    <span>
                      Mostrando {filteredMainServices.length} de {SERVICES.length} servicios
                    </span>
                  </div>
                </div>

                {/* Grid de Servicios */}
                {filteredMainServices.length === 0 ? (
                  <div className="text-center py-12 bg-warm-card/40 border border-warm-border mb-8">
                    <Search className="w-8 h-8 text-gold-champagne/40 mx-auto mb-3" />
                    <p className="text-sm text-gray-light/60 font-light">
                      No se encontraron servicios con "{servicesSearch}".
                    </p>
                    <button
                      onClick={() => { setServicesSearch(''); setServicesCategory('Todos'); }}
                      className="mt-4 text-xs text-gold-champagne uppercase tracking-widest underline cursor-pointer"
                    >
                      Restablecer filtros y ver los 175 servicios
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-8">
                    {filteredMainServices.map((service, index) => {
                      const IconComponent = service.icon || Scissors;
                      return (
                        <div
                          key={service.id}
                          className="group bg-warm-card border border-warm-border hover:border-gold-champagne/50 p-5 sm:p-6 transition-all duration-300 relative flex flex-col justify-between hover:shadow-[0_10px_30px_rgba(212,175,55,0.05)]"
                          id={`service-card-${service.id}`}
                        >
                          {/* Accent Corner Line */}
                          <div className="absolute top-0 right-0 w-0 h-0 border-t-2 border-r-2 border-gold-champagne opacity-0 group-hover:opacity-100 group-hover:w-3 group-hover:h-3 transition-all duration-300" />
                          
                          <div>
                            {/* Top Badges (Code & Category) */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="w-8 h-8 border border-gold-champagne/20 bg-dark-bg/60 flex items-center justify-center text-gold-champagne">
                                <IconComponent className="w-3.5 h-3.5" strokeWidth={1.2} />
                              </div>
                              {service.code && (
                                <span className="font-mono text-[10px] text-gold-champagne bg-gold-champagne/10 border border-gold-champagne/30 px-2 py-0.5 tracking-widest uppercase">
                                  CÓD. #{service.code}
                                </span>
                              )}
                            </div>
                            
                            {/* Title */}
                            <h3 className="font-serif-luxury text-base sm:text-lg text-white uppercase tracking-[0.08em] font-light mb-1.5 group-hover:text-gold-champagne transition-colors duration-300">
                              {service.name}
                            </h3>
                            
                            {/* Description */}
                            <p className="text-gray-light/60 text-xs font-light leading-relaxed mb-3 line-clamp-2">
                              {service.description || `Tratamiento exclusivo de ${service.category || 'Salón CF Portadas'}.`}
                            </p>

                            {/* Service Options Pills if configured */}
                            {service.options && service.options.length > 0 && (
                              <div className="mb-3 flex flex-wrap gap-1">
                                {service.options.map(opt => (
                                  <span
                                    key={opt.id}
                                    className="text-[9px] font-mono px-1.5 py-0.5 bg-dark-bg/80 border border-gold-champagne/30 text-gold-champagne/90 rounded"
                                  >
                                    {opt.name}{opt.price ? ` (${opt.price})` : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Meta info & CTA */}
                          <div className="pt-3 border-t border-neutral-900/80 space-y-2.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-light/40 flex items-center gap-1 font-mono text-[11px]">
                                <Clock className="w-3.5 h-3.5 text-gold-champagne/70" />
                                {service.durationText || `${service.durationMinutes} min`}
                              </span>
                              <span className="font-mono text-sm text-gold-champagne font-medium">
                                {service.price}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedService(service);
                                scrollToSection('contacto');
                              }}
                              className="w-full bg-dark-bg/90 border border-gold-champagne/40 hover:border-gold-champagne text-gold-champagne hover:bg-gold-champagne hover:text-dark-bg text-[10px] uppercase tracking-[0.15em] font-semibold py-2 px-3 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>Agendar Cita</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Bottom Close / Collapse Bar */}
                <div className="text-center pt-4 border-t border-warm-border/40">
                  <button
                    type="button"
                    onClick={() => {
                      setIsServicesExpanded(false);
                      setServicesSearch('');
                      setServicesCategory('Todos');
                    }}
                    className="bg-warm-card hover:bg-gold-champagne hover:text-dark-bg border border-warm-border hover:border-gold-champagne text-gold-champagne text-xs uppercase tracking-[0.2em] font-medium px-8 py-3 transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Plegar Catálogo de Servicios</span>
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick CTA to Form */}
          <div className="text-center mt-12">
            <button 
              onClick={() => scrollToSection('contacto')}
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

      {/* 4. PRODUCTOS DE SALÓN POR MARCA */}
      <ProductsSection />

      {/* 5. GALERÍA EDITORIAL */}
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
                    onError={(e) => {
                      const target = e.currentTarget;
                      const filename = item.image.split('/').pop();
                      if (filename && !target.dataset.failed) {
                        target.dataset.failed = 'true';
                        target.src = `/assets/images/${filename}`;
                      }
                    }}
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
      <section id="contacto" className="py-12 sm:py-24 bg-dark-bg relative z-10 border-t border-warm-border/60 overflow-hidden">
        {/* Soft Gold glow */}
        <div className="absolute right-0 bottom-0 w-[500px] h-[500px] bg-gold-champagne/4 rounded-full filter blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
            
            {/* Left Side / Mobile-First: Interactive Client Booking Wizard */}
            <div className="lg:col-span-7 order-1 lg:order-2 w-full" id="booking-assistant-container">
              <ClientBookingWidget
                existingAppointments={existingAppointments}
                externalSelectedService={selectedService}
                onSaveAppointment={async (appData) => {
                  const saved = saveAppointment(appData);
                  return { success: true, id: saved.id };
                }}
              />
            </div>

            {/* Right Side / Mobile-Second: Salon Contact Information & Map */}
            <div className="lg:col-span-5 order-2 lg:order-1 flex flex-col justify-between space-y-6 bg-warm-card/60 border border-warm-border/80 p-5 sm:p-7 rounded-sm">
              <div>
                <span className="text-gold-champagne text-[11px] tracking-[0.3em] uppercase font-light">CONECTEMOS</span>
                <div className="relative pl-6 pr-1 pt-1 flex items-center mt-2 mb-3">
                  <span className="absolute -top-1.5 left-0 font-logo-doulaise text-3xl text-gold-champagne leading-none select-none pointer-events-none transform -rotate-[10deg]">
                    cf
                  </span>
                  <span className="font-logo-sans text-lg sm:text-xl tracking-[0.22em] text-white font-light uppercase pl-[0.1em]">
                    PORTADAS
                  </span>
                </div>
                <p className="text-gray-light/60 text-xs font-light leading-relaxed">
                  Estamos ubicados en el corazón de San Rafael de Escazú, listos para brindarte un servicio personalizado inigualable.
                </p>
              </div>

              {/* Quick Mobile Call Actions */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:2219090"
                  className="flex items-center justify-center gap-1.5 p-2.5 bg-dark-bg/90 border border-warm-border hover:border-gold-champagne/60 text-white hover:text-gold-champagne text-xs font-mono rounded-sm transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-gold-champagne shrink-0" />
                  <span>2219 0909</span>
                </a>
                <a
                  href="tel:22883535"
                  className="flex items-center justify-center gap-1.5 p-2.5 bg-dark-bg/90 border border-warm-border hover:border-gold-champagne/60 text-white hover:text-gold-champagne text-xs font-mono rounded-sm transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-gold-champagne shrink-0" />
                  <span>2288 3535</span>
                </a>
                <a
                  href="https://wa.me/50689607575?text=Hola%20CF%20Portadas,%20quisiera%20consultar%20por%20una%20cita."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="col-span-2 flex items-center justify-center gap-2 p-2.5 bg-emerald-950/40 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-white text-xs font-medium rounded-sm transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>WhatsApp: 8960 7575</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>

              {/* Contact Information List */}
              <div className="space-y-4 border-t border-warm-border/60 pt-4">
                {/* Dirección */}
                <div className="flex items-start gap-3" id="contact-address">
                  <div className="w-7 h-7 rounded-none border border-gold-champagne/20 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-gold-champagne" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-[10px] tracking-[0.2em] uppercase text-gold-champagne/70 font-light mb-0.5">Ubicación</h4>
                    <p className="text-xs text-white/80 font-light leading-relaxed">
                      Asama Plaza, Carretera John F. Kennedy, San Rafael de Escazú, Costa Rica.
                    </p>
                  </div>
                </div>

                {/* Horario */}
                <div className="flex items-start gap-3" id="contact-hours">
                  <div className="w-7 h-7 rounded-none border border-gold-champagne/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-gold-champagne" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-[10px] tracking-[0.2em] uppercase text-gold-champagne/70 font-light mb-0.5">Horario de Atención</h4>
                    <p className="text-xs text-white/80 font-light">
                      Lunes a Sábado: <span className="text-white font-mono">9:00 AM - 7:00 PM</span>
                    </p>
                    <p className="text-xs text-gray-light/40 font-light mt-0.5">
                      Domingo: <span className="text-gold-champagne/50">Cerrado</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Map Embed */}
              <div className="w-full h-44 border border-warm-border overflow-hidden relative group rounded-sm">
                <iframe 
                  src="https://maps.google.com/maps?q=Asama%20Plaza,%20Escazu,%20Costa%20Rica&t=&z=16&ie=UTF8&iwloc=&output=embed" 
                  className="w-full h-full border-0 grayscale invert contrast-115 opacity-65 group-hover:opacity-85 transition-opacity duration-500" 
                  allowFullScreen 
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  title="Google Maps Asama Plaza"
                />
                <div className="absolute top-2.5 left-2.5 bg-warm-card/95 border border-gold-champagne/20 px-2.5 py-1 text-[9px] tracking-widest text-gold-champagne uppercase font-mono">
                  ASAMA PLAZA · ESCAZÚ
                </div>
              </div>
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
                      const matchedService = SERVICES.find(s => s.name === activeLightbox.service);
                      if (matchedService) setSelectedService(matchedService);
                      
                      setActiveLightbox(null);
                      scrollToSection('contacto');
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

      {/* DISCREET FLOATING WHATSAPP BUTTON (DESKTOP) */}
      <a 
        href="https://wa.me/50689607575?text=Hola%20CF%20Portadas,%20quisiera%20reservar%20una%20cita."
        target="_blank" 
        rel="noopener noreferrer"
        className="hidden md:flex fixed bottom-8 right-8 z-40 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 items-center justify-center border border-emerald-500 group"
        aria-label="Contactar por WhatsApp"
        id="floating-whatsapp-btn"
      >
        <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-25 group-hover:opacity-0" />
        <MessageSquare className="w-6 h-6 text-white" strokeWidth={2.0} />
      </a>

      {/* MOBILE STICKY BOTTOM ACTION BAR */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-bg/95 backdrop-blur-lg border-t border-gold-champagne/30 px-3 py-2 shadow-[0_-5px_20px_rgba(0,0,0,0.6)]"
        aria-label="Navegación Móvil"
      >
        <div className="grid grid-cols-4 gap-1 items-center max-w-md mx-auto">
          {/* 1. Services */}
          <button
            onClick={() => scrollToSection('servicios')}
            className={`flex flex-col items-center justify-center py-1 rounded transition-colors ${
              activeTab === 'servicios' ? 'text-gold-champagne' : 'text-gray-light/60 hover:text-white'
            }`}
          >
            <Scissors className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] uppercase tracking-wider font-mono">Servicios</span>
          </button>

          {/* 2. Primary Agendar Button */}
          <button
            onClick={() => {
              scrollToSection('contacto');
            }}
            className="flex flex-col items-center justify-center py-1.5 px-1 bg-gold-champagne text-dark-bg rounded font-bold shadow-md shadow-gold-champagne/20 active:scale-95 transition-transform"
          >
            <Sparkles className="w-4 h-4 mb-0.5 text-dark-bg" />
            <span className="text-[9px] uppercase tracking-wider font-bold">Agendar</span>
          </button>

          {/* 3. WhatsApp Direct */}
          <a
            href="https://wa.me/50689607575?text=Hola%20CF%20Portadas,%20quisiera%20consultar%20por%20una%20cita."
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center py-1 rounded text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <MessageSquare className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] uppercase tracking-wider font-mono">WhatsApp</span>
          </a>

          {/* 4. Ubicación / Map */}
          <button
            onClick={() => scrollToSection('contacto')}
            className={`flex flex-col items-center justify-center py-1 rounded transition-colors ${
              activeTab === 'contacto' ? 'text-gold-champagne' : 'text-gray-light/60 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] uppercase tracking-wider font-mono">Escazú</span>
          </button>
        </div>
      </nav>

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
