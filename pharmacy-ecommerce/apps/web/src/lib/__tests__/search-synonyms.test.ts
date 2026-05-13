import { describe, it, expect } from 'vitest'
import { expandQuery } from '../search-synonyms'

describe('expandQuery', () => {
  it('returns original query lowercased', () => {
    const v = expandQuery('Paracetamol')
    expect(v).toContain('paracetamol')
  })

  it('expands paracetamol → acetaminofén, tapsin, kitadol, panadol', () => {
    const v = expandQuery('paracetamol')
    expect(v).toContain('acetaminofén')
    expect(v).toContain('tapsin')
    expect(v).toContain('kitadol')
  })

  it('expands tapsin → paracetamol', () => {
    const v = expandQuery('tapsin')
    expect(v).toContain('paracetamol')
  })

  it('folds accents: acido ascorbico → also includes ascorbic terms', () => {
    const v = expandQuery('ácido ascórbico')
    expect(v).toContain('vitamina c')
    expect(v).toContain('ácido ascórbico')
  })

  it('folds accents bidirectional: input without accents matches accented synonym key', () => {
    const v = expandQuery('losartan')
    expect(v).toContain('losartán')
  })

  it('handles plural → singular variant', () => {
    const v = expandQuery('vitaminas')
    expect(v).toContain('vitamina')
  })

  it('returns empty for empty input', () => {
    expect(expandQuery('')).toEqual([])
    expect(expandQuery('   ')).toEqual([])
  })

  it('caps at 6 variants', () => {
    const v = expandQuery('paracetamol')
    expect(v.length).toBeLessThanOrEqual(6)
  })

  it('returns single variant for unknown term', () => {
    const v = expandQuery('xyzunknown')
    expect(v).toEqual(['xyzunknown'])
  })

  it('expands tylenol → paracetamol', () => {
    const v = expandQuery('tylenol')
    expect(v).toContain('paracetamol')
  })

  it('expands dipirona ↔ metamizol ↔ novalgina', () => {
    const v = expandQuery('dipirona')
    expect(v).toContain('metamizol')
    expect(v).toContain('novalgina')
  })

  it('expands ravotril → clonazepam', () => {
    const v = expandQuery('ravotril')
    expect(v).toContain('clonazepam')
  })

  it('expands ativan ↔ lorazepam', () => {
    const v = expandQuery('ativan')
    expect(v).toContain('lorazepam')
    const v2 = expandQuery('lorazepam')
    expect(v2).toContain('ativan')
  })

  it('expands transilium → bromazepam', () => {
    const v = expandQuery('transilium')
    expect(v).toContain('bromazepam')
  })

  it('expands ventolin → salbutamol', () => {
    const v = expandQuery('ventolin')
    expect(v).toContain('salbutamol')
  })

  it('expands cipro → ciprofloxacino', () => {
    const v = expandQuery('cipro')
    expect(v).toContain('ciprofloxacino')
  })

  it('expands eutirox → levotiroxina', () => {
    const v = expandQuery('eutirox')
    expect(v).toContain('levotiroxina')
  })

  it('expands losec → omeprazol', () => {
    const v = expandQuery('losec')
    expect(v).toContain('omeprazol')
  })
})
