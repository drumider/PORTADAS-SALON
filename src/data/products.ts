export interface Product {
  id: string;
  brand: 'BIOTOP Professional';
  name: string;
  volume: string;
  price: string;
  priceNumber: number;
  description: string;
  image: string;
  tag?: string;
}

export const PRODUCT_BRANDS = [
  { id: 'BIOTOP Professional', name: 'BIOTOP Professional' },
];

export const PRODUCTS: Product[] = [
  {
    id: 'biotop-101-spray-extra-strong-500',
    brand: 'BIOTOP Professional',
    name: '101 Spray Extra Strong Hold (Lata Plateada)',
    volume: '500 ml',
    price: '₡26,000',
    priceNumber: 26000,
    description: 'Laca de fijación extra fuerte. Máximo control de larga duración sin dejar residuos ni acartonar el cabello. Ideal para peinados y estructuración elaborada.',
    image: '/src/assets/images/biotop_101_spray_clean_1786048941070.jpg',
    tag: 'Fijación Extra Fuerte'
  },
  {
    id: 'biotop-101-spray-strong-500',
    brand: 'BIOTOP Professional',
    name: '101 Spray Strong Hold (Lata Negra)',
    volume: '500 ml',
    price: '₡26,000',
    priceNumber: 26000,
    description: 'Laca de fijación fuerte flexible. Aporta un acabado profesional con movimiento natural, brillo radiante y secado ultra rápido.',
    image: '/src/assets/images/biotop_101_black_spray_1786049124579.jpg',
    tag: 'Fijación Fuerte Natural'
  },
  {
    id: 'biotop-101-spray-flex-soft',
    brand: 'BIOTOP Professional',
    name: '101 Flex Spray Soft Hold (Lata Blanca)',
    volume: '500 ml',
    price: '₡26,000',
    priceNumber: 26000,
    description: 'Laca de fijación suave y flexible. Aporta un acabado ligero, sedoso y manejable con protección anti-frizz ideal para movimiento cotidiano.',
    image: '/src/assets/images/biotop_101_white_flex_spray_1786049206825.jpg',
    tag: 'Fijación Suave Flexible'
  },
  {
    id: 'biotop-101-top-coat',
    brand: 'BIOTOP Professional',
    name: '101 Create Top Coat Humidity Shield Spray',
    volume: '150 ml',
    price: '₡22,000',
    priceNumber: 22000,
    description: 'Spray protector térmico y barrera anti-humedad de alto rendimiento. Mantiene el alisado y peinado impecable en climas húmedos.',
    image: '/src/assets/images/biotop_top_coat_spray_1786049490783.jpg',
    tag: 'Escudo Anti-Humedad'
  },
  {
    id: 'biotop-101-style-volume-powder',
    brand: 'BIOTOP Professional',
    name: '101 Style Volume Powder (Texture + Body)',
    volume: '10 g',
    price: '₡18,000',
    priceNumber: 18000,
    description: 'Polvo voluminizador y texturizador de raíces. Otorga elevación instantánea, textura mate y cuerpo duradero sin apelmazar.',
    image: '/src/assets/images/biotop_volume_powder_1786049454311.jpg',
    tag: 'Efecto Volumen & Textura'
  },
  {
    id: 'biotop-101-create-antifrizz',
    brand: 'BIOTOP Professional',
    name: '101 Create Anti Frizz Smooth + Frizz Free',
    volume: '120 ml',
    price: '₡17,000',
    priceNumber: 17000,
    description: 'Tratamiento en crema alisante y sellador anti-frizz. Controla el encrespamiento, aporta sedosidad táctil y peinabilidad superior.',
    image: '/src/assets/images/biotop_antifrizz_tube_1786049434206.jpg',
    tag: 'Crema Alisante Anti-Frizz'
  },
  {
    id: 'biotop-aqua-wax',
    brand: 'BIOTOP Professional',
    name: 'Aqua Wax Texture + Definition',
    volume: 'Tarro de Salón',
    price: '₡16,000',
    priceNumber: 16000,
    description: 'Cera modeladora a base de agua para textura y definición. Permite moldear y reestructurar el peinado con acabado limpio y flexible.',
    image: '/src/assets/images/biotop_aqua_wax_1786049473733.jpg',
    tag: 'Cera Soluble en Agua'
  },
  {
    id: 'biotop-101-spray-extra-strong-75',
    brand: 'BIOTOP Professional',
    name: '101 Spray Extra Strong Hold (Edición Viaje)',
    volume: '75 ml',
    price: '₡10,000',
    priceNumber: 10000,
    description: 'Formato compacto de bolsillo de la laca extra fuerte BIOTOP 101. Ideal para retoques rápidos de peinado en cualquier lugar.',
    image: '/src/assets/images/biotop_101_spray_clean_1786048941070.jpg',
    tag: 'Formato Mini 75ml'
  },
  {
    id: 'biotop-101-spray-strong-75',
    brand: 'BIOTOP Professional',
    name: '101 Spray Strong Hold (Edición Viaje)',
    volume: '75 ml',
    price: '₡10,000',
    priceNumber: 10000,
    description: 'Formato travel size de la laca de fijación fuerte flexible. Cabello perfecto y protegido contra la humedad durante todo el día.',
    image: '/src/assets/images/biotop_101_black_spray_1786049124579.jpg',
    tag: 'Formato Mini 75ml'
  },
  {
    id: 'biotop-101-style-firm-hold-gel',
    brand: 'BIOTOP Professional',
    name: '101 Style Firm Hold Sculpting Gel',
    volume: '150 ml',
    price: '₡18,000',
    priceNumber: 18000,
    description: 'Gel esculpidor de fijación firme para estilo y control impecables sin residuos ni peso.',
    image: '/src/assets/images/biotop_101_firm_hold_gel_1786051944804.jpg',
    tag: 'Gel Esculpidor'
  },
  {
    id: 'biotop-101-finish-cream',
    brand: 'BIOTOP Professional',
    name: '101 Finish Finishing Cream (Smooth + Shine)',
    volume: '180 ml',
    price: '₡20,000',
    priceNumber: 20000,
    description: 'Crema de acabado para suavidad extrema y brillo deslumbrante al instante.',
    image: '/src/assets/images/biotop_101_finishing_cream_1786051966095.jpg',
    tag: 'Crema de Acabado & Brillo'
  },
  {
    id: 'biotop-700-shampoo',
    brand: 'BIOTOP Professional',
    name: '700 Keratin & Kale Repairing Shampoo',
    volume: '250 ml',
    price: '₡21,000',
    priceNumber: 21000,
    description: 'Champú reparador con queratina pura y col rizada (Kale) para cabello más fuerte y suave.',
    image: '/src/assets/images/biotop_700_shampoo_1786051983793.jpg',
    tag: 'Línea 700 Keratin & Kale'
  },
  {
    id: 'biotop-700-conditioner',
    brand: 'BIOTOP Professional',
    name: '700 Keratin & Kale Repairing Conditioner',
    volume: '250 ml',
    price: '₡23,000',
    priceNumber: 23000,
    description: 'Acondicionador nutritivo para reparación profunda, desenredo inmediato y elasticidad.',
    image: '/src/assets/images/biotop_700_conditioner_1786052000164.jpg',
    tag: 'Línea 700 Keratin & Kale'
  },
  {
    id: 'biotop-700-hair-mask',
    brand: 'BIOTOP Professional',
    name: '700 Keratin & Kale Hair Mask (Damage Repair)',
    volume: '250 ml',
    price: '₡35,000',
    priceNumber: 35000,
    description: 'Mascarilla intensiva de restauración para cabello seco o procesado químicamente.',
    image: '/src/assets/images/biotop_700_hair_mask_1786052019689.jpg',
    tag: 'Mascarilla Reparación Extrema'
  },
  {
    id: 'biotop-700-silky-touch',
    brand: 'BIOTOP Professional',
    name: '700 Keratin & Kale Silky Touch Styling Cream',
    volume: '150 ml',
    price: '₡43,000',
    priceNumber: 43000,
    description: 'Crema para peinar de tacto sedoso que aporta brillo espejo, suavidad y protección térmica.',
    image: '/src/assets/images/biotop_700_silky_touch_1786052038071.jpg',
    tag: 'Crema de Peinado Sedosa'
  },
  {
    id: 'biotop-700-hair-repair-oil',
    brand: 'BIOTOP Professional',
    name: '700 Keratin & Kale Hair Repair Oil (Damage Deep Treatment)',
    volume: '30 ml',
    price: '₡25,000',
    priceNumber: 25000,
    description: 'Aceite de tratamiento reparador profundo con queratina y kale. Fortalece, restaura la fibra capilar dañada y aporta brillo inmediato.',
    image: '/src/assets/images/biotop_700_repair_oil_1786052240248.jpg',
    tag: 'Tratamiento Reparador 30ml'
  },
  {
    id: 'biotop-700-cofre-kit',
    brand: 'BIOTOP Professional',
    name: 'Cofre BIOTOP 700 Keratin & Kale (Kit Trío Reparador)',
    volume: 'Set de 3 Productos',
    price: '₡40,000',
    priceNumber: 40000,
    description: 'Exclusivo cofre de regalo BIOTOP 700 que incluye Champú Reparador, Acondicionador y Sérum/Aceite de Queratina y Kale para una restauración completa.',
    image: '/src/assets/images/biotop_700_cofre_box_1786052251265.jpg',
    tag: 'Cofre de Lujo BIOTOP'
  },
  {
    id: 'biotop-911-cofre-kit',
    brand: 'BIOTOP Professional',
    name: 'Cofre BIOTOP 911 Quinoa (Kit Trío Nutritivo)',
    volume: 'Set de 3 Productos',
    price: '₡40,000',
    priceNumber: 40000,
    description: 'Exclusivo cofre de regalo BIOTOP 911 que incluye Champú Nutritivo de Quinua, Acondicionador y Sérum Capilar para recuperar la elasticidad.',
    image: '/src/assets/images/biotop_911_cofre_box_1786052273899.jpg',
    tag: 'Cofre de Lujo BIOTOP'
  },
  {
    id: 'biotop-911-conditioner-500',
    brand: 'BIOTOP Professional',
    name: '911 Quinoa Nourishing Conditioner (Formato Salón)',
    volume: '500 ml',
    price: '₡35,000',
    priceNumber: 35000,
    description: 'Acondicionador nutritivo de gran formato 500ml con extracto de quinua pura. Hidratación profunda y suavidad para cabello seco.',
    image: '/src/assets/images/biotop_911_conditioner_500_1786052290087.jpg',
    tag: 'Acondicionador 500ml'
  },
  {
    id: 'biotop-911-all-in-one',
    brand: 'BIOTOP Professional',
    name: '911 Quinoa All In One Leave-in Hair Treatment',
    volume: '150 ml',
    price: '₡35,000',
    priceNumber: 35000,
    description: 'Tratamiento en spray multibeneficio sin enjuague. Desencrespa, protege contra el calor, aporta brillo deslumbrante y desenreda.',
    image: '/src/assets/images/biotop_911_all_in_one_1786052299613.jpg',
    tag: 'Multibeneficio All In One'
  }
];
