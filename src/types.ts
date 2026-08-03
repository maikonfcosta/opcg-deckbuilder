export interface OPCard {
  card_name: string;
  card_set_id: string; // ex: "OP01-077"
  set_name: string;
  rarity: string;
  card_color: string; // "Red", "Blue", "Green", "Yellow", "Black", "Purple", "Multicolor" etc.
  card_type: string;  // "Leader", "Character", "Event", "Stage"
  life: string | null;
  card_cost: string | null;
  card_power: string | null;
  sub_types: string;  // ex: "Thriller Bark Pirates"
  counter_amount: number | null; // ex: 1000, 2000, 0
  attribute: string;  // ex: "Special", "Slash", "Strike"
  card_image: string; // URL da imagem da optcgapi
  card_text: string;  // Efeito
  market_price?: string;
  tcgplayer_url?: string;
}

export interface DeckCardEntry {
  card: OPCard;
  count: number;
}

export interface Deck {
  id: string;
  name: string;
  leader: OPCard | null;
  cards: { [card_set_id: string]: DeckCardEntry };
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  anthropicApiKey: string;
}

export interface LigaCardPrice {
  card_code: string;
  name: string;
  edition_code: string;
  url: string;
  image_url: string;
  updated_at: string;
  message?: string;
  // A API local retorna uma lista de versões com preços
  versions?: Array<{
    version_name: string;
    price_min: number;
    price_avg: number;
    price_max: number;
  }>;
}
