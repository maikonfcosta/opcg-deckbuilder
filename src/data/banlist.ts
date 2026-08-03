import { fetchPoneglyphFormats } from '../services/api';

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

export let ROTATED_BLOCKS: string[] = [];

/**
 * Atualiza a banlist dinamicamente consumindo a Poneglyph API
 */
export async function initBanlist() {
  try {
    const formatData = await fetchPoneglyphFormats();
    if (formatData && formatData.bans) {
      BANNED_CARDS.length = 0; // Limpa o array mantendo a referência
      BANNED_PAIRS.length = 0;
      
      const pairsSet = new Set<string>(); // Para evitar pares duplicados A->B e B->A
      
      formatData.bans.forEach((ban: any) => {
        if (ban.type === 'banned') {
          BANNED_CARDS.push(ban.card_number);
        } else if (ban.type === 'pair' && ban.paired_with) {
          const pairKey = [ban.card_number, ban.paired_with].sort().join('_');
          if (!pairsSet.has(pairKey)) {
            pairsSet.add(pairKey);
            BANNED_PAIRS.push([ban.card_number, ban.paired_with]);
          }
        }
      });
      
      if (formatData.blocks) {
        ROTATED_BLOCKS = formatData.blocks
          .filter((b: any) => b.legal === false)
          .map((b: any) => b.block);
      }
    }
  } catch (error) {
    console.error("Falha ao inicializar banlist dinâmica", error);
  }
}

