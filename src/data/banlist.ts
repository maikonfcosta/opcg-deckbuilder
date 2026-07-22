// Lista oficial de cartas com restrição no formato Padrão (OPCG)
export const BANNED_CARDS: string[] = [
  'OP06-047', // Charlotte Pudding
  'OP03-040', // Nami
  'OP06-086', // Gecko Moria
  'ST10-001', // Trafalgar Law
  'OP06-116', // Reject
];

export const RESTRICTED_CARDS: string[] = [];

// Cartas que não podem ser colocadas juntas no mesmo deck
export const BANNED_PAIRS: [string, string][] = [
  ['OP07-115', 'EB04-058'],
  ['OP11-040', 'OP11-067'],
  ['OP11-040', 'OP08-069']
];
