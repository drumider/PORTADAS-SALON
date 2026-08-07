import React, { useState } from 'react';
import { MessageSquare, ExternalLink, Sparkles, Filter, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { PRODUCTS, PRODUCT_BRANDS, PRODUCT_CATEGORIES, Product } from '../data/products';

export const ProductsSection: React.FC = () => {
  const [selectedBrand, setSelectedBrand] = useState<string>('TODOS');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [visibleCount, setVisibleCount] = useState<number>(6);

  const handleBrandChange = (brandId: string) => {
    setSelectedBrand(brandId);
    setVisibleCount(6);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setVisibleCount(6);
  };

  const filteredProducts = PRODUCTS.filter((p) => {
    const matchesBrand = selectedBrand === 'TODOS' || p.brand === selectedBrand;
    const matchesCategory = selectedCategory === 'TODOS' || p.category === selectedCategory;
    return matchesBrand && matchesCategory;
  });

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  const handleWhatsAppOrder = (product: Product) => {
    const message = `¡Hola CF Portadas! Me interesa reservar/comprar el siguiente producto:

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
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] sm:text-xs uppercase tracking-[0.2em] font-semibold mb-4 shadow-sm">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>EXCLUSIVO · RESERVAS VÍA WHATSAPP</span>
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl text-white tracking-[0.15em] uppercase font-light mt-2 mb-4">
            PRODUCTOS DE SALÓN AUTORIZADOS
          </h2>
          <div className="w-16 h-[1px] bg-gold-champagne/50 mx-auto mb-4" />
          <p className="text-gray-light/70 text-xs sm:text-sm font-light max-w-xl mx-auto leading-relaxed">
            Líneas profesionales autorizadas de fórmulas concentradas. Filtra por marca o categoría y reserva directamente por WhatsApp.
          </p>
        </div>

        {/* Filter Controls Container */}
        <div className="bg-warm-card/80 border border-warm-border/80 p-6 sm:p-8 mb-12 shadow-2xl backdrop-blur-md space-y-6">
          
          {/* 1. Brand Filters */}
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-gold-champagne font-bold mb-3">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtrar por Marca</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {PRODUCT_BRANDS.map((brand) => {
                const isSelected = selectedBrand === brand.id;
                return (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => handleBrandChange(brand.id)}
                    className={`px-4 py-2 text-xs uppercase tracking-[0.12em] font-mono transition-all duration-300 border cursor-pointer ${
                      isSelected
                        ? 'border-gold-champagne bg-gold-champagne text-dark-bg font-bold shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                        : 'border-warm-border/80 bg-black/40 text-gray-300 hover:border-gold-champagne/50 hover:text-white'
                    }`}
                  >
                    {brand.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-[1px] bg-warm-border/50" />

          {/* 2. Category Filters */}
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-gold-champagne font-bold mb-3">
              <Layers className="w-3.5 h-3.5" />
              <span>Categorías de Tratamiento</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {PRODUCT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`px-3.5 py-1.5 text-[11px] uppercase tracking-[0.1em] font-medium transition-all duration-300 border rounded-full cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300 font-semibold border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'border-warm-border/60 bg-black/30 text-gray-400 hover:border-emerald-500/50 hover:text-gray-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Brand & Category Banner Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-warm-border/60 pb-5 mb-10 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-9 bg-gold-champagne" />
            <div>
              <h3 className="font-serif-luxury text-2xl sm:text-3xl text-white uppercase tracking-[0.2em] font-light">
                {selectedBrand === 'TODOS' ? 'Catálogo General' : selectedBrand}
              </h3>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gold-champagne/80 font-medium mt-0.5">
                {selectedCategory === 'TODOS'
                  ? 'Todas las categorías'
                  : PRODUCT_CATEGORIES.find((c) => c.id === selectedCategory)?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-gray-300 bg-black/60 border border-warm-border px-3.5 py-1.5 uppercase tracking-wider">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Producto disponible' : 'Productos disponibles'}
            </span>
          </div>
        </div>

        {/* Empty state */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16 bg-warm-card border border-warm-border p-8 max-w-xl mx-auto">
            <p className="text-gray-300 text-sm mb-4">No se encontraron productos para esta combinación de filtros.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedBrand('TODOS');
                setSelectedCategory('TODOS');
                setVisibleCount(6);
              }}
              className="text-xs uppercase tracking-widest text-gold-champagne border border-gold-champagne/50 px-4 py-2 hover:bg-gold-champagne hover:text-dark-bg transition-all font-mono"
            >
              Restablecer Filtros
            </button>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {displayedProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
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
                    const filename = product.image.split('/').pop();
                    if (filename && !target.dataset.failed) {
                      target.dataset.failed = 'true';
                      target.src = `/assets/images/${filename}`;
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

        {/* Ver más / Mostrar menos Button */}
        {filteredProducts.length > visibleCount && (
          <div className="mt-14 text-center flex flex-col items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="px-8 py-4 bg-warm-card border-2 border-gold-champagne/70 text-gold-champagne hover:bg-gold-champagne hover:text-dark-bg text-xs uppercase tracking-[0.2em] font-bold transition-all duration-300 shadow-2xl flex items-center gap-3 cursor-pointer group"
            >
              <span>Ver más productos ({filteredProducts.length - visibleCount} restantes)</span>
              <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
            </button>
            <p className="text-[11px] text-gray-400 font-mono">
              Mostrando {displayedProducts.length} de {filteredProducts.length} productos
            </p>
          </div>
        )}

        {visibleCount >= filteredProducts.length && filteredProducts.length > 6 && (
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount(6)}
              className="text-xs text-gray-400 hover:text-gold-champagne transition-colors uppercase tracking-[0.2em] font-mono inline-flex items-center gap-2 cursor-pointer border-b border-gray-600 hover:border-gold-champagne pb-0.5"
            >
              <span>Mostrar menos</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* WhatsApp Consultation Footer Banner */}
        <div className="mt-16 bg-warm-card border border-gold-champagne/30 p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-gold-champagne text-xs uppercase tracking-widest font-semibold justify-center sm:justify-start">
              <Sparkles className="w-4 h-4" />
              <span>¿Tienes dudas sobre los productos de nuestro salón?</span>
            </div>
            <p className="text-xs text-gray-light/70 font-light leading-relaxed">
              Escríbenos directamente a WhatsApp para verificar disponibilidad o solicitar asesoría sobre la línea ideal para tu tipo de cabello (Moroccanoil, BIOTOP Professional, etc.).
            </p>
          </div>

          <a
            href={`https://wa.me/50689607575?text=${encodeURIComponent('¡Hola CF Portadas! Quisiera información sobre la disponibilidad de productos en el salón.')}`}
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
