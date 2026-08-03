import { useState } from 'react';
import { X, Copy, Edit2, Trash2, Layers, LayoutGrid, Wand2 } from 'lucide-react';
import type { SavedDeck } from './DeckList';
import './ViewDeckModal.css';
import { useDialog } from './DialogContext';
import { DeckAnalyzerModal } from './DeckAnalyzerModal';
import { LeaderMetaStats } from './LeaderMetaStats';

interface ViewDeckModalProps {
  deck: SavedDeck;
  allCards: any[];
  onClose: () => void;
  onEdit: (deck: SavedDeck) => void;
  onDelete: (deckId: string) => void;
  onCardClick: (card: any) => void;
  onAutoAdjust: (newCards: Record<string, number>) => void;
}

export function ViewDeckModal({ deck, allCards, onClose, onEdit, onDelete, onCardClick, onAutoAdjust }: ViewDeckModalProps) {
  const { showAlert, showConfirm } = useDialog();
  const [isStackedView, setIsStackedView] = useState(false);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  
  const handleCopyDecklist = () => {
    let listText = '';
    
    // Sort logic to put leader first (optional) but we just iterate keys
    const cardIds = Object.keys(deck.cards).filter(id => deck.cards[id] > 0);
    
    cardIds.forEach(id => {
      const card = allCards.find(c => c.id === id);
      const qty = deck.cards[id];
      if (card) {
        listText += `${qty}x ${card.card_name} [${card.card_set_id}]\n`;
      }
    });

    navigator.clipboard.writeText(listText.trim())
      .then(() => showAlert('Decklist copiada para a área de transferência!', 'Sucesso', 'success'))
      .catch(() => showAlert('Erro ao copiar decklist.'));
  };

  const handleDelete = () => {
    showConfirm(`Tem certeza que deseja excluir o deck "${deck.name}"?`, () => {
      onDelete(deck.id);
    });
  };

  return (
    <div className="view-deck-overlay" onClick={onClose}>
      <div className="view-deck-content" onClick={(e) => e.stopPropagation()}>
        <div className="view-deck-header">
          <h3>{deck.name}</h3>
          <div className="view-deck-actions">
            <button className="btn-icon" title="Ver Modo Empilhado" onClick={() => setIsStackedView(!isStackedView)}>
              {isStackedView ? <LayoutGrid size={20} /> : <Layers size={20} />}
            </button>
            <button className="btn-icon" title="Analisar Deck com IA" onClick={() => setShowAnalyzer(true)}>
              <Wand2 size={20} style={{ color: 'var(--accent)' }} />
            </button>
            <button className="btn-icon" title="Copiar Decklist" onClick={handleCopyDecklist}>
              <Copy size={20} />
            </button>
            <button className="btn-icon" title="Editar Deck" onClick={() => onEdit(deck)}>
              <Edit2 size={20} />
            </button>
            <button className="btn-icon danger" title="Excluir Deck" onClick={handleDelete}>
              <Trash2 size={20} />
            </button>
            <button className="btn-icon" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="view-deck-body">
          {/* Seção do Líder */}
          <div className="view-deck-leader-section">
            <h4 className="section-title">Líder</h4>
            {(() => {
              const leaderId = Object.keys(deck.cards).find(id => {
                const c = allCards.find(c => c.card_set_id === id);
                return c && c.card_type === 'Leader' && deck.cards[id] > 0;
              });
              if (!leaderId) return <div style={{color:'var(--text-muted)'}}>Nenhum Líder</div>;
              const leaderCard = allCards.find(c => c.card_set_id === leaderId);
              return (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div className="view-deck-card leader-card-wrap" onClick={() => onCardClick(leaderCard)}>
                    <img 
                      src={leaderCard.card_image} 
                      alt={leaderCard.card_name} 
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/icon.jpg'; }}
                    />
                  </div>
                  <div style={{ flex: '1 1 300px' }}>
                    <LeaderMetaStats leaderCard={leaderCard} allCards={allCards} />
                  </div>
                </div>
              );
            })()}
          </div>

          <hr className="view-deck-divider" />

          {/* Seção do Deck Principal */}
          <div className="view-deck-main-section">
            <h4 className="section-title">Main Deck ({Object.values(deck.cards).reduce((acc, v) => acc + v, 0) - (Object.keys(deck.cards).some(id => allCards.find(c => c.card_set_id === id)?.card_type === 'Leader') ? 1 : 0)})</h4>
            <div className={`view-deck-grid ${isStackedView ? 'stacked-mode' : 'grid-mode'}`}>
              {Object.entries(deck.cards)
                .sort(([idA], [idB]) => idA.localeCompare(idB))
                .map(([cardId, qty]) => {
                if (qty <= 0) return null;
                const card = allCards.find(c => c.card_set_id === cardId);
                if (!card || card.card_type === 'Leader') return null;

                if (isStackedView) {
                  const numQty = Number(qty);
                  return (
                    <div 
                      key={cardId} 
                      className="stacked-card-group" 
                      onClick={() => onCardClick(card)}
                      style={{ height: `${168 + (numQty - 1) * 24}px` }}
                    >
                      {Array.from({ length: numQty }).map((_, idx) => (
                        <div 
                          key={`${cardId}-${idx}`} 
                          className="stacked-card-item"
                          style={{ zIndex: idx, transform: `translateY(${idx * 24}px)` }}
                        >
                          <img 
                            src={card.card_image} 
                            alt={card.card_name} 
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/icon.jpg'; }}
                          />
                        </div>
                      ))}
                    </div>
                  );
                }

                return (
                  <div key={cardId} className="view-deck-card" onClick={() => onCardClick(card)} style={{ cursor: 'pointer' }}>
                    <img 
                      src={card.card_image} 
                      alt={card.card_name} 
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/icon.jpg'; }}
                    />
                    <div className="view-deck-badge">{qty}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showAnalyzer && (
        <DeckAnalyzerModal 
          deck={deck} 
          allCards={allCards} 
          onClose={() => setShowAnalyzer(false)} 
          onUpdateDeck={onAutoAdjust}
        />
      )}
    </div>
  );
}
