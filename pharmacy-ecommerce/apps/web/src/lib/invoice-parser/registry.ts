import { HeuristicParser } from './heuristic-parser';
import type { InvoiceParser } from './types';

const parsers: Record<string, InvoiceParser> = {
  heuristic: new HeuristicParser(),
};

export function getParser(name = 'heuristic'): InvoiceParser {
  return parsers[name] ?? parsers['heuristic'];
}
