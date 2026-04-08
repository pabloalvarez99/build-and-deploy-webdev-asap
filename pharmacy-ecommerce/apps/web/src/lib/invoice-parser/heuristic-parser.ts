import type { InvoiceParser, ScannedProductData } from './types';

// Known Chilean pharma labs (partial match, case-insensitive)
const KNOWN_LABS = [
  'SAVAL', 'RECALCINE', 'MINTLAB', 'CHILE', 'BAGÓ', 'BAGO', 'PFIZER',
  'NOVARTIS', 'ROCHE', 'ABBOTT', 'SANDOZ', 'GRUNENTHAL', 'PRATER',
  'SYNTHON', 'ETEX', 'ANDRÓMACO', 'ANDROMACO', 'MAVER', 'BIOSANO',
  'LABORATORIO', 'LAB.',
];

const PRESENTATION_KEYWORDS = [
  'COMPRIMIDO', 'CÁPSULA', 'CAPSULA', 'JARABE', 'SOLUCIÓN', 'SOLUCION',
  'CREMA', 'GEL', 'AMPOLLA', 'SUPOSITORIO', 'PARCHE', 'SPRAY', 'GOTAS',
  'POMADA', 'SUSPENSIÓN', 'SUSPENSION', 'INYECTABLE', 'TABLETA', 'GRAGEA',
  'ÓVULO', 'OVULO', 'POLVO', 'COLIRIO', 'LOCIÓN', 'LOCION',
];

export class HeuristicParser implements InvoiceParser {
  name = 'heuristic';

  parse(ocrText: string): ScannedProductData {
    const lines = ocrText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const upperLines = lines.map(l => l.toUpperCase());
    const result: ScannedProductData = {};

    result.price = this.extractPrice(lines, upperLines);
    result.laboratory = this.extractLaboratory(lines, upperLines);
    result.prescription_type = this.extractPrescriptionType(upperLines);
    result.presentation = this.extractPresentation(upperLines);
    result.active_ingredient = this.extractAfterKeyword(lines, upperLines, [
      'PRINCIPIO ACTIVO', 'P.ACTIVO', 'PRINCIPIO:', 'ACTIVO:',
    ]);
    result.therapeutic_action = this.extractAfterKeyword(lines, upperLines, [
      'ACCION TERAPEUTICA', 'ACCIÓN TERAPÉUTICA', 'DEPTO:', 'DEPTO.',
    ]);
    result.stock = this.extractStock(lines, upperLines);
    result.name = this.extractName(lines, upperLines);

    // Remove undefined keys for cleaner output
    return Object.fromEntries(
      Object.entries(result).filter(([, v]) => v !== undefined && v !== '')
    ) as ScannedProductData;
  }

  private extractPrice(lines: string[], upperLines: string[]): string | undefined {
    // Pattern: $1.234 or $1.234,00 or "PRECIO 1234"
    for (const line of lines) {
      const match = line.match(/\$\s*([\d\.]+)/);
      if (match) {
        const cleaned = match[1].replace(/\./g, ''); // Remove thousand separators
        const num = parseInt(cleaned, 10);
        if (!isNaN(num) && num > 0 && num < 10_000_000) return String(num);
      }
    }
    for (let i = 0; i < upperLines.length; i++) {
      if (upperLines[i].includes('PRECIO') || upperLines[i].includes('P.UNIT')) {
        const match = lines[i].match(/([\d\.]+)/);
        if (match) {
          const cleaned = match[1].replace(/\./g, '');
          const num = parseInt(cleaned, 10);
          if (!isNaN(num) && num > 0) return String(num);
        }
        // Price might be on next line
        if (i + 1 < lines.length) {
          const nextMatch = lines[i + 1].match(/([\d\.]+)/);
          if (nextMatch) {
            const cleaned = nextMatch[1].replace(/\./g, '');
            const num = parseInt(cleaned, 10);
            if (!isNaN(num) && num > 0) return String(num);
          }
        }
      }
    }
    return undefined;
  }

