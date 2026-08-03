import type { OPCard, LigaCardPrice } from '../types';

// URLs das APIs
const LIGA_BASE_URL = 'https://liga-onepiece-api.onrender.com/api';
const PONEGLYPH_BASE_URL = 'https://api.poneglyph.one/v1';

// Cache local do banco de cartas (P2.6) — evita refetch dos 4 endpoints a cada reload
const CARDS_CACHE_KEY = 'poneglyph_cards_cache_v1';
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
 * Busca todas as cartas da base consolidada da Poneglyph API,
 * substituindo as requisições fragmentadas da antiga optcgapi.
 */
export async function fetchAllCards(): Promise<OPCard[]> {
  // Usa cache local válido (< 24h) quando disponível
  const cached = readCardsCache();
  if (cached) return cached;

  try {
    // A Poneglyph fornece busca paginada com limite máximo de 100 por página.
    // Buscamos a primeira página para saber o total e, se houver mais, buscamos o resto em paralelo.
    let allRawCards: any[] = [];

    const firstPage = await fetchJson<any>(`${PONEGLYPH_BASE_URL}/search?limit=100&page=1`);
    if (!firstPage || !firstPage.data) {
      throw new Error("Formato de resposta inválido da Poneglyph");
    }
    
    allRawCards = allRawCards.concat(firstPage.data);

    if (firstPage.pagination && firstPage.pagination.total > firstPage.pagination.limit) {
      const totalPages = Math.ceil(firstPage.pagination.total / firstPage.pagination.limit);
      const promises = [];
      
      for (let i = 2; i <= totalPages; i++) {
        promises.push(fetchJson<any>(`${PONEGLYPH_BASE_URL}/search?limit=100&page=${i}`).catch(() => null));
      }
      
      const results = await Promise.all(promises);
      results.forEach(res => {
        if (res && res.data) {
          allRawCards = allRawCards.concat(res.data);
        }
      });
    }

    // Converte a interface da Poneglyph para a interface padronizada do nosso frontend (OPCard)
    const allCards: OPCard[] = allRawCards.map((item: any) => {
      let imageUrl = '';
      let marketPrice: string | undefined;
      let tcgUrl: string | undefined;
      
      if (item.variants && item.variants.length > 0) {
        // Prefere a imagem padrão de catálogo e cai para scans se necessário
        const v = item.variants[0];
        if (v.images && v.images.stock) {
          imageUrl = v.images.stock.full || v.images.stock.thumb || '';
        } 
        if (!imageUrl && v.images && v.images.scan) {
          imageUrl = v.images.scan.display || v.images.scan.full || '';
        }
        
        if (v.market) {
          marketPrice = v.market.market_price || v.market.mid_price;
          tcgUrl = v.market.tcgplayer_url;
        }
      }

      return {
        card_name: item.name || 'Unknown',
        card_set_id: item.card_number || '',
        set_name: item.set_name || '',
        rarity: item.rarity || '',
        card_color: Array.isArray(item.color) ? item.color.join(' ') : (item.color || ''),
        card_type: item.card_type || '',
        life: item.life !== null && item.life !== undefined ? String(item.life) : null,
        card_cost: item.cost !== null && item.cost !== undefined ? String(item.cost) : null,
        card_power: item.power !== null && item.power !== undefined ? String(item.power) : null,
        sub_types: Array.isArray(item.types) ? item.types.join(' ') : (item.types || ''),
        counter_amount: item.counter !== null && item.counter !== undefined ? item.counter : 0,
        attribute: Array.isArray(item.attribute) ? item.attribute.join('/') : (item.attribute || ''),
        card_image: imageUrl,
        card_text: item.effect || '',
        market_price: marketPrice,
        tcgplayer_url: tcgUrl
      };
    });

    if (allCards.length) writeCardsCache(allCards);
    return allCards;
  } catch (error) {
    console.error('Erro ao buscar todas as cartas da Poneglyph API:', error);
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

/**
 * Interfaces para os dados da Poneglyph API
 */
export interface PoneglyphMatchup {
  opponent_card_number: string;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number | null;
}

export interface PoneglyphLeaderMeta {
  card_number: string;
  decks: number;
  copies: number;
  wins: number;
  win_rate: number | null;
  lift: number | null;
  deck_share: number;
  average_copies: number;
  matchups: PoneglyphMatchup[];
  latest_date: string | null;
}

/**
 * Busca os status de Meta (Winrate e Matchups) para um Líder na Poneglyph API
 */
export async function fetchLeaderMetaStats(cardNumber: string): Promise<PoneglyphLeaderMeta | null> {
  try {
    const formattedCode = encodeURIComponent(cardNumber.trim().toUpperCase());
    const data = await fetchJson<PoneglyphLeaderMeta>(`${PONEGLYPH_BASE_URL}/meta/leaders/${formattedCode}`);
    return data;
  } catch (error) {
    console.warn(`Meta stats não encontrados na Poneglyph para a carta: ${cardNumber}`, error);
    return null;
  }
}

/**
 * Busca a legalidade do formato (Standard) incluindo a banlist dinâmica
 */
export async function fetchPoneglyphFormats(): Promise<any | null> {
  try {
    const response = await fetchJson<any>(`${PONEGLYPH_BASE_URL}/formats/Standard`);
    return response.data;
  } catch (error) {
    console.warn(`Erro ao buscar formatos da Poneglyph:`, error);
    return null;
  }
}
