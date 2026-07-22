import React, { useMemo } from 'react';
import { X, ShieldAlert, AlertTriangle } from 'lucide-react';
import { BANNED_CARDS, RESTRICTED_CARDS, BANNED_PAIRS } from '../data/banlist';
import './BanlistViewModal.css';
import { OpcgCard } from './OpcgCard';

interface BanlistViewModalProps {
  allCards: any[];
  onClose: () => void;
}

export const BanlistViewModal: React.FC<BanlistViewModalProps> = ({ allCards, onClose }) => {
  const bannedCards = useMemo(() => {
    return BANNED_CARDS.map(id => allCards.find(c => c.card_set_id === id)).filter(Boolean);
  }, [allCards]);

  const restrictedCards = useMemo(() => {
    return RESTRICTED_CARDS.map(id => allCards.find(c => c.card_set_id === id)).filter(Boolean);
  }, [allCards]);

  const bannedPairs = useMemo(() => {
    return BANNED_PAIRS.map(pair => {
      return [
        allCards.find(c => c.card_set_id === pair[0]),
        allCards.find(c => c.card_set_id === pair[1])
      ];
    }).filter(pair => pair[0] && pair[1]);
  }, [allCards]);

  return (
    <div className="banlist-modal-overlay" onClick={onClose}>
      <div className="banlist-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="banlist-header">
          <h2>Lista de Cartas Banidas e Restritas</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="banlist-body">
          <section className="banlist-section">
            <h3 className="section-title banned">
              <ShieldAlert size={20} /> Banidas (0 Cópias)
            </h3>
            <p className="section-desc">Estas cartas não podem ser utilizadas em nenhuma quantidade no deck.</p>
            {bannedCards.length === 0 ? (
              <p className="empty-msg">Nenhuma carta banida.</p>
            ) : (
              <div className="banlist-grid">
                {bannedCards.map(card => (
                  <div key={card.card_set_id} className="banlist-card-wrapper">
                    <OpcgCard card={card} onClick={() => {}} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="banlist-section">
            <h3 className="section-title restricted">
              <AlertTriangle size={20} /> Restritas (1 Cópia)
            </h3>
            <p className="section-desc">Você só pode utilizar até 1 cópia destas cartas no seu deck.</p>
            {restrictedCards.length === 0 ? (
              <p className="empty-msg">Nenhuma carta restrita.</p>
            ) : (
              <div className="banlist-grid">
                {restrictedCards.map(card => (
                  <div key={card.card_set_id} className="banlist-card-wrapper">
                    <OpcgCard card={card} onClick={() => {}} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="banlist-section">
            <h3 className="section-title banned">
              <ShieldAlert size={20} /> Pares Banidos (Não podem jogar juntos)
            </h3>
            <p className="section-desc">Você não pode usar a Carta A e a Carta B no mesmo deck.</p>
            {bannedPairs.length === 0 ? (
              <p className="empty-msg">Nenhum par banido.</p>
            ) : (
              <div className="banlist-pairs-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {bannedPairs.map((pair, index) => (
                  <div key={index} className="banned-pair-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ width: '120px' }}><OpcgCard card={pair[0]} onClick={() => {}} /></div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent)' }}>+</div>
                    <div style={{ width: '120px' }}><OpcgCard card={pair[1]} onClick={() => {}} /></div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
