import React from 'react';
import { MessageSquare, ExternalLink, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { PRODUCTS, Product } from '../data/products';

export const ProductsSection: React.FC = () => {
  const handleWhatsAppOrder = (product: Product) => {
    const message = `¡Hola CF Portadas! Me interesa reservar/comprar el siguiente producto BIOTOP:

📦 Producto: ${product.name}
🏷️ Marca: ${product.brand}
📏 Presentación: ${product.volume}
💰 Precio: ${product.price}

Por favor me confirman disponibilidad para retiro en el salón o envío. ¡Muchas gracias!`;

    const encodedText = encodeURIComponent(message);
    const waUrl = `https://wa.me/50689607575?text=${encodedText}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="productos" className="py-24 sm:py-32 bg-dark-bg relative z-10 border-t border-warm-border/60 overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-champagne/4 rounded-full filter blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] sm:text-xs uppercase tracking-[0.2em] font-semibold mb-4 shadow-sm">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>EXCLUSIVO · RESERVAS VÍA WHATSAPP</span>
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl text-white tracking-[0.15em] uppercase font-light mt-2 mb-4">
            PRODUCTOS BIOTOP PROFESSIONAL
          </h2>
          <div className="w-16 h-[1px] bg-gold-champagne/50 mx-auto mb-4" />
          <p className="text-gray-light/70 text-xs sm:text-sm font-light max-w-xl mx-auto leading-relaxed">
            Línea capilar profesional de fórmulas concentradas. Reserva tu tratamiento directamente por WhatsApp para retiro inmediato en salón o entrega.
          </p>
        </div>

        {/* Brand Banner */}
        <div className="flex items-center justify-between border-b border-warm-border/60 pb-5 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-9 bg-gold-champagne" />
            <div>
              <h3 className="font-serif-luxury text-2xl sm:text-3xl text-white uppercase tracking-[0.2em] font-light">
                BIOTOP Professional
              </h3>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gold-champagne/80 font-medium mt-0.5">
                Línea de Salón Autorizada
              </p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 uppercase tracking-widest inline-block font-bold">
              DISPONIBILIDAD INMEDIATA
            </span>
          </div>
        </div>

        {/* Products Grid for BIOTOP 101 Sprays */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {PRODUCTS.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-warm-card border border-gold-champagne/30 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-2xl relative group hover:border-gold-champagne/60"
              id={`product-card-${product.id}`}
            >
              {/* Image Container */}
              <div className="relative aspect-square overflow-hidden bg-black/70 flex items-center justify-center p-6">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter contrast-105"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.tried) {
                      target.dataset.tried = 'true';
                      if (product.image.startsWith('/assets/')) {
                        target.src = product.image.replace('/assets/', '/src/assets/');
                      } else if (product.image.startsWith('/src/assets/')) {
                        target.src = product.image.replace('/src/assets/', '/assets/');
                      }
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-warm-card via-transparent to-transparent opacity-80" />

                {/* Tag Badge */}
                {product.tag && (
                  <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-md border border-gold-champagne/60 px-3 py-1 text-[10px] uppercase tracking-wider text-gold-champagne font-bold">
                    {product.tag}
                  </div>
                )}

                {/* Volume Tag */}
                <div className="absolute bottom-4 left-4 text-[11px] font-mono bg-black/85 px-3 py-1 text-gray-200 border border-white/10">
                  {product.volume}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="text-[11px] uppercase tracking-[0.25em] text-gold-champagne font-bold">
                    {product.brand}
                  </div>
                  <h4 className="font-serif-luxury text-xl sm:text-2xl text-white font-medium leading-tight group-hover:text-gold-champagne transition-colors">
                    {product.name}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed pt-1">
                    {product.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-warm-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 block font-medium">Precio Oficial</span>
                    <span className="font-mono text-2xl font-bold text-white tracking-tight">
                      {product.price}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleWhatsAppOrder(product)}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white text-xs uppercase tracking-[0.12em] font-bold px-4 py-3 flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer border border-emerald-400/30"
                    id={`order-product-${product.id}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Reservar por WA</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* WhatsApp Consultation Footer Banner */}
        <div className="mt-16 bg-warm-card border border-gold-champagne/30 p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-gold-champagne text-xs uppercase tracking-widest font-semibold justify-center sm:justify-start">
              <Sparkles className="w-4 h-4" />
              <span>¿Tienes dudas sobre los productos de acabado BIOTOP Professional?</span>
            </div>
            <p className="text-xs text-gray-light/70 font-light leading-relaxed">
              Escríbenos directamente a WhatsApp para verificar disponibilidad o solicitar asesoría sobre cuál de nuestras lacas, polvos o ceras es ideal para tu tipo de cabello.
            </p>
          </div>

          <a
            href={`https://wa.me/50689607575?text=${encodeURIComponent('¡Hola CF Portadas! Quisiera información y reservar el Spray 101 de BIOTOP Professional.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs uppercase tracking-[0.15em] font-bold px-6 py-3.5 flex items-center gap-2 transition-all shadow-lg shrink-0 cursor-pointer border border-emerald-400/40"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Consultar por WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>

      </div>
    </section>
  );
};
