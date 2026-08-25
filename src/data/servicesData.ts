import { Service } from '../types';
import { Scissors, Paintbrush, Sparkles, Hand, Heart, Wind, Zap, Feather, Sun, Smile, Award } from 'lucide-react';

export const SERVICE_CATEGORIES = [
  'Todos',
  'Alisados y Keratinas',
  'Coloración y Tintes',
  'Cortes y Peinados',
  'Tratamientos Capilares',
  'Manicure y Pedicure',
  'Depilación y Rostro',
  'Maquillaje y Masajes',
  'Paquetes y Promociones'
] as const;

export const ALL_SERVICES: Service[] = [
  // 1-4: Alisados
  { id: '218', code: '218', name: 'Alisado Corto', price: '₡40,000', priceNumber: 40000, durationText: '2h', durationMinutes: 120, category: 'Alisados y Keratinas', icon: Wind, description: 'Alisado profesional para cabello corto.' },
  { id: '220', code: '220', name: 'Alisado Largo', price: '₡51,000', priceNumber: 51000, durationText: '3h', durationMinutes: 180, category: 'Alisados y Keratinas', icon: Wind, description: 'Alisado intensivo para cabello largo.' },
  { id: '219', code: '219', name: 'Alisado Mediano', price: '₡45,000', priceNumber: 45000, durationText: '2h 30min', durationMinutes: 150, category: 'Alisados y Keratinas', icon: Wind, description: 'Alisado orgánico para largo mediano.' },
  { id: '221', code: '221', name: 'Alisado Muy Largo', price: '₡80,000', priceNumber: 80000, durationText: '3h 30min', durationMinutes: 210, category: 'Alisados y Keratinas', icon: Wind, description: 'Alisado extra nutrición para cabello muy largo.' },

  // 5: Ampolla
  { id: '300', code: '300', name: 'Ampolla Loreal', price: '₡12,000', priceNumber: 12000, durationText: '15min', durationMinutes: 15, category: 'Tratamientos Capilares', icon: Sparkles, description: 'Dosis concentrada de nutrición y brillo instantáneo L\'Oréal.' },

  // 6-8: Color / Keratina / Smartbond
  { 
    id: '301', 
    code: '301', 
    name: 'Aplicacion De Color', 
    price: '₡22,000', 
    priceNumber: 22000, 
    durationText: '2h', 
    durationMinutes: 120, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Aplicación experta de color raíz o global con reposo y 1 hora final de lavado, secado y acabado.',
    phases: [
      { name: 'Aplicación de Color', durationMinutes: 30, isStylistBusy: true, description: 'Estilista ocupado aplicando el producto' },
      { name: 'Reposo de Color', durationMinutes: 30, isStylistBusy: false, description: 'Estilista libre durante reposo' },
      { name: 'Lavado, Secado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: lavado, secado y estilizado' }
    ]
  },
  { id: '321', code: '321', name: 'Aplicacion Keratina', price: '₡70,000', priceNumber: 70000, durationText: '2h 30min', durationMinutes: 150, category: 'Alisados y Keratinas', icon: Wind, description: 'Tratamiento de queratina regeneradora.' },
  { id: '333', code: '333', name: 'Aplicacion Smartbond', price: '₡6,000', priceNumber: 6000, durationText: '15min', durationMinutes: 15, category: 'Tratamientos Capilares', icon: Sparkles, description: 'Aditivo protector de puentes capilares durante la decoloración.' },

  // 11-14: Baño de color
  { 
    id: '214', 
    code: '214', 
    name: 'Baño Color Corto', 
    price: '₡32,000', 
    priceNumber: 32000, 
    durationText: '2h', 
    durationMinutes: 120, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Refresco de matiz y brillo para cabello corto con reposo y 1 hora final de lavado y secado.',
    phases: [
      { name: 'Aplicación Baño Color', durationMinutes: 30, isStylistBusy: true, description: 'Estilista aplicando matiz' },
      { name: 'Reposo de Color', durationMinutes: 30, isStylistBusy: false, description: 'Estilista libre durante tiempo de reposo' },
      { name: 'Lavado, Secado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: lavado, secado y acabado' }
    ]
  },
  { 
    id: '216', 
    code: '216', 
    name: 'Baño Color Largo', 
    price: '₡40,000', 
    priceNumber: 40000, 
    durationText: '2h', 
    durationMinutes: 120, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Refresco de matiz y brillo para cabello largo con reposo y 1 hora final de lavado y secado.',
    phases: [
      { name: 'Aplicación Baño Color', durationMinutes: 30, isStylistBusy: true, description: 'Estilista aplicando matiz' },
      { name: 'Reposo de Color', durationMinutes: 30, isStylistBusy: false, description: 'Estilista libre durante tiempo de reposo' },
      { name: 'Lavado, Secado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: lavado, secado y acabado' }
    ]
  },
  { 
    id: '215', 
    code: '215', 
    name: 'Baño Color Mediano', 
    price: '₡36,000', 
    priceNumber: 36000, 
    durationText: '2h', 
    durationMinutes: 120, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Refresco de matiz para largo mediano con reposo y 1 hora final de lavado y secado.',
    phases: [
      { name: 'Aplicación Baño Color', durationMinutes: 30, isStylistBusy: true, description: 'Estilista aplicando matiz' },
      { name: 'Reposo de Color', durationMinutes: 30, isStylistBusy: false, description: 'Estilista libre durante tiempo de reposo' },
      { name: 'Lavado, Secado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: lavado, secado y acabado' }
    ]
  },
  { 
    id: '217', 
    code: '217', 
    name: 'Baño Color Muy Largo', 
    price: '₡42,000', 
    priceNumber: 42000, 
    durationText: '2h 15min', 
    durationMinutes: 135, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Refresco de tono y brillo para cabello extra largo con reposo y 1 hora final de secado.',
    phases: [
      { name: 'Aplicación Baño Color', durationMinutes: 45, isStylistBusy: true, description: 'Estilista aplicando matiz' },
      { name: 'Reposo de Color', durationMinutes: 30, isStylistBusy: false, description: 'Estilista libre durante tiempo de reposo' },
      { name: 'Lavado, Secado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: lavado, secado y acabado' }
    ]
  },

  // 15-19: Blowers
  { id: '03', code: '03', name: 'Blower Corto', price: '₡10,000', priceNumber: 10000, durationText: '30min', durationMinutes: 30, category: 'Cortes y Peinados', icon: Feather, description: 'Secado y peinado con moldeado para cabello corto.' },
  { id: '05', code: '05', name: 'Blower Largo', price: '₡16,000', priceNumber: 16000, durationText: '50min', durationMinutes: 50, category: 'Cortes y Peinados', icon: Feather, description: 'Secado y peinado profesional para cabello largo.' },
  { id: '04', code: '04', name: 'Blower Mediano', price: '₡13,000', priceNumber: 13000, durationText: '40min', durationMinutes: 40, category: 'Cortes y Peinados', icon: Feather, description: 'Secado y moldeado para largo mediano.' },
  { id: '06', code: '06', name: 'Blower Muy Largo', price: '₡18,000', priceNumber: 18000, durationText: '1h', durationMinutes: 60, category: 'Cortes y Peinados', icon: Feather, description: 'Blower técnico especializado para cabello abundante o extra largo.' },
  { id: '196', code: '196', name: 'Blower-Colochos', price: '₡20,000', priceNumber: 20000, durationText: '1h', durationMinutes: 60, category: 'Cortes y Peinados', icon: Feather, description: 'Moldeado de rizos con blower y difusor.' },

  // 20: Boda
  { id: '197', code: '197', name: 'Boda', price: '₡28,000', priceNumber: 28000, durationText: '1h 30min', durationMinutes: 90, category: 'Cortes y Peinados', icon: Heart, description: 'Peinado elegante o recogido exclusivo de boda.' },

  // 21-24: Botox
  { id: '386', code: '386', name: 'Botox Cabello Corto', price: '₡50,000', priceNumber: 50000, durationText: '2h', durationMinutes: 120, category: 'Alisados y Keratinas', icon: Sparkles, description: 'Tratamiento reestructurante profundo Botox capilar.' },
  { id: '384', code: '384', name: 'Botox Cabello Largo', price: '₡75,000', priceNumber: 75000, durationText: '3h', durationMinutes: 180, category: 'Alisados y Keratinas', icon: Sparkles, description: 'Botox capilar intensivo para cabello largo.' },
  { id: '385', code: '385', name: 'Botox Cabello Mediano', price: '₡65,000', priceNumber: 65000, durationText: '2h', durationMinutes: 120, category: 'Alisados y Keratinas', icon: Sparkles, description: 'Botox capilar para largo mediano.' },
  { id: '388', code: '388', name: 'Botox Cabello Muy Largo', price: '₡80,000', priceNumber: 80000, durationText: '3h 30min', durationMinutes: 210, category: 'Alisados y Keratinas', icon: Sparkles, description: 'Botox capilar para cabello abundante o extra largo.' },

  // 25-27: Esmaltes
  { 
    id: '237', 
    code: '237', 
    name: 'Esmaltado', 
    price: '₡7,000', 
    priceNumber: 7000, 
    durationText: '20min - 40min', 
    durationMinutes: 20, 
    category: 'Manicure y Pedicure', 
    icon: Hand, 
    description: 'Esmaltado profesional de uñas. Elige entre Manos, Pies o Manos y Pies.',
    optionLabel: 'Zona a esmaltar',
    options: [
      { id: 'manos', name: 'Solo manos', price: '₡7,000', priceNumber: 7000, durationMinutes: 20, durationText: '20min' },
      { id: 'pies', name: 'Solo pies', price: '₡8,000', priceNumber: 8000, durationMinutes: 25, durationText: '25min' },
      { id: 'manos_pies', name: 'Manos y pies', price: '₡14,000', priceNumber: 14000, durationMinutes: 40, durationText: '40min' }
    ]
  },
  { 
    id: '315', 
    code: '315', 
    name: 'Esmaltado Gel Shine', 
    price: '₡8,000', 
    priceNumber: 8000, 
    durationText: '30min - 60min', 
    durationMinutes: 30, 
    category: 'Manicure y Pedicure', 
    icon: Hand, 
    description: 'Esmaltado en gel efecto alto brillo Shine.',
    optionLabel: 'Zona a esmaltar',
    options: [
      { id: 'gel_manos', name: 'Solo manos', price: '₡8,000', priceNumber: 8000, durationMinutes: 30, durationText: '30min' },
      { id: 'gel_pies', name: 'Solo pies', price: '₡10,000', priceNumber: 10000, durationMinutes: 35, durationText: '35min' },
      { id: 'gel_manos_pies', name: 'Manos y pies', price: '₡16,000', priceNumber: 16000, durationMinutes: 60, durationText: '1h' }
    ]
  },
  { 
    id: '231', 
    code: '231', 
    name: 'Esmaltado Shellac', 
    price: '₡10,000', 
    priceNumber: 10000, 
    durationText: '30min - 60min', 
    durationMinutes: 30, 
    category: 'Manicure y Pedicure', 
    icon: Hand, 
    description: 'Esmaltado de larga duración Shellac CND.',
    optionLabel: 'Zona a esmaltar',
    options: [
      { id: 'shellac_manos', name: 'Solo manos', price: '₡10,000', priceNumber: 10000, durationMinutes: 30, durationText: '30min' },
      { id: 'shellac_pies', name: 'Solo pies', price: '₡12,000', priceNumber: 12000, durationMinutes: 35, durationText: '35min' },
      { id: 'shellac_manos_pies', name: 'Manos y pies', price: '₡20,000', priceNumber: 20000, durationMinutes: 60, durationText: '1h' }
    ]
  },

  // 28: Cejas
  { id: '308', code: '308', name: 'Cejas Hilo', price: '₡8,000', priceNumber: 8000, durationText: '15min', durationMinutes: 15, category: 'Depilación y Rostro', icon: Sun, description: 'Depilación hindú con hilo para diseño limpio de cejas.' },

  // 29: Certificado
  { id: '322', code: '322', name: 'Certificado De Regalo', price: '₡100,000', priceNumber: 100000, durationText: '5min', durationMinutes: 5, category: 'Paquetes y Promociones', icon: Award, description: 'Bono de regalo canjeable en cualquier servicio o producto.' },

  // 30: Colochos
  { id: '195', code: '195', name: 'Colochos', price: '₡15,000', priceNumber: 15000, durationText: '1h', durationMinutes: 60, category: 'Cortes y Peinados', icon: Feather, description: 'Formación y definición de rizos/ondas con tenaza o plancha.' },

  // 31-35: Color Light / Highlights
  { 
    id: '390', 
    code: '390', 
    name: 'Color Light Contorno', 
    price: '₡30,000', 
    priceNumber: 30000, 
    durationText: '2h', 
    durationMinutes: 120, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Aclaración focalizada de contorno frontal (Money Piece) con reposo y 1 hora final de matiz y secado.',
    phases: [
      { name: 'Aplicación / Montaje', durationMinutes: 30, isStylistBusy: true, description: 'Montaje de papel y aplicación de aclarado' },
      { name: 'Reposo / Tiempo de Espera', durationMinutes: 30, isStylistBusy: false, description: 'Estilista libre durante tiempo de reposo' },
      { name: 'Matizado, Lavado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: matizado, lavado y acabado' }
    ]
  },
  { 
    id: '202', 
    code: '202', 
    name: 'Color Light Corto', 
    price: '₡39,000', 
    priceNumber: 39000, 
    durationText: '2h', 
    durationMinutes: 120, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Reflejos suaves de luz para cabello corto con reposo y 1 hora final de matizado y secado.',
    phases: [
      { name: 'Aplicación de Luces', durationMinutes: 30, isStylistBusy: true, description: 'Montaje técnico de mechas' },
      { name: 'Reposo / Tiempo de Espera', durationMinutes: 30, isStylistBusy: false, description: 'Estilista libre mientras actúa la decoloración' },
      { name: 'Matizado, Lavado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: matizado, lavado y secado' }
    ]
  },
  { 
    id: '14', 
    code: '14', 
    name: 'Color Light Largo', 
    price: '₡56,000', 
    priceNumber: 56000, 
    durationText: '3h', 
    durationMinutes: 180, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Iluminación multitonal para cabello largo con 1 hora de reposo y 1 hora final de matiz y secado.',
    phases: [
      { name: 'Aplicación / Montaje', durationMinutes: 60, isStylistBusy: true, description: 'Montaje técnico de papel y producto' },
      { name: 'Reposo / Tiempo de Espera', durationMinutes: 60, isStylistBusy: false, description: 'Estilista libre durante 1 hora de reposo' },
      { name: 'Matizado, Lavado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: matizado, lavado y secado final' }
    ]
  },
  { 
    id: '203', 
    code: '203', 
    name: 'Color Light Mediano', 
    price: '₡48,000', 
    priceNumber: 48000, 
    durationText: '3h', 
    durationMinutes: 180, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Puntos de luz estratégicos para largo mediano con 1 hora de reposo y 1 hora final de matizado y secado.',
    phases: [
      { name: 'Aplicación de Luces', durationMinutes: 60, isStylistBusy: true, description: 'Montaje técnico de mechas' },
      { name: 'Reposo / Tiempo de Espera', durationMinutes: 60, isStylistBusy: false, description: 'Estilista libre durante 1 hora de reposo' },
      { name: 'Matizado, Lavado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: matizado, lavado y secado' }
    ]
  },
  { 
    id: '205', 
    code: '205', 
    name: 'Color Light Muy Largo', 
    price: '₡65,000', 
    priceNumber: 65000, 
    durationText: '3h', 
    durationMinutes: 180, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Iluminación completa para cabello muy largo con 1 hora de reposo y 1 hora final de matizado y secado.',
    phases: [
      { name: 'Aplicación / Montaje', durationMinutes: 60, isStylistBusy: true, description: 'Montaje de mechas en cabello abundante' },
      { name: 'Reposo / Tiempo de Espera', durationMinutes: 60, isStylistBusy: false, description: 'Estilista libre durante 1 hora de reposo' },
      { name: 'Matizado, Lavado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: matizado, lavado y secado' }
    ]
  },
  { 
    id: '400', 
    code: '400', 
    name: 'Highlights / Mechas', 
    price: '₡55,000', 
    priceNumber: 55000, 
    durationText: '3h', 
    durationMinutes: 180, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Técnica clásica de highlights o mechas con 1 hora de reposo y 1 hora final de matizado, lavado y secado.',
    phases: [
      { name: 'Aplicación de Highlights', durationMinutes: 60, isStylistBusy: true, description: 'Montaje de papel y aplicación' },
      { name: 'Reposo / Tiempo de Espera', durationMinutes: 60, isStylistBusy: false, description: 'Estilista libre durante 1 hora de reposo' },
      { name: 'Matizado, Lavado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: matizado, lavado y acabado' }
    ]
  },

  // 36-44: Cortes
  { id: '23', code: '23', name: 'Corte & Blower Corto', price: '₡18,000', priceNumber: 18000, durationText: '45min', durationMinutes: 45, category: 'Cortes y Peinados', icon: Scissors, description: 'Diseño de corte y peinado con blower para corto.' },
  { id: '291', code: '291', name: 'Corte & Blower Mediano', price: '₡24,000', priceNumber: 24000, durationText: '1h', durationMinutes: 60, category: 'Cortes y Peinados', icon: Scissors, description: 'Corte estilizado más secado y moldeado mediano.' },
  { id: '292', code: '292', name: 'Corte Blower Largo', price: '₡29,000', priceNumber: 29000, durationText: '1h 15min', durationMinutes: 75, category: 'Cortes y Peinados', icon: Scissors, description: 'Corte personalizado y blower pulido largo.' },
  { id: '02', code: '02', name: 'Corte Hombre', price: '₡12,000', priceNumber: 12000, durationText: '45min', durationMinutes: 45, category: 'Cortes y Peinados', icon: Scissors, description: 'Corte masculino moderno con lavado y estilizado.' },
  { id: '16', code: '16', name: 'Corte Maquina', price: '₡10,000', priceNumber: 10000, durationText: '15min', durationMinutes: 15, category: 'Cortes y Peinados', icon: Scissors, description: 'Corte rápido con máquina uniformada.' },
  { id: '09', code: '09', name: 'Corte Mujer Solo', price: '₡15,000', priceNumber: 15000, durationText: '45min', durationMinutes: 45, category: 'Cortes y Peinados', icon: Scissors, description: 'Corte de puntas o cambio de estilo sin blower.' },
  { id: '004', code: '004', name: 'Corte Pava', price: '₡4,000', priceNumber: 4000, durationText: '20min', durationMinutes: 20, category: 'Cortes y Peinados', icon: Scissors, description: 'Mantenimiento y perfilado de flequillo/pava.' },
  { id: '370', code: '370', name: 'Corte Secado Con Difusor', price: '₡17,000', priceNumber: 17000, durationText: '45min', durationMinutes: 45, category: 'Cortes y Peinados', icon: Scissors, description: 'Corte para melenas rizadas con secado difusor.' },
  { id: '342', code: '342', name: 'Corte Y Blower Muy Largo', price: '₡31,000', priceNumber: 31000, durationText: '1h 30min', durationMinutes: 90, category: 'Cortes y Peinados', icon: Scissors, description: 'Corte completo y moldeado para cabello muy largo.' },

  // 45-46: Decoloraciones
  { id: '328', code: '328', name: 'Decoloracion De Brazo', price: '₡4,000', priceNumber: 4000, durationText: '20min', durationMinutes: 20, category: 'Depilación y Rostro', icon: Sun, description: 'Aclarado suave de vello en brazos.' },
  { 
    id: '344', 
    code: '344', 
    name: 'Decolorar Cabello Corto', 
    price: '₡25,000', 
    priceNumber: 25000, 
    durationText: '2h 30min', 
    durationMinutes: 150, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Decoloración global para cabello corto con reposo y 1 hora final de matizado y secado.',
    phases: [
      { name: 'Aplicación de Decoloración', durationMinutes: 45, isStylistBusy: true, description: 'Aplicación técnica de decoloración' },
      { name: 'Reposo / Decoloración', durationMinutes: 45, isStylistBusy: false, description: 'Estilista libre durante tiempo de reposo' },
      { name: 'Matizado, Lavado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: matizado, lavado y acabado' }
    ]
  },

  // 47-69: Depilaciones
  { id: '248', code: '248', name: 'Depilacion Axilas', price: '₡9,000', priceNumber: 9000, durationText: '15min', durationMinutes: 15, category: 'Depilación y Rostro', icon: Sun, description: 'Depilación higiénica con cera en axilas.' },
  { id: '261', code: '261', name: 'Depilacion Barbilla', price: '₡4,000', priceNumber: 4000, durationText: '10min', durationMinutes: 10, category: 'Depilación y Rostro', icon: Sun, description: 'Depilación de barbilla o mentón.' },
  { id: '250', code: '250', name: 'Depilacion Bikini Lateral', price: '₡9,000', priceNumber: 9000, durationText: '15min', durationMinutes: 15, category: 'Depilación y Rostro', icon: Sun, description: 'Depilación de contorno de bikini.' },
  { id: '251', code: '251', name: 'Depilacion Bikini Total', price: '₡17,000', priceNumber: 17000, durationText: '20min', durationMinutes: 20, category: 'Depilación y Rostro', icon: Sun, description: 'Depilación completa de área de bikini.' },
  { id: '253', code: '253', name: 'Depilacion Brazo Completo', price: '₡12,000', priceNumber: 12000, durationText: '20min', durationMinutes: 20, category: 'Depilación y Rostro', icon: Sun, description: 'Depilación suave de ambos brazos.' },
  { id: '245', code: '245', name: 'Depilacion Cejas', price: '₡8,000', priceNumber: 8000, durationText: '15min', durationMinutes: 15, category: 'Depilación y Rostro', icon: Sun, description: 'Diseño y depilación con cera vegetal.' },
  { id: '387', code: '387', name: 'Depilacion De Codos', price: '₡6,000', priceNumber: 6000, durationText: '10min', durationMinutes: 10, category: 'Depilación y Rostro', icon: Sun, description: 'Depilación focalizada de codos.' },
  { id: '373', code: '373', name: 'Depilacion De Pecho', price: '₡15,000', priceNumber: 15000, durationText: '20min', durationMinutes: 20, category: 'Depilación y Rostro', icon: Sun, description: 'Depilación corporal masculina/femenina de pecho.' },
  { id: '262', code: '262', name: 'Depilacion Dedos', price: '₡2,000', priceNumber: 2000, durationText: '10min', durationMinutes: 10, category: 'Depilación y Rostro', icon: Sun, description: 'Depilación fina de dedos.' },
  { id: '263', code: '263', name: 'Depilacion Dedos Y Pies', price: '₡4,000', priceNumber: 4000, durationText: '10min', durationMinutes: 10, category: 'Depilación y Rostro', icon: Sun, description: 'Depilación de empeine y dedos de pies.' },
  { id: '252', code: '252', name: 'Depilacion Entre Ceja', price: '₡3,000', priceNumber: 3000, durationText: '10min', durationMinutes: 10, category: 'Depilación y Rostro', icon: Sun, description: 'Limpieza rápida de entrecejo.' },
  { id: '258', code: '258', name: 'Depilacion Espalda', price: '₡17,000', priceNumber: 17000, durationText: '25min', durationMinutes: 25, category: 'Depilación y Rostro', icon: Sun, description: 'Depilación completa de espalda.' },
  { id: '244', code: '244', name: 'Depilacion Labio Inferior', price: '₡3,000', priceNumber: 3000, durationText: '5min', durationMinutes: 5, category: 'Depilación y Rostro', icon: Sun, description: 'Depilación de zona inferior de labios.' },
  { id: '243', code: '243', name: 'Depilacion Labio Superior', price: '₡4,000', priceNumber: 4000, durationText: '5min', durationMinutes: 5, category: 'Depilación y Rostro', icon: Sun, description: 'Depilación de bozo / labio superior.' },
  { id: '249', code: '249', name: 'Depilacion Linea Del Alba', price: '₡6,000', priceNumber: 6000, durationText: '15min', durationMinutes: 15, category: 'Depilación y Rostro', icon: Sun, description: 'Depilación de línea abdominal.' },
  { id: '259', code: '259', name: 'Depilacion Media Espalda', price: '₡9,000', priceNumber: 9000, durationText: '15min', durationMinutes: 15, category: 'Depilación y Rostro', icon: Sun, description: 'Depilación zona superior/inferior de espalda.' },
  { id: '257', code: '257', name: 'Depilacion Media Pierna Abajo', price: '₡11,000', priceNumber: 11000, durationText: '15min', durationMinutes: 15, category: 'Depilación y Rostro', icon: Sun, description: 'Depilación de pantorrillas y tobillos.' },
  { id: '256', code: '256', name: 'Depilacion Media Pierna Arriba', price: '₡13,000', priceNumber: 13000, durationText: '15min', durationMinutes: 15, category: 'Depilación y Rostro', icon: Sun, description: 'Depilación de muslos.' },
  { id: '254', code: '254', name: 'Depilacion Medio Brazo', price: '₡6,000', priceNumber: 6000, durationText: '15min', durationMinutes: 15, category: 'Depilación y Rostro', icon: Sun, description: 'Depilación de antebrazos.' },
  { id: '260', code: '260', name: 'Depilacion Nariz', price: '₡2,000', priceNumber: 2000, durationText: '5min', durationMinutes: 5, category: 'Depilación y Rostro', icon: Sun, description: 'Limpieza de vello nasal.' },
  { id: '255', code: '255', name: 'Depilacion Pierna Completa', price: '₡22,000', priceNumber: 22000, durationText: '30min', durationMinutes: 30, category: 'Depilación y Rostro', icon: Sun, description: 'Depilación completa de ambos miembros inferiores.' },
  { id: '247', code: '247', name: 'Depilacion Rostro Completo', price: '₡14,000', priceNumber: 14000, durationText: '20min', durationMinutes: 20, category: 'Depilación y Rostro', icon: Sun, description: 'Depilación de cejas, bozo, patillas y barbilla.' },
  { id: '246', code: '246', name: 'Depilacion Rostro Sin Cejas', price: '₡9,000', priceNumber: 9000, durationText: '15min', durationMinutes: 15, category: 'Depilación y Rostro', icon: Sun, description: 'Depilación facial omitiendo área de cejas.' },

  // 70: Efecto Espejo
  { id: '359', code: '359', name: 'Efecto Espejo OPI', price: '₡1,500', priceNumber: 1500, durationText: '15min', durationMinutes: 15, category: 'Manicure y Pedicure', icon: Hand, description: 'Efecto cromo/espejo brillante sobre esmaltado OPI.' },

  // 71-74: Exfoliacion / Extraccion / K18 / Kerathermique
  { id: '305', code: '305', name: 'Exfoliacion Capilar Corto', price: '₡12,000', priceNumber: 12000, durationText: '30min', durationMinutes: 30, category: 'Tratamientos Capilares', icon: Sparkles, description: 'Peeling del cuero cabelludo para eliminar residuos y desintoxicar.' },
  { id: '376', code: '376', name: 'Extraccion De Color', price: '₡12,000', priceNumber: 12000, durationText: '1h 30min', durationMinutes: 90, category: 'Coloración y Tintes', icon: Paintbrush, description: 'Remoción técnica de pigmentos cosméticos acumulados.' },
  { id: '394', code: '394', name: 'K18 Tratamiento', price: '₡29,000', priceNumber: 29000, durationText: '45min', durationMinutes: 45, category: 'Tratamientos Capilares', icon: Sparkles, description: 'Tratamiento molecular K18 que reconecta cadenas de queratina dañadas.' },
  { id: '358', code: '358', name: 'Kerathermique', price: '₡85,000', priceNumber: 85000, durationText: '2h 30min', durationMinutes: 150, category: 'Tratamientos Capilares', icon: Sparkles, description: 'Tratamiento cauterizador térmico Kérastase de máxima nutrición.' },

  // 75-81: Keratinas
  { id: '222', code: '222', name: 'Keratina Corto', price: '₡90,000', priceNumber: 90000, durationText: '2h 30min', durationMinutes: 150, category: 'Alisados y Keratinas', icon: Wind, description: 'Alisado de queratina para cabello corto.' },
  { id: '302', code: '302', name: 'Keratina Hombre O Mujer Muy Corto', price: '₡50,000', priceNumber: 50000, durationText: '1h 30min', durationMinutes: 90, category: 'Alisados y Keratinas', icon: Wind, description: 'Queratina para cortes muy cortos pixies o masculinos.' },
  { id: '224', code: '224', name: 'Keratina Largo', price: '₡150,000', priceNumber: 150000, durationText: '4h', durationMinutes: 240, category: 'Alisados y Keratinas', icon: Wind, description: 'Queratina brasileña para melena larga.' },
  { id: '223', code: '223', name: 'Keratina Mediano', price: '₡120,000', priceNumber: 120000, durationText: '3h 30min', durationMinutes: 210, category: 'Alisados y Keratinas', icon: Wind, description: 'Queratina tratante para largo mediano.' },
  { id: '325', code: '325', name: 'Keratina Mujer Corto', price: '₡60,000', priceNumber: 60000, durationText: '2h 30min', durationMinutes: 150, category: 'Alisados y Keratinas', icon: Wind, description: 'Queratina antifrizz para melena corta.' },
  { id: '225', code: '225', name: 'Keratina Muy Largo', price: '₡160,000', priceNumber: 160000, durationText: '4h 30min', durationMinutes: 270, category: 'Alisados y Keratinas', icon: Wind, description: 'Queratina máxima resistencia para cabello muy largo.' },
  { id: '372', code: '372', name: 'Keratina Pava', price: '₡10,000', priceNumber: 10000, durationText: '30min', durationMinutes: 30, category: 'Alisados y Keratinas', icon: Wind, description: 'Queratina localizada en zona de flequillo.' },

  // 82: Lavado
  { id: '298', code: '298', name: 'Lavado', price: '₡8,000', priceNumber: 8000, durationText: '15min', durationMinutes: 15, category: 'Cortes y Peinados', icon: Scissors, description: 'Lavado relajante con champú tratante y masaje capilar.' },

  // 83-84: Low Light
  { id: '364', code: '364', name: 'Low Light', price: '₡35,000', priceNumber: 35000, durationText: '1h 30min', durationMinutes: 90, category: 'Coloración y Tintes', icon: Paintbrush, description: 'Sombra y profundidad estratégica mediante mechas oscuras.' },
  { id: '377', code: '377', name: 'Low Light Frontales', price: '₡15,000', priceNumber: 15000, durationText: '45min', durationMinutes: 45, category: 'Coloración y Tintes', icon: Paintbrush, description: 'Contrastes de color en zona de marco facial.' },

  // 85-92: Manicuras
  { id: '349', code: '349', name: 'Manicura Spa Con Gel', price: '₡22,000', priceNumber: 22000, durationText: '1h', durationMinutes: 60, category: 'Manicure y Pedicure', icon: Hand, description: 'Manicura spa profunda con exfoliante y gel permanente.' },
  { id: '339', code: '339', name: 'Manicura Tratamiento OPI', price: '₡13,000', priceNumber: 13000, durationText: '45min', durationMinutes: 45, category: 'Manicure y Pedicure', icon: Hand, description: 'Tratamiento fortalecedor de uñas OPI.' },
  { id: '392', code: '392', name: 'Manicure Luminari', price: '₡20,000', priceNumber: 20000, durationText: '45min', durationMinutes: 45, category: 'Manicure y Pedicure', icon: Hand, description: 'Manicura de iluminación y suavidad Luminari.' },
  { id: '229', code: '229', name: 'Manicure Sencillo', price: '₡11,000', priceNumber: 11000, durationText: '30min', durationMinutes: 30, category: 'Manicure y Pedicure', icon: Hand, description: 'Limpieza de cutícula, limado y esmaltado clásico.' },
  { id: '232', code: '232', name: 'Manicure Shellac Fuell', price: '₡15,000', priceNumber: 15000, durationText: '45min', durationMinutes: 45, category: 'Manicure y Pedicure', icon: Hand, description: 'Manicura completa con esmaltado duradero Shellac.' },
  { id: '316', code: '316', name: 'Manicure Shine', price: '₡12,000', priceNumber: 12000, durationText: '40min', durationMinutes: 40, category: 'Manicure y Pedicure', icon: Hand, description: 'Manicura de alto brillo y rápida fijación.' },
  { id: '230', code: '230', name: 'Manicure Spa', price: '₡15,000', priceNumber: 15000, durationText: '1h', durationMinutes: 60, category: 'Manicure y Pedicure', icon: Hand, description: 'Manicura relajante con hidratación y exfoliación.' },
  { id: '240', code: '240', name: 'Mantenimiento', price: '₡15,000', priceNumber: 15000, durationText: '45min', durationMinutes: 45, category: 'Manicure y Pedicure', icon: Hand, description: 'Mantenimiento y relleno de acrílico/gel en uñas.' },

  // 93-97: Maquillajes y Masajes
  { id: '398', code: '398', name: 'Maquillaje Novia', price: '₡50,000', priceNumber: 50000, durationText: '1h 30min', durationMinutes: 90, category: 'Maquillaje y Masajes', icon: Heart, description: 'Maquillaje nupcial de larga duración HD con pruebas previas opcionales.' },
  { id: '288', code: '288', name: 'Maquillaje Ojos', price: '₡20,000', priceNumber: 20000, durationText: '30min', durationMinutes: 30, category: 'Maquillaje y Masajes', icon: Heart, description: 'Delineado, sombras y pestañas estilizadas.' },
  { id: '289', code: '289', name: 'Maquillaje Total', price: '₡40,000', priceNumber: 40000, durationText: '1h', durationMinutes: 60, category: 'Maquillaje y Masajes', icon: Heart, description: 'Maquillaje social completo para eventos especiales.' },
  { id: '269', code: '269', name: 'Masaje', price: '₡20,000', priceNumber: 20000, durationText: '1h', durationMinutes: 60, category: 'Maquillaje y Masajes', icon: Smile, description: 'Masaje corporal descontracturante o relajante.' },
  { id: '343', code: '343', name: 'Masaje Para Pies', price: '₡7,000', priceNumber: 7000, durationText: '20min', durationMinutes: 20, category: 'Maquillaje y Masajes', icon: Smile, description: 'Masaje cansancio cero para pies y pantorrillas.' },

  // 98-99: Mascarilla & Olaplex
  { id: '287', code: '287', name: 'Mascarilla', price: '₡12,000', priceNumber: 12000, durationText: '20min', durationMinutes: 20, category: 'Tratamientos Capilares', icon: Sparkles, description: 'Mascarilla ultra hidratante según el tipo de cabello.' },
  { id: '346', code: '346', name: 'Olaplex 1 Y 2', price: '₡35,000', priceNumber: 35000, durationText: '30min', durationMinutes: 30, category: 'Tratamientos Capilares', icon: Sparkles, description: 'Sistema multiplicador de enlaces capilares Olaplex No. 1 y No. 2.' },

  // 100-125: Paquetes
  { id: '367', code: '367', name: 'Paquete 1 Corto', price: '₡58,000', priceNumber: 58000, durationText: '2h', durationMinutes: 120, category: 'Paquetes y Promociones', icon: Award, description: 'Combo de color, corte y tratamiento para cabello corto.' },
  { id: '380', code: '380', name: 'Paquete 1 Largo', price: '₡76,000', priceNumber: 76000, durationText: '3h', durationMinutes: 180, category: 'Paquetes y Promociones', icon: Award, description: 'Combo completo de tinte, corte y blower para melena larga.' },
  { id: '365', code: '365', name: 'Paquete 1 Mediano', price: '₡69,000', priceNumber: 69000, durationText: '2h 30min', durationMinutes: 150, category: 'Paquetes y Promociones', icon: Award, description: 'Combo especial para cabello mediano.' },
  { id: '351', code: '351', name: 'Paquete 1 Muy Largo', price: '₡81,000', priceNumber: 81000, durationText: '3h 30min', durationMinutes: 210, category: 'Paquetes y Promociones', icon: Award, description: 'Paquete completo premium para cabello muy largo.' },
  { id: '185', code: '185', name: 'Paquete Blower Corto', price: '₡62,000', priceNumber: 62000, durationText: '1h 30min', durationMinutes: 90, category: 'Paquetes y Promociones', icon: Award, description: 'Cuponera o paquete de sesiones de blower corto.' },
  { id: '24', code: '24', name: 'Paquete Blower Largo', price: '₡98,000', priceNumber: 98000, durationText: '2h', durationMinutes: 120, category: 'Paquetes y Promociones', icon: Award, description: 'Paquete de blowers frecuentes para largo.' },
  { id: '22', code: '22', name: 'Paquete Blower Mediano', price: '₡82,000', priceNumber: 82000, durationText: '1h 45min', durationMinutes: 105, category: 'Paquetes y Promociones', icon: Award, description: 'Paquete de blowers para cabello mediano.' },
  { id: '338', code: '338', name: 'Paquete De Blower Muy Largo', price: '₡120,000', priceNumber: 120000, durationText: '2h 15min', durationMinutes: 135, category: 'Paquetes y Promociones', icon: Award, description: 'Paquete especial de secados para largo abundante.' },
  { id: '334', code: '334', name: 'Paquete De Manicure Sencillo', price: '₡64,000', priceNumber: 64000, durationText: '30min', durationMinutes: 30, category: 'Paquetes y Promociones', icon: Award, description: 'Suscripción/Paquete mensual de manicura.' },
  { id: '369', code: '369', name: 'Paquete Enero Largo', price: '₡44,000', priceNumber: 44000, durationText: '1h 45min', durationMinutes: 105, category: 'Paquetes y Promociones', icon: Award, description: 'Promoción especial de inicio de año para largo.' },
  { id: '378', code: '378', name: 'Paquete Enero Mediano', price: '₡40,000', priceNumber: 40000, durationText: '1h 30min', durationMinutes: 90, category: 'Paquetes y Promociones', icon: Award, description: 'Promoción especial de inicio de año mediano.' },
  { id: '379', code: '379', name: 'Paquete Magistral Septiembre Corto', price: '₡30,000', priceNumber: 30000, durationText: '1h', durationMinutes: 60, category: 'Paquetes y Promociones', icon: Award, description: 'Paquete magistral de tratamiento y acabado corto.' },
  { id: '381', code: '381', name: 'Paquete Magistral Septiembre Largo', price: '₡36,000', priceNumber: 36000, durationText: '1h 30min', durationMinutes: 90, category: 'Paquetes y Promociones', icon: Award, description: 'Paquete magistral especial largo.' },
  { id: '382', code: '382', name: 'Paquete Magistral Septiembre Mediano', price: '₡33,000', priceNumber: 33000, durationText: '1h 15min', durationMinutes: 75, category: 'Paquetes y Promociones', icon: Award, description: 'Paquete magistral mediano.' },
  { id: '383', code: '383', name: 'Paquete Magistral Septiembre Muy Largo', price: '₡39,000', priceNumber: 39000, durationText: '1h 45min', durationMinutes: 105, category: 'Paquetes y Promociones', icon: Award, description: 'Paquete magistral para melena abundante.' },
  { id: '335', code: '335', name: 'Paquete Manicure OPI Gel', price: '₡98,000', priceNumber: 98000, durationText: '1h', durationMinutes: 60, category: 'Paquetes y Promociones', icon: Award, description: 'Paquete de manicuras OPI gel.' },
  { id: '337', code: '337', name: 'Paquete Manicure Y Pedicure Shine', price: '₡154,000', priceNumber: 154000, durationText: '1h 30min', durationMinutes: 90, category: 'Paquetes y Promociones', icon: Award, description: 'Paquete dúo manos y pies brillos permanentes.' },
  { id: '336', code: '336', name: 'Paquete Manos Y Pies', price: '₡145,000', priceNumber: 145000, durationText: '1h 30min', durationMinutes: 90, category: 'Paquetes y Promociones', icon: Award, description: 'Paquete ahorro coordinado de manicura y pedicura.' },
  { id: '352', code: '352', name: 'Paquete Masaje Reductivo', price: '₡135,000', priceNumber: 135000, durationText: '1h 30min', durationMinutes: 90, category: 'Paquetes y Promociones', icon: Award, description: 'Bono de sesiones reductoras y moldeadoras.' },
  { id: '363', code: '363', name: 'Paquete Masaje Relajante', price: '₡120,000', priceNumber: 120000, durationText: '1h 30min', durationMinutes: 90, category: 'Paquetes y Promociones', icon: Award, description: 'Circuito de masajes antiestrés corporal.' },
  { id: '366', code: '366', name: 'Paquete Olaplex', price: '₡80,000', priceNumber: 80000, durationText: '1h', durationMinutes: 60, category: 'Paquetes y Promociones', icon: Award, description: 'Tratamientos seriados de reconstrucción Olaplex.' },
  { id: '368', code: '368', name: 'Paquete Pedicura Sencilla', price: '₡79,000', priceNumber: 79000, durationText: '40min', durationMinutes: 40, category: 'Paquetes y Promociones', icon: Award, description: 'Paquete promocional de pedicura.' },
  { id: '25', code: '25', name: 'Paquete Plancha Largo', price: '₡72,000', priceNumber: 72000, durationText: '1h 30min', durationMinutes: 90, category: 'Paquetes y Promociones', icon: Award, description: 'Paquete de alisados con plancha para largo.' },
  { id: '024', code: '024', name: 'Paquete Plancha Mediano', price: '₡54,000', priceNumber: 54000, durationText: '1h 15min', durationMinutes: 75, category: 'Paquetes y Promociones', icon: Award, description: 'Paquete de planchado para largo mediano.' },
  { id: '375', code: '375', name: 'Paquete Resistane', price: '₡90,000', priceNumber: 90000, durationText: '1h 30min', durationMinutes: 90, category: 'Paquetes y Promociones', icon: Award, description: 'Ritual Kérastase Résistance intensivo en paquete.' },
  { id: '360', code: '360', name: 'Paquete Shase Q Marzo Sin Blower', price: '₡22,000', priceNumber: 22000, durationText: '2h', durationMinutes: 120, category: 'Paquetes y Promociones', icon: Award, description: 'Tratamiento promocional Shase Q.' },

  // 126-133: Parafina, Pedicuras y Pestañas
  { id: '283', code: '283', name: 'Parafina Manos', price: '₡4,000', priceNumber: 4000, durationText: '20min', durationMinutes: 20, category: 'Manicure y Pedicure', icon: Hand, description: 'Baño de parafina tibia para ultra hidratación de manos.' },
  { id: '282', code: '282', name: 'Parafina Pies', price: '₡4,000', priceNumber: 4000, durationText: '20min', durationMinutes: 20, category: 'Manicure y Pedicure', icon: Hand, description: 'Tratamiento suavizante con parafina para pies secos.' },
  { id: '350', code: '350', name: 'Pedicura Spa Con Gel', price: '₡22,000', priceNumber: 22000, durationText: '1h', durationMinutes: 60, category: 'Manicure y Pedicure', icon: Hand, description: 'Pedicura spa relajante más esmaltado en gel.' },
  { id: '233', code: '233', name: 'Pedicure Sencillo', price: '₡13,000', priceNumber: 13000, durationText: '40min', durationMinutes: 40, category: 'Manicure y Pedicure', icon: Hand, description: 'Limpieza de uñas, exfoliación leve y esmaltado clásico.' },
  { id: '235', code: '235', name: 'Pedicure Shellac Basico', price: '₡10,000', priceNumber: 10000, durationText: '40min', durationMinutes: 40, category: 'Manicure y Pedicure', icon: Hand, description: 'Pedicura básica con aplicación Shellac.' },
  { id: '236', code: '236', name: 'Pedicure Shellac Fuell', price: '₡17,000', priceNumber: 17000, durationText: '50min', durationMinutes: 50, category: 'Manicure y Pedicure', icon: Hand, description: 'Pedicura profunda completa con esmaltado Shellac.' },
  { id: '317', code: '317', name: 'Pedicure Shine', price: '₡15,000', priceNumber: 15000, durationText: '45min', durationMinutes: 45, category: 'Manicure y Pedicure', icon: Hand, description: 'Pedicura rápida de alto brillo.' },
  { id: '234', code: '234', name: 'Pedicure Spa', price: '₡19,000', priceNumber: 19000, durationText: '1h', durationMinutes: 60, category: 'Manicure y Pedicure', icon: Hand, description: 'Pedicura con tina de hidromasaje, exfoliación y masaje.' },
  { id: '290', code: '290', name: 'Pegar Pestañas', price: '₡12,000', priceNumber: 12000, durationText: '1h 30min', durationMinutes: 90, category: 'Depilación y Rostro', icon: Sun, description: 'Colocación de pestañas en tira o por grupitos.' },

  // 135-140: Peinados y Planchados
  { id: '13', code: '13', name: 'Peinado Blower Colochos', price: '₡17,000', priceNumber: 17000, durationText: '1h', durationMinutes: 60, category: 'Cortes y Peinados', icon: Feather, description: 'Peinado con ondas suaves y volumen.' },
  { id: '12', code: '12', name: 'Peinado Colochos', price: '₡19,000', priceNumber: 19000, durationText: '45min', durationMinutes: 45, category: 'Cortes y Peinados', icon: Feather, description: 'Peinado semirrecogido o suelto con rizos definidos.' },
  { id: '15', code: '15', name: 'Peinado De Boda', price: '₡30,000', priceNumber: 30000, durationText: '1h 30min', durationMinutes: 90, category: 'Cortes y Peinados', icon: Heart, description: 'Peinado refinado especial novias y quinceañeras.' },
  { id: '07', code: '07', name: 'Planchado Corto', price: '₡9,000', priceNumber: 9000, durationText: '30min', durationMinutes: 30, category: 'Cortes y Peinados', icon: Feather, description: 'Planchado liso para cabello corto.' },
  { id: '10', code: '10', name: 'Planchado Largo', price: '₡13,000', priceNumber: 13000, durationText: '50min', durationMinutes: 50, category: 'Cortes y Peinados', icon: Feather, description: 'Planchado liso sedoso para melena larga.' },
  { id: '08', code: '08', name: 'Planchado Mediano', price: '₡11,000', priceNumber: 11000, durationText: '40min', durationMinutes: 40, category: 'Cortes y Peinados', icon: Feather, description: 'Planchado liso para largo mediano.' },

  // 141-144: Promos y Protocolos Kérastase
  { id: '393', code: '393', name: 'Promo Mani Pedi Sencillo', price: '₡20,000', priceNumber: 20000, durationText: '1h 10min', durationMinutes: 70, category: 'Paquetes y Promociones', icon: Award, description: 'Combo súper especial Manicure + Pedicure sencillo.' },
  { id: '391', code: '391', name: 'Protocolo Extenciniste', price: '₡35,000', priceNumber: 35000, durationText: '45min', durationMinutes: 45, category: 'Tratamientos Capilares', icon: Sparkles, description: 'Tratamiento Kérastase reforzador para largo deseado.' },
  { id: '331', code: '331', name: 'Protocolo Immunite', price: '₡30,000', priceNumber: 30000, durationText: '45min', durationMinutes: 45, category: 'Tratamientos Capilares', icon: Sparkles, description: 'Nutrición inmune Kérastase para cabellos extremadamente secos.' },
  { id: '395', code: '395', name: 'Protocolo Premiere', price: '₡45,000', priceNumber: 45000, durationText: '45min', durationMinutes: 45, category: 'Tratamientos Capilares', icon: Sparkles, description: 'Tratamiento descalcificante y reparador supremo Kérastase Première.' },

  // 145-148: Quick Light
  { 
    id: '198', 
    code: '198', 
    name: 'Quick Light Corto', 
    price: '₡37,000', 
    priceNumber: 37000, 
    durationText: '2h', 
    durationMinutes: 120, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Aclaración rápida y fresca para melena corta con reposo y 1 hora final de secado.',
    phases: [
      { name: 'Montaje de Luces', durationMinutes: 30, isStylistBusy: true, description: 'Montaje rápido de mechas' },
      { name: 'Reposo / Espera', durationMinutes: 30, isStylistBusy: false, description: 'Estilista libre durante reposo' },
      { name: 'Matizado, Lavado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: matizado, lavado y secado' }
    ]
  },
  { 
    id: '200', 
    code: '200', 
    name: 'Quick Light Largo', 
    price: '₡48,000', 
    priceNumber: 48000, 
    durationText: '2h 30min', 
    durationMinutes: 150, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Técnica rápida de luces para cabello largo con reposo y 1 hora final de secado.',
    phases: [
      { name: 'Montaje de Luces', durationMinutes: 45, isStylistBusy: true, description: 'Montaje de mechas' },
      { name: 'Reposo / Espera', durationMinutes: 45, isStylistBusy: false, description: 'Estilista libre durante reposo' },
      { name: 'Matizado, Lavado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: matizado, lavado y secado' }
    ]
  },
  { 
    id: '199', 
    code: '199', 
    name: 'Quick Light Mediano', 
    price: '₡44,000', 
    priceNumber: 44000, 
    durationText: '2h', 
    durationMinutes: 120, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Aclaración rápida mediano con reposo y 1 hora final de secado.',
    phases: [
      { name: 'Montaje de Luces', durationMinutes: 30, isStylistBusy: true, description: 'Montaje de mechas' },
      { name: 'Reposo / Espera', durationMinutes: 30, isStylistBusy: false, description: 'Estilista libre durante reposo' },
      { name: 'Matizado, Lavado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: matizado, lavado y secado' }
    ]
  },
  { 
    id: '201', 
    code: '201', 
    name: 'Quick Light Muy Largo', 
    price: '₡54,000', 
    priceNumber: 54000, 
    durationText: '2h 30min', 
    durationMinutes: 150, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Puntos de iluminación rápida para cabello muy largo con reposo y 1 hora final de secado.',
    phases: [
      { name: 'Montaje de Luces', durationMinutes: 45, isStylistBusy: true, description: 'Montaje de mechas' },
      { name: 'Reposo / Espera', durationMinutes: 45, isStylistBusy: false, description: 'Estilista libre durante reposo' },
      { name: 'Matizado, Lavado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: matizado, lavado y secado' }
    ]
  },

  // 149-151: Retiros
  { id: '357', code: '357', name: 'Quitar Pestañas', price: '₡5,000', priceNumber: 5000, durationText: '20min', durationMinutes: 20, category: 'Depilación y Rostro', icon: Sun, description: 'Retiro seguro e indoloro de pestañas postizas o extensiones.' },
  { id: '241', code: '241', name: 'Quitar Shellac', price: '₡3,000', priceNumber: 3000, durationText: '15min', durationMinutes: 15, category: 'Manicure y Pedicure', icon: Hand, description: 'Retiro cuidadoso de gel/shellac en uñas.' },
  { id: '242', code: '242', name: 'Quitar Uñas Recina', price: '₡5,000', priceNumber: 5000, durationText: '20min', durationMinutes: 20, category: 'Manicure y Pedicure', icon: Hand, description: 'Retiro de uñas acrílicas o resina sin dañar la uña natural.' },

  // 152-153: Reflexologia
  { id: '280', code: '280', name: 'Reflexologia 30 Min', price: '₡7,000', priceNumber: 7000, durationText: '30min', durationMinutes: 30, category: 'Maquillaje y Masajes', icon: Smile, description: 'Masaje reflexológico estimulante en puntos podales (30 minutos).' },
  { id: '281', code: '281', name: 'Reflexologia 60 Min', price: '₡14,000', priceNumber: 14000, durationText: '1h', durationMinutes: 60, category: 'Maquillaje y Masajes', icon: Smile, description: 'Sesión completa de reflexología podal profunda (1 hora).' },

  // 154-158: Reparar / Ritual / Shase Q / Spa / Thermo
  { id: '239', code: '239', name: 'Reparar Uña', price: '₡2,000', priceNumber: 2000, durationText: '15min', durationMinutes: 15, category: 'Manicure y Pedicure', icon: Hand, description: 'Reparación de uña rota o fisurada.' },
  { id: '297', code: '297', name: 'Ritual 24 Kilates', price: '₡26,000', priceNumber: 26000, durationText: '45min', durationMinutes: 45, category: 'Tratamientos Capilares', icon: Sparkles, description: 'Elixir de aceites y partículas de brillo para sedosidad extrema.' },
  { id: '17', code: '17', name: 'Shase Q', price: '₡29,000', priceNumber: 29000, durationText: '2h', durationMinutes: 120, category: 'Tratamientos Capilares', icon: Sparkles, description: 'Tratamiento de nutrición y reestructuración térmica.' },
  { id: '348', code: '348', name: 'Spa', price: '₡3,000', priceNumber: 3000, durationText: '20min', durationMinutes: 20, category: 'Maquillaje y Masajes', icon: Smile, description: 'Complemento de relajación o exfoliado spa.' },
  { id: '312', code: '312', name: 'Thermo Blindaje Capilar', price: '₡35,000', priceNumber: 35000, durationText: '1h', durationMinutes: 60, category: 'Tratamientos Capilares', icon: Sparkles, description: 'Sellado térmico contra la humedad y frizz.' },

  // 159-169: Tintes
  { 
    id: '397', 
    code: '397', 
    name: 'Tinte', 
    price: 'Según valoración', 
    priceNumber: 0, 
    durationText: '2h', 
    durationMinutes: 120, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Tinte personalizado según diagnóstico profesional con reposo y 1 hora final de secado.',
    phases: [
      { name: 'Aplicación de Tinte', durationMinutes: 30, isStylistBusy: true, description: 'Estilista ocupado aplicando el tinte' },
      { name: 'Reposo de Tinte', durationMinutes: 30, isStylistBusy: false, description: 'Estilista libre (tinte reposando) para cita corta' },
      { name: 'Lavado, Secado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: lavado, secado y estilizado' }
    ]
  },
  { 
    id: '206', 
    code: '206', 
    name: 'Tinte Corto', 
    price: '₡31,000', 
    priceNumber: 31000, 
    durationText: '2h', 
    durationMinutes: 120, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Tinte global para cabello corto con reposo y 1 hora final de lavado y secado.',
    phases: [
      { name: 'Aplicación de Tinte', durationMinutes: 30, isStylistBusy: true, description: 'Estilista ocupado aplicando el tinte' },
      { name: 'Reposo de Tinte', durationMinutes: 30, isStylistBusy: false, description: 'Estilista libre (tinte reposando) para cita corta' },
      { name: 'Lavado, Secado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: lavado, secado y peinado' }
    ]
  },
  { 
    id: '314', 
    code: '314', 
    name: 'Tinte Hombre', 
    price: '₡18,000', 
    priceNumber: 18000, 
    durationText: '1h 40min', 
    durationMinutes: 100, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Coloración masculina rápida para disimular canas con reposo y 1 hora final de lavado y peinado.',
    phases: [
      { name: 'Aplicación de Tinte', durationMinutes: 20, isStylistBusy: true, description: 'Estilista ocupado aplicando el tinte' },
      { name: 'Reposo de Tinte', durationMinutes: 20, isStylistBusy: false, description: 'Estilista libre durante reposo' },
      { name: 'Lavado, Secado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: lavado y peinado' }
    ]
  },
  { 
    id: '210', 
    code: '210', 
    name: 'Tinte Inoa Corto', 
    price: '₡31,000', 
    priceNumber: 31000, 
    durationText: '2h', 
    durationMinutes: 120, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Tinte sin amoníaco L\'Oréal INOA para cabello corto con reposo y 1 hora final de acabado.',
    phases: [
      { name: 'Aplicación de Tinte INOA', durationMinutes: 30, isStylistBusy: true, description: 'Estilista ocupado aplicando el tinte INOA' },
      { name: 'Reposo de Tinte', durationMinutes: 30, isStylistBusy: false, description: 'Estilista libre (tinte reposando) para cita corta' },
      { name: 'Acabado Final', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: acabado final, lavado y secado' }
    ]
  },
  { 
    id: '212', 
    code: '212', 
    name: 'Tinte Inoa Largo', 
    price: '₡44,000', 
    priceNumber: 44000, 
    durationText: '2h 15min', 
    durationMinutes: 135, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Tinte sin amoníaco INOA para melena larga con reposo y 1 hora final de acabado.',
    phases: [
      { name: 'Aplicación de Tinte INOA', durationMinutes: 30, isStylistBusy: true, description: 'Estilista ocupado aplicando el tinte INOA' },
      { name: 'Reposo de Tinte', durationMinutes: 45, isStylistBusy: false, description: 'Estilista libre (tinte reposando) para cita corta' },
      { name: 'Acabado Final', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: acabado final, lavado y secado' }
    ]
  },
  { 
    id: '211', 
    code: '211', 
    name: 'Tinte Inoa Mediano', 
    price: '₡41,000', 
    priceNumber: 41000, 
    durationText: '2h', 
    durationMinutes: 120, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Tinte sin amoníaco INOA para largo mediano con reposo y 1 hora final de acabado.',
    phases: [
      { name: 'Aplicación de Tinte INOA', durationMinutes: 30, isStylistBusy: true, description: 'Estilista ocupado aplicando el tinte INOA' },
      { name: 'Reposo de Tinte', durationMinutes: 30, isStylistBusy: false, description: 'Estilista libre (tinte reposando) para cita corta' },
      { name: 'Acabado Final', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: acabado final, lavado y secado' }
    ]
  },
  { 
    id: '213', 
    code: '213', 
    name: 'Tinte Inoa Muy Largo', 
    price: '₡54,000', 
    priceNumber: 54000, 
    durationText: '2h 30min', 
    durationMinutes: 150, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Tinte INOA vegetal/aceite para cabello extra largo con reposo y 1 hora final de acabado.',
    phases: [
      { name: 'Aplicación de Tinte INOA', durationMinutes: 45, isStylistBusy: true, description: 'Estilista ocupado aplicando el tinte INOA' },
      { name: 'Reposo de Tinte', durationMinutes: 45, isStylistBusy: false, description: 'Estilista libre (tinte reposando) para cita' },
      { name: 'Acabado Final', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: acabado final, lavado y secado' }
    ]
  },
  { 
    id: '208', 
    code: '208', 
    name: 'Tinte Largo', 
    price: '₡41,000', 
    priceNumber: 41000, 
    durationText: '2h 15min', 
    durationMinutes: 135, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Tinte global completo para melena larga con reposo y 1 hora final de secado.',
    phases: [
      { name: 'Aplicación de Tinte', durationMinutes: 30, isStylistBusy: true, description: 'Estilista ocupado aplicando el tinte' },
      { name: 'Reposo de Tinte', durationMinutes: 45, isStylistBusy: false, description: 'Estilista libre (tinte reposando) para cita corta' },
      { name: 'Lavado, Secado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: lavado, secado y peinado' }
    ]
  },
  { 
    id: '207', 
    code: '207', 
    name: 'Tinte Mediano', 
    price: '₡37,000', 
    priceNumber: 37000, 
    durationText: '2h', 
    durationMinutes: 120, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Tinte global para cabello mediano con reposo y 1 hora final de secado.',
    phases: [
      { name: 'Aplicación de Tinte', durationMinutes: 30, isStylistBusy: true, description: 'Estilista ocupado aplicando el tinte' },
      { name: 'Reposo de Tinte', durationMinutes: 30, isStylistBusy: false, description: 'Estilista libre (tinte reposando) para cita corta' },
      { name: 'Lavado, Secado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: lavado, secado y peinado' }
    ]
  },
  { 
    id: '209', 
    code: '209', 
    name: 'Tinte Muy Largo', 
    price: '₡46,000', 
    priceNumber: 46000, 
    durationText: '2h 30min', 
    durationMinutes: 150, 
    category: 'Coloración y Tintes', 
    icon: Paintbrush, 
    description: 'Tinte global para cabello muy largo o abundante con reposo y 1 hora final de secado.',
    phases: [
      { name: 'Aplicación de Tinte', durationMinutes: 45, isStylistBusy: true, description: 'Estilista ocupado aplicando el tinte' },
      { name: 'Reposo de Tinte', durationMinutes: 45, isStylistBusy: false, description: 'Estilista libre (tinte reposando) para cita' },
      { name: 'Lavado, Secado y Acabado', durationMinutes: 60, isStylistBusy: true, description: '1 hora extra al final: lavado, secado y peinado' }
    ]
  },
  { id: '286', code: '286', name: 'Tinte Ondulado Pestañas', price: '₡25,000', priceNumber: 25000, durationText: '45min', durationMinutes: 45, category: 'Depilación y Rostro', icon: Sun, description: 'Lifting, rizado permanente y tinte negro de pestañas.' },

  // 170-173: Tratamientos
  { id: '396', code: '396', name: 'Tratamiento Biotoop', price: '₡20,000', priceNumber: 20000, durationText: '45min', durationMinutes: 45, category: 'Tratamientos Capilares', icon: Sparkles, description: 'Ritual nutritivo natural BIOTOP Professional.' },
  { id: '296', code: '296', name: 'Tratamiento Capilar', price: '₡9,000', priceNumber: 9000, durationText: '30min', durationMinutes: 30, category: 'Tratamientos Capilares', icon: Sparkles, description: 'Mascarilla acondicionante con ampolla rápida.' },
  { id: '399', code: '399', name: 'Tratamiento Celulas Madre', price: '₡22,000', priceNumber: 22000, durationText: '45min', durationMinutes: 45, category: 'Tratamientos Capilares', icon: Sparkles, description: 'Regenerador capilar con biotecnología de células madre vegetal.' },
  { id: '01', code: '01', name: 'Tratamiento Olapex', price: '₡35,000', priceNumber: 35000, durationText: '45min', durationMinutes: 45, category: 'Tratamientos Capilares', icon: Sparkles, description: 'Reconstrucción intensiva de enlaces capilares Olaplex.' },

  // 174-175: Uñas & Vendas
  { id: '238', code: '238', name: 'Uñas Recina', price: '₡26,000', priceNumber: 26000, durationText: '1h', durationMinutes: 60, category: 'Manicure y Pedicure', icon: Hand, description: 'Set completo de uñas en acrílico o resina con diseño.' },
  { id: '347', code: '347', name: 'Vendas Frias', price: '₡5,000', priceNumber: 5000, durationText: '30min', durationMinutes: 30, category: 'Maquillaje y Masajes', icon: Smile, description: 'Tratamiento reafirmante y descongestivo con vendas frías.' }
];
