// Principios activos sujetos a control según Decreto 404 (Chile)
const CONTROLLED = new Set([
  'clonazepam', 'alprazolam', 'lorazepam', 'diazepam', 'bromazepam',
  'midazolam', 'nitrazepam', 'flunitrazepam', 'triazolam',
  'morfina', 'codeína', 'tramadol', 'oxicodona', 'hidromorfona',
  'fentanilo', 'buprenorfina', 'metadona', 'meperidina',
  'metilfenidato', 'anfetamina', 'modafinilo',
  'fenobarbital', 'butalbital',
  'ketamina', 'dronabinol',
]);

export function isControlledSubstance(activeIngredient: string | null | undefined): boolean {
  if (!activeIngredient) return false;
  const lower = activeIngredient.toLowerCase();
  for (const s of Array.from(CONTROLLED)) {
    if (lower.includes(s)) return true;
  }
  return false;
}
