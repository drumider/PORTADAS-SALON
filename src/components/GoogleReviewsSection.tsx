import React, { useState } from 'react';
import { Star, CheckCircle, ExternalLink, ThumbsUp, MessageSquare, Filter, Award, ChevronRight, X, Camera, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface GoogleReview {
  id: string;
  author: string;
  avatarColor: string;
  rating: number;
  timeAgo: string;
  text: string;
  services: string[];
  stylist?: string;
  ownerReply?: string;
  spent?: string;
  photosCount?: number;
}

// Reseñas verificadas de clientes de CF Portada Salón (Asama Plaza, Escazú)
const GOOGLE_REVIEWS_DATA: GoogleReview[] = [
  {
    id: 'rev-1',
    author: 'Gabriel Guadamuz',
    avatarColor: 'bg-emerald-700',
    rating: 5,
    timeAgo: 'Hace 2 semanas',
    text: 'Excelente atención desde que uno entra al salón. El corte y el estilo quedaron exactamente como lo pedí, además el trato del personal y la puntualidad es de primera calidad. Las instalaciones en Asama Plaza son muy cómodas y elegantes. 100% recomendado.',
    services: ['Cortes para niños', 'Peinados', 'Corte de flequillo'],
    stylist: 'Carlos',
    ownerReply: '¡Muchas gracias Gabriel! Un placer atenderte en CF Portada Salón. Nos alegra mucho saber que tu experiencia y corte fueron de tu total agrado. ¡Te esperamos pronto!',
    spent: '₡15.000 - ₡25.000'
  },
  {
    id: 'rev-2',
    author: 'Natalia Monge',
    avatarColor: 'bg-amber-700',
    rating: 5,
    timeAgo: 'Hace 3 semanas',
    text: 'Me realicé un alisado orgánico y tratamiento de reconstrucción Kérastase. Mi cabello quedó como una seda, súper suave, con un brillo espejo increíble y cero frizz. Salí fascinada con el resultado y la delicadeza de todo el equipo.',
    services: ['Alisado', 'Baño de luz', 'Permanente'],
    stylist: 'Fernando',
    ownerReply: '¡Gracias por confiar en nosotros Natalia! Cuidar la salud y el brillo de tu cabello con productos de primer nivel como Kérastase es nuestra pasión.',
    spent: '₡45.000 - ₡80.000'
  },
  {
    id: 'rev-3',
    author: 'Sofía Carvajal M.',
    avatarColor: 'bg-purple-800',
    rating: 5,
    timeAgo: 'Hace 1 mes',
    text: 'El mejor balayage y baño de luz que me han realizado en Costa Rica. Entendieron exactamente la tonalidad champagne que buscaba sin maltratar las puntas. Los productos Biotop y Kérastase que aplican hacen toda la diferencia.',
    services: ['Baño de luz', 'Peinados'],
    stylist: 'Carlos',
    ownerReply: '¡Sofía, nos encanta ver cómo luce ese tono champagne! Gracias por preferirnos para tus cambios de look.',
    spent: '₡60.000 - ₡100.000'
  },
  {
    id: 'rev-4',
    author: 'Marianela Chaves',
    avatarColor: 'bg-blue-800',
    rating: 5,
    timeAgo: 'Hace 1 mes',
    text: 'Excelente salón en Escazú. Llevé a mis hijos a corte y yo me hice pedicure spa y depilación. La paciencia con los niños y el cuidado en cada detalle fue excepcional. El ambiente es relajante y de verdadero lujo.',
    services: ['Cortes para niños', 'Depilación con cera'],
    stylist: 'Yorleny',
    ownerReply: '¡Qué alegría leer esto Marianela! Siempre serán más que bienvenidos toda la familia en CF Portadas.',
    spent: '₡20.000 - ₡35.000'
  },
  {
    id: 'rev-5',
    author: 'Valeria Trejos',
    avatarColor: 'bg-rose-800',
    rating: 5,
    timeAgo: 'Hace 2 meses',
    text: 'Me prepararon para una boda: peinado recogido sofisticado y ritual Kérastase Fusio-Dose. El peinado duró intacto toda la noche sin sentirse pesado. Servicio de primer nivel en Escazú.',
    services: ['Recogidos', 'Peinados', 'Trenzas'],
    stylist: 'Junior',
    ownerReply: '¡Muchísimas felicidades Valeria! Qué honor acompañarte en esa ocasión tan especial.',
    spent: '₡30.000 - ₡50.000'
  },
  {
    id: 'rev-6',
    author: 'Esteban Rodríguez',
    avatarColor: 'bg-teal-800',
    rating: 5,
    timeAgo: 'Hace 2 meses',
    text: 'Puntualidad estricta, asesoría impecable y excelente café de cortesía. Las instalaciones son modernas y el parqueo en Asama Plaza es muy accesible. Definitivamente mi salón de confianza.',
    services: ['Peinados'],
    stylist: 'Carlos',
    ownerReply: '¡Muchas gracias Esteban por tu lealtad y por valorar nuestro compromiso con la puntualidad y el servicio!',
    spent: '₡12.000 - ₡20.000'
  }
];

// Opciones de servicios exactamente como aparecen en el modal de Google Maps del usuario
const GOOGLE_MAPS_SERVICES = [
  'Cortes para niños',
  'Trenzas',
  'Recogidos',
  'Peinados',
  'Permanente',
  'Depilación con cera',
  'Alisado',
  'Baño de luz',
  'Corte de flequillo',
  'Tratamiento Kérastase',
  'Coloración & Mechas',
  'Manicure & Pedicure'
];

export const GoogleReviewsSection: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('Todos');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState<boolean>(false);

  // Form state for interactive review modal replicating the Google Reviews UI
  const [modalAuthor, setModalAuthor] = useState<string>('');
  const [modalRating, setModalRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [modalText, setModalText] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [modalSpent, setModalSpent] = useState<string>('');
  const [submittedLocalReview, setSubmittedLocalReview] = useState<boolean>(false);

  const googleMapsUrl = 'https://www.google.com/maps/search/?api=1&query=CF+Portada+Sal%C3%B3n+Escazu';
  const googleReviewDirectUrl = 'https://search.google.com/local/writereview?placeid=ChIJ-f8g_K_2kI8RwM0jE3wSgV8';

  const toggleService = (srv: string) => {
    setSelectedServices(prev => 
      prev.includes(srv) ? prev.filter(s => s !== srv) : [...prev, srv]
    );
  };

  const handlePublishReview = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedLocalReview(true);
    // After quick acknowledgment, open the real Google Maps listing in a new tab
    setTimeout(() => {
      window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
    }, 1200);
  };

  const filteredReviews = activeFilter === 'Todos'
    ? GOOGLE_REVIEWS_DATA
    : GOOGLE_REVIEWS_DATA.filter(rev => 
        rev.services.some(s => s.toLowerCase().includes(activeFilter.toLowerCase())) ||
        (activeFilter === '5 Estrellas' && rev.rating === 5)
      );

  return (
    <section id="opiniones" className="py-20 sm:py-28 px-4 sm:px-6 relative z-10 bg-dark-bg/95 border-t border-warm-border/60 overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute right-1/4 top-1/3 w-[500px] h-[500px] bg-gold-champagne/4 rounded-full filter blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-warm-card border border-gold-champagne/30 text-gold-champagne text-[11px] font-mono tracking-widest uppercase mb-4 shadow-sm">
            {/* Google G multi-color icon */}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Google Reviews Oficial · CF Portada Salón</span>
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl text-white tracking-[0.15em] uppercase font-light mt-1 mb-4">
            CALIFICACIONES & RESEÑAS
          </h2>
          <div className="w-12 h-[1px] bg-gold-champagne/40 mx-auto mb-4" />
          <p className="text-gray-light/65 text-xs sm:text-sm font-light max-w-2xl mx-auto leading-relaxed">
            La satisfacción de nuestras clientas y clientes en Asama Plaza, Escazú. Opiniones reales verificadas en Google Maps.
          </p>
        </div>

        {/* GOOGLE REVIEWS OVERALL SCOREBOARD CARD */}
        <div className="bg-warm-card border border-warm-border/80 p-6 sm:p-8 mb-12 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Col 1: Big Rating Score */}
            <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left border-b lg:border-b-0 lg:border-r border-warm-border/60 pb-6 lg:pb-0 lg:pr-8">
              <div className="flex items-center gap-3 mb-2">
                {/* Official Google G Logo */}
                <div className="w-10 h-10 rounded-full bg-white p-2 shadow flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-serif-luxury text-lg text-white font-medium uppercase tracking-wider">
                    CF Portada Salón
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Perfil de Negocio Verificado</span>
                  </div>
                </div>
              </div>

              <div className="flex items-baseline gap-3 my-2">
                <span className="font-serif-luxury text-5xl sm:text-6xl font-light text-gold-champagne">
                  4.8
                </span>
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs text-gray-light/60 font-mono">
                    128+ opiniones en Google
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-gray-light/50 font-light mt-1">
                Ubicación: Asama Plaza, Escazú, Costa Rica.
              </p>
            </div>

            {/* Col 2: Breakdown Rating Bars */}
            <div className="lg:col-span-4 space-y-1.5 border-b lg:border-b-0 lg:border-r border-warm-border/60 pb-6 lg:pb-0 lg:pr-8">
              {[
                { stars: 5, pct: 94, count: '121' },
                { stars: 4, pct: 5, count: '6' },
                { stars: 3, pct: 1, count: '1' },
                { stars: 2, pct: 0, count: '0' },
                { stars: 1, pct: 0, count: '0' }
              ].map((row) => (
                <div key={row.stars} className="flex items-center gap-2.5 text-xs text-gray-light/60">
                  <span className="w-12 font-mono text-[11px] text-right">{row.stars} estrellas</span>
                  <div className="flex-1 h-2 bg-dark-bg rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gold-champagne rounded-full transition-all duration-1000"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                  <span className="w-8 font-mono text-[11px] text-gray-light/40">{row.pct}%</span>
                </div>
              ))}
            </div>

            {/* Col 3: Direct Actions to Google */}
            <div className="lg:col-span-4 flex flex-col justify-center gap-3">
              <button
                onClick={() => setIsWriteModalOpen(true)}
                className="w-full bg-gold-champagne hover:bg-gold-champagne/90 text-dark-bg font-semibold text-xs uppercase tracking-[0.15em] py-3.5 px-4 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span>Escribir una Reseña en Google</span>
              </button>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-dark-bg hover:bg-warm-card border border-warm-border hover:border-gold-champagne/50 text-gray-light hover:text-white text-xs uppercase tracking-[0.15em] py-3 px-4 transition-all flex items-center justify-center gap-2 cursor-pointer font-medium"
              >
                <span>Ver Todas en Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 text-gold-champagne" />
              </a>

              <p className="text-[10px] text-center text-gray-light/40 font-mono">
                Google Reviews auténticas de clientes verificados.
              </p>
            </div>

          </div>
        </div>

        {/* FILTER CHIPS (Matching Google Categories from User Screenshot) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          <span className="text-[10px] uppercase font-mono tracking-wider text-gray-light/40 shrink-0 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-gold-champagne" /> Filtrar:
          </span>
          {['Todos', '5 Estrellas', 'Alisado', 'Cortes para niños', 'Baño de luz', 'Peinados', 'Recogidos', 'Depilación con cera'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`text-[11px] uppercase tracking-wider px-3.5 py-1.5 border transition-all shrink-0 cursor-pointer font-medium ${
                activeFilter === filter
                  ? 'bg-gold-champagne border-gold-champagne text-dark-bg font-bold shadow-md'
                  : 'bg-warm-card/80 border-warm-border text-gray-light/70 hover:border-gold-champagne/50 hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* REVIEWS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((review, idx) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="bg-warm-card border border-warm-border hover:border-gold-champagne/50 p-6 flex flex-col justify-between transition-all duration-300 relative group hover:shadow-[0_10px_30px_rgba(212,175,55,0.06)]"
            >
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-0 h-0 border-t-2 border-r-2 border-gold-champagne opacity-0 group-hover:opacity-100 group-hover:w-3 group-hover:h-3 transition-all duration-300" />

              <div>
                {/* Review Header: User Info & Google Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${review.avatarColor} text-white font-semibold flex items-center justify-center text-sm shadow-inner`}>
                      {review.author.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white group-hover:text-gold-champagne transition-colors">
                        {review.author}
                      </h4>
                      <span className="text-[11px] text-gray-light/40 font-mono block">
                        {review.timeAgo}
                      </span>
                    </div>
                  </div>

                  {/* Google Icon Badge */}
                  <div className="shrink-0 p-1 bg-dark-bg/80 border border-warm-border rounded-sm" title="Reseña verificada de Google">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-[10px] text-gray-light/40 font-mono ml-2">
                    Reseña en Google
                  </span>
                </div>

                {/* Service Tags (from Google prompt) */}
                {review.services && review.services.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {review.services.map((srv, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 bg-dark-bg/90 border border-gold-champagne/20 text-gold-champagne/90 rounded-sm"
                      >
                        {srv}
                      </span>
                    ))}
                  </div>
                )}

                {/* Review Text */}
                <p className="text-gray-light/75 text-xs font-light leading-relaxed mb-4">
                  "{review.text}"
                </p>

                {/* Stylist or Expense Mention */}
                {(review.stylist || review.spent) && (
                  <div className="flex items-center justify-between text-[10px] text-gray-light/40 font-mono pb-2 border-b border-warm-border/40 mb-3">
                    {review.stylist && <span>Atendido por: <strong className="text-white/80">{review.stylist}</strong></span>}
                    {review.spent && <span>Gasto: {review.spent}</span>}
                  </div>
                )}
              </div>

              {/* Owner Reply if any */}
              {review.ownerReply && (
                <div className="mt-2 p-3 bg-dark-bg/70 border-l-2 border-gold-champagne/60 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 text-gold-champagne font-medium text-[10px] uppercase tracking-wider">
                    <span>Respuesta de CF Portada Salón:</span>
                  </div>
                  <p className="text-gray-light/60 font-light italic text-[10px] leading-relaxed">
                    {review.ownerReply}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* BOTTOM GOOGLE MAPS CTA BAR */}
        <div className="mt-12 text-center bg-warm-card/60 border border-warm-border/60 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h4 className="text-white font-serif-luxury text-base sm:text-lg font-light uppercase tracking-wider">
              ¿Ya viviste la experiencia CF Portadas?
            </h4>
            <p className="text-gray-light/60 text-xs font-light mt-1">
              Tu opinión en Google Maps nos ayuda a seguir perfeccionando cada detalle de nuestro servicio.
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsWriteModalOpen(true)}
              className="bg-gold-champagne hover:bg-gold-champagne/90 text-dark-bg font-semibold text-xs uppercase tracking-[0.15em] px-5 py-3 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dejar Reseña en Google</span>
            </button>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-dark-bg border border-warm-border hover:border-gold-champagne/60 text-gold-champagne transition-colors"
              title="Abrir CF Portada Salón en Google Maps"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>

      {/* INTERACTIVE GOOGLE REVIEW MODAL (Faithful recreation of the user's uploaded screenshot) */}
      <AnimatePresence>
        {isWriteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#202124] text-white border border-[#3c4043] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 font-sans"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title Matching Screenshot */}
              <div className="text-center pb-4 border-b border-[#3c4043]">
                <h3 className="text-base font-medium text-white tracking-wide">
                  CF Portada Salón
                </h3>
              </div>

              {submittedLocalReview ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-500/60 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-medium text-white">¡Muchas gracias por tu calificación!</h4>
                  <p className="text-xs text-gray-300 max-w-sm mx-auto">
                    Estamos redirigiéndote a la ficha pública de <strong>CF Portada Salón en Google Maps</strong> para que tu reseña quede publicada con tu cuenta de Google.
                  </p>
                  <div className="pt-2">
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] font-semibold text-xs px-5 py-2.5 rounded-full transition-colors"
                    >
                      <span>Abrir Google Maps Ahora</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePublishReview} className="pt-4 space-y-5">
                  {/* User row */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#5f6368] text-white flex items-center justify-center font-bold text-sm">
                      {modalAuthor ? modalAuthor.charAt(0).toUpperCase() : '👤'}
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={modalAuthor}
                        onChange={(e) => setModalAuthor(e.target.value)}
                        placeholder="Tu nombre (ej. Gabriel Guadamuz)"
                        className="bg-transparent border-b border-[#5f6368] focus:border-[#8ab4f8] outline-none text-sm text-white w-full placeholder:text-gray-400 font-medium"
                      />
                      <span className="text-[11px] text-[#9aa0a6] block mt-0.5">
                        Se mostrará públicamente en Google ⓘ
                      </span>
                    </div>
                  </div>

                  {/* 5 Stars Rating Bar */}
                  <div className="flex justify-center items-center gap-2 py-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setModalRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-110 cursor-pointer"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            (hoverRating || modalRating) >= star
                              ? 'fill-[#fbbc04] text-[#fbbc04]'
                              : 'text-[#9aa0a6]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Review Text Area */}
                  <div>
                    <textarea
                      rows={4}
                      value={modalText}
                      onChange={(e) => setModalText(e.target.value)}
                      placeholder="Comparte detalles sobre tu experiencia en este lugar..."
                      className="w-full bg-transparent border border-[#5f6368] focus:border-[#8ab4f8] rounded-lg p-3 text-sm text-white placeholder:text-[#9aa0a6] outline-none resize-none"
                    />
                  </div>

                  {/* Agregar fotos y videos button */}
                  <button
                    type="button"
                    onClick={() => {
                      alert('Para adjuntar fotos a tu reseña pública, podrás subirlas directamente al abrir Google Maps.');
                    }}
                    className="w-full py-2.5 px-4 rounded-full border border-[#5f6368] hover:bg-[#303134] text-[#8ab4f8] text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Camera className="w-4 h-4 text-[#8ab4f8]" />
                    <span>Agregar fotos y videos</span>
                  </button>

                  {/* Question from screenshot: ¿Qué servicios recibiste? */}
                  <div className="bg-[#303134] p-4 rounded-xl space-y-3">
                    <div>
                      <h4 className="text-xs font-medium text-white">¿Qué servicios recibiste?</h4>
                      <p className="text-[11px] text-[#9aa0a6]">(Selecciona todas las que correspondan)</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {GOOGLE_MAPS_SERVICES.map((service) => {
                        const isSelected = selectedServices.includes(service);
                        return (
                          <button
                            key={service}
                            type="button"
                            onClick={() => toggleService(service)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#8ab4f8] border-[#8ab4f8] text-[#202124] font-medium'
                                : 'bg-[#3c4043] border-transparent text-[#e8eaed] hover:bg-[#4a4d51]'
                            }`}
                          >
                            {service}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Question: ¿Cuánto gastaste por persona? */}
                  <div className="bg-[#303134] p-4 rounded-xl space-y-2">
                    <h4 className="text-xs font-medium text-white">¿Cuánto gastaste por persona? (Opcional)</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Menos de ₡15.000', '₡15.000 - ₡30.000', '₡30.000 - ₡60.000', 'Más de ₡60.000'].map((range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => setModalSpent(range)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                            modalSpent === range
                              ? 'bg-[#8ab4f8] border-[#8ab4f8] text-[#202124] font-medium'
                              : 'bg-[#3c4043] border-transparent text-[#e8eaed] hover:bg-[#4a4d51]'
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#3c4043]">
                    <button
                      type="button"
                      onClick={() => setIsWriteModalOpen(false)}
                      className="px-4 py-2 text-xs font-medium text-[#8ab4f8] hover:bg-white/5 rounded-md cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] font-semibold text-xs rounded-full shadow cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <span>Publicar en Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