  private extractLaboratory(lines: string[], upperLines: string[]): string | undefined {
    // Look for explicit lab label
    for (let i = 0; i < upperLines.length; i++) {
      if (
        upperLines[i].startsWith('LAB:') ||
        upperLines[i].startsWith('LAB.') ||
        upperLines[i].startsWith('LABORATORIO:')
      ) {
        const afterColon = lines[i].split(':')[1]?.trim();
        if (afterColon && afterColon.length > 1) return afterColon.toUpperCase();
        if (i + 1 < lines.length) return lines[i + 1].toUpperCase();
      }
    }
    // Look for known lab names in any line
    for (let i = 0; i < upperLines.length; i++) {
      for (const lab of KNOWN_LABS) {
        if (lab === 'LABORATORIO' || lab === 'LAB.') continue; // Skip generic words
        if (upperLines[i].includes(lab)) {
          // Return the word that matched or the whole line if short
          const words = lines[i].split(/\s+/);
          const labWord = words.find(w => w.toUpperCase().includes(lab));
          return labWord ? labWord.toUpperCase() : lines[i].toUpperCase().substring(0, 30);
        }
      }
    }
    return undefined;
  }

  private extractPrescriptionType(upperLines: string[]): ScannedProductData['prescription_type'] {
    for (const line of upperLines) {
      if (line.includes('RETENIDA')) return 'retained';
      if (line.includes('RECETA MEDICA') || line.includes('RECETA MÉDICA')) return 'prescription';
      if (line.includes('CON RECETA')) return 'prescription';
    }
    return 'direct';
  }

  private extractPresentation(upperLines: string[]): string | undefined {
    for (const line of upperLines) {
      for (const kw of PRESENTATION_KEYWORDS) {
        if (line.includes(kw)) {
          // Try to extract the word + surrounding context (e.g. "COMPRIMIDOS 500MG")
          const idx = line.indexOf(kw);
          const segment = line.substring(idx, idx + 40).split(/[,;]/)[0].trim();
          return segment.substring(0, 50);
        }
      }
    }
    return undefined;
  }

  private extractAfterKeyword(
    lines: string[],
    upperLines: string[],
    keywords: string[]
  ): string | undefined {
    for (let i = 0; i < upperLines.length; i++) {
      for (const kw of keywords) {
        if (upperLines[i].includes(kw)) {
          // Value may be after colon on same line
          const colonIdx = lines[i].indexOf(':');
          if (colonIdx !== -1) {
            const val = lines[i].substring(colonIdx + 1).trim();
            if (val.length > 1) return val;
          }
          // Or on next line
          if (i + 1 < lines.length && lines[i + 1].length > 1) {
            return lines[i + 1].trim();
          }
        }
      }
    }
    return undefined;
  }

  private extractStock(lines: string[], upperLines: string[]): string | undefined {
    for (let i = 0; i < upperLines.length; i++) {
      if (
        upperLines[i].includes('STOCK') ||
        upperLines[i].includes('CANTIDAD') ||
        upperLines[i].includes('UNIDADES')
      ) {
        const match = lines[i].match(/(\d+)/);
        if (match) return match[1];
        if (i + 1 < lines.length) {
          const nextMatch = lines[i + 1].match(/(\d+)/);
          if (nextMatch) return nextMatch[1];
        }
      }
    }
    return undefined; // Don't guess stock — admin must enter manually
  }

  private extractName(lines: string[], upperLines: string[]): string | undefined {
    // Heuristic: longest predominantly uppercase line in the first 8 lines,
    // excluding lines that are clearly labels/metadata
    const skipKeywords = [
      'FACTURA', 'BOLETA', 'PRECIO', 'LAB', 'RECETA', 'FECHA', 'RUT',
      'PROVEEDOR', 'CLIENTE', 'TOTAL', 'SUBTOTAL', 'IVA', 'FOLIO',
    ];

    const candidates = lines.slice(0, 8).filter((line, i) => {
      const upper = upperLines[i];
      if (line.length < 4) return false;
      const hasSkipKeyword = skipKeywords.some(kw => upper.startsWith(kw));
      if (hasSkipKeyword) return false;
      // Must be at least 50% uppercase letters
      const letters = line.replace(/[^a-zA-Z]/g, '');
      if (letters.length === 0) return false;
      const upperCount = (line.match(/[A-ZÁÉÍÓÚÑÜ]/g) || []).length;
      return upperCount / letters.length > 0.5;
    });

    if (candidates.length === 0) return undefined;
    // Return the longest candidate, trimmed to 100 chars
    return candidates.reduce((a, b) => (a.length >= b.length ? a : b)).substring(0, 100);
  }
}
