import type { OPCard, LigaCardPrice } from '../types';

// URLs das APIs
const OPTCG_BASE_URL = 'https://www.optcgapi.com/api';
const LIGA_BASE_URL = 'https://liga-onepiece-api.onrender.com/api';

// Cache local do banco de cartas (P2.6) — evita refetch dos 4 endpoints a cada reload
const CARDS_CACHE_KEY = 'opcg_cards_cache';
const CARDS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h em ms

interface CardsCache {
  ts: number;
  data: OPCard[];
}

function readCardsCache(): OPCard[] | null {
  try {
    const raw = localStorage.getItem(CARDS_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as CardsCache;
    if (!cache.data?.length || Date.now() - cache.ts > CARDS_CACHE_TTL) return null;
    return cache.data;
  } catch {
    return null;
  }
}

function writeCardsCache(data: OPCard[]): void {
  try {
    localStorage.setItem(CARDS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // localStorage cheio ou indisponível — ignora, cache é opcional
  }
}

/**
 * Função utilitária para fazer requisição HTTP com tratamento de erro
 */
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} on URL: ${url}`);
  }
  return response.json() as Promise<T>;
}

/**
 * Busca todas as cartas de todas as fontes da OPTCG API (Sets, Starters, Promos, Don!!)
 * Junta tudo e remove duplicatas com base no ID da imagem/carta.
 */
export async function fetchAllCards(): Promise<OPCard[]> {
  // Usa cache local válido (< 24h) quando disponível
  const cached = readCardsCache();
  if (cached) return cached;

  try {
    // Faz os fetches em paralelo para maior performance
    const [setCards, stCards, promoCards, donCards] = await Promise.all([
      fetchJson<OPCard[]>(`${OPTCG_BASE_URL}/allSetCards/`).catch(() => [] as OPCard[]),
      fetchJson<OPCard[]>(`${OPTCG_BASE_URL}/allSTCards/`).catch(() => [] as OPCard[]),
      fetchJson<OPCard[]>(`${OPTCG_BASE_URL}/allPromoCards/`).catch(() => [] as OPCard[]),
      fetchJson<OPCard[]>(`${OPTCG_BASE_URL}/allDonCards/`).catch(() => [] as OPCard[])
    ]);

    // Combina todas as listas
    const allCombined = [...setCards, ...stCards, ...promoCards, ...donCards];

    // Remove duplicatas exatas de cartas que possam aparecer em mais de uma lista
    const uniqueCardsMap = new Map<string, OPCard>();
    allCombined.forEach(card => {
      if (card && card.card_set_id) {
        // Algumas variantes têm o mesmo card_set_id (paralelas).
        // Usamos uma combinação do set_id e nome para diferenciar, ou apenas guardamos a primeira/mais barata.
        // Na listagem geral, é melhor agrupar ou manter apenas chaves únicas baseadas no card_name + set_id + imagem.
        const uniqueKey = `${card.card_set_id}_${card.card_name}_${card.card_image || ''}`;
        uniqueCardsMap.set(uniqueKey, card);
      }
    });

    const result = Array.from(uniqueCardsMap.values());
    if (result.length) writeCardsCache(result);
    return result;
  } catch (error) {
    console.error('Erro ao buscar todas as cartas da OPTCG API:', error);
    throw error;
  }
}

/**
 * Busca cotações de preços em Reais (BRL) e informações da Liga One Piece
 * usando o código da carta (ex: OP01-001)
 */
export async function fetchLigaPrices(cardCode: string): Promise<LigaCardPrice | null> {
  try {
    // Ajusta o formato do código caso necessário (ex: tirar barras extras)
    const formattedCode = encodeURIComponent(cardCode.trim().toUpperCase());
    const data = await fetchJson<LigaCardPrice>(`${LIGA_BASE_URL}/cards/${formattedCode}`);
    return data;
  } catch (error) {
    console.warn(`Preço da Liga One Piece não encontrado para a carta: ${cardCode}`, error);
    return null;
  }
}
