import { Plus, ChevronLeft, ChevronRight, LayoutGrid, Wand2 } from 'lucide-react';
import { useRef } from 'react';
import './DeckList.css';

export interface SavedDeck {
  id: string;
  name: string;
  cards: Record<string, number>;
}

interface DeckListProps {
  decks: SavedDeck[];
  allCards: any[];
  onCreateClick: () => void;
  onDeckClick: (deck: SavedDeck) => void;
  onAutoGenerateClick?: () => void;
}

const isPremade = (id: string) => id.startsWith('starter-') || id.startsWith('meta-') || id.startsWith('budget-');

interface DeckRowProps {
  title: string;
  decks: SavedDeck[];
  allCards: any[];
  onDeckClick: (deck: SavedDeck) => void;
}

function DeckRow({ title, decks, allCards, onDeckClick }: DeckRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getLeaderForDeck = (deckCards: Record<string, number>) => {
    for (const cardId of Object.keys(deckCards)) {
      if (deckCards[cardId] > 0) {
        const card = allCards.find(c => c.card_set_id === cardId);
        if (card && card.card_type === 'Leader') {
          return card;
        }
      }
    }
    return null;
  };

  const getCardCount = (deckCards: Record<string, number>) => {
    return Object.values(deckCards).reduce((acc, curr) => acc + curr, 0);
  };

  if (decks.length === 0) return null;

  return (
    <div className="deck-section">
      <div className="deck-section-header">
        <h3>{title}</h3>
        <div className="deck-section-actions">
          <button className="btn-text" title="Ver Todos">
            <LayoutGrid size={16} /> Ver Todos
          </button>
          <div className="scroll-buttons">
            <button className="btn-icon" onClick={() => scroll('left')}><ChevronLeft size={20} /></button>
            <button className="btn-icon" onClick={() => scroll('right')}><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>
      
      <div className="deck-row" ref={scrollRef}>
        {decks.map(deck => {
          const leader = getLeaderForDeck(deck.cards);
          const count = getCardCount(deck.cards);
          return (
            <div key={deck.id} className="deck-card" onClick={() => onDeckClick(deck)}>
              {leader ? (
                <img 
                  src={leader.card_image} 
                  alt={leader.card_name} 
                  className="deck-leader-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/icon.jpg';
                  }}
                />
              ) : (
                <div className="deck-placeholder">
                  Sem Líder
                </div>
              )}
              <div className="deck-info">
                <span className="deck-name">{deck.name}</span>
                <span className="deck-count">{count} cartas</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DeckList({ decks, allCards, onCreateClick, onDeckClick, onAutoGenerateClick }: DeckListProps) {
  const premadeDecks = decks.filter(d => isPremade(d.id));
  const myDecks = decks.filter(d => !isPremade(d.id));

  return (
    <div className="deck-list-container">
      <div className="deck-list-header">
        <h2>Gerenciador de Decks</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={onAutoGenerateClick} style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            <Wand2 size={20} /> Assistente Inteligente
          </button>
          <button className="btn-primary" onClick={onCreateClick}>
            <Plus size={20} /> Cadastrar Deck
          </button>
        </div>
      </div>

      <DeckRow 
        title="Meus Decks" 
        decks={myDecks} 
        allCards={allCards} 
        onDeckClick={onDeckClick} 
      />

      {myDecks.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '40px', color: 'var(--text-muted)' }}>
          Nenhum deck customizado. Clique em "Cadastrar Deck" para começar!
        </div>
      )}

      <DeckRow 
        title="Decks Prontos (Meta, Budget, Starters)" 
        decks={premadeDecks} 
        allCards={allCards} 
        onDeckClick={onDeckClick} 
      />
    </div>
  );
}
