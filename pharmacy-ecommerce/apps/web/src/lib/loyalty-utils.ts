/** 1 punto por cada $1000 CLP gastados. Safe para usar en Client Components. */
export function calcPoints(totalCLP: number): number {
  return Math.floor(totalCLP / 1000)
}
