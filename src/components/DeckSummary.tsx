import React from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { BANNED_CARDS, RESTRICTED_CARDS, BANNED_PAIRS } from '../data/banlist';
import './DeckSummary.css';

interface DeckSummaryProps {
  deckState: Record<string, number>;
  cardsData: any[];
}

export const DeckSummary: React.FC<DeckSummaryProps> = ({ deckState, cardsData }) => {
  // Obter detalhes das cartas que estão no deck
  const deckCards = cardsData.filter(card => deckState[card.card_set_id] > 0);
  
  let leaderCount = 0;
  let characterCount = 0;
  let eventStageCount = 0;

  Object.entries(deckState).forEach(([id, qty]) => {
    if (qty <= 0) return;
    const card = cardsData.find(c => c.card_set_id === id);
    if (!card) return;
    
    if (card.card_type === 'Leader') leaderCount += qty;
    if (card.card_type === 'Character') characterCount += qty;
    if (card.card_type === 'Event' || card.card_type === 'Stage') eventStageCount += qty;
  });

  const totalMainDeck = characterCount + eventStageCount;

  // Regras OPCG: 1 Líder e Exatamente 50 cartas no Main Deck
  const hasLeader = leaderCount === 1;
  const isMainDeckValid = totalMainDeck === 50;

  // Validar Banlist
  const hasBanned = deckCards.some(c => BANNED_CARDS.includes(c.card_set_id));
  const hasRestrictedOverlimit = deckCards.some(c => RESTRICTED_CARDS.includes(c.card_set_id) && deckState[c.card_set_id] > 1);
  
  // Validar Pares Banidos
  let hasBannedPair = false;
  for (const pair of BANNED_PAIRS) {
    if (deckState[pair[0]] > 0 && deckState[pair[1]] > 0) {
      hasBannedPair = true;
      break;
    }
  }

  const isValidDeck = hasLeader && isMainDeckValid && !hasBanned && !hasRestrictedOverlimit && !hasBannedPair;

  const progressPercentage = Math.min((totalMainDeck / 50) * 100, 100);
  
  let fillClass = '';
  if (totalMainDeck === 50) fillClass = 'complete';
  if (totalMainDeck > 50) fillClass = 'over';

  return (
    <div className="deck-summary-container">
      <div className="deck-summary-top">
        <div className="deck-summary-title">
          Análise do Deck
        </div>
        <div className={`deck-validity-badge ${isValidDeck ? 'valid' : 'invalid'}`} title={
          hasBanned ? "Deck contém cartas banidas" :
          hasRestrictedOverlimit ? "Deck excede o limite de cartas restritas (1)" :
          hasBannedPair ? "Deck contém um Par Banido que não pode jogar junto" :
          !hasLeader ? "Deck precisa de exatamente 1 Líder" :
          !isMainDeckValid ? "Deck precisa ter exatamente 50 cartas no Main Deck" : "Deck Válido"
        }>
          {isValidDeck ? (
            <><ShieldCheck size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> Válido</>
          ) : (
            <><AlertCircle size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> Inválido</>
          )}
        </div>
      </div>

      <div className="deck-size-bar-container">
        <div className="deck-size-label">
          <span>Main Deck (Battle/Extra)</span>
          <span style={{ color: totalMainDeck > 50 ? 'var(--color-red)' : totalMainDeck === 50 ? '#00ff80' : 'var(--text-muted)' }}>
            {totalMainDeck} / 50
          </span>
        </div>
        <div className="deck-size-bar">
          <div className={`deck-size-fill ${fillClass}`} style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </div>

      <div className="deck-stats-grid">
        <div className="stat-box">
          <span className="stat-box-label">Líder</span>
          <span className="stat-box-value" style={{ color: leaderCount === 1 ? '#00ff80' : 'var(--color-red)' }}>
            {leaderCount} / 1
          </span>
        </div>
        <div className="stat-box">
          <span className="stat-box-label">Characters</span>
          <span className="stat-box-value">{characterCount}</span>
        </div>
        <div className="stat-box">
          <span className="stat-box-label">Events/Stages</span>
          <span className="stat-box-value">{eventStageCount}</span>
        </div>
      </div>
    </div>
  );
};
