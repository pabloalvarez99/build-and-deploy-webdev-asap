export interface ScannedProductData {
  name?: string;
  laboratory?: string;
  price?: string;
  stock?: string;
  therapeutic_action?: string;
  active_ingredient?: string;
  prescription_type?: 'direct' | 'prescription' | 'retained';
  presentation?: string;
  discount_percent?: string;
}

export interface InvoiceParser {
  name: string;
  parse(ocrText: string): ScannedProductData;
}
