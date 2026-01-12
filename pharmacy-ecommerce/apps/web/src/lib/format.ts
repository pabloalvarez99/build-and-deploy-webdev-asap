/**
 * Formatea un precio en Pesos Chilenos (CLP)
 * @param price - El precio a formatear (string o number)
 * @returns String formateado con separador de miles y símbolo $
 */
export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
}

/**
 * Formatea un número con separador de miles (estilo chileno)
 * @param num - El número a formatear
 * @returns String formateado con puntos como separador de miles
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-CL').format(num);
}
