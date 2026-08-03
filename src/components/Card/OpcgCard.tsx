import React from 'react';
import { motion } from 'framer-motion';
import './OpcgCard.css';

import type { OPCard } from '../../types';

interface CardProps {
  card: OPCard;
  onClick: (card: any) => void;
  quantity?: number;
}

// React.memo previne re-renderizações desnecessárias das cartas quando o usuário digita na busca
export const OpcgCard: React.FC<CardProps> = React.memo(({ card, onClick, quantity }) => {
  return (
    <motion.div 
      className="card-wrapper"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(0,240,255,0.2)" }}
      transition={{ duration: 0.3 }}
      onClick={() => onClick(card)}
    >
      <img src={card.card_image} alt={card.card_name} className="card-image" loading="lazy" />
      {quantity !== undefined && quantity > 0 && (
        <div className="view-deck-badge">{quantity}</div>
      )}
      <div className="card-overlay">
        <span className="card-name">{card.card_name}</span>
        <div className="card-meta">
          <span className={`color-dot ${card.card_color}`}></span>
          {card.card_cost !== null && <span className="card-cost">Cost: {card.card_cost}</span>}
          {card.card_power && <span style={{ fontSize: '0.7rem' }}>PWR: {card.card_power}</span>}
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Comparações rasas otimizadas
  return prevProps.card.card_set_id === nextProps.card.card_set_id && prevProps.quantity === nextProps.quantity;
});
