import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { fetchLigaPrices } from '../services/api';
import type { LigaCardPrice } from '../types';
import './CardModal.css';
import './CardModalMarket.css';

interface CardModalProps {
  card: any | null;
  onClose: () => void;
  quantityInDeck: number;
  onUpdateDeck: (card: any, quantity: number) => void;
}

export const CardModal: React.FC<CardModalProps> = ({ card, onClose, quantityInDeck, onUpdateDeck }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [priceData, setPriceData] = useState<LigaCardPrice | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [currency, setCurrency] = useState<'USD' | 'BRL'>('USD');

  // Reseta o estado do flip e busca preços quando a carta mudar (se for BRL)
  useEffect(() => {
    setIsFlipped(false);
  }, [card]);

  useEffect(() => {
    if (currency === 'BRL' && card && card.card_set_id && !priceData) {
      setLoadingPrice(true);
      fetchLigaPrices(card.card_set_id)
        .then(data => setPriceData(data))
        .catch(() => setPriceData(null))
        .finally(() => setLoadingPrice(false));
    }
  }, [card, currency]);

  if (!card) return null;

  const isLeader = card.card_type === 'LEADER';
  const maxCopies = isLeader ? 1 : 4;
  const backImage = card.card_image.replace('.webp', '_b.webp');
  
  const handleIncrease = () => {
    if (quantityInDeck < maxCopies) onUpdateDeck(card, quantityInDeck + 1);
  };

  const handleDecrease = () => {
    if (quantityInDeck > 0) onUpdateDeck(card, quantityInDeck - 1);
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="modal-content"
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
          
          {/* LADO ESQUERDO: IMAGEM (Com efeito 3D) */}
          <div className="modal-left-pane">
            <div className={`modal-image-wrapper ${isFlipped ? 'is-flipped' : ''}`}>
              <div className="modal-image-inner">
                <div className="modal-image-front">
                  <img src={card.card_image} alt={card.card_name} />
                </div>
                {isLeader && (
                  <div className="modal-image-back">
                    <img src={backImage} alt={`${card.card_name} Awakened`} />
                  </div>
                )}
              </div>
            </div>

            {/* Controles de Flip (Apenas para Leaders) */}
            {isLeader && (
              <div className="modal-flip-controls">
                <button 
                  className={`flip-btn ${!isFlipped ? 'active' : ''}`}
                  onClick={() => setIsFlipped(false)}
                >
                  Base
                </button>
                <button 
                  className={`flip-btn ${isFlipped ? 'active' : ''}`}
                  onClick={() => setIsFlipped(true)}
                >
                  Awakened
                </button>
              </div>
            )}
          </div>

          {/* LADO DIREITO: DETALHES E DADOS */}
          <div className="modal-right-pane">
            <div className="modal-header">
              <h2 className="modal-title">{card.card_name}</h2>
              <div className="modal-subtitle">
                <span className={`color-dot ${card.card_color}`}></span>
                {card.card_set_id} • {card.rarity} • {card.card_type}
              </div>
            </div>

            {/* Controle de Quantidade no Deck */}
            <div className="deck-control">
              <div className="deck-control-header">
                <span>Cópias no Deck:</span>
                <span className="deck-count">{quantityInDeck} / {maxCopies}</span>
              </div>
              <div className="deck-actions-row">
                <button 
                  className="deck-btn decrease" 
                  onClick={handleDecrease}
                  disabled={quantityInDeck === 0}
                >
                  {quantityInDeck === 1 ? <Trash2 size={18} /> : <Minus size={18} />}
                </button>
                <div className="deck-progress">
                  {[...Array(maxCopies)].map((_, i) => (
                    <div key={i} className={`progress-pip ${i < quantityInDeck ? 'filled' : ''}`}></div>
                  ))}
                </div>
                <button 
                  className="deck-btn increase" 
                  onClick={handleIncrease}
                  disabled={quantityInDeck >= maxCopies}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="modal-stats">
              <div className="stat-item">
                <span className="stat-label">Cost</span>
                <span className="stat-value">{card.card_cost !== null ? card.card_cost : '-'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Power</span>
                <span className="stat-value">{card.card_power || '-'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Combo</span>
                <span className="stat-value">{card.counter_amount || '-'}</span>
              </div>
            </div>

            {/* Mercado (Preços) */}
            <div className="modal-market">
              <div className="market-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 className="market-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingCart size={16} /> Market Price
                </h4>
                <div className="currency-toggle" style={{ display: 'flex', background: 'var(--bg-primary)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border)' }}>
                  <button 
                    onClick={() => setCurrency('USD')} 
                    style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '4px', background: currency === 'USD' ? 'var(--accent)' : 'transparent', color: currency === 'USD' ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}
                  >
                    USD
                  </button>
                  <button 
                    onClick={() => setCurrency('BRL')} 
                    style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '4px', background: currency === 'BRL' ? 'var(--accent)' : 'transparent', color: currency === 'BRL' ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}
                  >
                    BRL
                  </button>
                </div>
              </div>
              
              {currency === 'BRL' ? (
                loadingPrice ? (
                  <div className="market-loading">Buscando menor preço na Liga One Piece...</div>
                ) : priceData && priceData.versions && priceData.versions.length > 0 ? (
                  <div className="market-prices">
                    {priceData.versions.slice(0, 3).map((v, i) => (
                      <div key={i} className="market-version">
                        <span className="version-name">{v.version_name || 'Base'}</span>
                        <span className="version-price">
                          R$ {v.price_min.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                    <a href={priceData.url} target="_blank" rel="noopener noreferrer" className="market-link">
                      Ver na Liga One Piece
                    </a>
                  </div>
                ) : (
                  <div className="market-empty">Sem cotação na Liga One Piece</div>
                )
              ) : (
                card.market_price ? (
                  <div className="market-prices">
                    <div className="market-version">
                      <span className="version-name">TCGPlayer Market</span>
                      <span className="version-price" style={{ color: '#4ade80' }}>
                        $ {parseFloat(card.market_price).toFixed(2)}
                      </span>
                    </div>
                    {card.tcgplayer_url && (
                      <a href={card.tcgplayer_url} target="_blank" rel="noopener noreferrer" className="market-link">
                        Ver no TCGPlayer
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="market-empty">Sem cotação no TCGPlayer</div>
                )
              )}
            </div>

            {card.card_text && (
              <div className="modal-skill">
                {card.card_text.split('[br]').map((line: string, i: number) => (
                  <span key={i}>
                    {line}
                    <br />
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
