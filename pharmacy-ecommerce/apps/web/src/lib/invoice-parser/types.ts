// Legacy single-product OCR shape — used by the older /api/admin/scan-invoice
// (heurística para escaneo de envase de producto). NO mezclar con factura.
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

// ─────────────────────────────────────────────────────────────────────────────
// Nuevo: parsing estructurado de facturas/pedidos de proveedores.
// ─────────────────────────────────────────────────────────────────────────────

export type InvoiceFormat = 'global' | 'mediven' | 'generic';

export interface InvoiceLine {
  /** Código interno del proveedor (Global lo usa; Mediven no). */
  supplier_product_code: string | null;
  product_name_invoice: string;
  quantity: number;
  /** Costo unitario neto del proveedor (sin IVA si está desglosado). */
  unit_cost: number;
  /** quantity * unit_cost (puede venir directamente del PDF). */
  subtotal: number;
  /** Código de lote del proveedor (sólo presente en facturas SII). */
  batch_code: string | null;
  /** Fecha vencimiento ISO YYYY-MM-DD (Mediven entrega MM-YYYY → último día del mes). */
  expiry_date: string | null;
}

export interface InvoiceHeader {
  /** Folio factura SII (Mediven) o N° pedido (Global). */
  invoice_number: string | null;
  /** RUT del proveedor (clave para auto-match con suppliers.rut). */
  supplier_rut: string | null;
  /** Nombre detectado del proveedor en el documento. */
  supplier_name: string | null;
  /** ISO YYYY-MM-DD. */
  invoice_date: string | null;
  /** ISO YYYY-MM-DD. Vencimiento del pago (sólo Mediven). */
  due_date: string | null;
  /** Referencia a OC del proveedor (Mediven: "OC No. Peds 4160394"). */
  po_reference: string | null;
  /** Total neto (sin IVA). Sólo Mediven entrega desglose. */
  subtotal_net: number | null;
  /** Monto IVA. Sólo Mediven. */
  tax_amount: number | null;
  /** Total bruto (Mediven con IVA, Global ya con IVA incluido). */
  total: number | null;
}

export interface ParsedInvoice {
  format: InvoiceFormat;
  header: InvoiceHeader;
  lines: InvoiceLine[];
}
